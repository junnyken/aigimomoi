// R7 — Truy vấn hồ sơ người nấu & thống kê uy tín (server-only, thuần DB).
// Chỉ trả về trường công khai: KHÔNG email, KHÔNG id người xác minh, KHÔNG mốc xác minh chi tiết.
import { and, avg, countDistinct, count, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { creatorProfiles, recipeCookedFeedbacks, recipes, users } from '@/lib/db/schema';
import { mapPublicCardRow, selectPublicCards, type PublicRecipeCard } from '@/lib/recipes/publicQueries';
import { COMMUNITY_PROVENANCE } from '@/lib/recipes/source';
import { computeCreatorTier, isValidCreatorSlug, type CreatorTier, type CreatorTierResult } from './tier';

export interface CreatorStats {
  publishedCommunityRecipes: number;
  distinctRaters: number;
  averageRating: number | null;
}

export interface PublicCreatorProfile {
  slug: string;
  displayName: string;
  bio: string | null;
  region: string;
  isProfessional: boolean;
  tier: CreatorTier;
  stats: CreatorStats;
  joinedAt: string;
  recipes: PublicRecipeCard[];
}

/**
 * Thống kê uy tín của 1 người nấu.
 * - Chỉ đếm món COMMUNITY_SUBMITTED đang PUBLISHED.
 * - Đánh giá: chỉ APPROVED, chỉ từ người dùng đăng nhập (user_id NOT NULL),
 *   loại trừ chính tác giả (chống tự đánh giá).
 */
export async function getCreatorStats(userId: number): Promise<CreatorStats> {
  const ownPublished = and(
    eq(recipes.authorId, userId),
    eq(recipes.status, 'PUBLISHED'),
    eq(recipes.provenance, COMMUNITY_PROVENANCE)
  );

  const [recipeCount] = await db.select({ total: count() }).from(recipes).where(ownPublished);

  const [ratingAgg] = await db
    .select({
      raters: countDistinct(recipeCookedFeedbacks.userId),
      average: avg(recipeCookedFeedbacks.rating),
    })
    .from(recipeCookedFeedbacks)
    .innerJoin(recipes, eq(recipeCookedFeedbacks.recipeId, recipes.id))
    .where(
      and(
        ownPublished,
        eq(recipeCookedFeedbacks.status, 'APPROVED'),
        sql`${recipeCookedFeedbacks.userId} IS NOT NULL`,
        ne(recipeCookedFeedbacks.userId, userId)
      )
    );

  const raters = Number(ratingAgg?.raters ?? 0);
  const average = ratingAgg?.average === null || ratingAgg?.average === undefined
    ? null
    : Math.round(Number(ratingAgg.average) * 10) / 10;

  return {
    publishedCommunityRecipes: Number(recipeCount?.total ?? 0),
    distinctRaters: raters,
    averageRating: raters > 0 ? average : null,
  };
}

export async function getCreatorTierForUser(userId: number): Promise<CreatorTierResult & { stats: CreatorStats }> {
  const [profile] = await db
    .select({
      identityVerifiedAt: creatorProfiles.identityVerifiedAt,
      sellerTermsAcceptedAt: creatorProfiles.sellerTermsAcceptedAt,
    })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, userId))
    .limit(1);

  const stats = await getCreatorStats(userId);
  const result = computeCreatorTier({
    ...stats,
    identityVerified: Boolean(profile?.identityVerifiedAt),
    sellerTermsAccepted: Boolean(profile?.sellerTermsAcceptedAt),
  });
  return { ...result, stats };
}

