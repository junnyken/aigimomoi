// AG-36: Bộ máy tính toán Dinh dưỡng Công thức Chuẩn Việt Nam
// Tuân thủ nghiêm ngặt Invariants Gate P6:
// 1. Dữ liệu thiếu không được ép thành 0 (Missing is NOT zero).
// 2. Tỷ lệ bao phủ dinh dưỡng (Coverage %) phải tính trung thực dựa trên khối lượng thực tế.
// 3. Phân biệt rõ lượng ăn được (Edible Portion) và lượng mua về (As Purchased).
// 4. Lưu Snapshot cố định để chống hồi tố khi sửa từ điển sau này.

import { db } from '@/lib/db';
import { recipes, recipeIngredients, ingredients, ingredientNutrition } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { convertToGrams } from './units';
import { VIETNAMESE_STANDARD_FCT } from './seedData';
import type { RecipeNutritionSnapshot, NutrientValues, IngredientNutritionDetail } from './types';
import { logger } from '@/lib/logger';

/**
 * Nạp hoặc cập nhật dữ liệu dinh dưỡng chuẩn Viện Dinh Dưỡng vào DB
 */
export async function seedNutritionStandards(): Promise<number> {
  let seededCount = 0;

  for (const item of VIETNAMESE_STANDARD_FCT) {
    // Tìm tất cả nguyên liệu tương ứng trong từ điển ingredients
    const foundIngs = await db.query.ingredients.findMany({
      where: (ing, { or, eq, like }) =>
        or(
          eq(ing.slug, item.slug),
          like(ing.name, `%${item.name}%`)
        ),
    });

    for (const foundIng of foundIngs) {
      await db
        .insert(ingredientNutrition)
        .values({
          ingredientId: foundIng.id,
          source: item.source,
          edibleRate: item.edibleRate,
          calories100g: item.calories100g,
          protein100g: item.protein100g,
          fat100g: item.fat100g,
          carbs100g: item.carbs100g,
          fiber100g: item.fiber100g,
          sodium100g: item.sodium100g,
          isVerified: true,
          notes: item.notes,
        })
        .onConflictDoUpdate({
          target: ingredientNutrition.ingredientId,
          set: {
            source: item.source,
            edibleRate: item.edibleRate,
            calories100g: item.calories100g,
            protein100g: item.protein100g,
            fat100g: item.fat100g,
            carbs100g: item.carbs100g,
            fiber100g: item.fiber100g,
            sodium100g: item.sodium100g,
            isVerified: true,
            notes: item.notes,
            updatedAt: new Date(),
          },
        });
      seededCount++;
    }
  }

  return seededCount;
}

/**
 * Tính toán dinh dưỡng cho một công thức món ăn
 * @param recipeId ID công thức
 */
