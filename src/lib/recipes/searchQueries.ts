// AG-17 — Engine tìm kiếm và bộ lọc công thức công khai (thuần DB).
// Tuân thủ nghiêm ngặt Invariants §5.1, §5.5, §6.7, §6.8:
// - CHỈ truy vấn công thức có status = 'PUBLISHED'
// - Parameterized query với Drizzle ORM chống SQL Injection
// - Allow-list trường dữ liệu công khai, tuyệt đối không lộ email hay reviewNotes
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes, dishes, recipeTags, taxonomies, type mealRoleEnum } from '@/lib/db/schema';
import { safeImageSrc, type PublicRecipeCard } from './publicQueries';

export type MealRoleType = (typeof mealRoleEnum.enumValues)[number];

export interface RecipeSearchParams {
  q?: string;
  role?: string;
  maxTime?: number;
  difficulty?: string;
  testedOnly?: boolean;
  nutritionOnly?: boolean;
  taxonomySlug?: string;
  sort?: 'newest' | 'quickest' | 'calories_asc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: PublicRecipeCard[];
  totalCount: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface SearchFilterMeta {
  roleCounts: Record<string, number>;
  taxonomies: { id: number; name: string; slug: string; type: string }[];
  totalPublished: number;
}

const ALLOWED_DIFFICULTIES = new Set(['Dễ', 'Vừa', 'Khó']);
const ALLOWED_ROLES = new Set(['MAIN', 'SOUP', 'SIDE', 'ONE_DISH_MEAL', 'DESSERT', 'BEVERAGE']);

/**
 * Tìm kiếm công thức công khai theo từ khóa và đa trục bộ lọc.
 */
export async function searchPublishedRecipes(params: RecipeSearchParams = {}): Promise<SearchResult> {
  const conditions: SQL[] = [eq(recipes.status, 'PUBLISHED')];

  // 1. Lọc từ khóa tìm kiếm (q)
  const rawQ = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  if (rawQ.length > 0) {
    const escaped = rawQ.replace(/[%_\\]/g, '\\$&');
    const pattern = `%${escaped}%`;
    conditions.push(
      or(
        ilike(recipes.name, pattern),
        ilike(recipes.shortDescription, pattern),
        // Tìm kiếm theo tên món ăn gốc (dish)
        inArray(
          recipes.dishId,
          db
            .select({ id: dishes.id })
            .from(dishes)
            .where(ilike(dishes.name, pattern))
        )
      )!
    );
  }

  // 2. Lọc vai trò bữa ăn (role)
  if (params.role && ALLOWED_ROLES.has(params.role)) {
    conditions.push(eq(recipes.role, params.role as MealRoleType));
  }

  // 3. Lọc thời gian nấu tối đa (maxTime = prepTime + cookTime)
  if (typeof params.maxTime === 'number' && Number.isFinite(params.maxTime) && params.maxTime > 0) {
    conditions.push(sql`(${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes}) <= ${params.maxTime}`);
  }

  // 4. Lọc độ khó (difficulty)
  if (params.difficulty && ALLOWED_DIFFICULTIES.has(params.difficulty)) {
    conditions.push(eq(recipes.difficulty, params.difficulty));
  }

  // 5. Lọc nhãn kiểm chứng
  if (params.testedOnly === true) {
    conditions.push(eq(recipes.isCookTested, true));
  }
  if (params.nutritionOnly === true) {
    conditions.push(eq(recipes.isNutritionVerified, true));
  }

  // 6. Lọc theo taxonomy tag (cách chế biến, vùng miền...)
  const rawTaxonomy = typeof params.taxonomySlug === 'string' ? params.taxonomySlug.trim() : '';
  if (rawTaxonomy.length > 0) {
    conditions.push(
      inArray(
        recipes.id,
        db
          .select({ recipeId: recipeTags.recipeId })
          .from(recipeTags)
          .innerJoin(taxonomies, eq(recipeTags.taxonomyId, taxonomies.id))
          .where(eq(taxonomies.slug, rawTaxonomy))
      )
    );
  }

  const whereClause = and(...conditions);

  // Sắp xếp
  let orderByClause: SQL;
  switch (params.sort) {
    case 'quickest':
      orderByClause = asc(sql`${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes}`);
      break;
    case 'calories_asc':
      orderByClause = asc(recipes.caloriesPerServing);
      break;
    case 'newest':
    default:
      orderByClause = desc(sql`COALESCE(${recipes.publishedAt}, ${recipes.createdAt})`);
      break;
  }

  // Phân trang
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
  const offset = (page - 1) * limit;

  // Đếm tổng số kết quả
  const [countRes] = await db
    .select({ total: count() })
    .from(recipes)
    .where(whereClause);
  const totalCount = Number(countRes?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Lấy danh sách thẻ công thức
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
    .where(whereClause)
    .orderBy(orderByClause, desc(recipes.id))
    .limit(limit)
    .offset(offset);

  const items: PublicRecipeCard[] = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    shortDescription: r.shortDescription,
    role: r.role,
    baseServings: r.baseServings,
    totalTimeMinutes: (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0),
    difficulty: r.difficulty,
    heroImage: safeImageSrc(r.heroImage),
    isCookTested: r.isCookTested,
  }));

  return {
    items,
    totalCount,
    page,
    totalPages,
    limit,
  };
}

/**
 * Lấy metadata để hiển thị số lượng bộ lọc (Role counts, Taxonomies).
 */
export async function getSearchFilterMeta(): Promise<SearchFilterMeta> {
  const publishedCondition = eq(recipes.status, 'PUBLISHED');

  // Đếm số món theo role
  const roleRows = await db
    .select({
      role: recipes.role,
      count: count(),
    })
    .from(recipes)
    .where(publishedCondition)
    .groupBy(recipes.role);

  const roleCounts: Record<string, number> = {};
  let totalPublished = 0;
  for (const row of roleRows) {
    const c = Number(row.count ?? 0);
    roleCounts[row.role] = c;
    totalPublished += c;
  }

  // Lấy các taxonomies có công thức PUBLISHED
  const taxRows = await db
    .selectDistinct({
      id: taxonomies.id,
      name: taxonomies.name,
      slug: taxonomies.slug,
      type: taxonomies.type,
    })
    .from(taxonomies)
    .innerJoin(recipeTags, eq(taxonomies.id, recipeTags.taxonomyId))
    .innerJoin(recipes, and(eq(recipeTags.recipeId, recipes.id), publishedCondition))
    .orderBy(asc(taxonomies.name));

  return {
    roleCounts,
    taxonomies: taxRows,
    totalPublished,
  };
}
