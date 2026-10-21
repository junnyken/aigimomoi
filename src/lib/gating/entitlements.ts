// R8 — Logic kiểm tra quyền sở hữu và bảo vệ nội dung phía Server (D66)
// Tuyệt đối không leak nguyên liệu/bước nấu khi chưa sở hữu.

export interface RecipeAccessContext {
  recipeId: number;
  provenance: string;
  isFree: boolean;
  price: number;
  authorId: number | null;
}

/**
 * Kiểm tra xem người xem hiện tại có quyền truy cập toàn bộ công thức hay không.
 */
export function canAccessRecipe(
  recipe: RecipeAccessContext,
  viewerId: number | null,
  entitlements: Set<number> | ReadonlySet<number>
): boolean {
  // 1. Công thức biên tập Bếp Mom luôn mở 100% cho mọi người (kể cả khách chưa đăng nhập)
  if (recipe.provenance === 'EDITORIAL') {
    return true;
  }

  // 2. Công thức cộng đồng miễn phí luôn mở
  if (recipe.isFree || (recipe.price ?? 0) === 0) {
    return true;
  }

  // 3. Tác giả của công thức luôn có quyền sở hữu trọn vẹn
  if (viewerId !== null && recipe.authorId !== null && viewerId === recipe.authorId) {
    return true;
  }

  // 4. Người dùng đã sở hữu quyền truy cập (qua claim / mua / combo)
  if (viewerId !== null && entitlements.has(recipe.recipeId)) {
    return true;
  }

  return false;
}

export type GatedRecipe<T> = T & {
  isGated: boolean;
  gatedReason?: 'REQUIRES_PURCHASE';
};

/**
 * Lọc nội dung công thức an toàn ở phía Server.
 * Khi chưa sở hữu, làm rỗng mảng nguyên liệu và các bước để ngăn chặn rò rỉ qua DevTools.
 */
export function filterRecipeForViewer<
  T extends {
    ingredients?: unknown[];
    steps?: unknown[];
    tips?: string | null;
    videoUrl?: string | null;
  }
>(recipe: T, hasAccess: boolean): GatedRecipe<T> {
  if (hasAccess) {
    return {
      ...recipe,
      isGated: false,
    };
  }

  return {
    ...recipe,
    ingredients: [],
    steps: [],
    tips: null,
    videoUrl: null,
    isGated: true,
    gatedReason: 'REQUIRES_PURCHASE',
  };
}
