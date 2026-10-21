// Nhãn hiển thị dùng chung cho các trang công khai (AG-16).

export const ROLE_LABELS: Record<string, string> = {
  MAIN: 'Món mặn',
  SOUP: 'Món canh',
  SIDE: 'Món rau / phụ',
  ONE_DISH_MEAL: 'Món nước / Trọn bữa',
  DESSERT: 'Tráng miệng',
  BEVERAGE: 'Đồ uống',
};

export const TAXONOMY_TYPE_LABELS: Record<string, string> = {
  CUISINE_REGION: 'Vùng miền',
  COOKING_METHOD: 'Cách nấu',
  DIET_PREFERENCE: 'Chế độ ăn',
  OCCASION: 'Dịp',
};

export const SORT_LABELS: Record<string, string> = {
  newest: 'Mới nhất',
  quickest: 'Nấu nhanh nhất',
  calories_asc: 'Calo thấp nhất',
};

export const TIME_PRESETS = [
  { label: 'Tất cả thời gian', value: undefined },
  { label: '≤ 20 phút (Nhanh gọn)', value: 20 },
  { label: '≤ 45 phút (Bữa cơm thường)', value: 45 },
  { label: '≤ 60 phút', value: 60 },
] as const;

const amountFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

/** Làm tròn chỉ ở tầng hiển thị (D21) — giá trị gốc không bị thay đổi. */
export function formatAmount(amount: number): string {
  return amountFormatter.format(amount);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return s === 0 ? `${m} phút` : `${m} phút ${s} giây`;
}

export const PUBLIC_RECIPE_PREFIX = '/cong-thuc/';

/**
 * Param placeholder: thỏa yêu cầu generateStaticParams của Cache Components mà không cần DB
 * lúc build, đồng thời là trang 404 tĩnh để Proxy rewrite tới (trả mã 404 thật).
 * Có dấu `_` nên không bao giờ khớp SLUG_PATTERN → không thể trùng công thức thật.
 */
export const RECIPE_NOT_FOUND_PLACEHOLDER = '_khong-tim-thay';

export function recipePath(slug: string): string {
  return `${PUBLIC_RECIPE_PREFIX}${encodeURIComponent(slug)}`;
}

/**
 * Phân biệt ảnh minh họa (stock / Unsplash) với ảnh chụp đĩa cơm thực tế tại bếp (D23, R1).
 * - URL Unsplash hoặc kho ảnh ngoài -> true (Ảnh minh họa).
 * - Kho ảnh tải lên nội bộ (/uploads/...) hoặc không có ảnh -> false.
 */
export function isIllustrationImage(src: string | null | undefined): boolean {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith('/uploads/') || trimmed.includes('/uploads/')) return false;
  if (
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('unsplash.com') ||
    trimmed.includes('pexels.com') ||
    trimmed.includes('pixabay.com') ||
    trimmed.includes('placeholder')
  ) {
    return true;
  }
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}
