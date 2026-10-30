// AG-36: Recipe Nutrition API (Calculate & Fetch Nutrition Snapshot)
// Cho phép tính toán và truy xuất dữ liệu dinh dưỡng chuẩn Viện Dinh Dưỡng

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { calculateRecipeNutrition } from '@/lib/nutrition/calculator';
import { canAccessRecipe } from '@/lib/gating/entitlements';
import { getUserRecipeEntitlements } from '@/lib/gating/queries';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const recipeId = Number(id);

    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ.' }, { status: 400 });
    }

    const [recipe] = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        status: recipes.status,
        provenance: recipes.provenance,
        price: recipes.price,
        isFree: recipes.isFree,
        authorId: recipes.authorId,
        caloriesPerServing: recipes.caloriesPerServing,
        nutritionStatus: recipes.nutritionStatus,
        isNutritionVerified: recipes.isNutritionVerified,
        nutritionSnapshot: recipes.nutritionSnapshot,
      })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    const user = await getSessionUser(request);
    const isStaff = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    if (!recipe || (!isStaff && recipe.status !== 'PUBLISHED' && recipe.authorId !== user?.id)) {
      return NextResponse.json({ error: 'Không tìm thấy công thức.' }, { status: 404 });
    }

    let safeNutrition = recipe.nutritionSnapshot;
    if (!isStaff && safeNutrition) {
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
      if (!hasAccess) {
        safeNutrition = {
          ...safeNutrition,
          ingredientsDetail: [],
          missingIngredients: [],
        };
      }
    }

    return NextResponse.json({
      success: true,
      nutrition: safeNutrition,
      summary: {
        caloriesPerServing: recipe.caloriesPerServing,
        nutritionStatus: recipe.nutritionStatus,
        isNutritionVerified: recipe.isNutritionVerified,
      },
    });
  } catch (error) {
    logger.error('Error fetching recipe nutrition:', error);
    return NextResponse.json(
      { error: 'Không thể tải thông tin dinh dưỡng lúc này.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json(
        { error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' },
        { status: 403 }
      );
    }

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để tính toán dinh dưỡng.' }, { status: 401 });
    }

    const rate = await checkRateLimitShared(
      'recipe-nutrition-calc',
      `${user.id}:${getClientIp(request)}`,
      30,
      60_000
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Thao tác tính toán dinh dưỡng quá nhanh. Vui lòng thử lại sau ít giây.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const { id } = await context.params;
    const recipeId = Number(id);

    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ.' }, { status: 400 });
    }

    const [recipe] = await db
      .select({ id: recipes.id, authorId: recipes.authorId })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipe) {
      return NextResponse.json({ error: 'Không tìm thấy công thức.' }, { status: 404 });
    }

    const isStaff = user.role === 'ADMIN' || user.role === 'EDITOR';
    if (!isStaff && recipe.authorId !== user.id) {
      return NextResponse.json(
        { error: 'Chỉ Ban biên tập, Quản trị viên hoặc tác giả mới được tính toán lại dinh dưỡng.' },
        { status: 403 }
      );
    }

    // Tính toán snapshot dinh dưỡng
    const snapshot = await calculateRecipeNutrition(recipeId);

    return NextResponse.json({
      success: true,
      message: 'Đã tính toán dinh dưỡng thành công theo Bảng thành phần thực phẩm Việt Nam.',
      snapshot,
    });
  } catch (error: unknown) {
    logger.error('Error calculating recipe nutrition:', error);
    return NextResponse.json(
      { error: 'Lỗi khi tính toán dinh dưỡng.' },
      { status: 500 }
    );
  }
}
