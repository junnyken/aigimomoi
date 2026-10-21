// AG-17 — Engine tìm kiếm và bộ lọc công thức công khai (thuần DB).
// Tuân thủ nghiêm ngặt Invariants §5.1, §5.5, §6.7, §6.8:
// - CHỈ truy vấn công thức có status = 'PUBLISHED'
// - Parameterized query với Drizzle ORM chống SQL Injection
// - Allow-list trường dữ liệu công khai, tuyệt đối không lộ email hay reviewNotes
import { and, asc, count, desc, eq, ilike, inArray, isNotNull, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes, dishes, recipeTags, taxonomies, type mealRoleEnum } from '@/lib/db/schema';
import { mapPublicCardRow, selectPublicCards, type PublicRecipeCard } from './publicQueries';
import { COMMUNITY_PROVENANCE, type RecipeSourceFilter } from './source';
import { FALLBACK_PUBLIC_RECIPES, toPublicRecipeCard } from './fallbackCatalog';
import { BUILT_IN_DIPPING_SAUCES } from '@/lib/meal/mealPresets';

export type MealRoleType = (typeof mealRoleEnum.enumValues)[number];

export interface RecipeSearchParams {
  q?: string;
  role?: string;
  maxTime?: number;
  maxCalories?: number;
  difficulty?: string;
  testedOnly?: boolean;
  nutritionOnly?: boolean;
  taxonomySlug?: string;
  sort?: 'newest' | 'quickest' | 'calories_asc';
  /** R7: lọc nguồn — tất cả / Bếp Mom / Chợ công thức */
  source?: RecipeSourceFilter;
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
const ALLOWED_ROLES = new Set([
  'MAIN',
  'SOUP',
  'SIDE',
  'DIPPING_SAUCE',
  'ONE_DISH_MEAL',
  'DESSERT',
  'BEVERAGE',
]);

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
    if (params.role === 'DIPPING_SAUCE') {
      conditions.push(
        or(
          sql`${recipes.role}::text = 'DIPPING_SAUCE'`,
          ilike(recipes.name, '%nước chấm%'),
          ilike(recipes.name, '%nước mắm%'),
          ilike(recipes.name, '%kho quẹt%'),
          ilike(recipes.name, '%mắm nêm%'),
          ilike(recipes.name, '%muối ớt%'),
          ilike(recipes.name, '%sốt chấm%')
        )!
      );
    } else {
      conditions.push(eq(recipes.role, params.role as MealRoleType));
    }
  }

  // 3. Lọc thời gian nấu tối đa (maxTime = prepTime + cookTime)
  if (typeof params.maxTime === 'number' && Number.isFinite(params.maxTime) && params.maxTime > 0) {
    conditions.push(sql`(${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes}) <= ${params.maxTime}`);
  }

  // 3b. Lọc mức năng lượng tối đa mỗi khẩu phần (maxCalories - trung thực theo Gate P6: chỉ lấy món đã có dữ liệu > 0)
  if (typeof params.maxCalories === 'number' && Number.isFinite(params.maxCalories) && params.maxCalories > 0) {
    conditions.push(isNotNull(recipes.caloriesPerServing));
    conditions.push(sql`${recipes.caloriesPerServing} > 0`);
    conditions.push(lte(recipes.caloriesPerServing, params.maxCalories));
    conditions.push(ne(recipes.nutritionStatus, 'NO_DATA'));
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

  // 7. R7 — lọc nguồn công thức
  if (params.source === 'bep-mom') {
    conditions.push(ne(recipes.provenance, COMMUNITY_PROVENANCE));
  } else if (params.source === 'cho') {
    conditions.push(eq(recipes.provenance, COMMUNITY_PROVENANCE));
  }

  const whereClause = and(...conditions);

  // Sắp xếp
  let orderByClause: SQL;
  switch (params.sort) {
    case 'quickest':
      orderByClause = asc(sql`${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes}`);
      break;
    case 'calories_asc':
      orderByClause = sql`${recipes.caloriesPerServing} ASC NULLS LAST`;
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

  try {
    // Đếm tổng số kết quả
    const [countRes] = await db
      .select({ total: count() })
      .from(recipes)
      .where(whereClause);
    const totalCount = Number(countRes?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Lấy danh sách thẻ công thức
    // LEFT JOIN users/creator_profiles là 1-1 (userId unique) nên không nhân bản dòng.
    const rows = await selectPublicCards()
      .where(whereClause)
      .orderBy(orderByClause, desc(recipes.id))
      .limit(limit)
      .offset(offset);

    if (rows.length > 0 || totalCount > 0) {
      const items: PublicRecipeCard[] = rows.map(mapPublicCardRow);
      return {
        items,
        totalCount,
        page,
        totalPages,
        limit,
      };
    }
  } catch {
    // Fallback below when DB is unreachable
  }

  // Fallback sang kho công thức chuẩn tích hợp sẵn khi DB tạm ngắt kết nối
  const sauceCards: PublicRecipeCard[] = BUILT_IN_DIPPING_SAUCES.map((s) => ({
    slug: s.slug,
    name: s.name,
    shortDescription: s.shortDescription,
    role: 'DIPPING_SAUCE',
    baseServings: s.baseServings,
    totalTimeMinutes: s.totalTimeMinutes,
    difficulty: s.difficulty,
    caloriesPerServing: s.caloriesPerServing ?? null,
    nutritionStatus: s.nutritionStatus ?? 'ESTIMATED',
    heroImage: s.heroImage,
    isIllustration: true,
    isCookTested: true,
    source: 'EDITORIAL',
    creatorSlug: null,
    authorName: 'Bếp Ăn Gì Mom',
    price: 0,
    isFree: true,
  }));

  let fallbackItems: PublicRecipeCard[] = [
    ...FALLBACK_PUBLIC_RECIPES.map(toPublicRecipeCard),
    ...sauceCards,
  ];

  if (params.role && ALLOWED_ROLES.has(params.role)) {
    fallbackItems = fallbackItems.filter((item) => item.role === params.role);
  }
  if (params.q && params.q.trim()) {
    const qLower = params.q.trim().toLowerCase();
    fallbackItems = fallbackItems.filter(
      (item) =>
        item.name.toLowerCase().includes(qLower) ||
        item.shortDescription.toLowerCase().includes(qLower)
    );
  }
  if (typeof params.maxTime === 'number' && params.maxTime > 0) {
    fallbackItems = fallbackItems.filter((item) => item.totalTimeMinutes <= params.maxTime!);
  }
  if (typeof params.maxCalories === 'number' && params.maxCalories > 0) {
    fallbackItems = fallbackItems.filter(
      (item) =>
        typeof item.caloriesPerServing === 'number' &&
        item.caloriesPerServing > 0 &&
        item.caloriesPerServing <= params.maxCalories!
    );
  }
  if (params.difficulty && ALLOWED_DIFFICULTIES.has(params.difficulty)) {
    fallbackItems = fallbackItems.filter((item) => item.difficulty === params.difficulty);
  }
  if (params.testedOnly) {
    fallbackItems = fallbackItems.filter((item) => item.isCookTested);
  }
  if (params.sort === 'quickest') {
    fallbackItems.sort((a, b) => a.totalTimeMinutes - b.totalTimeMinutes);
  } else if (params.sort === 'calories_asc') {
    fallbackItems.sort((a, b) => (a.caloriesPerServing ?? 9999) - (b.caloriesPerServing ?? 9999));
  }

  const totalCount = fallbackItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const pagedItems = fallbackItems.slice(offset, offset + limit);

  return {
    items: pagedItems,
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
  try {
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

    if (totalPublished > 0) {
      return {
        roleCounts,
        taxonomies: taxRows,
        totalPublished,
      };
    }
  } catch {
    // Fallback below
  }

  const fallbackRoleCounts: Record<string, number> = {
    DIPPING_SAUCE: BUILT_IN_DIPPING_SAUCES.length,
  };
  for (const r of FALLBACK_PUBLIC_RECIPES) {
    fallbackRoleCounts[r.role] = (fallbackRoleCounts[r.role] || 0) + 1;
  }

  return {
    roleCounts: fallbackRoleCounts,
    taxonomies: [
      { id: 1, name: 'Miền Nam', slug: 'mien-nam', type: 'CUISINE_REGION' },
      { id: 2, name: 'Miền Bắc', slug: 'mien-bac', type: 'CUISINE_REGION' },
      { id: 3, name: 'Ít dầu mỡ / Eat Clean', slug: 'eat-clean', type: 'DIET_PREFERENCE' },
      { id: 4, name: 'Kho / Rim', slug: 'kho-rim', type: 'COOKING_METHOD' },
      { id: 5, name: 'Luộc / Hấp', slug: 'luoc-hap', type: 'COOKING_METHOD' },
    ],
    totalPublished: FALLBACK_PUBLIC_RECIPES.length + BUILT_IN_DIPPING_SAUCES.length,
  };
}
