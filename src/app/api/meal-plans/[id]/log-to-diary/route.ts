// AG-41: Complete Meal Plan & Log to Family Meal Diary (1-Click Diary Sync)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mealPlans, mealDiaryEntries, recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq, and } from 'drizzle-orm';
import { calculateRecipeNutrition } from '@/lib/nutrition/calculator';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập.' }, { status: 401 });
    }

    const { id } = await params;
    const planId = Number(id);
    if (isNaN(planId)) {
      return NextResponse.json({ error: 'ID kế hoạch không hợp lệ.' }, { status: 400 });
    }

    const plan = await db.query.mealPlans.findFirst({
      where: and(
        eq(mealPlans.id, planId),
        eq(mealPlans.userId, user.id)
      ),
      with: {
        recipe: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Không tìm thấy kế hoạch hoặc bạn không có quyền thao tác.' }, { status: 404 });
    }

    // Đánh dấu hoàn thành kế hoạch
    await db.update(mealPlans)
      .set({ isCompleted: true, updatedAt: new Date() })
      .where(eq(mealPlans.id, planId));

    let diaryEntry = null;

    if (plan.recipeId && plan.recipe) {
      // Tính toán dinh dưỡng snapshot
      const nutrition = await calculateRecipeNutrition(plan.recipeId);
      const calories = nutrition ? Math.round(nutrition.perServing.calories) : (plan.recipe.caloriesPerServing || 350);
      const protein = nutrition ? nutrition.perServing.protein : 20.0;
      const fat = nutrition ? nutrition.perServing.fat : 10.0;
      const carbs = nutrition ? nutrition.perServing.carbs : 40.0;
      const sodium = nutrition ? nutrition.perServing.sodium : null;
      const fiber = nutrition ? nutrition.perServing.fiber : null;

      [diaryEntry] = await db.insert(mealDiaryEntries).values({
        userId: user.id,
        recipeId: plan.recipeId,
        recipeName: plan.recipe.name,
        diaryDate: plan.planDate,
        mealType: plan.mealType,
        memberName: 'Cả nhà',
        consumedPortion: 1.0,
        calories,
        protein,
        fat,
        carbs,
        sodium,
        fiber,
      }).returning();
    } else {
      // Món tùy chỉnh không có recipeId
      [diaryEntry] = await db.insert(mealDiaryEntries).values({
        userId: user.id,
        recipeId: null,
        recipeName: plan.customDishName || 'Món ăn gia đình',
        diaryDate: plan.planDate,
        mealType: plan.mealType,
        memberName: 'Cả nhà',
        consumedPortion: 1.0,
        calories: 350,
        protein: 15.0,
        fat: 10.0,
        carbs: 45.0,
        sodium: 600,
        fiber: null,
      }).returning();
    }

    logger.info('Meal plan completed and logged to diary', { userId: user.id, planId, diaryId: diaryEntry?.id });

    return NextResponse.json({
      success: true,
      message: `Đã hoàn thành món "${plan.customDishName || plan.recipe?.name}" và ghi vào Nhật ký dinh dưỡng!`,
      diaryEntry,
    });
  } catch (error) {
    console.error('Error logging meal plan to diary:', error);
    logger.error('Error logging meal plan to diary', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi hoàn thành kế hoạch và ghi nhật ký.', details: String(error) }, { status: 500 });
  }
}
