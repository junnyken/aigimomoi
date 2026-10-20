// AG-41: Weekly Meal Planner API (Get 7-Day Plans & Add Entry)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mealPlans, recipes } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để xem kế hoạch tuần.' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    let weekStart = searchParams.get('weekStart');

    // Nếu không truyền, tính ngày Thứ 2 của tuần hiện tại
    if (!weekStart) {
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      weekStart = monday.toISOString().split('T')[0];
    }

    // Tính ngày Chủ nhật (6 ngày sau Thứ 2)
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const weekEnd = endDate.toISOString().split('T')[0];

    const plans = await db.query.mealPlans.findMany({
      where: and(
        eq(mealPlans.userId, user.id),
        gte(mealPlans.planDate, weekStart),
        lte(mealPlans.planDate, weekEnd)
      ),
      orderBy: [asc(mealPlans.planDate), asc(mealPlans.mealType)],
      with: {
        recipe: {
          columns: {
            id: true,
            slug: true,
            name: true,
            role: true,
            heroImage: true,
            caloriesPerServing: true,
            baseServings: true,
          },
        },
      },
    });

    return NextResponse.json({
      weekStart,
      weekEnd,
      plans,
      totalPlans: plans.length,
      completedPlans: plans.filter((p) => p.isCompleted).length,
    });
  } catch (error) {
    logger.error('Error fetching weekly meal plans', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy kế hoạch tuần.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để lập kế hoạch.' }, { status: 401 });
    }

    const body = await request.json();
    const { planDate, dayOfWeek, mealType = 'LUNCH', recipeId, customDishName, servings = 4, notes } = body;

    if (!planDate || typeof planDate !== 'string') {
      return NextResponse.json({ error: 'Ngày lên kế hoạch (planDate) không được để trống.' }, { status: 400 });
    }

    if (!recipeId && (!customDishName || !customDishName.trim())) {
      return NextResponse.json({ error: 'Vui lòng chọn công thức hoặc nhập tên món ăn.' }, { status: 400 });
    }

    // Xác định dayOfWeek nếu chưa có (1 = Thứ 2, 7 = Chủ nhật)
    let computedDayOfWeek = dayOfWeek;
    if (!computedDayOfWeek) {
      const d = new Date(planDate);
      const jsDay = d.getDay(); // 0 = CN, 1 = T2
      computedDayOfWeek = jsDay === 0 ? 7 : jsDay;
    }

    let dishName = customDishName ? customDishName.trim() : null;
    if (recipeId) {
      const r = await db.query.recipes.findFirst({
        where: eq(recipes.id, Number(recipeId)),
        columns: { name: true },
      });
      if (r && !dishName) {
        dishName = r.name;
      }
    }

    const [newPlan] = await db.insert(mealPlans).values({
      userId: user.id,
      planDate: planDate.trim(),
      dayOfWeek: computedDayOfWeek,
      mealType: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].includes(mealType) ? mealType : 'LUNCH',
      recipeId: recipeId ? Number(recipeId) : null,
      customDishName: dishName,
      servings: Number(servings) > 0 ? Number(servings) : 4,
      notes: notes ? String(notes).trim() : null,
      isCompleted: false,
    }).returning();

    logger.info('Created meal plan entry', { userId: user.id, planId: newPlan.id, planDate });
    return NextResponse.json({ success: true, plan: newPlan }, { status: 201 });
  } catch (error) {
    logger.error('Error creating meal plan entry', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo kế hoạch món ăn.' }, { status: 500 });
  }
}
