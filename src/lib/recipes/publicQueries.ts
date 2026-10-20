// AG-16 — Truy vấn công thức công khai (thuần DB, không phụ thuộc Next.js runtime).
// Chỉ trả về bản PUBLISHED với tập cột tường minh: không email tác giả, không ghi chú duyệt,
// không id người duyệt (D35). Lớp cache Next.js nằm ở `public.ts`.
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { recipes, recipeIngredients, cookingSteps } from '@/lib/db/schema';

const SLUG_PATTERN = /^[a-z0-9]+(?:-+[a-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 200;
const LINEAGE_MAX_DEPTH = 50;

export function isValidPublicSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(slug);
}

/**
 * Chỉ cho phép ảnh từ kho upload nội bộ hoặc https — loại bỏ scheme lạ
 * (javascript:, data:, protocol-relative) trước khi đưa vào <img>/OG.
 */
export function safeImageSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  const value = src.trim();
  if (value.startsWith('/uploads/') && !value.includes('..') && !value.includes('\\')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export interface PublicRecipeIngredient {
  id: number;
  name: string;
  category: string;
  amount: number;
  unit: string;
  scalePolicy: 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST';
  preparation: string | null;
  isOptional: boolean;
}

export interface PublicRecipeStep {
  id: number;
  stepNumber: number;
  phaseName: string;
  instruction: string;
  timerSeconds: number | null;
  tipText: string | null;
  image: string | null;
}

export interface PublicRecipeTag {
  name: string;
  slug: string;
  type: string;
}

export interface PublicRecipeVariant {
  id: number;
  name: string;
  slug: string;
  region: string;
  shortDescription: string;
  heroImage: string | null;
}

export interface PublicRecipe {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  role: string;
  region: string;
  kitchenStory: string | null;
  sourceAttribution: string | null;
  variantOfId: number | null;
  variants: PublicRecipeVariant[];
  baseServings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: string;
  caloriesPerServing: number | null;
  nutritionStatus: 'NO_DATA' | 'INCOMPLETE' | 'ESTIMATED';
  nutritionSnapshot?: any | null;
  heroImage: string | null;
  isEditorialReviewed: boolean;
  isCookTested: boolean;
  isNutritionVerified: boolean;
  versionNumber: number;
  publishedAt: string | null;
  dish: { name: string; aliases: string[] } | null;
  authorName: string | null;
  ingredients: PublicRecipeIngredient[];
  steps: PublicRecipeStep[];
  tags: PublicRecipeTag[];
}

export interface PublicRecipeCard {
  slug: string;
  name: string;
  shortDescription: string;
  role: string;
  baseServings: number;
  totalTimeMinutes: number;
  difficulty: string;
  heroImage: string | null;
  isCookTested: boolean;
}

export async function queryPublishedRecipeBySlug(slug: string): Promise<PublicRecipe | null> {
  if (!isValidPublicSlug(slug)) return null;

  const row = await db.query.recipes.findFirst({
    where: and(eq(recipes.slug, slug), eq(recipes.status, 'PUBLISHED')),
    columns: {
      id: true,
      slug: true,
      name: true,
      shortDescription: true,
      role: true,
      baseServings: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      difficulty: true,
      caloriesPerServing: true,
      nutritionStatus: true,
      nutritionSnapshot: true,
      heroImage: true,
      isEditorialReviewed: true,
      isCookTested: true,
      isNutritionVerified: true,
      versionNumber: true,
      publishedAt: true,
      region: true,
      kitchenStory: true,
      sourceAttribution: true,
      variantOfId: true,
    },
    with: {
      dish: { columns: { name: true }, with: { aliases: { columns: { aliasName: true } } } },
      author: { columns: { displayName: true } },
      ingredients: {
        orderBy: [asc(recipeIngredients.sortOrder), asc(recipeIngredients.id)],
        columns: { id: true, amount: true, unit: true, scalePolicy: true, preparation: true, isOptional: true },
        with: { ingredient: { columns: { name: true, category: true } } },
      },
      steps: {
        orderBy: [asc(cookingSteps.stepNumber), asc(cookingSteps.id)],
        columns: {
          id: true,
          stepNumber: true,
          phaseName: true,
          instruction: true,
          timerSeconds: true,
          tipText: true,
          image: true,
        },
      },
      tags: { with: { taxonomy: { columns: { name: true, slug: true, type: true } } } },
    },
  });

  if (!row) return null;

  // Lấy các biến thể liên quan (Invariants §5.1: chỉ trả PUBLISHED)
  const rootId = row.variantOfId || row.id;
  const rawVariants = await db.query.recipes.findMany({
    where: (r, { and, or, eq, ne }) =>
      and(
        eq(r.status, 'PUBLISHED'),
        ne(r.id, row.id),
        or(eq(r.id, rootId), eq(r.variantOfId, rootId))
      ),
    columns: {
      id: true,
      name: true,
      slug: true,
      region: true,
      shortDescription: true,
      heroImage: true,
    },
    limit: 6,
  });

  const variants: PublicRecipeVariant[] = rawVariants.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    region: v.region,
    shortDescription: v.shortDescription,
    heroImage: safeImageSrc(v.heroImage),
  }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    role: row.role,
    region: row.region || 'GENERAL',
    kitchenStory: row.kitchenStory,
    sourceAttribution: row.sourceAttribution,
    variantOfId: row.variantOfId,
    variants,
    baseServings: row.baseServings,
    prepTimeMinutes: row.prepTimeMinutes,
    cookTimeMinutes: row.cookTimeMinutes,
    difficulty: row.difficulty,
    caloriesPerServing: row.caloriesPerServing,
    nutritionStatus: row.nutritionStatus,
    nutritionSnapshot: row.nutritionSnapshot,
    heroImage: safeImageSrc(row.heroImage),
    isEditorialReviewed: row.isEditorialReviewed,
    isCookTested: row.isCookTested,
    isNutritionVerified: row.isNutritionVerified,
    versionNumber: row.versionNumber,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    dish: row.dish ? { name: row.dish.name, aliases: row.dish.aliases.map((a) => a.aliasName) } : null,
    authorName: row.author?.displayName ?? null,
    ingredients: row.ingredients.map((ri) => ({
      id: ri.id,
      name: ri.ingredient.name,
      category: ri.ingredient.category,
      amount: ri.amount,
      unit: ri.unit,
      scalePolicy: ri.scalePolicy,
      preparation: ri.preparation,
      isOptional: ri.isOptional,
    })),
    steps: row.steps.map((s) => ({ ...s, image: safeImageSrc(s.image) })),
    tags: row.tags.map((t) => t.taxonomy),
  };
}

