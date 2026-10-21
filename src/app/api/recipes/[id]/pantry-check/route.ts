// AG-40: Check Recipe Ingredients against User's Pantry (Smart Matching)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recipes, recipeIngredients, pantryItems } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/session';
import { canAccessRecipe } from '@/lib/gating/entitlements';
import { getUserRecipeEntitlements } from '@/lib/gating/queries';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipeId = Number(id);
    if (isNaN(recipeId)) {
      return NextResponse.json({ error: 'ID công thức không hợp lệ.' }, { status: 400 });
    }

    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, recipeId),
      with: {
        ingredients: {
          with: {
            ingredient: true,
          },
        },
      },
    });

    const user = await getSessionUser();
    const isStaff = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    if (!recipe || (!isStaff && recipe.status !== 'PUBLISHED' && recipe.authorId !== user?.id)) {
      return NextResponse.json({ error: 'Không tìm thấy công thức.' }, { status: 404 });
    }

    if (!isStaff) {
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
        return NextResponse.json(
          {
            error: 'Vui lòng mở khóa công thức để đối chiếu nguyên liệu với tủ lạnh.',
            isGated: true,
            totalIngredients: 0,
            availableCount: 0,
            coveragePercent: 0,
            matchedIngredients: [],
            missingIngredients: [],
            isLoggedIn: Boolean(user),
          },
          { status: 403 }
        );
      }
    }

    if (!user) {
      return NextResponse.json({
        totalIngredients: recipe.ingredients.length,
        availableCount: 0,
        coveragePercent: 0,
        matchedIngredients: [],
        missingIngredients: recipe.ingredients.map((ri) => ({
          name: ri.ingredient.name,
          amount: ri.amount,
          unit: ri.unit,
        })),
        isLoggedIn: false,
      });
    }

    // Lấy toàn bộ pantry của user
    const userPantry = await db.query.pantryItems.findMany({
      where: eq(pantryItems.userId, user.id),
    });

    const matchedIngredients: any[] = [];
    const missingIngredients: any[] = [];

    for (const ri of recipe.ingredients) {
      const ingName = ri.ingredient.name.toLowerCase().trim();
      const ingId = ri.ingredientId;

      // Tìm trong pantry
      const foundInPantry = userPantry.find((p) => {
        if (p.ingredientId && p.ingredientId === ingId) return true;
        const pName = p.customName.toLowerCase().trim();
        return pName === ingName || pName.includes(ingName) || ingName.includes(pName);
      });

      if (foundInPantry) {
        matchedIngredients.push({
          name: ri.ingredient.name,
          recipeAmount: ri.amount,
          recipeUnit: ri.unit,
          pantryQuantity: foundInPantry.quantity,
          pantryUnit: foundInPantry.unit,
          pantryLocation: foundInPantry.location,
        });
      } else {
        missingIngredients.push({
          name: ri.ingredient.name,
          amount: ri.amount,
          unit: ri.unit,
        });
      }
    }

    const total = recipe.ingredients.length;
    const available = matchedIngredients.length;
    const coveragePercent = total > 0 ? Math.round((available / total) * 100) : 0;

    return NextResponse.json({
      totalIngredients: total,
      availableCount: available,
      coveragePercent,
      matchedIngredients,
      missingIngredients,
      isLoggedIn: true,
    });
  } catch (error) {
    logger.error('Error checking recipe pantry', { error });
    return NextResponse.json({ error: 'Lỗi máy chủ khi đối chiếu tủ lạnh.' }, { status: 500 });
  }
}
