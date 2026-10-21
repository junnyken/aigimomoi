import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes, recipeIngredients } from '@/lib/db/schema';
import { safeImageSrc, isValidPublicSlug } from '@/lib/recipes/publicQueries';
import { isIllustrationImage } from '@/lib/recipes/labels';
import { COMMUNITY_PROVENANCE, recipeSourceFromProvenance, type RecipeSource } from '@/lib/recipes/source';
import { canAccessRecipe } from '@/lib/gating/entitlements';
import { getUserRecipeEntitlements } from '@/lib/gating/queries';
import type { RecipeNutritionSnapshot } from '@/lib/nutrition/types';
import { FALLBACK_PUBLIC_RECIPES, getFallbackMealOptions } from '@/lib/recipes/fallbackCatalog';
import {
  BUILT_IN_DIPPING_SAUCES,
  type MealSlotRole,
  type MealDishMacros,
  type MealDishSummary,
  type MealSelection,
} from './mealPresets';

export {
  BUILT_IN_DIPPING_SAUCES,
  type MealSlotRole,
  type MealDishMacros,
  type MealDishSummary,
  type MealSelection,
};

const mealColumns = {
  slug: recipes.slug,
  name: recipes.name,
  shortDescription: recipes.shortDescription,
  role: recipes.role,
  baseServings: recipes.baseServings,
  prepTimeMinutes: recipes.prepTimeMinutes,
  cookTimeMinutes: recipes.cookTimeMinutes,
  difficulty: recipes.difficulty,
  caloriesPerServing: recipes.caloriesPerServing,
  nutritionStatus: recipes.nutritionStatus,
  nutritionSnapshot: recipes.nutritionSnapshot,
  heroImage: recipes.heroImage,
  isCookTested: recipes.isCookTested,
  provenance: recipes.provenance,
};

type MealRow = {
  slug: string;
  name: string;
  shortDescription: string;
  role: string;
  baseServings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: string;
  caloriesPerServing?: number | null;
  nutritionStatus?: 'NO_DATA' | 'INCOMPLETE' | 'ESTIMATED' | null;
  nutritionSnapshot?: unknown;
  heroImage: string | null;
  isCookTested: boolean;
  provenance: string;
};

function mapMealRow(row: MealRow, overrideRole?: MealSlotRole): MealDishSummary {
  const source = recipeSourceFromProvenance(row.provenance);
  const snap = row.nutritionSnapshot as RecipeNutritionSnapshot | null | undefined;
  const macrosPerServing: MealDishMacros | null =
    snap?.perServing && row.nutritionStatus !== 'NO_DATA'
      ? {
          protein: snap.perServing.protein ?? 0,
          fat: snap.perServing.fat ?? 0,
          carbs: snap.perServing.carbs ?? 0,
          fiber: snap.perServing.fiber ?? null,
          sodium: snap.perServing.sodium ?? null,
        }
      : null;

  return {
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    role: overrideRole ?? (row.role as MealSlotRole),
    baseServings: row.baseServings,
    prepTimeMinutes: row.prepTimeMinutes,
    cookTimeMinutes: row.cookTimeMinutes,
    totalTimeMinutes: row.prepTimeMinutes + row.cookTimeMinutes,
    difficulty: row.difficulty,
    caloriesPerServing: row.caloriesPerServing ?? null,
    nutritionStatus: row.nutritionStatus ?? 'NO_DATA',
    macrosPerServing,
    heroImage: safeImageSrc(row.heroImage),
    // Bất biến R7: món cộng đồng không mang nhãn "Đã nấu thử" của Bếp Mom
    isCookTested: source === 'EDITORIAL' ? row.isCookTested : false,
    isIllustration: isIllustrationImage(row.heroImage),
    source,
  };
}

/**
 * Lấy danh sách các món ăn đã PUBLISHED theo vai trò để hiển thị trong modal đổi món.
 * Invariants §5.1: Tuyệt đối chỉ lấy các công thức có status = 'PUBLISHED'.
 * R7: `editorialOnly` giới hạn trong món Bếp Mom (dùng cho gợi ý ngẫu nhiên/mặc định).
 */