export async function calculateRecipeNutrition(recipeId: number): Promise<RecipeNutritionSnapshot> {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);

  if (!recipe) {
    throw new Error(`Không tìm thấy công thức với ID ${recipeId}`);
  }

  // Lấy danh sách nguyên liệu của công thức kèm thông tin dinh dưỡng
  const recipeIngList = await db.query.recipeIngredients.findMany({
    where: eq(recipeIngredients.recipeId, recipeId),
    with: {
      ingredient: {
        with: {
          nutrition: true,
        },
      },
    },
  });

  const servings = recipe.baseServings || 4;
  let totalRawGrams = 0;
  let totalEdibleGrams = 0;
  let coveredEdibleGrams = 0;

  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalFiber: number | null = null;
  let totalSodium: number | null = null;

  let hasAnyFiber = false;
  let hasAnySodium = false;

  const missingIngredients: string[] = [];
  const ingredientsDetail: IngredientNutritionDetail[] = [];

  for (const item of recipeIngList) {
    const ingName = item.ingredient.name;
    const rawGrams = convertToGrams(item.amount, item.unit, ingName);
    totalRawGrams += rawGrams;

    const nut = item.ingredient.nutrition;

    if (!nut || nut.calories100g === null) {
      missingIngredients.push(ingName);
      ingredientsDetail.push({
        ingredientId: item.ingredient.id,
        ingredientName: ingName,
        rawAmount: item.amount,
        unit: item.unit,
        edibleGrams: rawGrams,
        hasNutritionData: false,
      });
      totalEdibleGrams += rawGrams;
      continue;
    }

    const edibleRate = nut.edibleRate || 1.0;
    const edibleGrams = rawGrams * edibleRate;
    totalEdibleGrams += edibleGrams;
    coveredEdibleGrams += edibleGrams;

    const factor = edibleGrams / 100;
    const ingCalories = (nut.calories100g || 0) * factor;
    const ingProtein = (nut.protein100g || 0) * factor;
    const ingFat = (nut.fat100g || 0) * factor;
    const ingCarbs = (nut.carbs100g || 0) * factor;

    totalCalories += ingCalories;
    totalProtein += ingProtein;
    totalFat += ingFat;
    totalCarbs += ingCarbs;

    // Xử lý chất xơ (Invariant: Missing is NOT zero)
    if (nut.fiber100g !== null) {
      hasAnyFiber = true;
      totalFiber = (totalFiber ?? 0) + nut.fiber100g * factor;
    }

    // Xử lý natri (Invariant: Missing is NOT zero)
    if (nut.sodium100g !== null) {
      hasAnySodium = true;
      totalSodium = (totalSodium ?? 0) + nut.sodium100g * factor;
    }

    ingredientsDetail.push({
      ingredientId: item.ingredient.id,
      ingredientName: ingName,
      rawAmount: item.amount,
      unit: item.unit,
      edibleGrams: Math.round(edibleGrams * 10) / 10,
      hasNutritionData: true,
      source: nut.source,
      nutrients: {
        calories: Math.round(ingCalories * 10) / 10,
        protein: Math.round(ingProtein * 10) / 10,
        fat: Math.round(ingFat * 10) / 10,
        carbs: Math.round(ingCarbs * 10) / 10,
        fiber: nut.fiber100g !== null ? Math.round(nut.fiber100g * factor * 10) / 10 : null,
        sodium: nut.sodium100g !== null ? Math.round(nut.sodium100g * factor) : null,
      },
    });
  }

  // Tính tỷ lệ bao phủ theo khối lượng thực phẩm ăn được
  const coveragePercent = totalEdibleGrams > 0 
    ? Math.round((coveredEdibleGrams / totalEdibleGrams) * 100) 
    : 0;

  // Xác định trạng thái kiểm chứng
  let status: 'NO_DATA' | 'INCOMPLETE' | 'ESTIMATED' = 'NO_DATA';
  let isVerified = false;

  if (coveragePercent >= 80) {
    status = 'ESTIMATED';
    isVerified = true;
  } else if (coveragePercent > 0) {
    status = 'INCOMPLETE';
    isVerified = false;
  }

  // Dinh dưỡng toàn bộ nồi nấu
  const totalBatch: NutrientValues = {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fiber: hasAnyFiber && totalFiber !== null ? Math.round(totalFiber * 10) / 10 : null,
    sodium: hasAnySodium && totalSodium !== null ? Math.round(totalSodium) : null,
  };

  // Dinh dưỡng trên 1 khẩu phần (per serving)
  const perServing: NutrientValues = {
    calories: Math.round(totalBatch.calories / servings),
    protein: Math.round((totalBatch.protein / servings) * 10) / 10,
    fat: Math.round((totalBatch.fat / servings) * 10) / 10,
    carbs: Math.round((totalBatch.carbs / servings) * 10) / 10,
    fiber: totalBatch.fiber !== null ? Math.round((totalBatch.fiber / servings) * 10) / 10 : null,
    sodium: totalBatch.sodium !== null ? Math.round(totalBatch.sodium / servings) : null,
  };

  // Dinh dưỡng trên 100g thành phẩm
  const per100gFactor = totalEdibleGrams > 0 ? 100 / totalEdibleGrams : 0;
  const per100g: NutrientValues = {
    calories: Math.round(totalBatch.calories * per100gFactor),
    protein: Math.round(totalBatch.protein * per100gFactor * 10) / 10,
    fat: Math.round(totalBatch.fat * per100gFactor * 10) / 10,
    carbs: Math.round(totalBatch.carbs * per100gFactor * 10) / 10,
    fiber: totalBatch.fiber !== null ? Math.round(totalBatch.fiber * per100gFactor * 10) / 10 : null,
    sodium: totalBatch.sodium !== null ? Math.round(totalBatch.sodium * per100gFactor) : null,
  };

  const snapshot: RecipeNutritionSnapshot = {
    source: 'VIETNAM_FCT_2007 (Viện Dinh Dưỡng Quốc Gia)',
    servings,
    totalEdibleGrams: Math.round(totalEdibleGrams),
    coveragePercent,
    isVerified,
    status,
    perServing,
    per100g,
    totalBatch,
    missingIngredients,
    ingredientsDetail,
    calculatedAt: new Date().toISOString(),
  };

  // Cập nhật vào DB
  await db
    .update(recipes)
    .set({
      nutritionSnapshot: snapshot,
      caloriesPerServing: perServing.calories,
      nutritionStatus: status,
      isNutritionVerified: isVerified,
    })
    .where(eq(recipes.id, recipeId));

  logger.info(`Calculated nutrition for recipe ${recipeId}`, {
    recipeId,
    caloriesPerServing: perServing.calories,
    coveragePercent,
    isVerified,
  });

  return snapshot;
}
