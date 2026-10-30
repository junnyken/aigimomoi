// AG-37 & AG-38: Family Meal Diary API (Get & Log Entries)
// Invariants Gate P6:
// - Lượng đã ăn khác lượng đã nấu (tính theo consumedPortion)
// - Snapshot dinh dưỡng lưu độc lập, không bị hồi tố
// - Quyền riêng tư gia đình: Chỉ chính chủ user mới xem được dữ liệu của mình

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mealDiaryEntries, recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimitShared, getClientIp } from '@/lib/auth/rateLimit';
import { isCrossSiteRequest } from '@/lib/http/sameOrigin';
import { eq, and, asc } from 'drizzle-orm';
import { calculateRecipeNutrition } from '@/lib/nutrition/calculator';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để xem nhật ký ăn uống.' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const todayStr = new Date().toISOString().split('T')[0];
    const queryDate = searchParams.get('date') || todayStr;

    // Lấy tất cả các món đã ăn trong ngày của user
    const entries = await db.query.mealDiaryEntries.findMany({
      where: and(
        eq(mealDiaryEntries.userId, user.id),
        eq(mealDiaryEntries.diaryDate, queryDate)
      ),
      orderBy: [asc(mealDiaryEntries.createdAt)],
      with: {
        recipe: {
          columns: {
            slug: true,
            heroImage: true,
          },
        },
      },
    });

    // Tính toán tổng hợp ngày (Daily Summary)
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalSodium: number | null = null;
    let totalFiber: number | null = null;
    let hasSodium = false;
    let hasFiber = false;

    // Gom nhóm theo bữa ăn
    const meals = {
      BREAKFAST: [] as typeof entries,
      LUNCH: [] as typeof entries,
      DINNER: [] as typeof entries,
      SNACK: [] as typeof entries,
    };

    for (const entry of entries) {
      if (meals[entry.mealType]) {
        meals[entry.mealType].push(entry);
      }
      totalCalories += entry.calories;
      totalProtein += entry.protein;
      totalFat += entry.fat;
      totalCarbs += entry.carbs;

      if (entry.sodium !== null) {
        hasSodium = true;
        totalSodium = (totalSodium ?? 0) + entry.sodium;
      }
      if (entry.fiber !== null) {
        hasFiber = true;
        totalFiber = (totalFiber ?? 0) + entry.fiber;
      }
    }

    // Tỉ lệ năng lượng từ Đạm (4 kcal/g), Béo (9 kcal/g), Đường bột (4 kcal/g)
    const calFromProtein = totalProtein * 4;
    const calFromFat = totalFat * 9;
    const calFromCarbs = totalCarbs * 4;
    const macroTotalCal = calFromProtein + calFromFat + calFromCarbs;

    const macroPercentages = macroTotalCal > 0 ? {
      protein: Math.round((calFromProtein / macroTotalCal) * 100),
      fat: Math.round((calFromFat / macroTotalCal) * 100),
      carbs: Math.round((calFromCarbs / macroTotalCal) * 100),
    } : { protein: 0, fat: 0, carbs: 0 };

    // Cảnh báo sức khỏe chuẩn Viện Dinh Dưỡng
    const alerts: string[] = [];
    if (totalSodium !== null && totalSodium > 2000) {
      alerts.push(`Hôm nay gia đình đã nạp ${Math.round(totalSodium)} mg Natri (vượt ngưỡng 2000mg/ngày khuyến nghị của Viện Dinh Dưỡng). Nên giảm chấm nước mắm hoặc ăn nhạt hơn vào bữa tiếp theo.`);
    }

    return NextResponse.json({
      success: true,
      date: queryDate,
      entries,
      meals,
      summary: {
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalSodium: hasSodium && totalSodium !== null ? Math.round(totalSodium) : null,
        totalFiber: hasFiber && totalFiber !== null ? Math.round(totalFiber * 10) / 10 : null,
        macroPercentages,
        alerts,
      },
    });
  } catch (error) {
    logger.error('Error fetching meal diary:', error);
    return NextResponse.json({ error: 'Không thể tải nhật ký bữa ăn.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (isCrossSiteRequest(request)) {
      return NextResponse.json({ error: 'Yêu cầu bị từ chối do khác nguồn gốc (CSRF).' }, { status: 403 });
    }

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để ghi nhật ký bữa ăn.' }, { status: 401 });
    }

    const rate = await checkRateLimitShared('diary-write', `${user.id}:${getClientIp(request)}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Thao tác ghi nhật ký quá nhanh. Vui lòng thử lại sau ít phút.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      recipeId,
      recipeName,
      diaryDate,
      mealType = 'LUNCH',
      memberName = 'Cả nhà',
      consumedPortion = 1.0,
      customCalories,
      customProtein,
      customFat,
      customCarbs,
      customFiber,
      customSodium,
    } = body;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const finalDate = (diaryDate && dateRegex.test(diaryDate)) 
      ? diaryDate 
      : new Date().toISOString().split('T')[0];

    const portion = Number(consumedPortion);
    if (isNaN(portion) || portion <= 0 || portion > 10) {
      return NextResponse.json({ error: 'Khẩu phần ăn không hợp lệ (từ 0.1 đến 10.0).' }, { status: 400 });
    }

    let finalName = (recipeName && String(recipeName).trim()) || 'Món ăn tự do';
    let baseCalories = typeof customCalories === 'number' && customCalories >= 0 ? customCalories : 250;
    let baseProtein = typeof customProtein === 'number' && customProtein >= 0 ? customProtein : 15;
    let baseFat = typeof customFat === 'number' && customFat >= 0 ? customFat : 10;
    let baseCarbs = typeof customCarbs === 'number' && customCarbs >= 0 ? customCarbs : 20;
    let baseSodium: number | null = typeof customSodium === 'number' && customSodium >= 0 ? customSodium : null;
    let baseFiber: number | null = typeof customFiber === 'number' && customFiber >= 0 ? customFiber : null;

    let resolvedRecipeId: number | null = null;
    if (recipeId !== undefined && recipeId !== null && recipeId !== '') {
      const numRecipeId = Number(recipeId);
      if (!Number.isInteger(numRecipeId) || numRecipeId <= 0) {
        return NextResponse.json({ error: 'Mã công thức không hợp lệ.' }, { status: 400 });
      }
      const [recipe] = await db
        .select()
        .from(recipes)
        .where(eq(recipes.id, numRecipeId))
        .limit(1);

      const isStaff = user.role === 'ADMIN' || user.role === 'EDITOR';
      const canAccessRecipe =
        Boolean(recipe) &&
        (recipe.status === 'PUBLISHED' || recipe.authorId === user.id || isStaff);

      if (!recipe || !canAccessRecipe) {
        return NextResponse.json(
          { error: 'Không tìm thấy công thức đã xuất bản hoặc bạn không có quyền truy cập công thức này.' },
          { status: 404 }
        );
      }

      resolvedRecipeId = recipe.id;
      finalName = recipe.name;
      // Kiểm tra xem đã có snapshot dinh dưỡng chưa
      let snapshot: any = recipe.nutritionSnapshot;
      if (!snapshot || !snapshot.perServing) {
        try {
          snapshot = await calculateRecipeNutrition(numRecipeId);
        } catch {
          // Dùng số liệu ước tính thô nếu không tính được
        }
      }

      if (snapshot && snapshot.perServing) {
        baseCalories = snapshot.perServing.calories || recipe.caloriesPerServing || 250;
        baseProtein = snapshot.perServing.protein || 0;
        baseFat = snapshot.perServing.fat || 0;
        baseCarbs = snapshot.perServing.carbs || 0;
        baseSodium = snapshot.perServing.sodium ?? null;
        baseFiber = snapshot.perServing.fiber ?? null;
      } else if (recipe.caloriesPerServing) {
        baseCalories = recipe.caloriesPerServing;
      }
    }

    // Nhân với khẩu phần thực tế đã ăn (Lượng ăn khác lượng nấu - Gate P6)
    const entryCalories = Math.round(baseCalories * portion);
    const entryProtein = Math.round(baseProtein * portion * 10) / 10;
    const entryFat = Math.round(baseFat * portion * 10) / 10;
    const entryCarbs = Math.round(baseCarbs * portion * 10) / 10;
    const entrySodium = baseSodium !== null ? Math.round(baseSodium * portion) : null;
    const entryFiber = baseFiber !== null ? Math.round(baseFiber * portion * 10) / 10 : null;

    const [newEntry] = await db
      .insert(mealDiaryEntries)
      .values({
        userId: user.id,
        recipeId: resolvedRecipeId,
        recipeName: finalName,
        diaryDate: finalDate,
        mealType,
        memberName: String(memberName).trim() || 'Cả nhà',
        consumedPortion: portion,
        calories: entryCalories,
        protein: entryProtein,
        fat: entryFat,
        carbs: entryCarbs,
        sodium: entrySodium,
        fiber: entryFiber,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `Đã ghi nhận món ${finalName} (${portion} phần) vào nhật ký.`,
      entry: newEntry,
    });
  } catch (error) {
    logger.error('Error logging meal diary entry:', error);
    return NextResponse.json({ error: 'Không thể ghi nhận món ăn lúc này.' }, { status: 500 });
  }
}
