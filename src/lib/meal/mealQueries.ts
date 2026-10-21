import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes } from '@/lib/db/schema';
import { safeImageSrc, isValidPublicSlug } from '@/lib/recipes/publicQueries';
import { isIllustrationImage } from '@/lib/recipes/labels';
import { COMMUNITY_PROVENANCE, recipeSourceFromProvenance, type RecipeSource } from '@/lib/recipes/source';

export interface MealDishSummary {
  slug: string;
  name: string;
  shortDescription: string;
  role: 'MAIN' | 'SOUP' | 'SIDE';
  baseServings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  difficulty: string;
  heroImage: string | null;
  isCookTested: boolean;
  isIllustration?: boolean;
  /** R7: Bếp Mom hay Chợ công thức */
  source?: RecipeSource;
}

export interface MealSelection {
  main: MealDishSummary | null;
  soup: MealDishSummary | null;
  side: MealDishSummary | null;
}

const mealColumns = {
  slug: recipes.slug,
  name: recipes.name,
  shortDescription: recipes.shortDescription,
  role: recipes.role,
  baseServings: recipes.baseServings,
  prepTimeMinutes: recipes.prepTimeMinutes,
  cookTimeMinutes: recipes.cookTimeMinutes,
  difficulty: recipes.difficulty,
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
  heroImage: string | null;
  isCookTested: boolean;
  provenance: string;
};

function mapMealRow(row: MealRow): MealDishSummary {
  const source = recipeSourceFromProvenance(row.provenance);
  return {
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    role: row.role as 'MAIN' | 'SOUP' | 'SIDE',
    baseServings: row.baseServings,
    prepTimeMinutes: row.prepTimeMinutes,
    cookTimeMinutes: row.cookTimeMinutes,
    totalTimeMinutes: row.prepTimeMinutes + row.cookTimeMinutes,
    difficulty: row.difficulty,
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
  role?: 'MAIN' | 'SOUP' | 'SIDE',
  options: { editorialOnly?: boolean } = {}
): Promise<MealDishSummary[]> {
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

  return rows.map(mapMealRow);
}

/**
 * Lấy chi tiết 1 món ăn cho slot mâm cơm theo slug.
 */
export async function querySingleMealDish(slug: string, expectedRole: 'MAIN' | 'SOUP' | 'SIDE'): Promise<MealDishSummary | null> {
  if (!isValidPublicSlug(slug)) return null;

  const [row] = await db
    .select(mealColumns)
    .from(recipes)
    .where(
      and(
        eq(recipes.slug, slug),
        eq(recipes.status, 'PUBLISHED'),
        eq(recipes.role, expectedRole)
      )
    )
    .limit(1);

  if (!row) return null;

  return mapMealRow(row);
}

/**
 * Phân giải 3 món ăn cho mâm cơm. Nếu slug thiếu hoặc không hợp lệ, tự động chọn món PUBLISHED đầu tiên của vai trò đó.
 */
export async function resolveMealSelection(params: {
  mainSlug?: string | null;
  soupSlug?: string | null;
  sideSlug?: string | null;
}): Promise<MealSelection> {
  // Mặc định khi thiếu slug: chỉ lấy món Bếp Mom (R7). Slug chỉ định rõ vẫn phân giải được món Chợ.
  const [mains, soups, sides] = await Promise.all([
    queryPublishedMealOptions('MAIN'),
    queryPublishedMealOptions('SOUP'),
    queryPublishedMealOptions('SIDE'),
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

  return { main, soup, side };
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
export async function queryMealRecipesForAggregation(slugs: string[]) {
  const validSlugs = slugs.filter(isValidPublicSlug).slice(0, 10);
  if (validSlugs.length === 0) return [];

  const rows = await db.query.recipes.findMany({
    where: and(inArray(recipes.slug, validSlugs), eq(recipes.status, 'PUBLISHED')),
    columns: {
      slug: true,
      name: true,
      baseServings: true,
    },
    with: {
      ingredients: {
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

  return rows.map((r) => ({
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

