// AG-22: Kịch bản kiểm thử tự động toàn diện cho Bộ máy Gộp nguyên liệu đi chợ (Ingredient Aggregation Engine).
// Kiểm tra Invariants §5.4 (Gộp cùng đơn vị, ScalePolicy, Traceability, Tách riêng MANUAL_ADJUST),
// Invariants §5.1 (Chỉ lấy công thức PUBLISHED), Phân loại quầy chợ, và Format tầng hiển thị (D21).
// Chạy độc lập: npx tsx src/scripts/test_ingredient_aggregation.ts
import { db } from '../lib/db';
import { recipes, users, dishes, recipeIngredients, ingredients } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { aggregateMealIngredients } from '../lib/recipes/aggregation';
import { queryMealRecipesForAggregation } from '../lib/meal/mealQueries';

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
  console.log('  AG-22 — Test Suite: Ingredient Aggregation Engine');
  console.log('======================================================\n');

  console.log('--- Test Case Group 1: Unit Engine Logic (Thuần túy, Invariants §5.4) ---');

  // Món 1: Thịt kho tiêu (4 người)
  const dish1 = {
    slug: 'thit-kho-tieu',
    name: 'Thịt Kho Tiêu',
    baseServings: 4,
    ingredients: [
      {
        id: 1,
        name: 'Thịt ba chỉ',
        category: 'MEAT_SEAFOOD',
        amount: 400,
        unit: 'g',
        scalePolicy: 'LINEAR' as const,
        preparation: 'thái con chì',
        isOptional: false,
      },
      {
        id: 2,
        name: 'Hành tím',
        category: 'PRODUCE',
        amount: 3,
        unit: 'củ',
        scalePolicy: 'LINEAR' as const,
        preparation: 'băm nhỏ',
        isOptional: false,
      },
      {
        id: 3,
        name: 'Gừng',
        category: 'PRODUCE',
        amount: 1,
        unit: 'củ',
        scalePolicy: 'FIXED' as const,
        preparation: 'đập dập',
        isOptional: false,
      },
      {
        id: 4,
        name: 'Nước mắm',
        category: 'PANTRY',
        amount: 3,
        unit: 'muỗng canh',
        scalePolicy: 'MANUAL_ADJUST' as const,
        preparation: null,
        isOptional: false,
      },
    ],
  };

  // Món 2: Canh bí đao thịt băm (4 người)
  const dish2 = {
    slug: 'canh-bi-dao',
    name: 'Canh Bí Đao',
    baseServings: 4,
    ingredients: [
      {
        id: 5,
        name: 'Thịt ba chỉ', // Trùng nguyên liệu và cùng đơn vị 'g'
        category: 'MEAT_SEAFOOD',
        amount: 150,
        unit: 'g',
        scalePolicy: 'LINEAR' as const,
        preparation: 'băm nhuyễn',
        isOptional: false,
      },
      {
        id: 6,
        name: 'Hành tím', // Trùng nguyên liệu và cùng đơn vị 'củ'
        category: 'PRODUCE',
        amount: 2,
        unit: 'củ',
        scalePolicy: 'LINEAR' as const,
        preparation: 'thái lát',
        isOptional: false,
      },
      {
        id: 7,
        name: 'Bí đao',
        category: 'PRODUCE',
        amount: 500,
        unit: 'g',
        scalePolicy: 'LINEAR' as const,
        preparation: 'gọt vỏ, thái miếng',
        isOptional: false,
      },
      {
        id: 8,
        name: 'Nước mắm', // MANUAL_ADJUST
        category: 'PANTRY',
        amount: 1,
        unit: 'muỗng canh',
        scalePolicy: 'MANUAL_ADJUST' as const,
        preparation: null,
        isOptional: false,
      },
    ],
  };

  // Test 1.1: Gộp khẩu phần gốc (target = 4, R = 1.0)
  const res1 = aggregateMealIngredients([dish1, dish2], 4);
  assert(res1.dishesCount === 2, 'Ghi nhận đúng 2 món ăn');
  assert(res1.targetServings === 4, 'Khẩu phần đúng 4 người');

  // Kiểm tra thịt ba chỉ gộp
  const thitBaChi = res1.freshItems.find((i) => i.name === 'Thịt ba chỉ');
  assert(thitBaChi !== undefined, 'Tìm thấy nguyên liệu Thịt ba chỉ');
  if (thitBaChi) {
    assert(thitBaChi.totalAmount === 550, `Cộng dồn chính xác 400g + 150g = 550g: ${thitBaChi.totalAmount}`);
    assert(thitBaChi.formattedTotal === '550', 'Format số nguyên 550 sạch sẽ');
    assert(thitBaChi.traces.length === 2, 'Truy vết đủ 2 nguồn gốc món ăn');
    assert(thitBaChi.traces[0].recipeName === 'Thịt Kho Tiêu' && thitBaChi.traces[0].scaledAmount === 400, 'Trace 1 đúng món kho 400g');
    assert(thitBaChi.traces[1].recipeName === 'Canh Bí Đao' && thitBaChi.traces[1].scaledAmount === 150, 'Trace 2 đúng món canh 150g');
  }

  // Kiểm tra hành tím gộp
  const hanhTim = res1.freshItems.find((i) => i.name === 'Hành tím');
  assert(hanhTim !== undefined, 'Tìm thấy nguyên liệu Hành tím');
  if (hanhTim) {
    assert(hanhTim.totalAmount === 5, `Cộng dồn chính xác 3 củ + 2 củ = 5 củ: ${hanhTim.totalAmount}`);
    assert(hanhTim.traces.length === 2, 'Hành tím có đủ 2 traces');
  }

  // Kiểm tra gừng (FIXED)
  const gung = res1.freshItems.find((i) => i.name === 'Gừng');
  assert(gung !== undefined && gung.totalAmount === 1, 'Gừng giữ nguyên 1 củ (FIXED)');

  // Kiểm tra nước mắm (MANUAL_ADJUST) - Không được có trong freshItems
  const nuocMamInFresh = res1.freshItems.find((i) => i.name === 'Nước mắm');
  assert(nuocMamInFresh === undefined, 'Invariants §5.4: Nước mắm MANUAL_ADJUST không bị gộp thô vào freshItems');

  // Kiểm tra nước mắm trong seasoningItems
  const nuocMamInSeasonings = res1.seasoningItems.find((i) => i.name === 'Nước mắm');
  assert(nuocMamInSeasonings !== undefined, 'Nước mắm nằm riêng trong danh mục gia vị nêm nếm');
  if (nuocMamInSeasonings) {
    assert(nuocMamInSeasonings.traces.length === 2, 'Gia vị nước mắm có đủ 2 traces hướng dẫn nêm');
    assert(nuocMamInSeasonings.traces[0].amount === 3, 'Món kho 3 muỗng canh');
    assert(nuocMamInSeasonings.traces[1].amount === 1, 'Món canh 1 muỗng canh');
  }

  console.log('\n--- Test Case Group 2: Co giãn Khẩu Phần Toàn Mâm (Scaling with R) ---');

  // Test 2.1: Scale Up gấp đôi (target = 8, R = 2.0)
  const resScaleUp = aggregateMealIngredients([dish1, dish2], 8);
  const thitScaleUp = resScaleUp.freshItems.find((i) => i.name === 'Thịt ba chỉ');
  assert(thitScaleUp?.totalAmount === 1100, `Thịt ba chỉ scale gấp đôi (550 * 2 = 1100g): ${thitScaleUp?.totalAmount}`);
  assert(thitScaleUp?.isScaled === true, 'Đánh dấu isScaled = true');

  const gungScaleUp = resScaleUp.freshItems.find((i) => i.name === 'Gừng');
  assert(gungScaleUp?.totalAmount === 1, 'Invariants §5.4: Gừng FIXED vẫn là 1 củ khi scale 8 người');
  assert(gungScaleUp?.isScaled === false, 'Gừng FIXED không bị đánh dấu isScaled');

  // Test 2.2: Scale Down giảm nửa (target = 2, R = 0.5)
  const resScaleDown = aggregateMealIngredients([dish1, dish2], 2);
  const thitScaleDown = resScaleDown.freshItems.find((i) => i.name === 'Thịt ba chỉ');
  assert(thitScaleDown?.totalAmount === 275, `Thịt ba chỉ scale giảm nửa (550 * 0.5 = 275g): ${thitScaleDown?.totalAmount}`);

  // Test 2.3: Scale lẻ 6 người (target = 6, R = 1.5)
  const resScale6 = aggregateMealIngredients([dish1, dish2], 6);
  const thitScale6 = resScale6.freshItems.find((i) => i.name === 'Thịt ba chỉ');
  assert(thitScale6?.totalAmount === 825, `Thịt ba chỉ scale 1.5 lần (550 * 1.5 = 825g): ${thitScale6?.totalAmount}`);
  const hanhScale6 = resScale6.freshItems.find((i) => i.name === 'Hành tím');
  assert(hanhScale6?.totalAmount === 7.5, `Hành tím scale 1.5 lần (5 * 1.5 = 7.5 củ): ${hanhScale6?.totalAmount}`);
  assert(hanhScale6?.formattedTotal === '7,5', `Format số thập phân dùng dấu phẩy: ${hanhScale6?.formattedTotal}`);

  console.log('\n--- Test Case Group 3: Cùng tên khác đơn vị đo (Unit Boundary Separation) ---');

  const dish3 = {
    slug: 'mon-test-don-vi',
    name: 'Món Test Đơn Vị',
    baseServings: 4,
    ingredients: [
      {
        id: 9,
        name: 'Ớt hiểm',
        category: 'PRODUCE',
        amount: 2,
        unit: 'trái',
        scalePolicy: 'LINEAR' as const,
        preparation: null,
        isOptional: false,
      },
      {
        id: 10,
        name: 'Ớt hiểm', // Cùng tên nhưng đơn vị là 'muỗng cà phê'
        category: 'PRODUCE',
        amount: 1,
        unit: 'muỗng cà phê',
        scalePolicy: 'LINEAR' as const,
        preparation: 'bột ớt',
        isOptional: false,
      },
    ],
  };

  const resUnit = aggregateMealIngredients([dish3], 4);
  const otTrai = resUnit.freshItems.find((i) => i.name === 'Ớt hiểm' && i.unit === 'trái');
  const otMuong = resUnit.freshItems.find((i) => i.name === 'Ớt hiểm' && i.unit === 'muỗng cà phê');

  assert(otTrai !== undefined && otTrai.totalAmount === 2, 'Tách riêng Ớt hiểm 2 trái');
  assert(otMuong !== undefined && otMuong.totalAmount === 1, 'Tách riêng Ớt hiểm 1 muỗng cà phê');
  assert(resUnit.freshItems.length === 2, 'Không cộng dồn nhầm 2 đơn vị khác nhau (Invariants §5.4)');

  console.log('\n--- Test Case Group 4: Phân loại theo quầy chợ (Market Categories) ---');

  assert(res1.categories.meatSeafood.length === 1, 'Quầy thịt/thủy hải sản có 1 món (Thịt ba chỉ)');
  assert(res1.categories.produce.length === 3, 'Quầy rau củ có 3 món (Hành tím, Gừng, Bí đao)');

  console.log('\n--- Test Case Group 5: Tích Hợp Database Query (queryMealRecipesForAggregation) ---');

  // 1. Tạo test user & dish
  let testUser = await db.query.users.findFirst({
    where: eq(users.email, 'test_agg_user@angimom.vn'),
  });
  if (!testUser) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'test_agg_user@angimom.vn',
        passwordHash: 'dummy',
        displayName: 'Test Agg User',
        role: 'EDITOR',
      })
      .returning();
    testUser = u;
  }

  let testDish = await db.query.dishes.findFirst({
    where: eq(dishes.name, 'Món Test Gộp DB AG-22'),
  });
  if (!testDish) {
    const [d] = await db
      .insert(dishes)
      .values({
        name: 'Món Test Gộp DB AG-22',
        slug: 'mon-test-gop-db-ag22',
        description: 'Phục vụ kiểm thử gộp nguyên liệu DB',
      })
      .returning();
    testDish = d;
  }

  // Tạo ingredients trong catalog nếu chưa có
  let ing1 = await db.query.ingredients.findFirst({ where: eq(ingredients.name, 'Thịt đùi heo AG-22') });
  if (!ing1) {
    const [created] = await db
      .insert(ingredients)
      .values({
        name: 'Thịt đùi heo AG-22',
        slug: 'thit-dui-heo-ag22',
        category: 'MEAT_SEAFOOD',
        standardUnit: 'g',
      })
      .returning();
    ing1 = created;
  }

  // Dọn dẹp recipes test cũ
  await db.delete(recipes).where(
    inArray(recipes.slug, ['test-agg-pub-1', 'test-agg-pub-2', 'test-agg-draft-3'])
  );

  // Tạo 2 recipe PUBLISHED và 1 DRAFT
  const [rec1] = await db
    .insert(recipes)
    .values({
      dishId: testDish.id,
      authorId: testUser.id,
      name: 'Món Gộp Test 1',
      slug: 'test-agg-pub-1',
      shortDescription: 'Mô tả 1',
      role: 'MAIN',
      difficulty: 'Dễ',
      baseServings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      status: 'PUBLISHED',
    })
    .returning();

  const [rec2] = await db
    .insert(recipes)
    .values({
      dishId: testDish.id,
      authorId: testUser.id,
      name: 'Món Gộp Test 2',
      slug: 'test-agg-pub-2',
      shortDescription: 'Mô tả 2',
      role: 'SOUP',
      difficulty: 'Dễ',
      baseServings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      status: 'PUBLISHED',
    })
    .returning();

  const [recDraft] = await db
    .insert(recipes)
    .values({
      dishId: testDish.id,
      authorId: testUser.id,
      name: 'Món Nháp Không Được Lấy',
      slug: 'test-agg-draft-3',
      shortDescription: 'Nháp',
      role: 'SIDE',
      difficulty: 'Dễ',
      baseServings: 4,
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      status: 'DRAFT',
    })
    .returning();

  // Thêm recipe ingredients
  await db.insert(recipeIngredients).values([
    {
      recipeId: rec1.id,
      ingredientId: ing1.id,
      amount: 300,
      unit: 'g',
      scalePolicy: 'LINEAR',
      sortOrder: 1,
    },
    {
      recipeId: rec2.id,
      ingredientId: ing1.id,
      amount: 200,
      unit: 'g',
      scalePolicy: 'LINEAR',
      sortOrder: 1,
    },
    {
      recipeId: recDraft.id,
      ingredientId: ing1.id,
      amount: 1000,
      unit: 'g',
      scalePolicy: 'LINEAR',
      sortOrder: 1,
    },
  ]);

  // Query DB thông qua helper
  const dbRecipes = await queryMealRecipesForAggregation([
    'test-agg-pub-1',
    'test-agg-pub-2',
    'test-agg-draft-3', // Nháp
    'slug-la-khong-ton-tai',
  ]);

  assert(dbRecipes.length === 2, 'Chỉ lấy 2 recipes PUBLISHED, loại bỏ bản nháp và slug lạ');
  assert(dbRecipes.some((r) => r.slug === 'test-agg-pub-1'), 'Có recipe 1');
  assert(dbRecipes.some((r) => r.slug === 'test-agg-pub-2'), 'Có recipe 2');
  assert(!dbRecipes.some((r) => r.slug === 'test-agg-draft-3'), 'Bản DRAFT bị loại bỏ 100% (Invariants §5.1)');

  // Chạy aggregation trên dữ liệu DB
  const dbAggResult = aggregateMealIngredients(dbRecipes, 4);
  const dbThit = dbAggResult.freshItems.find((i) => i.name === 'Thịt đùi heo AG-22');
  assert(dbThit !== undefined, 'Tìm thấy nguyên liệu DB đã gộp');
  if (dbThit) {
    assert(dbThit.totalAmount === 500, `Gộp chính xác 300g + 200g = 500g: ${dbThit.totalAmount}`);
    assert(dbThit.traces.length === 2, 'Có đủ 2 traces từ DB');
  }

  // Dọn dẹp fixtures DB
  await db.delete(recipes).where(
    inArray(recipes.slug, ['test-agg-pub-1', 'test-agg-pub-2', 'test-agg-draft-3'])
  );

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Lỗi ngoại lệ khi chạy test suite:', err);
  process.exit(1);
});
