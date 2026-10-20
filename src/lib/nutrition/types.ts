// AG-35 & AG-36: Kiểu dữ liệu Dinh dưỡng Chuẩn Việt Nam
// Tuân thủ quy tắc Invariants Gate P6:
// - Nguồn gốc có thể truy vết (VIETNAM_FCT_2007)
// - Dữ liệu thiếu không được ép thành 0 (null, không phải 0)
// - Lượng đã ăn khác lượng đã nấu (perServing, totalBatch, per100g)

export interface NutrientValues {
  calories: number;        // Kcal
  protein: number;         // g (Chất đạm)
  fat: number;             // g (Chất béo / Lipid)
  carbs: number;           // g (Chất bột đường / Carbohydrate)
  fiber: number | null;    // g (Chất xơ - nullable nếu chưa có dữ liệu)
  sodium: number | null;   // mg (Natri / Muối - nullable nếu chưa có dữ liệu)
}

export interface IngredientNutritionDetail {
  ingredientId: number;
  ingredientName: string;
  rawAmount: number;
  unit: string;
  edibleGrams: number;
  hasNutritionData: boolean;
  source?: string;
  nutrients?: NutrientValues;
}

export interface RecipeNutritionSnapshot {
  source: string;                  // 'VIETNAM_FCT_2007' | 'USDA' | ...
  servings: number;                // Số khẩu phần cơ sở
  totalEdibleGrams: number;        // Tổng khối lượng ăn được của cả nồi (g)
  coveragePercent: number;         // Độ bao phủ dinh dưỡng (0..100%)
  isVerified: boolean;             // true nếu coverage >= 80% và nguồn chuẩn
  status: 'NO_DATA' | 'INCOMPLETE' | 'ESTIMATED';
  perServing: NutrientValues;      // Dinh dưỡng trên 1 khẩu phần
  per100g: NutrientValues;         // Dinh dưỡng trên 100g thành phẩm
  totalBatch: NutrientValues;      // Dinh dưỡng toàn bộ nồi nấu
  missingIngredients: string[];    // Danh sách nguyên liệu chưa có dữ liệu dinh dưỡng
  ingredientsDetail: IngredientNutritionDetail[];
  calculatedAt: string;            // ISO timestamp
}
