// R8 — Database Queries cho Quản lý Quyền sở hữu và Gói công thức (D66)

import { eq, and, sql, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { 
  recipes, 
  userEntitlements, 
  recipeBundles, 
  recipeBundleItems 
} from '@/lib/db/schema';
import { canAccessRecipe, filterRecipeForViewer } from './entitlements';

/**
 * Lấy danh sách ID các công thức mà người dùng hiện tại đã sở hữu
 * (bao gồm sở hữu trực tiếp hoặc sở hữu qua bộ combo).
 */
export async function getUserRecipeEntitlements(userId: number): Promise<Set<number>> {
  if (!userId || userId <= 0) {
    return new Set<number>();
  }

  // 1. Quyền sở hữu trực tiếp công thức
  const directRows = await db
    .select({ recipeId: userEntitlements.recipeId })
    .from(userEntitlements)
    .where(
      and(
        eq(userEntitlements.userId, userId),
        eq(userEntitlements.itemType, 'RECIPE'),
        sql`${userEntitlements.recipeId} IS NOT NULL`
      )
    );

  const entitlementSet = new Set<number>();
  for (const row of directRows) {
    if (row.recipeId !== null) {
      entitlementSet.add(row.recipeId);
    }
  }

  // 2. Quyền sở hữu qua các bộ combo đã mở khóa
  const bundleRows = await db
    .select({ recipeId: recipeBundleItems.recipeId })
    .from(userEntitlements)
    .innerJoin(recipeBundleItems, eq(userEntitlements.bundleId, recipeBundleItems.bundleId))
    .where(
      and(
        eq(userEntitlements.userId, userId),
        eq(userEntitlements.itemType, 'BUNDLE')
      )
    );

  for (const row of bundleRows) {
    if (row.recipeId !== null) {
      entitlementSet.add(row.recipeId);
    }
  }

  return entitlementSet;
}

/**
 * Kiểm tra nhanh xem người dùng có quyền truy cập công thức này không.
 */
export async function checkRecipeAccess(
  recipeId: number,
  viewerId: number | null
): Promise<{ hasAccess: boolean; isAuthor: boolean; price: number; isFree: boolean }> {
  const row = await db
    .select({
      id: recipes.id,
      provenance: recipes.provenance,
      price: recipes.price,
      isFree: recipes.isFree,
      authorId: recipes.authorId,
    })
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);

  if (row.length === 0) {
    return { hasAccess: false, isAuthor: false, price: 0, isFree: true };
  }

  const r = row[0];
  const isAuthor = viewerId !== null && r.authorId !== null && viewerId === r.authorId;
  const entitlements = viewerId ? await getUserRecipeEntitlements(viewerId) : new Set<number>();

  const hasAccess = canAccessRecipe(
    {
      recipeId: r.id,
      provenance: r.provenance,
      price: r.price ?? 0,
      isFree: r.isFree ?? true,
      authorId: r.authorId,
    },
    viewerId,
    entitlements
  );

  return {
    hasAccess,
    isAuthor,
    price: r.price ?? 0,
    isFree: r.isFree ?? true,
  };
}

/**
 * Cấp quyền sở hữu công thức dùng thử miễn phí trong giai đoạn R8 (Zero-Money Promo Claim).
 */
export async function claimRecipePromo(
  userId: number,
  recipeId: number
): Promise<{ success: boolean; message: string; alreadyOwned?: boolean }> {
  if (!userId || !recipeId) {
    return { success: false, message: 'Thông tin không hợp lệ.' };
  }

  // Kiểm tra công thức tồn tại
  const [existingRecipe] = await db
    .select({
      id: recipes.id,
      name: recipes.name,
      status: recipes.status,
      authorId: recipes.authorId,
    })
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);

  if (!existingRecipe || existingRecipe.status !== 'PUBLISHED') {
    return { success: false, message: 'Công thức không tồn tại hoặc chưa xuất bản.' };
  }

  if (existingRecipe.authorId === userId) {
    return { success: true, message: 'Bạn là tác giả của công thức này.', alreadyOwned: true };
  }

  // Kiểm tra xem đã sở hữu chưa
  const existingEntitlement = await db
    .select({ id: userEntitlements.id })
    .from(userEntitlements)
    .where(
      and(
        eq(userEntitlements.userId, userId),
        eq(userEntitlements.itemType, 'RECIPE'),
        eq(userEntitlements.recipeId, recipeId)
      )
    )
    .limit(1);

  if (existingEntitlement.length > 0) {
    return { success: true, message: 'Bạn đã sở hữu công thức này rồi.', alreadyOwned: true };
  }

  // Thêm entitlement (chống race condition khi bấm liên tiếp)
  await db
    .insert(userEntitlements)
    .values({
      userId,
      itemType: 'RECIPE',
      recipeId,
      grantedReason: 'PROMO_CLAIM',
    })
    .onConflictDoNothing();

  return { success: true, message: `Mở khóa thành công công thức "${existingRecipe.name}"!` };
}

/**
 * Cấp quyền sở hữu bộ combo công thức dùng thử miễn phí trong giai đoạn R8.
 */
export async function claimBundlePromo(
  userId: number,
  bundleId: number
): Promise<{ success: boolean; message: string; alreadyOwned?: boolean }> {
  if (!userId || !bundleId) {
    return { success: false, message: 'Thông tin không hợp lệ.' };
  }

  const [bundle] = await db
    .select({
      id: recipeBundles.id,
      title: recipeBundles.title,
      status: recipeBundles.status,
      creatorId: recipeBundles.creatorId,
    })
    .from(recipeBundles)
    .where(eq(recipeBundles.id, bundleId))
    .limit(1);

  if (!bundle || bundle.status !== 'PUBLISHED') {
    return { success: false, message: 'Bộ công thức không tồn tại hoặc chưa xuất bản.' };
  }

  if (bundle.creatorId === userId) {
    return { success: true, message: 'Bạn là tác giả của bộ công thức này.', alreadyOwned: true };
  }

  const existingEntitlement = await db
    .select({ id: userEntitlements.id })
    .from(userEntitlements)
    .where(
      and(
        eq(userEntitlements.userId, userId),
        eq(userEntitlements.itemType, 'BUNDLE'),
        eq(userEntitlements.bundleId, bundleId)
      )
    )
    .limit(1);

  if (existingEntitlement.length > 0) {
    return { success: true, message: 'Bạn đã sở hữu bộ công thức này rồi.', alreadyOwned: true };
  }

  await db
    .insert(userEntitlements)
    .values({
      userId,
      itemType: 'BUNDLE',
      bundleId,
      grantedReason: 'PROMO_CLAIM',
    })
    .onConflictDoNothing();

  return { success: true, message: `Mở khóa thành công bộ công thức "${bundle.title}"!` };
}