export async function queryPublishedMealOptions(
  role?: MealSlotRole,
  options: { editorialOnly?: boolean } = {}
): Promise<MealDishSummary[]> {
  try {
    if (role === 'DIPPING_SAUCE') {
      const rows = await db
        .select(mealColumns)
        .from(recipes)
        .where(
          and(
            eq(recipes.status, 'PUBLISHED'),
            or(
              sql`${recipes.role}::text = 'DIPPING_SAUCE'`,
              ilike(recipes.name, '%nước chấm%'),
              ilike(recipes.name, '%nước mắm%'),
              ilike(recipes.name, '%kho quẹt%'),
              ilike(recipes.name, '%mắm nêm%'),
              ilike(recipes.name, '%muối ớt%'),
              ilike(recipes.name, '%sốt chấm%')
            ),
            options.editorialOnly ? ne(recipes.provenance, COMMUNITY_PROVENANCE) : undefined
          )
        )
        .orderBy(desc(recipes.publishedAt), desc(recipes.id));

      const dbSauces = rows.map((r) => mapMealRow(r, 'DIPPING_SAUCE'));
      const existingSlugs = new Set(dbSauces.map((s) => s.slug));
      return [
        ...dbSauces,
        ...BUILT_IN_DIPPING_SAUCES.filter((preset) => !existingSlugs.has(preset.slug)),
      ];
    }

    const allowedRoles = role ? [role] : ['MAIN', 'SOUP', 'SIDE'];

    const rows = await db
      .select(mealColumns)
      .from(recipes)
      .where(
        and(
          eq(recipes.status, 'PUBLISHED'),
          inArray(recipes.role, allowedRoles as ('MAIN' | 'SOUP' | 'SIDE')[]),
          options.editorialOnly ? ne(recipes.provenance, COMMUNITY_PROVENANCE) : undefined
        )
      )
      .orderBy(desc(recipes.publishedAt), desc(recipes.id));

    if (rows.length > 0) {
      return rows.map((r) => mapMealRow(r));
    }
    return getFallbackMealOptions(role);
  } catch {
    return getFallbackMealOptions(role);
  }
}

/**
 * Lấy chi tiết 1 món ăn cho slot mâm cơm theo slug.
 */
export async function querySingleMealDish(slug: string, expectedRole: MealSlotRole): Promise<MealDishSummary | null> {
  if (!isValidPublicSlug(slug)) return null;

  if (expectedRole === 'DIPPING_SAUCE') {
    const preset = BUILT_IN_DIPPING_SAUCES.find((p) => p.slug === slug);
    if (preset) return preset;
  }

  try {
    const [row] = await db
      .select(mealColumns)
      .from(recipes)
      .where(
        and(
          eq(recipes.slug, slug),
          eq(recipes.status, 'PUBLISHED'),
          expectedRole === 'DIPPING_SAUCE'
            ? sql`${recipes.role}::text = 'DIPPING_SAUCE'`
            : eq(recipes.role, expectedRole)
        )
      )
      .limit(1);

    if (row) return mapMealRow(row, expectedRole);
  } catch {
    // Fallback below
  }

  return getFallbackMealOptions(expectedRole).find((d) => d.slug === slug) ?? null;
}

/**
 * Phân giải 3 món ăn + 1 chén nước chấm đi kèm cho mâm cơm.
 */
export async function resolveMealSelection(params: {
  mainSlug?: string | null;
  soupSlug?: string | null;
  sideSlug?: string | null;
  sauceSlug?: string | null;
}): Promise<MealSelection> {
  // Mặc định khi thiếu slug: chỉ lấy món Bếp Mom (R7). Slug chỉ định rõ vẫn phân giải được món Chợ.
  const [mains, soups, sides, sauces] = await Promise.all([
    queryPublishedMealOptions('MAIN'),
    queryPublishedMealOptions('SOUP'),
    queryPublishedMealOptions('SIDE'),
    queryPublishedMealOptions('DIPPING_SAUCE'),
  ]);
  const firstEditorial = (list: MealDishSummary[]) =>
    list.find((d) => d.source !== 'COMMUNITY') ?? null;

  let main: MealDishSummary | null = null;
  if (params.mainSlug) {
    main = mains.find((d) => d.slug === params.mainSlug) || null;
  }
  if (!main) {
    main = firstEditorial(mains);
  }

  let soup: MealDishSummary | null = null;
  if (params.soupSlug) {
    soup = soups.find((d) => d.slug === params.soupSlug) || null;
  }
  if (!soup) {
    soup = firstEditorial(soups);
  }

  let side: MealDishSummary | null = null;
  if (params.sideSlug) {
    side = sides.find((d) => d.slug === params.sideSlug) || null;
  }
  if (!side) {
    side = firstEditorial(sides);
  }

  let sauce: MealDishSummary | null = null;
  if (params.sauceSlug) {
    sauce = sauces.find((d) => d.slug === params.sauceSlug) || null;
  }
  if (!sauce) {
    sauce = firstEditorial(sauces) ?? BUILT_IN_DIPPING_SAUCES[0];
  }

  return { main, soup, side, sauce };
}

