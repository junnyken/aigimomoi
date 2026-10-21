// AG-31: Community Contributor Recipe Submission API
// Cho phép người dùng cộng đồng đóng góp công thức gia đình.
// Invariants Gate P5:
// - Bắt buộc đăng nhập.
// - Tuyệt đối không cho phép tự ý xuất bản (status chỉ là DRAFT hoặc SUBMITTED).
// - provenance BẮT BUỘC là 'COMMUNITY_SUBMITTED', authorId = user.id.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes, dishes, recipeIngredients, cookingSteps, recipeTags, mealRoleEnum } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { calculateRecipeNutrition } from '@/lib/nutrition/calculator';
import { eq, desc, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// GET /api/contribute/recipes — Lấy danh sách công thức của chính tôi
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để xem danh sách công thức đóng góp của bạn.' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get('status');

    const query = db.query.recipes.findMany({
      where: (r, { eq, and }) => {
        const conditions = [eq(r.authorId, user.id)];
        if (statusFilter && statusFilter !== 'ALL') {
          conditions.push(eq(r.status, statusFilter as any));
        }
        return and(...conditions);
      },
      orderBy: [desc(recipes.createdAt)],
      with: {
        dish: true,
        ingredients: {
          with: {
            ingredient: true,
          },
        },
      },
    });

    const items = await query;

    return NextResponse.json({
      success: true,
      recipes: items,
      total: items.length,
    });
  } catch (error) {
    logger.error('Error fetching contributor recipes', { error });
    return NextResponse.json(
      { error: 'Không thể tải danh sách công thức đóng góp.' },
      { status: 500 }
    );
  }
}

// POST /api/contribute/recipes — Tạo mới bài đóng góp công thức
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để đóng góp công thức.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      name,
      dishName,
      shortDescription,
      role = 'MAIN',
      baseServings = 4,
      prepTimeMinutes = 15,
      cookTimeMinutes = 30,
      difficulty = 'Dễ',
      heroImage,
      region = 'GENERAL',
      kitchenStory,
      sourceAttribution,
      variantOfId,
      ingredients: rawIngredients = [],
      steps: rawSteps = [],
      taxonomyIds = [],
      submitNow = false,
    } = body;

    // Validation cơ bản
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Tên công thức không được để trống.' }, { status: 400 });
    }

    if (!shortDescription || typeof shortDescription !== 'string' || !shortDescription.trim()) {
      return NextResponse.json({ error: 'Mô tả ngắn không được để trống.' }, { status: 400 });
    }

    if (!Array.isArray(rawIngredients) || rawIngredients.length === 0) {
      return NextResponse.json({ error: 'Công thức cần có ít nhất một nguyên liệu định lượng.' }, { status: 400 });
    }

    if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
      return NextResponse.json({ error: 'Công thức cần có ít nhất một bước thực hiện.' }, { status: 400 });
    }

    // INVARIANTS GATE P5:
    // Cấm tuyệt đối status = 'PUBLISHED'
    const targetStatus: 'DRAFT' | 'SUBMITTED' = submitNow === true ? 'SUBMITTED' : 'DRAFT';

    const baseSlug = slugify(name);
    let finalSlug = baseSlug || `recipe-${Date.now()}`;
    const [existingRecipe] = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.slug, finalSlug))
      .limit(1);

    if (existingRecipe) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-6)}`;
    }

    // Dish resolution
    const dName = (dishName || name).trim();
    const dishSlug = slugify(dName) || finalSlug;
    let resolvedDishId: number;

    const [existingDish] = await db
      .select({ id: dishes.id })
      .from(dishes)
      .where(eq(dishes.slug, dishSlug))
      .limit(1);

    if (existingDish) {
      resolvedDishId = existingDish.id;
    } else {
      const [newDish] = await db
        .insert(dishes)
        .values({
          name: dName,
          slug: dishSlug,
          defaultRole: role,
          description: shortDescription.trim(),
        })
        .returning({ id: dishes.id });
      resolvedDishId = newDish.id;
    }

    // Transaction an toàn
    const created = await db.transaction(async (tx) => {
      // 1. Chèn recipe với INVARIANTS: provenance='COMMUNITY_SUBMITTED', authorId=user.id
      const [rec] = await tx
        .insert(recipes)
        .values({
          dishId: resolvedDishId,
          slug: finalSlug,
          name: name.trim(),
          shortDescription: shortDescription.trim(),
          role,
          status: targetStatus,
          provenance: 'COMMUNITY_SUBMITTED',
          baseServings: Number(baseServings) || 4,
          prepTimeMinutes: Number(prepTimeMinutes) || 0,
          cookTimeMinutes: Number(cookTimeMinutes) || 0,
          difficulty: difficulty || 'Dễ',
          heroImage: heroImage || null,
          region: region || 'GENERAL',
          kitchenStory: kitchenStory ? String(kitchenStory).trim() : null,
          sourceAttribution: sourceAttribution ? String(sourceAttribution).trim() : null,
          variantOfId: variantOfId ? Number(variantOfId) : null,
          authorId: user.id,
          isEditorialReviewed: false,
          isCookTested: false,
          isNutritionVerified: false,
        })
        .returning();

      // 2. Chèn ingredients
      const ingValues = rawIngredients.map((item: any, idx: number) => ({
        recipeId: rec.id,
        ingredientId: Number(item.ingredientId),
        amount: Number(item.amount) || 1,
        unit: String(item.unit || 'g').trim(),
        scalePolicy: item.scalePolicy || 'LINEAR',
        preparation: item.preparation ? String(item.preparation).trim() : null,
        isOptional: Boolean(item.isOptional),
        sortOrder: idx + 1,
      }));
      await tx.insert(recipeIngredients).values(ingValues);

      // 3. Chèn cooking steps
      const stepValues = rawSteps.map((item: any, idx: number) => ({
        recipeId: rec.id,
        stepNumber: idx + 1,
        phaseName: item.phaseName || (idx === 0 ? 'Sơ chế' : idx === rawSteps.length - 1 ? 'Hoàn thành' : 'Chế biến'),
        instruction: String(item.instruction || '').trim(),
        timerSeconds: item.timerSeconds ? Number(item.timerSeconds) : (item.timerMinutes ? Number(item.timerMinutes) * 60 : null),
        tipText: item.tipText ? String(item.tipText).trim() : null,
        image: item.image || null,
      }));
      await tx.insert(cookingSteps).values(stepValues);

      // 4. Chèn taxonomy tags
      if (Array.isArray(taxonomyIds) && taxonomyIds.length > 0) {
        await tx.insert(recipeTags).values(
          taxonomyIds.map((tid: number) => ({
            recipeId: rec.id,
            taxonomyId: Number(tid),
          }))
        );
      }

      return rec;
    });

    try {
      await calculateRecipeNutrition(created.id);
    } catch (nutErr) {
      logger.warn('Auto nutrition calculation for contributor recipe skipped', { error: nutErr });
    }

    logger.info('Community contributor recipe submitted', {
      recipeId: created.id,
      slug: created.slug,
      authorId: user.id,
      status: targetStatus,
    });

    return NextResponse.json({
      success: true,
      recipe: created,
      message: targetStatus === 'SUBMITTED'
        ? 'Công thức đã được gửi vào hàng chờ duyệt của Ban biên tập!'
        : 'Công thức đã được lưu thành bản nháp cá nhân.',
    });
  } catch (error) {
    logger.error('Error submitting contributor recipe', { error });
    return NextResponse.json(
      { error: 'Không thể tạo bài đóng góp lúc này. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
