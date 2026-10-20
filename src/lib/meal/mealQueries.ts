import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes } from '@/lib/db/schema';
import { safeImageSrc, isValidPublicSlug } from '@/lib/recipes/publicQueries';

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
}

export interface MealSelection {
  main: MealDishSummary | null;
  soup: MealDishSummary | null;
  side: MealDishSummary | null;
}

/**
 * Lấy danh sách các món ăn đã PUBLISHED theo vai trò để hiển thị trong modal đổi món.
 * Invariants §5.1: Tuyệt đối chỉ lấy các công thức có status = 'PUBLISHED'.
 */
export async function queryPublishedMealOptions(role?: 'MAIN' | 'SOUP' | 'SIDE'): Promise<MealDishSummary[]> {
  const allowedRoles = role ? [role] : ['MAIN', 'SOUP', 'SIDE'];

  const rows = await db
    .select({
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
    })
    .from(recipes)
    .where(
      and(
        eq(recipes.status, 'PUBLISHED'),
        inArray(recipes.role, allowedRoles as ('MAIN' | 'SOUP' | 'SIDE')[])
      )
    )
    .orderBy(desc(recipes.publishedAt), desc(recipes.id));

  return rows.map(({ prepTimeMinutes, cookTimeMinutes, heroImage, role: r, ...rest }) => ({
    ...rest,
    role: r as 'MAIN' | 'SOUP' | 'SIDE',
    prepTimeMinutes,
    cookTimeMinutes,
    totalTimeMinutes: prepTimeMinutes + cookTimeMinutes,
    heroImage: safeImageSrc(heroImage),
  }));
}

/**
 * Lấy chi tiết 1 món ăn cho slot mâm cơm theo slug.
 */
async function querySingleMealDish(slug: string, expectedRole: 'MAIN' | 'SOUP' | 'SIDE'): Promise<MealDishSummary | null> {
  if (!isValidPublicSlug(slug)) return null;

  const [row] = await db
    .select({
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
    })
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

  return {
    ...row,
    role: row.role as 'MAIN' | 'SOUP' | 'SIDE',
    totalTimeMinutes: row.prepTimeMinutes + row.cookTimeMinutes,
    heroImage: safeImageSrc(row.heroImage),
  };
}

/**
 * Phân giải 3 món ăn cho mâm cơm. Nếu slug thiếu hoặc không hợp lệ, tự động chọn món PUBLISHED đầu tiên của vai trò đó.
 */
export async function resolveMealSelection(params: {
  mainSlug?: string | null;
  soupSlug?: string | null;
  sideSlug?: string | null;
}): Promise<MealSelection> {
  const [mains, soups, sides] = await Promise.all([
    queryPublishedMealOptions('MAIN'),
    queryPublishedMealOptions('SOUP'),
    queryPublishedMealOptions('SIDE'),
  ]);

  let main: MealDishSummary | null = null;
  if (params.mainSlug) {
    main = mains.find((d) => d.slug === params.mainSlug) || null;
  }
  if (!main && mains.length > 0) {
    main = mains[0];
  }

  let soup: MealDishSummary | null = null;
  if (params.soupSlug) {
    soup = soups.find((d) => d.slug === params.soupSlug) || null;
  }
  if (!soup && soups.length > 0) {
    soup = soups[0];
  }

  let side: MealDishSummary | null = null;
  if (params.sideSlug) {
    side = sides.find((d) => d.slug === params.sideSlug) || null;
  }
  if (!side && sides.length > 0) {
    side = sides[0];
  }

  return { main, soup, side };
}

/**
 * Thuật toán gợi ý ngẫu nhiên 1 mâm cơm 3 món từ kho công thức PUBLISHED.
 */
export async function getRandomMealSlugs(): Promise<{ mainSlug: string; soupSlug: string; sideSlug: string } | null> {
  const [mains, soups, sides] = await Promise.all([
    queryPublishedMealOptions('MAIN'),
    queryPublishedMealOptions('SOUP'),
    queryPublishedMealOptions('SIDE'),
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
