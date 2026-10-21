// AG-15 — Publishing Gate Check (pure, dùng chung cho API server và UI duyệt bài).
// Không import DB ở đây để client component có thể dùng lại cùng một bộ luật.

export interface GateRecipeInput {
  name: string | null | undefined;
  shortDescription: string | null | undefined;
  heroImage: string | null | undefined;
  caloriesPerServing?: number | null;
  ingredients: Array<{ ingredientId: number; amount: number }>;
  steps: Array<{ instruction: string | null | undefined }>;
}

export interface GateCheckItem {
  key: string;
  label: string;
  passed: boolean;
}

export interface VerificationFlags {
  isEditorialReviewed: boolean;
  isCookTested: boolean;
  isNutritionVerified: boolean;
}

export function evaluateGateChecks(recipe: GateRecipeInput): GateCheckItem[] {
  const steps = recipe.steps || [];
  const ingredients = recipe.ingredients || [];

  return [
    {
      key: 'name',
      label: 'Có tên công thức',
      passed: Boolean(recipe.name && recipe.name.trim().length > 0),
    },
    {
      key: 'shortDescription',
      label: 'Có mô tả ngắn',
      passed: Boolean(recipe.shortDescription && recipe.shortDescription.trim().length > 0),
    },
    {
      key: 'heroImage',
      label: 'Có ảnh bìa (hero image)',
      passed: Boolean(recipe.heroImage && recipe.heroImage.trim().length > 0),
    },
    {
      key: 'ingredients',
      label: 'Có ít nhất 1 nguyên liệu có cấu trúc',
      passed: ingredients.length > 0,
    },
    {
      key: 'steps',
      label: 'Có ít nhất 1 bước nấu và không có bước rỗng',
      passed:
        steps.length > 0 &&
        steps.every((s) => Boolean(s.instruction && s.instruction.trim().length > 0)),
    },
  ];
}

export function failedGateChecks(recipe: GateRecipeInput): GateCheckItem[] {
  return evaluateGateChecks(recipe).filter((c) => !c.passed);
}

/**
 * Luật cho 3 nhãn kiểm chứng (Invariants §5.5, D23).
 * Trả về danh sách lỗi; rỗng nghĩa là hợp lệ.
 */
export function validateVerificationFlags(
  flags: VerificationFlags,
  recipe: Pick<GateRecipeInput, 'caloriesPerServing'> & { provenance?: string | null }
): string[] {
  const errors: string[] = [];
  // D35: ADMIN phải xác nhận tường minh đã biên tập trước khi xuất bản.
  if (!flags.isEditorialReviewed) {
    errors.push('Phải xác nhận "Đã biên tập" (isEditorialReviewed) trước khi xuất bản.');
  }
  // D23: không bật nhãn dinh dưỡng khi không có số liệu để kiểm chứng.
  if (flags.isNutritionVerified && (recipe.caloriesPerServing === null || recipe.caloriesPerServing === undefined)) {
    errors.push('Không thể bật "Đã kiểm chứng dinh dưỡng" khi công thức chưa có số liệu calo/khẩu phần.');
  }
  // R7: nhãn "Đã nấu thử" là cam kết của Bếp Mom — không gắn cho món Chợ công thức.
  if (flags.isCookTested && recipe.provenance === 'COMMUNITY_SUBMITTED') {
    errors.push('Không được bật "Đã nấu thử" (Bếp Mom) cho công thức cộng đồng.');
  }
  return errors;
}

export const REVIEW_NOTES_MIN = 5;
export const REVIEW_NOTES_MAX = 2000;
