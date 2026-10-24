import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  users,
  recipes,
  ingredients,
  ingredientNutrition,
  taxonomies,
  savedRecipes,
  mealDiaryEntries,
  mealPlans,
  pantryItems,
  recipeCookedFeedbacks,
  recipeReports,
} from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getSessionUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
    }
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'EDITOR') {
      return NextResponse.json({ error: 'Không có quyền truy cập dữ liệu Quản trị.' }, { status: 403 });
    }

    const [
      allUsers,
      allRecipes,
      ingredientCountRes,
      nutritionCountRes,
      taxonomyCountRes,
      savedByRecipe,
      plansByRecipe,
      recentDiary,
      diaryTotalRes,
      plansTotalRes,
      pantryTotalRes,
      feedbacksTotalRes,
      reportsTotalRes,
    ] = await Promise.all([
      db
        .select({
          id: users.id,
          displayName: users.displayName,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt)),
      db
        .select({
          id: recipes.id,
          slug: recipes.slug,
          name: recipes.name,
          role: recipes.role,
          status: recipes.status,
          caloriesPerServing: recipes.caloriesPerServing,
          isEditorialReviewed: recipes.isEditorialReviewed,
          isCookTested: recipes.isCookTested,
          isNutritionVerified: recipes.isNutritionVerified,
          heroImage: recipes.heroImage,
          createdAt: recipes.createdAt,
        })
        .from(recipes)
        .orderBy(desc(recipes.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(ingredients),
      db.select({ count: sql<number>`count(*)::int` }).from(ingredientNutrition),
      db.select({ count: sql<number>`count(*)::int` }).from(taxonomies),
      db
        .select({
          recipeId: savedRecipes.recipeId,
          count: sql<number>`count(*)::int`,
        })
        .from(savedRecipes)
        .groupBy(savedRecipes.recipeId),
      db
        .select({
          recipeId: mealPlans.recipeId,
          count: sql<number>`count(*)::int`,
        })
        .from(mealPlans)
        .groupBy(mealPlans.recipeId),
      db
        .select({
          id: mealDiaryEntries.id,
          userId: mealDiaryEntries.userId,
          recipeName: mealDiaryEntries.recipeName,
          diaryDate: mealDiaryEntries.diaryDate,
          mealType: mealDiaryEntries.mealType,
          calories: mealDiaryEntries.calories,
          protein: mealDiaryEntries.protein,
          fat: mealDiaryEntries.fat,
          carbs: mealDiaryEntries.carbs,
          createdAt: mealDiaryEntries.createdAt,
        })
        .from(mealDiaryEntries)
        .orderBy(desc(mealDiaryEntries.createdAt))
        .limit(12),
      db.select({ count: sql<number>`count(*)::int` }).from(mealDiaryEntries),
      db.select({ count: sql<number>`count(*)::int` }).from(mealPlans),
      db.select({ count: sql<number>`count(*)::int` }).from(pantryItems),
      db.select({ count: sql<number>`count(*)::int` }).from(recipeCookedFeedbacks),
      db.select({ count: sql<number>`count(*)::int` }).from(recipeReports),
    ]);

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // 1. Thống kê Tài khoản
    const userMetrics = {
      total: allUsers.length,
      admins: allUsers.filter((u) => u.role === 'ADMIN').length,
      editors: allUsers.filter((u) => u.role === 'EDITOR').length,
      cooks: allUsers.filter((u) => u.role === 'COOK').length,
      newLast7Days: allUsers.filter((u) => new Date(u.createdAt).getTime() >= sevenDaysAgo).length,
      recentUsers: allUsers.slice(0, 6),
    };

    // 2. Thống kê Công thức & Bài viết
    const publishedRecipes = allRecipes.filter((r) => r.status === 'PUBLISHED');
    const calRecipes = publishedRecipes.filter((r) => typeof r.caloriesPerServing === 'number');
    const avgCalories =
      calRecipes.length > 0
        ? Math.round(
            calRecipes.reduce((acc, r) => acc + (r.caloriesPerServing || 0), 0) / calRecipes.length
          )
        : 0;

    const recipeMetrics = {
      total: allRecipes.length,
      published: publishedRecipes.length,
      draft: allRecipes.filter((r) => r.status === 'DRAFT').length,
      submitted: allRecipes.filter((r) => r.status === 'SUBMITTED').length,
      needsChanges: allRecipes.filter((r) => r.status === 'NEEDS_CHANGES').length,
      editorialReviewed: allRecipes.filter((r) => r.isEditorialReviewed).length,
      cookTested: allRecipes.filter((r) => r.isCookTested).length,
      nutritionVerified: allRecipes.filter((r) => r.caloriesPerServing !== null).length,
      avgCaloriesPerServing: avgCalories,
      byRole: {
        MAIN: allRecipes.filter((r) => r.role === 'MAIN').length,
        SOUP: allRecipes.filter((r) => r.role === 'SOUP').length,
        SIDE: allRecipes.filter((r) => r.role === 'SIDE').length,
        DIPPING_SAUCE: allRecipes.filter((r) => r.role === 'DIPPING_SAUCE').length,
        OTHER: allRecipes.filter(
          (r) => !['MAIN', 'SOUP', 'SIDE', 'DIPPING_SAUCE'].includes(r.role)
        ).length,
      },
    };

    // 3. Top món ăn được tương tác nhiều nhất
    const savedMap = new Map(savedByRecipe.map((s) => [s.recipeId, s.count]));
    const planMap = new Map(plansByRecipe.map((p) => [p.recipeId, p.count]));

    const topRecipes = allRecipes
      .map((r) => {
        const saves = savedMap.get(r.id) || 0;
        const plans = planMap.get(r.id) || 0;
        return {
          ...r,
          savesCount: saves,
          plansCount: plans,
          engagementScore: saves * 2 + plans,
        };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore || b.id - a.id)
      .slice(0, 8);

    // 4. Nhật ký Calo & Quét ảnh AI gần đây kèm tên người dùng
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const recentDiaryFeed = recentDiary.map((d) => ({
      ...d,
      isAiScan: d.recipeName.includes('📸'),
      userDisplayName: userMap.get(d.userId)?.displayName || 'Thành viên',
      userEmail: userMap.get(d.userId)?.email || '',
    }));

    return NextResponse.json({
      ok: true,
      userMetrics,
      recipeMetrics,
      catalogMetrics: {
        ingredientsCount: ingredientCountRes[0]?.count || 0,
        nutritionVerifiedIngredients: nutritionCountRes[0]?.count || 0,
        taxonomiesCount: taxonomyCountRes[0]?.count || 0,
      },
      activityMetrics: {
        totalSavedRecipes: savedByRecipe.reduce((acc, s) => acc + s.count, 0),
        totalDiaryEntries: diaryTotalRes[0]?.count || 0,
        totalMealPlans: plansTotalRes[0]?.count || 0,
        totalPantryItems: pantryTotalRes[0]?.count || 0,
        totalFeedbacks: feedbacksTotalRes[0]?.count || 0,
        totalReports: reportsTotalRes[0]?.count || 0,
      },
      topRecipes,
      recentDiaryFeed,
    });
  } catch (error) {
    logger.error('Lỗi khi tải dữ liệu Dashboard Admin', { error: String(error) });
    return NextResponse.json(
      { error: 'Không thể tải dữ liệu tổng quan lúc này.' },
      { status: 500 }
    );
  }
}
