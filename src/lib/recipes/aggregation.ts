// AG-22: Bộ máy gộp nguyên liệu đi chợ (Ingredient Aggregation Engine).
// Tuân thủ nghiêm ngặt Invariants §5.4: Gộp đúng cùng đơn vị tính, truy vết nguồn gốc,
// phân tách riêng gia vị MANUAL_ADJUST, làm tròn hiển thị an toàn (D21).

import { formatScaledAmount } from './scaling';

export interface RawRecipeIngredientForAggregation {
  id: number;
  name: string;
  category: string; // PRODUCE | MEAT_SEAFOOD | PANTRY | OTHER
  amount: number;
  unit: string;
  scalePolicy: 'LINEAR' | 'FIXED' | 'MANUAL_ADJUST';
  preparation: string | null;
  isOptional: boolean;
}

export interface RecipeForAggregation {
  slug: string;
  name: string;
  baseServings: number;
  ingredients: RawRecipeIngredientForAggregation[];
}

export interface IngredientTrace {
  recipeName: string;
  recipeSlug: string;
  scaledAmount: number;
  baseAmount: number;
  unit: string;
  preparation: string | null;
}

export interface AggregatedItem {
  key: string; // `${name.toLowerCase()}__${unit.toLowerCase()}`
  name: string;
  category: string;
  unit: string;
  scalePolicy: 'LINEAR' | 'FIXED';
  totalAmount: number;
  formattedTotal: string;
  isScaled: boolean;
  traces: IngredientTrace[];
}

export interface SeasoningTrace {
  recipeName: string;
  recipeSlug: string;
  amount: number;
  unit: string;
  preparation: string | null;
}

export interface SeasoningItem {
  key: string;
  name: string;
  unit: string;
  category: string;
  scalePolicy: 'MANUAL_ADJUST';
  traces: SeasoningTrace[];
}

export interface AggregationResult {
  targetServings: number;
  dishesCount: number;
  freshItems: AggregatedItem[];
  seasoningItems: SeasoningItem[];
  categories: {
    meatSeafood: AggregatedItem[];
    produce: AggregatedItem[];
    pantry: AggregatedItem[];
    other: AggregatedItem[];
  };
}

/**
 * Gộp nguyên liệu từ nhiều món ăn trong mâm cơm theo số khẩu phần ăn mong muốn.
 */
export function aggregateMealIngredients(
  recipesList: RecipeForAggregation[],
  targetServings = 4
): AggregationResult {
  const aggregatedMap = new Map<string, AggregatedItem>();
  const seasoningsMap = new Map<string, SeasoningItem>();

  for (const recipe of recipesList) {
    const baseServings = Math.max(1, recipe.baseServings);
    const ratio = targetServings / baseServings;

    for (const ing of recipe.ingredients) {
      const cleanName = ing.name.trim();
      const cleanUnit = ing.unit.trim();
      const nameKey = cleanName.toLowerCase();
      const unitKey = cleanUnit.toLowerCase();

      // 1. Phân nhóm gia vị nêm nếm MANUAL_ADJUST
      // Không cộng dồn số học thô thiển để tránh sai lệch nêm nếm
      if (ing.scalePolicy === 'MANUAL_ADJUST') {
        const seasoningKey = `${nameKey}__${unitKey}`;
        if (!seasoningsMap.has(seasoningKey)) {
          seasoningsMap.set(seasoningKey, {
            key: seasoningKey,
            name: cleanName,
            unit: cleanUnit,
            category: ing.category || 'PANTRY',
            scalePolicy: 'MANUAL_ADJUST',
            traces: [],
          });
        }

        seasoningsMap.get(seasoningKey)!.traces.push({
          recipeName: recipe.name,
          recipeSlug: recipe.slug,
          amount: ing.amount,
          unit: cleanUnit,
          preparation: ing.preparation,
        });
        continue;
      }

      // 2. Nguyên liệu LINEAR hoặc FIXED
      // Chỉ gộp khi cùng tên và CÙNG đơn vị đo lường (Invariants §5.4)
      const aggKey = `${nameKey}__${unitKey}`;
      const scaledAmount = ing.scalePolicy === 'LINEAR' ? ing.amount * ratio : ing.amount;

      if (!aggregatedMap.has(aggKey)) {
        aggregatedMap.set(aggKey, {
          key: aggKey,
          name: cleanName,
          category: ing.category || 'OTHER',
          unit: cleanUnit,
          scalePolicy: ing.scalePolicy,
          totalAmount: 0,
          formattedTotal: '',
          isScaled: ratio !== 1 && ing.scalePolicy === 'LINEAR',
          traces: [],
        });
      }

      const item = aggregatedMap.get(aggKey)!;
      item.totalAmount += scaledAmount;
      if (ratio !== 1 && ing.scalePolicy === 'LINEAR') {
        item.isScaled = true;
      }

      item.traces.push({
        recipeName: recipe.name,
        recipeSlug: recipe.slug,
        scaledAmount,
        baseAmount: ing.amount,
        unit: cleanUnit,
        preparation: ing.preparation,
      });
    }
  }

  // Chuyển map thành list và format hiển thị
  const freshItems: AggregatedItem[] = Array.from(aggregatedMap.values()).map((item) => ({
    ...item,
    formattedTotal: formatScaledAmount(item.totalAmount),
  }));

  const seasoningItems: SeasoningItem[] = Array.from(seasoningsMap.values());

  // Phân loại theo quầy chợ
  const categories = {
    meatSeafood: freshItems.filter((i) => i.category === 'MEAT_SEAFOOD'),
    produce: freshItems.filter((i) => i.category === 'PRODUCE'),
    pantry: freshItems.filter((i) => i.category === 'PANTRY'),
    other: freshItems.filter((i) => !['MEAT_SEAFOOD', 'PRODUCE', 'PANTRY'].includes(i.category)),
  };

  return {
    targetServings,
    dishesCount: recipesList.length,
    freshItems,
    seasoningItems,
    categories,
  };
}
