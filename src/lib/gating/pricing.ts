// R8 — Quy tắc giá bán và gói công thức (D66, docs/mini-specs/R8.md)
// Thuần logic, không import DB, dễ dàng unit test.

export const PRICING_RULES = {
  minRecipePrice: 10000,
  maxRecipePrice: 200000,
  minBundlePrice: 30000,
  maxBundlePrice: 1000000,
  minBundleRecipes: 2,
  maxBundleRecipes: 50,
  priceStep: 1000, // Bội số 1.000 VNĐ
} as const;

export interface PriceValidationResult {
  ok: boolean;
  error?: string;
  normalizedPrice?: number;
}

/**
 * Kiểm tra tính hợp lệ của giá món lẻ.
 * Chỉ Người nấu Bậc 2 hoặc Quản trị viên (ADMIN) mới được đặt giá có phí.
 */
export function validateRecipePrice(
  rawPrice: unknown,
  creatorTier: number,
  userRole?: string
): PriceValidationResult {
  if (rawPrice === 0 || rawPrice === '0' || rawPrice === null || rawPrice === undefined) {
    return { ok: true, normalizedPrice: 0 };
  }

  const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);
  if (!Number.isInteger(price) || price < 0) {
    return { ok: false, error: 'Giá bán phải là số nguyên dương hợp lệ.' };
  }

  if (price === 0) {
    return { ok: true, normalizedPrice: 0 };
  }

  const isAdmin = userRole === 'ADMIN';
  if (!isAdmin && creatorTier < 2) {
    return {
      ok: false,
      error: 'Chỉ người nấu đạt Bậc 2 (đã xác minh và có đánh giá cao) hoặc Quản trị viên mới được đặt giá bán công thức.',
    };
  }

  if (price < PRICING_RULES.minRecipePrice || price > PRICING_RULES.maxRecipePrice) {
    return {
      ok: false,
      error: `Giá món lẻ phải nằm trong khoảng từ ${formatPriceVND(PRICING_RULES.minRecipePrice)} đến ${formatPriceVND(PRICING_RULES.maxRecipePrice)}.`,
    };
  }

  if (price % PRICING_RULES.priceStep !== 0) {
    return {
      ok: false,
      error: `Giá bán phải là bội số của ${formatPriceVND(PRICING_RULES.priceStep)}.`,
    };
  }

  return { ok: true, normalizedPrice: price };
}

/**
 * Kiểm tra tính hợp lệ của giá và số lượng món trong bộ combo công thức.
 */
export function validateBundlePricing(
  rawPrice: unknown,
  recipeCount: number,
  creatorTier: number,
  userRole?: string
): PriceValidationResult {
  if (recipeCount < PRICING_RULES.minBundleRecipes || recipeCount > PRICING_RULES.maxBundleRecipes) {
    return {
      ok: false,
      error: `Bộ công thức phải chứa từ ${PRICING_RULES.minBundleRecipes} đến ${PRICING_RULES.maxBundleRecipes} món.`,
    };
  }

  const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);
  if (!Number.isInteger(price) || price <= 0) {
    return { ok: false, error: 'Giá bộ công thức phải là số nguyên dương hợp lệ.' };
  }

  const isAdmin = userRole === 'ADMIN';
  if (!isAdmin && creatorTier < 2) {
    return {
      ok: false,
      error: 'Chỉ người nấu đạt Bậc 2 hoặc Quản trị viên mới được tạo bộ công thức có phí.',
    };
  }

  if (price < PRICING_RULES.minBundlePrice || price > PRICING_RULES.maxBundlePrice) {
    return {
      ok: false,
      error: `Giá bộ công thức phải nằm trong khoảng từ ${formatPriceVND(PRICING_RULES.minBundlePrice)} đến ${formatPriceVND(PRICING_RULES.maxBundlePrice)}.`,
    };
  }

  if (price % PRICING_RULES.priceStep !== 0) {
    return {
      ok: false,
      error: `Giá bộ công thức phải là bội số của ${formatPriceVND(PRICING_RULES.priceStep)}.`,
    };
  }

  return { ok: true, normalizedPrice: price };
}

/**
 * Định dạng tiền tệ VNĐ chuẩn hiển thị tiếng Việt.
 */
export function formatPriceVND(price: number): string {
  if (price <= 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price).replace(/\s/g, ' ');
}
