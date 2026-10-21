import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  recipes,
  dishes,
  recipeIngredients,
  cookingSteps,
  recipeTags,
} from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { isSameOrigin } from '@/lib/http/sameOrigin';
import { findOpenRevisionId } from '@/lib/recipes/publishing';
import { calculateRecipeNutrition } from '@/lib/nutrition/calculator';
import { canAccessRecipe, filterRecipeForViewer } from '@/lib/gating/entitlements';
import { getUserRecipeEntitlements } from '@/lib/gating/queries';
import { eq, asc } from 'drizzle-orm';

// AG-15: PUT chỉ được chuyển sang các trạng thái này. PUBLISHED / NEEDS_CHANGES chỉ đi qua
// /publish và /reject (ADMIN) để không thể "đi đường tắt" qua cổng duyệt.
const EDITABLE_TARGET_STATUSES = ['DRAFT', 'SUBMITTED'] as const;
const EDITABLE_CURRENT_STATUSES = ['DRAFT', 'SUBMITTED', 'NEEDS_CHANGES'];

function isStaff(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/recipes/[id]
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const recipeId = Number(id);

    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ' }, { status: 400 });
    }

    const user = await getSessionUser();
    const staff = isStaff(user?.role);

    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, recipeId),
      with: {
        dish: true,
        author: {
          columns: staff
            ? { id: true, displayName: true, email: true, role: true }
            : { id: true, displayName: true },
        },
        ingredients: {
          orderBy: [asc(recipeIngredients.sortOrder)],
          with: {
            ingredient: true,
          },
        },
        steps: {
          orderBy: [asc(cookingSteps.stepNumber)],
        },
        tags: {
          with: {
            taxonomy: true,
          },
        },
      },
    });

    // AG-15: Draft không công khai — người ngoài chỉ thấy bản PUBLISHED
    if (!recipe || (!staff && recipe.status !== 'PUBLISHED')) {
      return NextResponse.json({ error: 'Không tìm thấy công thức' }, { status: 404 });
    }

    if (!staff) {
      // Không lộ metadata kiểm duyệt nội bộ và bảo vệ nội dung có phí (D66)
      const entitlements = user ? await getUserRecipeEntitlements(user.id) : new Set<number>();
      const hasAccess = canAccessRecipe(
        {
          recipeId: recipe.id,
          provenance: recipe.provenance,
          isFree: recipe.isFree ?? true,
          price: recipe.price ?? 0,
          authorId: recipe.authorId,
        },
        user?.id ?? null,
        entitlements
      );
      const { reviewNotes: _n, reviewedById: _r, ...publicRecipe } = recipe;
      const filteredRecipe = filterRecipeForViewer(publicRecipe, hasAccess);
      return NextResponse.json({ recipe: filteredRecipe });
    }

    const openRevisionId =
      recipe.status === 'PUBLISHED' ? await findOpenRevisionId(recipe.id) : null;

    return NextResponse.json({ recipe, openRevisionId });
  } catch (error) {
    console.error('Error fetching recipe detail:', error);
    return NextResponse.json(
      { error: 'Không thể tải chi tiết công thức' },
      { status: 500 }
    );
  }
}

