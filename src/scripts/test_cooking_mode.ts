// AG-19: Kịch bản kiểm thử tự động toàn diện cho Chế độ Nấu từng bước (Cooking Mode).
// Kiểm tra Invariants §5.1, §6.7, §5.4.
// Chạy độc lập: npx tsx src/scripts/test_cooking_mode.ts
import { db } from '../lib/db';
import { recipes, users, dishes, cookingSteps, recipeIngredients, ingredients } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { queryPublishedRecipeBySlug } from '../lib/recipes/publicQueries';
import { scaleRecipeIngredients, clampServings } from '../lib/recipes/scaling';

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
  console.log('  AG-19 — Test Suite: Cooking Mode & Step Navigation');
  console.log('======================================================\n');

  // Lấy hoặc tạo user test
  let author = await db.query.users.findFirst({
    where: eq(users.email, 'test_cooking_author@angimom.vn'),
  });
  if (!author) {
    const [created] = await db
      .insert(users)
      .values({
        email: 'test_cooking_author@angimom.vn',
        passwordHash: 'dummy_hash',
        displayName: 'Cooking Test Author',
        role: 'EDITOR',
      })
      .returning();
    author = created;
  }

  // Lấy hoặc tạo dish test
  let testDish = await db.query.dishes.findFirst({
    where: eq(dishes.name, 'Món Test Chế Độ Nấu AG-19'),
  });
  if (!testDish) {
    const [d] = await db
      .insert(dishes)
      .values({
        name: 'Món Test Chế Độ Nấu AG-19',
        slug: 'mon-test-che-do-nau-ag19',
        description: 'Món ăn phục vụ kiểm thử chế độ nấu',
      })
      .returning();
    testDish = d;
  }

  // Lấy hoặc tạo nguyên liệu test
  let ingr1 = await db.query.ingredients.findFirst({
    where: eq(ingredients.slug, 'thit-ba-chi-test-ag19'),
  });
  if (!ingr1) {
    const [i] = await db
      .insert(ingredients)
      .values({
        name: 'Thịt ba chỉ kiểm thử',
        slug: 'thit-ba-chi-test-ag19',
        standardUnit: 'g',
        category: 'Thực phẩm tươi sống',
      })
      .returning();
    ingr1 = i;
  }

  const testSlugPublished = 'test-ag19-cooking-published';
  const testSlugDraft = 'test-ag19-cooking-draft';

  // Dọn dẹp fixtures cũ nếu có
  await db.delete(recipes).where(inArray(recipes.slug, [testSlugPublished, testSlugDraft]));

  console.log('1. Thiết lập fixtures công thức kèm các bước nấu có hẹn giờ...');
  const [pubRecipe] = await db
    .insert(recipes)
    .values({
      slug: testSlugPublished,
      name: 'Thịt kho trứng cút ngũ vị',
      shortDescription: 'Món ăn đậm đà đưa cơm',
      dishId: testDish.id,
      authorId: author.id,
      role: 'MAIN',
      status: 'PUBLISHED',
      baseServings: 4,
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      difficulty: 'Dễ',
    })
    .returning();

  // Tạo các bước nấu theo giai đoạn
  await db.insert(cookingSteps).values([
    {
      recipeId: pubRecipe.id,
      stepNumber: 1,
      phaseName: 'Sơ chế nguyên liệu',
      instruction: 'Thịt ba chỉ rửa sạch, thái miếng vuông vừa ăn khoảng 3cm.',
      tipText: 'Chần sơ qua nước sôi với một chút muối để thịt thơm và trong nước kho.',
      timerSeconds: 180, // 3 phút chần thịt
    },
    {
      recipeId: pubRecipe.id,
      stepNumber: 2,
      phaseName: 'Ướp gia vị',
      instruction: 'Ướp thịt với 2 muỗng nước mắm, hành tỏi băm nhuyễn và tiêu.',
      tipText: 'Để thịt ngấm ít nhất 15-20 phút trước khi nấu.',
      timerSeconds: 900, // 15 phút ướp
    },
    {
      recipeId: pubRecipe.id,
      stepNumber: 3,
      phaseName: 'Kho thịt',
      instruction: 'Thắng nước màu cánh gián, cho thịt vào đảo săn rồi đổ nước dừa ngập mặt thịt.',
      tipText: 'Kho lửa nhỏ liu riu để thịt mềm mà không bị nát.',
      timerSeconds: 1800, // 30 phút kho
    },
  ]);

  // Thêm nguyên liệu
  await db.insert(recipeIngredients).values([
    {
      recipeId: pubRecipe.id,
      ingredientId: ingr1.id,
      amount: 400,
      unit: 'g',
      scalePolicy: 'LINEAR',
      sortOrder: 1,
    },
  ]);

  // Tạo công thức DRAFT
  await db.insert(recipes).values({
    slug: testSlugDraft,
    name: 'Món nháp không công khai',
    shortDescription: 'Bản nháp',
    dishId: testDish.id,
    authorId: author.id,
    role: 'MAIN',
    status: 'DRAFT',
  });

  console.log('\n2. Kiểm tra Invariants §5.1: Chỉ công thức PUBLISHED mở được chế độ nấu');
  {
    const pubData = await queryPublishedRecipeBySlug(testSlugPublished);
    assert(pubData !== null, 'Công thức PUBLISHED truy vấn thành công dữ liệu');
    assert(pubData?.steps.length === 3, 'Trả về đầy đủ 3 bước nấu');

    const draftData = await queryPublishedRecipeBySlug(testSlugDraft);
    assert(draftData === null, 'Công thức DRAFT bị từ chối truy cập (null / 404)');
  }

  console.log('\n3. Kiểm tra Invariants §6.7: Thứ tự bước và dữ liệu hẹn giờ an toàn');
  {
    const pubData = (await queryPublishedRecipeBySlug(testSlugPublished))!;
    const steps = pubData.steps;

    assert(steps[0].stepNumber === 1, 'Bước 1 đúng thứ tự');
    assert(steps[1].stepNumber === 2, 'Bước 2 đúng thứ tự');
    assert(steps[2].stepNumber === 3, 'Bước 3 đúng thứ tự');

    assert(steps[0].timerSeconds === 180, 'Bước 1 có timer 180 giây (3 phút)');
    assert(steps[1].timerSeconds === 900, 'Bước 2 có timer 900 giây (15 phút)');
    assert(steps[2].timerSeconds === 1800, 'Bước 3 có timer 1800 giây (30 phút)');

    assert(typeof steps[0].tipText === 'string', 'Bước 1 có mẹo nấu');
    assert(steps[0].phaseName === 'Sơ chế nguyên liệu', 'Bước 1 có tên giai đoạn');
  }

  console.log('\n4. Kiểm tra tích hợp khẩu phần ăn (AG-18, §5.4) trong Chế độ nấu');
  {
    const pubData = (await queryPublishedRecipeBySlug(testSlugPublished))!;

    // Scale lên 6 người (từ base = 4, R = 1.5)
    const scaled6 = scaleRecipeIngredients(pubData.ingredients, pubData.baseServings, 6);
    assert(scaled6[0].scaledAmount === 600, 'Thịt ba chỉ 400g scale 6 người thành 600g');
    assert(scaled6[0].formattedAmount === '600', 'Định dạng 600g hiển thị đẹp');

    // Scale xuống 2 người (R = 0.5)
    const scaled2 = scaleRecipeIngredients(pubData.ingredients, pubData.baseServings, 2);
    assert(scaled2[0].scaledAmount === 200, 'Thịt ba chỉ scale 2 người thành 200g');
  }

  console.log('\n5. Kiểm tra logic điều hướng bước an toàn (Bounds checking)');
  {
    const totalSteps = 3;

    function getSafeStepIndex(stepQuery: unknown): number {
      const idx = typeof stepQuery === 'number' ? stepQuery : Number(stepQuery);
      if (!Number.isFinite(idx) || idx < 0) return 0;
      if (idx >= totalSteps) return totalSteps - 1;
      return idx;
    }

    assert(getSafeStepIndex(0) === 0, 'Index 0 hợp lệ');
    assert(getSafeStepIndex(2) === 2, 'Index 2 hợp lệ');
    assert(getSafeStepIndex(-1) === 0, 'Index âm clamp về 0');
    assert(getSafeStepIndex(10) === 2, 'Index quá lớn clamp về bước cuối');
    assert(getSafeStepIndex('abc') === 0, 'Index chuỗi lạ clamp về 0');
  }

  console.log('\n6. Dọn dẹp dữ liệu kiểm thử...');
  await db.delete(recipes).where(inArray(recipes.slug, [testSlugPublished, testSlugDraft]));
  console.log('  ✓ Đã dọn dẹp sạch sẽ toàn bộ fixtures test');

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passCount} PASS | ${failCount} FAIL`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Lỗi khi chạy kiểm thử:', err);
  process.exit(1);
});
