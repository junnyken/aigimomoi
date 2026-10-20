// Nhãn hiển thị dùng chung cho các trang công khai (AG-16).

export const ROLE_LABELS: Record<string, string> = {
  MAIN: 'Món mặn',
  SOUP: 'Món canh',
  SIDE: 'Món rau / phụ',
  ONE_DISH_MEAL: 'Món một đĩa',
  DESSERT: 'Tráng miệng',
  BEVERAGE: 'Đồ uống',
};

export const TAXONOMY_TYPE_LABELS: Record<string, string> = {
  CUISINE_REGION: 'Vùng miền',
  COOKING_METHOD: 'Cách nấu',
  DIET_PREFERENCE: 'Chế độ ăn',
  OCCASION: 'Dịp',
};

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
