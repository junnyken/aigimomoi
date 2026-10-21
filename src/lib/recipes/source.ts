// R7 — Phân tầng nguồn công thức: "Bếp Mom" (biên tập) vs "Chợ công thức" (cộng đồng).
// Thuần (không import DB) để dùng chung cho server, client component và test.
//
// Nguồn được SUY RA từ cột `provenance` có sẵn (AG-29/AG-31) — không thêm cột trùng lặp:
//   - 'COMMUNITY_SUBMITTED' → COMMUNITY (Chợ công thức)
//   - còn lại ('MANUAL', 'AI_ASSISTED', …) → EDITORIAL (Bếp Mom, do ban biên tập soạn/duyệt)

export type RecipeSource = 'EDITORIAL' | 'COMMUNITY';

export const COMMUNITY_PROVENANCE = 'COMMUNITY_SUBMITTED';

export function recipeSourceFromProvenance(provenance: string | null | undefined): RecipeSource {
  return provenance === COMMUNITY_PROVENANCE ? 'COMMUNITY' : 'EDITORIAL';
}

export const RECIPE_SOURCE_LABELS: Record<RecipeSource, string> = {
  EDITORIAL: 'Bếp Mom',
  COMMUNITY: 'Chợ công thức',
};

/** Giá trị hợp lệ cho bộ lọc ?nguon= ở /mon-an */
export type RecipeSourceFilter = 'all' | 'bep-mom' | 'cho';

export function parseRecipeSourceFilter(value: unknown): RecipeSourceFilter {
  return value === 'bep-mom' || value === 'cho' ? value : 'all';
}
