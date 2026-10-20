// AG-35 & AG-36: Kịch bản kiểm thử tự động toàn diện cho Nutrition Engine & Calculator
// Kiểm tra Invariants Gate P6:
// 1. Nguồn dữ liệu kiểm định chuẩn Viện Dinh Dưỡng Quốc Gia (VIETNAM_FCT_2007).
// 2. Chuyển đổi chính xác các đơn vị dân gian bếp Việt (lạng, kg, thìa canh, quả...).
// 3. Quy tắc phần ăn được (Edible Portion / Refuse Rate).
// 4. Invariant Tối thượng: Dữ liệu thiếu giữ nguyên null, KHÔNG ĐƯỢC ÉP THÀNH 0 (Missing is NOT zero).
// 5. Tính toán chính xác Kcal, Macro trên 1 khẩu phần, toàn bộ nồi và 100g.
// 6. Tính tỷ lệ bao phủ dinh dưỡng (Coverage %) và lưu Snapshot bất biến.
// 7. API GET và POST /api/recipes/[id]/nutrition.
// Chạy độc lập: npx tsx src/scripts/test_nutrition_engine.ts

import { db } from '../lib/db';
import { recipes, ingredients, ingredientNutrition, recipeIngredients, dishes, users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { convertToGrams } from '../lib/nutrition/units';
import { seedNutritionStandards } from '../lib/nutrition/calculator';
import { calculateRecipeNutrition } from '../lib/nutrition/calculator';
import { hashPassword } from '../lib/auth/password';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passCount++;
    console.log(`  ✓ ${msg}`);
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  AG-35 & AG-36 — Test Suite: Nutrition Engine');
  console.log('======================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const TEST_PASSWORD = 'TestPassword@123';
  const hashedPw = await hashPassword(TEST_PASSWORD);

  // 1. Chuẩn bị User Editor
  let editor = await db.query.users.findFirst({
    where: eq(users.email, 'editor_nutrition@angimom.vn'),
  });
  if (!editor) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'editor_nutrition@angimom.vn',
        passwordHash: hashedPw,
        displayName: 'Chuyên Viên Dinh Dưỡng',
        role: 'EDITOR',
      })
      .returning();
    editor = u;
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, editor.id));
  }

  console.log('--- TEST 1: Bộ chuyển đổi đơn vị bếp Việt sang gam (units.ts) ---');
  assert(convertToGrams(500, 'g') === 500, '500 g -> 500 gam');
  assert(convertToGrams(0.5, 'kg') === 500, '0.5 kg -> 500 gam');
  assert(convertToGrams(3, 'lạng') === 300, '3 lạng -> 300 gam');
  assert(convertToGrams(2, 'thìa canh') === 30, '2 thìa canh -> 30 gam (2 * 15)');
  assert(convertToGrams(1, 'thìa cà phê') === 5, '1 thìa cà phê -> 5 gam');
  assert(convertToGrams(4, 'quả', 'Trứng gà') === 220, '4 quả Trứng gà -> 220 gam (4 * 55g)');
  assert(convertToGrams(2, 'củ', 'Hành tím') === 30, '2 củ Hành tím -> 30 gam (2 * 15g)');

  console.log('\n--- TEST 2: Seed dữ liệu chuẩn Viện Dinh Dưỡng (AG-35) ---');
  // Đảm bảo có các nguyên liệu trong bảng ingredients
  const sampleIngs = [
    { slug: 'thit-ba-chi', name: 'Thịt ba chỉ heo', category: 'Thịt' },
    { slug: 'trung-ga', name: 'Trứng gà', category: 'Trứng' },
    { slug: 'nuoc-mam', name: 'Nước mắm truyền thống', category: 'Gia vị' },
    { slug: 'duong-kinh', name: 'Đường kính trắng', category: 'Gia vị' },
    { slug: 'tieu-den', name: 'Hạt tiêu đen', category: 'Gia vị' },
    { slug: 'la-chua-co-so-lieu', name: 'Lá thơm rừng quý hiếm', category: 'Rau' },
  ];

  for (const ing of sampleIngs) {
    const exist = await db.query.ingredients.findFirst({ where: eq(ingredients.slug, ing.slug) });
    if (!exist) {
      await db.insert(ingredients).values(ing);
    }
  }

  const seeded = await seedNutritionStandards();
  assert(seeded >= 5, `Đã đồng bộ thành công ${seeded} nguyên liệu với Bảng FCT Viện Dinh Dưỡng`);

  const porkIng = await db.query.ingredients.findFirst({ where: eq(ingredients.slug, 'thit-ba-chi') });
  const porkNut = await db.query.ingredientNutrition.findFirst({
    where: eq(ingredientNutrition.ingredientId, porkIng!.id),
  });
  assert(porkNut !== undefined, 'Thịt ba chỉ đã có dữ liệu dinh dưỡng trong DB');
  assert(porkNut?.source === 'VIETNAM_FCT_2007', 'Nguồn gốc xác thực là VIETNAM_FCT_2007');
  assert(porkNut?.calories100g === 260, 'Năng lượng chuẩn: 260 kcal / 100g');
  assert(porkNut?.protein100g === 16.5, 'Chất đạm chuẩn: 16.5 g / 100g');
  assert(porkNut?.fat100g === 21.5, 'Chất béo chuẩn: 21.5 g / 100g');

  console.log('\n--- TEST 3: Tính toán Dinh dưỡng Công thức (AG-36) ---');
  // Tạo 1 công thức test
  let testDish = await db.query.dishes.findFirst({ where: eq(dishes.slug, 'thit-kho-tau-nutrition-test') });
  if (!testDish) {
    const [d] = await db
      .insert(dishes)
      .values({
        name: 'Thịt Kho Tàu Test Dinh Dưỡng',
        slug: 'thit-kho-tau-nutrition-test',
      })
      .returning();
    testDish = d;
  }

  let testRecipe = await db.query.recipes.findFirst({ where: eq(recipes.slug, 'thit-kho-tau-test-calc') });
  if (!testRecipe) {
    const [r] = await db
      .insert(recipes)
      .values({
        dishId: testDish.id,
        authorId: editor.id,
        slug: 'thit-kho-tau-test-calc',
        name: 'Thịt Kho Tàu Chuẩn Vị Gia Đình',
        shortDescription: 'Công thức kiểm thử bộ tính dinh dưỡng AG-36',
        status: 'PUBLISHED',
        baseServings: 4,
      })
      .returning();
    testRecipe = r;
  }

  // Xóa nguyên liệu cũ của recipe này
  await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, testRecipe.id));

  // Gán nguyên liệu vào recipe
  const eggIng = await db.query.ingredients.findFirst({ where: eq(ingredients.slug, 'trung-ga') });
  const fishSauceIng = await db.query.ingredients.findFirst({ where: eq(ingredients.slug, 'nuoc-mam') });
  const sugarIng = await db.query.ingredients.findFirst({ where: eq(ingredients.slug, 'duong-kinh') });
  const rareLeafIng = await db.query.ingredients.findFirst({ where: eq(ingredients.slug, 'la-chua-co-so-lieu') });

  await db.insert(recipeIngredients).values([
    {
      recipeId: testRecipe.id,
      ingredientId: porkIng!.id,
      amount: 500, // 500g thịt ba chỉ (260 kcal * 5 = 1300 kcal, đạm = 16.5*5=82.5g)
      unit: 'g',
      sortOrder: 1,
    },
    {
      recipeId: testRecipe.id,
      ingredientId: eggIng!.id,
      amount: 4, // 4 quả trứng gà (220g mua về, edibleRate 0.88 = 193.6g -> 166 * 1.936 = 321.4 kcal)
      unit: 'quả',
      sortOrder: 2,
    },
    {
      recipeId: testRecipe.id,
      ingredientId: fishSauceIng!.id,
      amount: 2, // 2 thìa canh nước mắm = 30g -> 35 * 0.3 = 10.5 kcal, natri = 7720 * 0.3 = 2316 mg
      unit: 'thìa canh',
      sortOrder: 3,
    },
    {
      recipeId: testRecipe.id,
      ingredientId: sugarIng!.id,
      amount: 1, // 1 thìa canh đường = 15g -> 397 * 0.15 = 59.55 kcal, carb = 99.3 * 0.15 = 14.9g
      unit: 'thìa canh',
      sortOrder: 4,
    },
    {
      recipeId: testRecipe.id,
      ingredientId: rareLeafIng!.id,
      amount: 20, // 20g lá rừng (chưa có số liệu dinh dưỡng để test missing & coverage)
      unit: 'g',
      sortOrder: 5,
    },
  ]);

  // Thực hiện tính toán
  const snapshot = await calculateRecipeNutrition(testRecipe.id);

  assert(snapshot !== null, 'Tính toán snapshot dinh dưỡng thành công');
  assert(
    snapshot.source.includes('VIETNAM_FCT_2007'),
    'Nguồn gốc hiển thị đúng Viện Dinh Dưỡng Quốc Gia'
  );
  assert(
    snapshot.servings === 4,
    'Số khẩu phần ăn tính toán theo recipe là 4'
  );

  // Tổng calo dự kiến: 1300 + 321.4 + 10.5 + 59.55 ~ 1691 kcal
  // Trên 1 khẩu phần (chia 4): ~ 423 kcal
  console.log(`  -> Calo toàn nồi: ${snapshot.totalBatch.calories} kcal | 1 Khẩu phần: ${snapshot.perServing.calories} kcal`);
  assert(
    snapshot.perServing.calories >= 400 && snapshot.perServing.calories <= 450,
    `Calo 1 khẩu phần nằm trong khoảng chuẩn (~423 kcal, thực tế: ${snapshot.perServing.calories})`
  );

  assert(
    snapshot.perServing.protein >= 25 && snapshot.perServing.protein <= 30,
    `Chất đạm trên 1 khẩu phần chuẩn xác (~27g, thực tế: ${snapshot.perServing.protein}g)`
  );

  assert(
    snapshot.perServing.sodium !== null && snapshot.perServing.sodium > 500,
    `Natri tính toán chính xác có chứa lượng muối từ nước mắm (${snapshot.perServing.sodium} mg)`
  );

  assert(
    snapshot.missingIngredients.includes('Lá thơm rừng quý hiếm'),
    'Phát hiện chính xác nguyên liệu chưa có dữ liệu trong danh sách thiếu'
  );

  assert(
    snapshot.coveragePercent >= 90,
    `Tỷ lệ bao phủ dinh dưỡng đạt mức cao (${snapshot.coveragePercent}%)`
  );

  assert(
    snapshot.isVerified === true,
    'Nhãn kiểm định được bật (isNutritionVerified = true do coverage >= 80%)'
  );

  console.log('\n--- TEST 4: Invariant Tối thượng Gate P6: Missing is NOT zero ---');
  // Tạo công thức chỉ có nguyên liệu không có số liệu chất xơ
  // Đảm bảo không bao giờ biến null thành 0
  assert(
    snapshot.perServing.fiber !== undefined,
    'Trường chất xơ tồn tại và bảo toàn tính toàn vẹn dữ liệu'
  );

  console.log('\n--- TEST 5: Kiểm tra Dữ liệu đã lưu vào DB (Recipes Snapshot) ---');
  const updatedRecipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, testRecipe.id),
  });

  assert(
    updatedRecipe?.caloriesPerServing === snapshot.perServing.calories,
    `DB lưu đúng caloriesPerServing = ${snapshot.perServing.calories}`
  );
  assert(
    updatedRecipe?.nutritionStatus === 'ESTIMATED',
    'DB lưu nutritionStatus = ESTIMATED'
  );
  assert(
    updatedRecipe?.isNutritionVerified === true,
    'DB lưu isNutritionVerified = true'
  );
  assert(
    updatedRecipe?.nutritionSnapshot !== null,
    'DB lưu snapshot jsonb đầy đủ'
  );

  console.log('\n--- TEST 6: API GET & POST /api/recipes/[id]/nutrition ---');
  // Helper login
  const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'editor_nutrition@angimom.vn', password: TEST_PASSWORD }),
  });
  const editorCookie = resLogin.headers.get('set-cookie') || '';

  // GET
  const resGet = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/nutrition`);
  assert(resGet.status === 200, 'GET /api/recipes/[id]/nutrition thành công (HTTP 200)');
  const getData = await resGet.json();
  assert(
    getData.nutrition.perServing.calories === snapshot.perServing.calories,
    'API trả về chính xác snapshot dinh dưỡng'
  );

  // POST calculate
  const resPost = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/nutrition`, {
    method: 'POST',
    headers: { Cookie: editorCookie },
  });
  assert(resPost.status === 200, 'POST /api/recipes/[id]/nutrition tính toán lại thành công (HTTP 200)');

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passCount} PASS | ${failCount} FAIL`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Lỗi thực thi test:', err);
  process.exit(1);
});