export async function getPublicCreatorBySlug(slug: string): Promise<PublicCreatorProfile | null> {
  if (!isValidCreatorSlug(slug)) return null;

  const [row] = await db
    .select({
      userId: creatorProfiles.userId,
      slug: creatorProfiles.slug,
      bio: creatorProfiles.bio,
      region: creatorProfiles.region,
      isProfessional: creatorProfiles.isProfessional,
      identityVerifiedAt: creatorProfiles.identityVerifiedAt,
      sellerTermsAcceptedAt: creatorProfiles.sellerTermsAcceptedAt,
      createdAt: creatorProfiles.createdAt,
      displayName: users.displayName,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(creatorProfiles.userId, users.id))
    .where(and(eq(creatorProfiles.slug, slug), eq(creatorProfiles.isPublic, true)))
    .limit(1);

  if (!row) return null;

  const stats = await getCreatorStats(row.userId);
  const { tier } = computeCreatorTier({
    ...stats,
    identityVerified: Boolean(row.identityVerifiedAt),
    sellerTermsAccepted: Boolean(row.sellerTermsAcceptedAt),
  });

  const recipeRows = await selectPublicCards()
    .where(
      and(
        eq(recipes.authorId, row.userId),
        eq(recipes.status, 'PUBLISHED'),
        eq(recipes.provenance, COMMUNITY_PROVENANCE)
      )
    )
    .orderBy(desc(recipes.publishedAt), desc(recipes.id))
    .limit(48);

  return {
    slug: row.slug,
    displayName: row.displayName,
    bio: row.bio,
    region: row.region,
    isProfessional: row.isProfessional,
    tier,
    stats,
    joinedAt: row.createdAt.toISOString(),
    recipes: recipeRows.map(mapPublicCardRow),
  };
}

export interface OwnCreatorProfile {
  profile: {
    slug: string;
    bio: string | null;
    region: string;
    isPublic: boolean;
    isProfessional: boolean;
    identityVerified: boolean;
    sellerTermsAccepted: boolean;
  } | null;
  tier: CreatorTier;
  missingForNextTier: string[];
  stats: CreatorStats;
}

/** Hồ sơ của chính chủ (kèm điều kiện còn thiếu) — chỉ dùng sau khi đã xác thực session. */
export async function getOwnCreatorProfile(userId: number): Promise<OwnCreatorProfile> {
  const [p] = await db
    .select({
      slug: creatorProfiles.slug,
      bio: creatorProfiles.bio,
      region: creatorProfiles.region,
      isPublic: creatorProfiles.isPublic,
      isProfessional: creatorProfiles.isProfessional,
      identityVerifiedAt: creatorProfiles.identityVerifiedAt,
      sellerTermsAcceptedAt: creatorProfiles.sellerTermsAcceptedAt,
    })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, userId))
    .limit(1);

  const { tier, missingForNextTier, stats } = await getCreatorTierForUser(userId);
  return {
    profile: p
      ? {
          slug: p.slug,
          bio: p.bio,
          region: p.region,
          isPublic: p.isPublic,
          isProfessional: p.isProfessional,
          identityVerified: Boolean(p.identityVerifiedAt),
          sellerTermsAccepted: Boolean(p.sellerTermsAcceptedAt),
        }
      : null,
    tier,
    missingForNextTier,
    stats,
  };
}

/** Map userId → slug hồ sơ công khai (để gắn link "Chợ công thức · Tên người nấu"). */
export async function getPublicCreatorSlugs(userIds: number[]): Promise<Map<number, string>> {
  const ids = Array.from(new Set(userIds.filter((id) => Number.isInteger(id) && id > 0))).slice(0, 200);
  const map = new Map<number, string>();
  if (ids.length === 0) return map;

  const rows = await db
    .select({ userId: creatorProfiles.userId, slug: creatorProfiles.slug })
    .from(creatorProfiles)
    .where(and(inArray(creatorProfiles.userId, ids), eq(creatorProfiles.isPublic, true)));

  for (const r of rows) map.set(r.userId, r.slug);
  return map;
}

/**
 * Quyết định nhanh cho Proxy (trước khi stream):
 * kiểm tra slug hồ sơ người nấu công khai.
 */
export async function queryPublicCreatorSlugResolution(slug: string): Promise<'published' | 'missing'> {
  if (!isValidCreatorSlug(slug)) return 'missing';

  const [row] = await db
    .select({ isPublic: creatorProfiles.isPublic })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.slug, slug))
    .limit(1);

  if (row?.isPublic) return 'published';
  return 'missing';
}