/**
 * Thuật toán gợi ý ngẫu nhiên 1 mâm cơm 3 món từ kho công thức PUBLISHED.
 * R7: chỉ gợi ý từ món Bếp Mom (đã qua biên tập).
 */
export async function getRandomMealSlugs(): Promise<{ mainSlug: string; soupSlug: string; sideSlug: string } | null> {
  const [mains, soups, sides] = await Promise.all([
    queryPublishedMealOptions('MAIN', { editorialOnly: true }),
    queryPublishedMealOptions('SOUP', { editorialOnly: true }),
    queryPublishedMealOptions('SIDE', { editorialOnly: true }),
  ]);

  if (mains.length === 0 || soups.length === 0 || sides.length === 0) {
    return null;
  }

  const randomMain = mains[Math.floor(Math.random() * mains.length)];
  const randomSoup = soups[Math.floor(Math.random() * soups.length)];
  const randomSide = sides[Math.floor(Math.random() * sides.length)];

  return {
    mainSlug: randomMain.slug,
    soupSlug: randomSoup.slug,
    sideSlug: randomSide.slug,
  };
}

/**
 * Lấy danh sách các công thức PUBLISHED kèm bảng nguyên liệu đầy đủ để gộp nguyên liệu (AG-22).
 */
export async function queryMealRecipesForAggregation(slugs: string[], viewerId?: number | null) {
  const validSlugs = slugs.filter(isValidPublicSlug).slice(0, 10);
  if (validSlugs.length === 0) return [];

  try {
    const entitlements = viewerId ? await getUserRecipeEntitlements(viewerId) : new Set<number>();

    const rows = await db.query.recipes.findMany({
      where: and(inArray(recipes.slug, validSlugs), eq(recipes.status, 'PUBLISHED')),
      columns: {
        id: true,
        slug: true,
        name: true,
        baseServings: true,
        provenance: true,
        price: true,
        isFree: true,
        authorId: true,
      },
      with: {
        ingredients: {
          orderBy: [asc(recipeIngredients.sortOrder), asc(recipeIngredients.id)],
          columns: {
            id: true,
            amount: true,
            unit: true,
            scalePolicy: true,
            preparation: true,
            isOptional: true,
          },
          with: {
            ingredient: {
              columns: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (rows.length > 0) {
      return rows
        .filter((r) =>
          canAccessRecipe(
            {
              recipeId: r.id,
              provenance: r.provenance,
              price: r.price ?? 0,
              isFree: r.isFree ?? true,
              authorId: r.authorId,
            },
            viewerId ?? null,
            entitlements
          )
        )
        .map((r) => ({
          slug: r.slug,
          name: r.name,
          baseServings: r.baseServings,
          ingredients: r.ingredients.map((ri) => ({
            id: ri.id,
            name: ri.ingredient?.name || 'Nguyên liệu',
            category: ri.ingredient?.category || 'OTHER',
            amount: ri.amount,
            unit: ri.unit,
            scalePolicy: ri.scalePolicy as 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST',
            preparation: ri.preparation,
            isOptional: ri.isOptional,
          })),
        }));
    }
  } catch {
    // Fallback below
  }

  return FALLBACK_PUBLIC_RECIPES.filter((r) => validSlugs.includes(r.slug)).map((r) => ({
    slug: r.slug,
    name: r.name,
    baseServings: r.baseServings,
    ingredients: r.ingredients,
  }));
}

