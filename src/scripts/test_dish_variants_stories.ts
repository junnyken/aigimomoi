// AG-33: Kịch bản kiểm thử tự động toàn diện cho Biến thể món ăn vùng miền và Câu chuyện bếp nhà
// Kiểm tra Invariants Gate P5:
// 1. Lưu trữ và truy vấn chính xác region, kitchenStory, sourceAttribution.
// 2. Liên kết biến thể variantOfId hai chiều giữa món gốc và các biến thể địa phương.
// 3. Invariants §5.1: Tuyệt đối chỉ trả biến thể PUBLISHED trong danh sách variants; chặn 100% bản DRAFT.
// 4. API đóng góp cộng đồng /api/contribute/recipes lưu đầy đủ thuộc tính văn hóa món ăn.
// Chạy độc lập: npx tsx src/scripts/test_dish_variants_stories.ts

import { db } from '../lib/db';
import { recipes, users, dishes, ingredients } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { hashPassword } from '../lib/auth/password';
import { queryPublishedRecipeBySlug } from '../lib/recipes/publicQueries';

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
  console.log('  AG-33 — Test Suite: Dish Variants & Kitchen Stories');
  console.log('======================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const TEST_PASSWORD = 'TestPassword@123';
  const hashedPw = await hashPassword(TEST_PASSWORD);

  // 1. Chuẩn bị User Contributor
  let cook = await db.query.users.findFirst({
    where: eq(users.email, 'cook_ag33@angimom.vn'),
  });
  if (!cook) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'cook_ag33@angimom.vn',
        passwordHash: hashedPw,
        displayName: 'Mẹ Bếp Ba Miền',
        role: 'COOK',
      })
      .returning();
    cook = u;
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, cook.id));
  }

  // Đăng nhập lấy cookie
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cook.email, password: TEST_PASSWORD }),
  });
  const cookCookie = loginRes.headers.get('set-cookie')?.split(';')[0] || '';

  // Lấy 1 nguyên liệu có sẵn
  const existingIng = await db.query.ingredients.findFirst();
  const testIngId = existingIng ? existingIng.id : 1;

  // 2. Tạo món ăn cha (Dish)
  let dish = await db.query.dishes.findFirst({
    where: eq(dishes.slug, 'thit-kho-ba-mien-ag33'),
  });
  if (!dish) {
    const [d] = await db
      .insert(dishes)
      .values({
        name: 'Thịt Kho Ba Miền',
        slug: 'thit-kho-ba-mien-ag33',
        defaultRole: 'MAIN',
      })
      .returning();
    dish = d;
  }

  const timestamp = Date.now();
  const rootSlug = `thit-kho-nam-bo-${timestamp}`;
  const northSlug = `thit-kho-bac-bo-${timestamp}`;
  const centralDraftSlug = `thit-kho-mien-trung-nhap-${timestamp}`;

  // 3. Tạo món gốc PUBLISHED: Thịt kho Nam Bộ
  const [rootRecipe] = await db
    .insert(recipes)
    .values({
      dishId: dish.id,
      slug: rootSlug,
      name: 'Thịt Kho Hột Vịt Nước Dừa Nam Bộ',
      shortDescription: 'Thịt kho rục mềm béo ngậy với nước dừa xiêm Bến Tre ngày Tết.',
      role: 'MAIN',
      status: 'PUBLISHED',
      region: 'SOUTH',
      kitchenStory: 'Mỗi năm cứ đến 28 Tết là ngoại lại ra vườn hái dừa xiêm ngọt lịm vào kho nồi thịt lớn cho cả nhà sum vầy.',
      sourceAttribution: 'Công thức gia truyền bà ngoại ở Chợ Gạo, Tiền Giang',
      authorId: cook.id,
      provenance: 'COMMUNITY_SUBMITTED',
      isEditorialReviewed: true,
      isCookTested: true,
      baseServings: 4,
    })
    .returning();

  // 4. Tạo biến thể Miền Bắc PUBLISHED (variantOfId = rootRecipe.id)
  const [northRecipe] = await db
    .insert(recipes)
    .values({
      dishId: dish.id,
      slug: northSlug,
      name: 'Thịt Kho Tiêu Kiểu Bắc Bộ',
      shortDescription: 'Thịt kho đậm đà thơm cay nồng hạt tiêu đen, ăn cùng cơm nóng mùa đông.',
      role: 'MAIN',
      status: 'PUBLISHED',
      region: 'NORTH',
      kitchenStory: 'Bữa cơm chiều đông Hà Nội gió rét, đĩa thịt kho tiêu thơm lừng mẹ nấu xua tan mọi mỏi mệt.',
      sourceAttribution: 'Mẹ Lan phố cổ Hà Nội',
      variantOfId: rootRecipe.id,
      authorId: cook.id,
      provenance: 'COMMUNITY_SUBMITTED',
      isEditorialReviewed: true,
      isCookTested: true,
      baseServings: 4,
    })
    .returning();

  // 5. Tạo biến thể Miền Trung DRAFT (variantOfId = rootRecipe.id)
  const [centralDraftRecipe] = await db
    .insert(recipes)
    .values({
      dishId: dish.id,
      slug: centralDraftSlug,
      name: 'Thịt Kho Cay Miền Trung (Bản Nháp)',
      shortDescription: 'Bản thảo chưa được duyệt.',
      role: 'MAIN',
      status: 'DRAFT', // INVARIANTS §5.1: Không được xuất hiện trong catalog công khai
      region: 'CENTRAL',
      variantOfId: rootRecipe.id,
      authorId: cook.id,
      provenance: 'COMMUNITY_SUBMITTED',
      baseServings: 4,
    })
    .returning();

  // ----------------------------------------------------
  // TEST 1: Truy vấn món gốc qua queryPublishedRecipeBySlug
  // ----------------------------------------------------
  console.log('Test 1: Truy vấn món gốc và xác minh các trường văn hóa ẩm thực');
  const queriedRoot = await queryPublishedRecipeBySlug(rootSlug);
  assert(queriedRoot !== null, 'Tìm thấy món gốc PUBLISHED');
  assert(queriedRoot?.region === 'SOUTH', 'Trường region là SOUTH');
  assert(
    Boolean(queriedRoot?.kitchenStory?.includes('28 Tết')),
    'kitchenStory hiển thị trọn vẹn ký ức gia đình'
  );
  assert(
    Boolean(queriedRoot?.sourceAttribution?.includes('bà ngoại')),
    'sourceAttribution ghi nhận đúng nguồn gốc gia đình'
  );

  // ----------------------------------------------------
  // TEST 2: Invariants §5.1 - Danh sách biến thể chỉ chứa bản PUBLISHED
  // ----------------------------------------------------
  console.log('\nTest 2: Invariants §5.1 - Danh sách biến thể liên kết lọc sạch bản DRAFT');
  assert(
    queriedRoot?.variants.length === 1,
    `Số lượng biến thể hợp lệ: ${queriedRoot?.variants.length} (Kỳ vọng: 1 món Bắc)`
  );
  assert(
    queriedRoot?.variants[0]?.slug === northSlug,
    'Biến thể hiển thị là Thịt kho kiểu Bắc Bộ'
  );
  assert(
    queriedRoot?.variants[0]?.region === 'NORTH',
    'Vùng miền của biến thể là NORTH'
  );
  assert(
    !queriedRoot?.variants.some((v) => v.slug === centralDraftSlug),
    'Biến thể DRAFT miền Trung TUYỆT ĐỐI KHÔNG xuất hiện (Invariants §5.1)'
  );

  // ----------------------------------------------------
  // TEST 3: Truy vấn biến thể liên kết ngược về món gốc
  // ----------------------------------------------------
  console.log('\nTest 3: Truy vấn biến thể miền Bắc và xác minh liên kết ngược');
  const queriedNorth = await queryPublishedRecipeBySlug(northSlug);
  assert(queriedNorth !== null, 'Tìm thấy món biến thể miền Bắc');
  assert(queriedNorth?.region === 'NORTH', 'Vùng miền của món này là NORTH');
  assert(
    Boolean(queriedNorth?.variants.some((v) => v.slug === rootSlug)),
    'Biến thể miền Bắc liên kết ngược thành công tới món gốc Nam Bộ'
  );

  // ----------------------------------------------------
  // TEST 4: Đóng góp công thức có câu chuyện bếp nhà qua API
  // ----------------------------------------------------
  console.log('\nTest 4: Contributor đóng góp công thức có kèm câu chuyện bếp nhà qua API');
  const contributeRes = await fetch(`${BASE_URL}/api/contribute/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookCookie,
    },
    body: JSON.stringify({
      name: `Canh Cua Rau Đay Mùng Tơi ${timestamp}`,
      shortDescription: 'Bát canh ngọt mát ngày hè xua tan oi ả của mẹ.',
      role: 'SOUP',
      region: 'NORTH',
      kitchenStory: 'Tuổi thơ tôi gắn liền với tiếng giã cua lách cách trưa hè của mẹ...',
      sourceAttribution: 'Bếp mẹ Hải Dương',
      ingredients: [{ ingredientId: testIngId, amount: 300, unit: 'g' }],
      steps: [{ phaseName: 'Sơ chế', instruction: 'Giã cua lọc lấy nước trong.' }],
      submitNow: false,
    }),
  });
  const contributeData = await contributeRes.json();
  assert(contributeRes.status === 200 && contributeData.success === true, 'Đóng góp công thức qua API thành công');

  const createdId = contributeData.recipe?.id;
  if (createdId) {
    const dbRec = await db.query.recipes.findFirst({
      where: eq(recipes.id, createdId),
    });
    assert(dbRec?.region === 'NORTH', 'Cột region lưu đúng NORTH');
    assert(
      Boolean(dbRec?.kitchenStory?.includes('tiếng giã cua')),
      'Cột kitchenStory lưu trọn vẹn câu chuyện bếp nhà'
    );
    assert(dbRec?.sourceAttribution === 'Bếp mẹ Hải Dương', 'Cột sourceAttribution lưu đúng nguồn gốc');

    // Dọn dẹp
    await db.delete(recipes).where(eq(recipes.id, createdId));
  }

  // Dọn dẹp dữ liệu test
  await db.delete(recipes).where(inArray(recipes.id, [rootRecipe.id, northRecipe.id, centralDraftRecipe.id]));

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ AG-33: PASS ${passCount} / ${passCount + failCount}`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Lỗi thực thi test suite AG-33:', err);
  process.exit(1);
});
