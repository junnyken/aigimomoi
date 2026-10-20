// AG-18 — Logic co giãn khẩu phần và định lượng nguyên liệu (Invariants §5.4, D21).
// Hợp đồng nghiệp vụ:
// - R = targetServings / baseServings
// - LINEAR: scaledAmount = round(amount * R)
// - FIXED: giữ nguyên amount gốc (thảo mộc, hương liệu, lá thơm)
// - MANUAL_ADJUST: giữ nguyên amount gốc kèm nhãn "nêm theo khẩu vị gia đình"
// - Giới hạn khẩu phần an toàn: 1 đến 20 người
// - Thời gian nấu KHÔNG tự động nhân tuyến tính
import type { PublicRecipeIngredient } from './publicQueries';

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;

export interface ScaledIngredient extends PublicRecipeIngredient {
  scaledAmount: number;
  formattedAmount: string;
  scaleRatio: number;
  isScaled: boolean;
}

const amountFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/**
 * Làm tròn chỉ ở tầng hiển thị, không lưu đè giá trị làm tròn vào state tính toán (Invariants §5.4, D21).
 */
export function formatScaledAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0';
  // Làm tròn tới 2 chữ số thập phân
  const rounded = Math.round(amount * 100) / 100;
  return amountFormatter.format(rounded);
}

/**
 * Chuẩn hóa số khẩu phần hợp lệ trong khoảng [MIN_SERVINGS, MAX_SERVINGS].
 */
export function clampServings(value: unknown, fallback: number = 4): number {
  if (value === undefined || value === null || value === '') return Math.max(MIN_SERVINGS, fallback);
  const num = Number(value);
  if (!Number.isFinite(num)) return Math.max(MIN_SERVINGS, fallback);
  if (num < MIN_SERVINGS) return MIN_SERVINGS;
  if (num > MAX_SERVINGS) return MAX_SERVINGS;
  return Math.round(num);
}

/**
 * Co giãn danh sách nguyên liệu theo số khẩu phần mục tiêu.
 */
export function scaleRecipeIngredients(
  ingredients: PublicRecipeIngredient[],
  baseServings: number,
  targetServings: number
): ScaledIngredient[] {
  const safeBase = clampServings(baseServings, 4);
  const safeTarget = clampServings(targetServings, safeBase);
  const scaleRatio = safeTarget / safeBase;
  const isRatioDifferent = Math.abs(scaleRatio - 1) > 0.001;

  return ingredients.map((ing) => {
    let scaledAmount = ing.amount;
    let isScaled = false;

    switch (ing.scalePolicy) {
      case 'LINEAR':
        scaledAmount = ing.amount * scaleRatio;
        isScaled = isRatioDifferent;
        break;

      case 'FIXED':
      case 'MANUAL_ADJUST':
      default:
        // Invariants §5.4: Dòng FIXED và MANUAL_ADJUST giữ nguyên số lượng gốc
        scaledAmount = ing.amount;
        isScaled = false;
        break;
    }

    return {
      ...ing,
      scaledAmount,
      formattedAmount: formatScaledAmount(scaledAmount),
      scaleRatio,
      isScaled,
    };
  });
}
