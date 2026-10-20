// AG-41: Aggregate Weekly Meal Plans into Shopping List (Smart Aggregation with Pantry Deduplication)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mealPlans, recipes, recipeIngredients, pantryItems } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập để tổng hợp giỏ đi chợ.' }, { status: 401 });
    }

    const body = await request.json();
    const { planIds, weekStart, excludePantry = false } = body;

    let plans = [];

    if (Array.isArray(planIds) && planIds.length > 0) {
      plans = await db.query.mealPlans.findMany({
        where: and(
          eq(mealPlans.userId, user.id),
          inArray(mealPlans.id, planIds)
        ),
        with: {
          recipe: {
            with: {
              ingredients: {
                with: {
                  ingredient: true,
                },
              },
            },
          },
        },
      });
    } else if (weekStart) {
      const startDate = new Date(weekStart);
      const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      const weekEnd = endDate.toISOString().split('T')[0];

      plans = await db.query.mealPlans.findMany({
        where: and(
          eq(mealPlans.userId, user.id),
          gte(mealPlans.planDate, weekStart),
          lte(mealPlans.planDate, weekEnd)
        ),
        with: {
          recipe: {
            with: {
              ingredients: {
                with: {
                  ingredient: true,
                },
              },
            },
          },
        },
      });
    } else {
      return NextResponse.json({ error: 'Vui lòng cung cấp weekStart hoặc danh sách planIds.' }, { status: 400 });
    }

    // Lấy pantry items nếu cần loại trừ
    let userPantry: any[] = [];
    if (excludePantry) {
      userPantry = await db.query.pantryItems.findMany({
        where: eq(pantryItems.userId, user.id),
      });
    }

    // Tổng hợp nguyên liệu
    const ingredientMap: Record<string, {
      name: string;
      category: string;
      totalAmount: number;
      unit: string;
      recipesUsedIn: string[];
      inPantry: boolean;
      pantryQuantity?: number;
    }> = {};

    for (const plan of plans) {
      if (!plan.recipe) continue;
      const scale = plan.servings / (plan.recipe.baseServings || 4);

      for (const ri of plan.recipe.ingredients) {
        const key = `${ri.ingredient.name.toLowerCase().trim()}_${ri.unit.toLowerCase().trim()}`;
        const amount = ri.amount * scale;

        if (!ingredientMap[key]) {
          ingredientMap[key] = {
            name: ri.ingredient.name,
            category: ri.ingredient.category || 'Khác',
            totalAmount: 0,
            unit: ri.unit,
            recipesUsedIn: [],
            inPantry: false,
          };
        }

        ingredientMap[key].totalAmount += amount;
        if (!ingredientMap[key].recipesUsedIn.includes(plan.recipe.name)) {
          ingredientMap[key].recipesUsedIn.push(plan.recipe.name);
        }
      }
    }

    // Kiểm tra với Pantry
    if (excludePantry && userPantry.length > 0) {
      for (const key of Object.keys(ingredientMap)) {
        const item = ingredientMap[key];
        const found = userPantry.find((p) => {
          const pName = p.customName.toLowerCase().trim();
          const iName = item.name.toLowerCase().trim();
          return pName === iName || pName.includes(iName) || iName.includes(pName);
        });

        if (found) {
          item.inPantry = true;
          item.pantryQuantity = found.quantity;
        }
      }
    }

    // Gom nhóm theo quầy mua sắm
    const items = Object.values(ingredientMap).map((i) => ({
      ...i,
      totalAmount: Math.round(i.totalAmount * 10) / 10,
    }));

    const categories: Record<string, typeof items> = {};
    for (const item of items) {
      if (!categories[item.category]) {
        categories[item.category] = [];
      }
      categories[item.category].push(item);
    }

    logger.info('Aggregated meal plan shopping list', {
      userId: user.id,
      plansCount: plans.length,
      ingredientsCount: items.length,
      excludePantry,
    });

    return NextResponse.json({
      success: true,
      totalItems: items.length,
      categories,
      items,
      message: `Đã tổng hợp ${items.length} nguyên liệu từ ${plans.length} món ăn trong kế hoạch!`,
    });
  } catch (error) {
    logger.error('Error generating shopping list from meal plans', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi tổng hợp giỏ đi chợ từ kế hoạch.' }, { status: 500 });
  }
}