/**
 * Nếu slug thuộc một phiên bản ARCHIVED, lần theo lineage (revisionOfId) tới bản
 * PUBLISHED hiện hành và trả slug của nó. Trả null nếu không phải bản lưu trữ
 * hoặc lineage không còn bản công khai — tránh tiết lộ bản nháp.
 */
export async function queryCurrentSlugForArchived(slug: string): Promise<string | null> {
  if (!isValidPublicSlug(slug)) return null;

  const [archived] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.slug, slug), eq(recipes.status, 'ARCHIVED')))
    .limit(1);
  if (!archived) return null;

  let currentId = archived.id;
  for (let depth = 0; depth < LINEAGE_MAX_DEPTH; depth++) {
    const [next] = await db
      .select({ id: recipes.id, slug: recipes.slug, status: recipes.status })
      .from(recipes)
      .where(and(eq(recipes.revisionOfId, currentId), inArray(recipes.status, ['PUBLISHED', 'ARCHIVED'])))
      .orderBy(desc(recipes.versionNumber))
      .limit(1);

    if (!next) return null;
    if (next.status === 'PUBLISHED') return next.slug;
    currentId = next.id;
  }
  return null;
}

export type PublicSlugResolution =
  | { kind: 'published' }
  | { kind: 'redirect'; slug: string }
  | { kind: 'missing' };

/**
 * Quyết định nhanh cho Proxy (trước khi stream): một truy vấn theo index unique `slug`.
 * DRAFT/SUBMITTED/NEEDS_CHANGES/APPROVED đều là `missing` — không phân biệt với slug không tồn tại.
 */
export async function queryPublicSlugResolution(slug: string): Promise<PublicSlugResolution> {
  if (!isValidPublicSlug(slug)) return { kind: 'missing' };

  const [row] = await db
    .select({ status: recipes.status })
    .from(recipes)
    .where(eq(recipes.slug, slug))
    .limit(1);

  if (row?.status === 'PUBLISHED') return { kind: 'published' };
  if (row?.status === 'ARCHIVED') {
    const current = await queryCurrentSlugForArchived(slug);
    if (current) return { kind: 'redirect', slug: current };
  }
  return { kind: 'missing' };
}

export async function queryPublishedRecipeCards(limit = 12): Promise<PublicRecipeCard[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 12, 1), 48);
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
    .where(eq(recipes.status, 'PUBLISHED'))
    .orderBy(desc(recipes.publishedAt), desc(recipes.id))
    .limit(safeLimit);

  return rows.map(({ prepTimeMinutes, cookTimeMinutes, heroImage, ...rest }) => ({
    ...rest,
    totalTimeMinutes: prepTimeMinutes + cookTimeMinutes,
    heroImage: safeImageSrc(heroImage),
  }));
}

export async function queryPublishedRecipeCardsBySlugs(slugs: string[]): Promise<PublicRecipeCard[]> {
  const validSlugs = slugs.filter(isValidPublicSlug).slice(0, 100);
  if (validSlugs.length === 0) return [];

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
    .where(and(inArray(recipes.slug, validSlugs), eq(recipes.status, 'PUBLISHED')));

  return rows.map(({ prepTimeMinutes, cookTimeMinutes, heroImage, ...rest }) => ({
    ...rest,
    totalTimeMinutes: prepTimeMinutes + cookTimeMinutes,
    heroImage: safeImageSrc(heroImage),
  }));
}