// PUT /api/recipes/[id] (Requires EDITOR or ADMIN)
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Yêu cầu không hợp lệ (origin)' }, { status: 403 });
    }

    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: 'Yêu cầu quyền Biên tập viên (EDITOR) hoặc Quản trị viên (ADMIN)' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const recipeId = Number(id);

    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ' }, { status: 400 });
    }

    // Check existing
    const existing = await db.query.recipes.findFirst({
      where: eq(recipes.id, recipeId),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy công thức' }, { status: 404 });
    }

    // INVARIANT §5.1: Cấm sửa trực tiếp công thức đã PUBLISHED
    if (existing.status === 'PUBLISHED') {
      return NextResponse.json(
        {
          error:
            'Công thức đã xuất bản không được phép chỉnh sửa trực tiếp. Vui lòng tạo phiên bản sửa đổi (revision) mới theo quy trình xuất bản (Invariants §5.1).',
        },
        { status: 400 }
      );
    }

    if (!EDITABLE_CURRENT_STATUSES.includes(existing.status)) {
      return NextResponse.json(
        { error: `Công thức ở trạng thái ${existing.status} không được phép chỉnh sửa.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      shortDescription,
      role,
      status,
      baseServings,
      prepTimeMinutes,
      cookTimeMinutes,
      difficulty,
      caloriesPerServing,
      heroImage,
      ingredients: rawIngredients,
      steps: rawSteps,
      taxonomyIds,
    } = body;

    // AG-15: chặn chuyển trạng thái vượt cổng duyệt
    let nextStatus: (typeof EDITABLE_TARGET_STATUSES)[number] | typeof existing.status = existing.status;
    if (status !== undefined && status !== null && status !== '') {
      if (!(EDITABLE_TARGET_STATUSES as readonly string[]).includes(status)) {
        return NextResponse.json(
          {
            error:
              'Chỉ được lưu nháp (DRAFT) hoặc gửi duyệt (SUBMITTED). Xuất bản phải đi qua cổng duyệt của ADMIN.',
          },
          { status: 400 }
        );
      }
      nextStatus = status;
    }

    const updated = await db.transaction(async (tx) => {
      // 1. Update recipe basic info
      const [uRec] = await tx
        .update(recipes)
        .set({
          name: name ? name.trim() : existing.name,
          shortDescription: shortDescription ? shortDescription.trim() : existing.shortDescription,
          role: role || existing.role,
          status: nextStatus,
          baseServings: baseServings ? Number(baseServings) : existing.baseServings,
          prepTimeMinutes: prepTimeMinutes !== undefined ? Number(prepTimeMinutes) : existing.prepTimeMinutes,
          cookTimeMinutes: cookTimeMinutes !== undefined ? Number(cookTimeMinutes) : existing.cookTimeMinutes,
          difficulty: difficulty || existing.difficulty,
          caloriesPerServing: caloriesPerServing !== undefined ? Number(caloriesPerServing) : existing.caloriesPerServing,
          heroImage: heroImage !== undefined ? heroImage : existing.heroImage,
          updatedAt: new Date(),
        })
        .where(eq(recipes.id, recipeId))
        .returning();

      // 2. Replace ingredients if provided
      if (Array.isArray(rawIngredients)) {
        await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
        if (rawIngredients.length > 0) {
          const ingValues = rawIngredients.map((item: any, idx: number) => ({
            recipeId,
            ingredientId: Number(item.ingredientId),
            amount: Number(item.amount) || 0,
            unit: (item.unit || 'g').trim(),
            scalePolicy: (item.scalePolicy || 'LINEAR') as 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST',
            preparation: item.preparation ? item.preparation.trim() : null,
            isOptional: Boolean(item.isOptional),
            sortOrder: idx + 1,
          }));
          await tx.insert(recipeIngredients).values(ingValues);
        }
      }

      // 3. Replace steps if provided
      if (Array.isArray(rawSteps)) {
        await tx.delete(cookingSteps).where(eq(cookingSteps.recipeId, recipeId));
        if (rawSteps.length > 0) {
          const stepValues = rawSteps.map((s: any, idx: number) => ({
            recipeId,
            stepNumber: idx + 1,
            phaseName: (s.phaseName || 'Chế biến').trim(),
            instruction: (s.instruction || '').trim(),
            timerSeconds: s.timerSeconds ? Number(s.timerSeconds) : null,
            tipText: s.tipText ? s.tipText.trim() : null,
            image: s.image || null,
          }));
          await tx.insert(cookingSteps).values(stepValues);
        }
      }

      // 4. Replace taxonomies if provided
      if (Array.isArray(taxonomyIds)) {
        await tx.delete(recipeTags).where(eq(recipeTags.recipeId, recipeId));
        if (taxonomyIds.length > 0) {
          const tagValues = taxonomyIds.map((tid: number) => ({
            recipeId,
            taxonomyId: Number(tid),
          }));
          await tx.insert(recipeTags).values(tagValues);
        }
      }

      return uRec;
    });

    if (Array.isArray(rawIngredients) && rawIngredients.length > 0) {
      try {
        await calculateRecipeNutrition(updated.id);
      } catch (nutErr) {
        console.warn('Auto nutrition update skipped:', nutErr);
      }
    }

    return NextResponse.json({ recipe: updated });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Không thể cập nhật công thức' },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/[id] (Requires EDITOR or ADMIN)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Yêu cầu không hợp lệ (origin)' }, { status: 403 });
    }

    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      return NextResponse.json(
        { error: 'Yêu cầu quyền Biên tập viên (EDITOR) hoặc Quản trị viên (ADMIN)' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const recipeId = Number(id);

    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ' }, { status: 400 });
    }

    const existing = await db.query.recipes.findFirst({
      where: eq(recipes.id, recipeId),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy công thức' }, { status: 404 });
    }

    if (existing.status === 'PUBLISHED' || existing.status === 'ARCHIVED') {
      return NextResponse.json(
        {
          error:
            existing.status === 'PUBLISHED'
              ? 'Không được phép xóa công thức đã xuất bản. Hãy chuyển trạng thái sang ARCHIVED nếu muốn ẩn.'
              : 'Phiên bản đã lưu trữ là lịch sử bất biến, không được xóa (Invariants §5.1).',
        },
        { status: 400 }
      );
    }

    await db.delete(recipes).where(eq(recipes.id, recipeId));

    return NextResponse.json({ success: true, message: 'Đã xóa công thức nháp' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: 'Không thể xóa công thức' },
      { status: 500 }
    );
  }
}
