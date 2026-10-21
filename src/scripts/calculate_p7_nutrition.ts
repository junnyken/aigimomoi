// AG-39 & AG-35/36: Nạp dữ liệu dinh dưỡng FCT và tính toán Snapshot cho các món P7
import { db, closeDb } from '../lib/db';
import { recipes, ingredients, ingredientNutrition } from '../lib/db/schema';
import { eq, inArray, ilike } from 'drizzle-orm';
import { calculateRecipeNutrition } from '../lib/nutrition/calculator';

const P7_FCT_STANDARDS = [
  { name: 'Xương ống bò', calories100g: 150, protein100g: 12.0, fat100g: 10.0, carbs100g: 0, edibleRate: 0.2, fiber100g: 0, sodium100g: 60 },
  { name: 'Thịt bò phi lê', calories100g: 182, protein100g: 21.5, fat100g: 10.5, carbs100g: 0, edibleRate: 1.0, fiber100g: 0, sodium100g: 65 },
  { name: 'Bắp bò hoặc nạm bò', calories100g: 201, protein100g: 20.0, fat100g: 13.0, carbs100g: 0, edibleRate: 1.0, fiber100g: 0, sodium100g: 70 },
  { name: 'Bánh phở tươi', calories100g: 110, protein100g: 2.0, fat100g: 0.3, carbs100g: 25.0, edibleRate: 1.0, fiber100g: 0.5, sodium100g: 20 },
  { name: 'Bún sợi to', calories100g: 110, protein100g: 1.8, fat100g: 0.2, carbs100g: 25.5, edibleRate: 1.0, fiber100g: 0.5, sodium100g: 20 },
  { name: 'Đậu hũ trắng', calories100g: 95, protein100g: 10.9, fat100g: 5.4, carbs100g: 0.7, edibleRate: 1.0, fiber100g: 0.4, sodium100g: 15 },
  { name: 'Cà chua chín', calories100g: 20, protein100g: 1.2, fat100g: 0.2, carbs100g: 4.2, edibleRate: 0.95, fiber100g: 1.4, sodium100g: 10 },
  { name: 'Cùi bưởi da xanh', calories100g: 38, protein100g: 0.7, fat100g: 0.1, carbs100g: 9.0, edibleRate: 1.0, fiber100g: 1.5, sodium100g: 5 },
  { name: 'Đậu xanh bóc vỏ', calories100g: 328, protein100g: 23.4, fat100g: 2.4, carbs100g: 53.1, edibleRate: 1.0, fiber100g: 4.7, sodium100g: 12 },
  { name: 'Bí đao già', calories100g: 12, protein100g: 0.6, fat100g: 0.1, carbs100g: 2.4, edibleRate: 0.9, fiber100g: 1.0, sodium100g: 8 },
  { name: 'Đường phèn', calories100g: 387, protein100g: 0, fat100g: 0, carbs100g: 99.8, edibleRate: 1.0, fiber100g: 0, sodium100g: 2 },
  { name: 'Nước cốt dừa', calories100g: 197, protein100g: 2.0, fat100g: 21.0, carbs100g: 2.8, edibleRate: 1.0, fiber100g: 0, sodium100g: 15 },
  { name: 'Bột năng', calories100g: 350, protein100g: 0.5, fat100g: 0.2, carbs100g: 86.0, edibleRate: 1.0, fiber100g: 0.5, sodium100g: 10 },
];

const P7_SLUGS = [
  'pho-bo-ha-noi-truyen-thong',
  'bun-bo-hue-chuan-vi-co-do',
  'dau-hu-sot-ca-chua-chay-thanh-dam',
  'che-buoi-an-giang-gion-san-sat',
  'nuoc-sam-bi-dao-la-dua-hat-chia',
];

async function syncNutrition() {
  console.log('--- ĐỒNG BỘ DINH DƯỠNG CHO CÁC MÓN MỚI PHASE P7 ---');

  // 1. Cập nhật bảng FCT nguyên liệu
  for (const std of P7_FCT_STANDARDS) {
    const foundIngs = await db.query.ingredients.findMany({
      where: ilike(ingredients.name, `%${std.name}%`),
    });

    for (const ing of foundIngs) {
      await db.insert(ingredientNutrition).values({
        ingredientId: ing.id,
        source: 'VIETNAM_FCT_2007',
        edibleRate: std.edibleRate,
        calories100g: std.calories100g,
        protein100g: std.protein100g,
        fat100g: std.fat100g,
        carbs100g: std.carbs100g,
        fiber100g: std.fiber100g,
        sodium100g: std.sodium100g,
        isVerified: true,
      }).onConflictDoUpdate({
        target: ingredientNutrition.ingredientId,
        set: {
          calories100g: std.calories100g,
          protein100g: std.protein100g,
          fat100g: std.fat100g,
          carbs100g: std.carbs100g,
          fiber100g: std.fiber100g,
          sodium100g: std.sodium100g,
          isVerified: true,
        },
      });
      console.log(`+ Dinh dưỡng cập nhật cho: ${ing.name}`);
    }
  }

  // 2. Tính toán snapshot dinh dưỡng cho 5 công thức P7
  const p7Recipes = await db.query.recipes.findMany({
    where: inArray(recipes.slug, P7_SLUGS),
  });

  for (const r of p7Recipes) {
    const snapshot = await calculateRecipeNutrition(r.id);
    if (snapshot) {
      await db.update(recipes).set({
        caloriesPerServing: Math.round(snapshot.perServing.calories),
        nutritionStatus: snapshot.status,
        isNutritionVerified: snapshot.isVerified,
        nutritionSnapshot: snapshot as any,
        updatedAt: new Date(),
      }).where(eq(recipes.id, r.id));

      console.log(`✓ [${r.name}] -> ${Math.round(snapshot.perServing.calories)} kcal/phần (Độ bao phủ: ${snapshot.coveragePercent}%, Trạng thái: ${snapshot.status})`);
    }
  }

  console.log('✅ Hoàn tất đồng bộ dinh dưỡng cho Catalog P7!');
  await closeDb();
}

syncNutrition().catch((err) => {
  console.error('Error syncing nutrition:', err);
  process.exit(1);
});
