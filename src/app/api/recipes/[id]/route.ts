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
import { eq, asc } from 'drizzle-orm';

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

    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, recipeId),
      with: {
        dish: true,
        author: {
          columns: {
            id: true,
            displayName: true,
            email: true,
            role: true,
          },
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

    if (!recipe) {
      return NextResponse.json({ error: 'Không tìm thấy công thức' }, { status: 404 });
    }

    return NextResponse.json({ recipe });
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

    const updated = await db.transaction(async (tx) => {
      // 1. Update recipe basic info
      const [uRec] = await tx
        .update(recipes)
        .set({
          name: name ? name.trim() : existing.name,
          shortDescription: shortDescription ? shortDescription.trim() : existing.shortDescription,
          role: role || existing.role,
          status: status || existing.status,
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

    if (existing.status === 'PUBLISHED') {
      return NextResponse.json(
        {
          error:
            'Không được phép xóa công thức đã xuất bản. Hãy chuyển trạng thái sang ARCHIVED nếu muốn ẩn.',
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
