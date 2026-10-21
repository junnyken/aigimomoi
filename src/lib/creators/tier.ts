// R7 — Bậc thang uy tín người nấu (thuần, không import DB).
// Ngưỡng theo docs/mini-specs/R7.md §4, đã được chủ sản phẩm duyệt 21/10/2026.
//
// Giai đoạn hiện tại (R7) toàn bộ công thức MIỄN PHÍ để thu hút người dùng:
// bậc 2 chỉ là huy hiệu "Người nấu uy tín" + đủ điều kiện bán khi R8/R9 mở.

export type CreatorTier = 0 | 1 | 2;

export const TIER_RULES = {
  /** Số món Chợ công thức đã xuất bản tối thiểu để lên bậc 2 */
  minPublishedRecipesForTier2: 3,
  /** Số người (khác tác giả) đã nấu & đánh giá được duyệt, tối thiểu để lên bậc 2 */
  minDistinctRatersForTier2: 10,
  /** Điểm trung bình tối thiểu để lên bậc 2 */
  minAverageRatingForTier2: 4,
} as const;

export interface CreatorTierInput {
  /** Số món COMMUNITY_SUBMITTED của người này đang PUBLISHED */
  publishedCommunityRecipes: number;
  /** Số người dùng đăng nhập KHÁC tác giả có đánh giá APPROVED trên các món của người này */
  distinctRaters: number;
  /** Điểm trung bình các đánh giá đó (null nếu chưa có) */
  averageRating: number | null;
  /** Admin đã xác minh danh tính (CCCD) */
  identityVerified: boolean;
  /** Đã đồng ý điều khoản người bán */
  sellerTermsAccepted: boolean;
}

export interface CreatorTierResult {
  tier: CreatorTier;
  /** Các điều kiện còn thiếu để lên bậc kế tiếp (tiếng Việt, hiển thị cho chính chủ) */
  missingForNextTier: string[];
}

export function computeCreatorTier(input: CreatorTierInput): CreatorTierResult {
  const published = Math.max(0, Math.trunc(input.publishedCommunityRecipes || 0));
  const raters = Math.max(0, Math.trunc(input.distinctRaters || 0));
  const avg = typeof input.averageRating === 'number' && Number.isFinite(input.averageRating)
    ? input.averageRating
    : null;

  if (published < 1) {
    return {
      tier: 0,
      missingForNextTier: ['Có ít nhất 1 công thức được duyệt và xuất bản trên Chợ công thức'],
    };
  }

  const missing: string[] = [];
  if (published < TIER_RULES.minPublishedRecipesForTier2) {
    missing.push(`Có ít nhất ${TIER_RULES.minPublishedRecipesForTier2} công thức đã xuất bản (hiện có ${published})`);
  }
  if (raters < TIER_RULES.minDistinctRatersForTier2) {
    missing.push(`Có ít nhất ${TIER_RULES.minDistinctRatersForTier2} người đã nấu và đánh giá (hiện có ${raters})`);
  }
  if (avg === null || avg < TIER_RULES.minAverageRatingForTier2) {
    missing.push(`Điểm đánh giá trung bình từ ${TIER_RULES.minAverageRatingForTier2}/5 trở lên`);
  }
  if (!input.identityVerified) {
    missing.push('Xác minh danh tính với Ban quản trị');
  }
  if (!input.sellerTermsAccepted) {
    missing.push('Đồng ý điều khoản người bán');
  }

  return missing.length === 0
    ? { tier: 2, missingForNextTier: [] }
    : { tier: 1, missingForNextTier: missing };
}

export const CREATOR_TIER_LABELS: Record<CreatorTier, string> = {
  0: 'Thành viên',
  1: 'Người đóng góp',
  2: 'Người nấu uy tín',
};

/** Slug hồ sơ công khai: chữ thường không dấu, số, gạch nối; 3–40 ký tự. */
const CREATOR_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidCreatorSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 3 && value.length <= 40 && CREATOR_SLUG_PATTERN.test(value);
}

/** Gợi ý slug từ tên hiển thị tiếng Việt (bỏ dấu). */
export function suggestCreatorSlug(displayName: string): string {
  const base = displayName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return base.length >= 3 ? base : `nguoi-nau-${base || 'moi'}`;
}
