// R2 — Helper thuần dựng URL giữa các chặng của hành trình nấu bếp.
// Mục đích: không để mất trạng thái (món đã chọn, số người ăn) khi chuyển trang (§6.7).
import { clampServings } from '@/lib/recipes/scaling';
import { recipePath } from '@/lib/recipes/labels';

export interface MealQueryInput {
  mainSlug?: string | null;
  soupSlug?: string | null;
  sideSlug?: string | null;
  servings: number;
}

/** Query string chung cho /meal và /shopping: giữ nguyên 3 món + khẩu phần. */
export function buildMealQuery({ mainSlug, soupSlug, sideSlug, servings }: MealQueryInput): string {
  const params = new URLSearchParams();
  if (mainSlug) params.set('main', mainSlug);
  if (soupSlug) params.set('soup', soupSlug);
  if (sideSlug) params.set('side', sideSlug);
  params.set('servings', String(clampServings(servings, 4)));
  return params.toString();
}

/** Lấy slug theo vai trò từ danh sách món của mâm (dùng ở /shopping để quay lại /meal). */
export function mealQueryFromDishes(
  dishes: { slug: string; role: string }[],
  servings: number
): string {
  const find = (role: string) => dishes.find((d) => d.role === role)?.slug ?? null;
  return buildMealQuery({
    mainSlug: find('MAIN'),
    soupSlug: find('SOUP'),
    sideSlug: find('SIDE'),
    servings,
  });
}

/**
 * Link vào Chế độ nấu, mang theo số người ăn người dùng đã chọn.
 * Bằng khẩu phần gốc thì bỏ tham số cho URL gọn.
 */
export function buildCookingHref(slug: string, servings: unknown, baseServings: number): string {
  const base = `${recipePath(slug)}/nau`;
  const safeBase = clampServings(baseServings, 4);
  if (servings === undefined || servings === null || servings === '') return base;
  const safeTarget = clampServings(servings, safeBase);
  return safeTarget === safeBase ? base : `${base}?servings=${safeTarget}`;
}
