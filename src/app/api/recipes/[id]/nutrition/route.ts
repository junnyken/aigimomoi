// AG-36: Recipe Nutrition API (Calculate & Fetch Nutrition Snapshot)
// Cho phép tính toán và truy xuất dữ liệu dinh dưỡng chuẩn Viện Dinh Dưỡng

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { calculateRecipeNutrition } from '@/lib/nutrition/calculator';
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
        caloriesPerServing: recipes.caloriesPerServing,
        nutritionStatus: recipes.nutritionStatus,
        isNutritionVerified: recipes.isNutritionVerified,
        nutritionSnapshot: recipes.nutritionSnapshot,
      })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (!recipe) {
      return NextResponse.json({ error: 'Không tìm thấy công thức.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      nutrition: recipe.nutritionSnapshot,
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
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để tính toán dinh dưỡng.' }, { status: 401 });
    }

    const { id } = await context.params;
    const recipeId = Number(id);

    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ.' }, { status: 400 });
    }

    // Tính toán snapshot dinh dưỡng
    const snapshot = await calculateRecipeNutrition(recipeId);

    return NextResponse.json({
      success: true,
      message: 'Đã tính toán dinh dưỡng thành công theo Bảng thành phần thực phẩm Việt Nam.',
      snapshot,
    });
  } catch (error: any) {
    logger.error('Error calculating recipe nutrition:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi tính toán dinh dưỡng.' },
      { status: 500 }
    );
  }
}
