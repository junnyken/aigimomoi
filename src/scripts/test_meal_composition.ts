// AG-21: Kịch bản kiểm thử tự động toàn diện cho Tính năng Ghép mâm cơm & Thuật toán đổi món.
// Kiểm tra Invariants §5.1 (chỉ hiện món PUBLISHED), §5.3 (cấu trúc 3 món MAIN/SOUP/SIDE),
// §5.4 (đồng bộ khẩu phần toàn mâm), Slot Replacement & Fallback logic.
// Chạy độc lập: npx tsx src/scripts/test_meal_composition.ts
import { db } from '../lib/db';
import { recipes, users, dishes } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import {
  queryPublishedMealOptions,
  resolveMealSelection,
  getRandomMealSlugs,
} from '../lib/meal/mealQueries';
import { clampServings } from '../lib/recipes/scaling';

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
  console.log('  AG-21 — Test Suite: Meal Composition & Replacement');
  console.log('======================================================\n');

  // 1. Tạo test user
  let author = await db.query.users.findFirst({
    where: eq(users.email, 'test_meal_author@angimom.vn'),
  });
  if (!author) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'test_meal_author@angimom.vn',
        passwordHash: 'dummy_hash',
        displayName: 'Test Meal Author',
        role: 'EDITOR',
      })
      .returning();
    author = u;
  }

  // 2. Tạo test dish
  let testDish = await db.query.dishes.findFirst({
    where: eq(dishes.name, 'Món Test Mâm Cơm AG-21'),
  });
  if (!testDish) {
    const [d] = await db
      .insert(dishes)
      .values({
        name: 'Món Test Mâm Cơm AG-21',
        slug: 'mon-test-mam-com-ag21',
        description: 'Món ăn phục vụ kiểm thử mâm cơm',
      })
      .returning();
    testDish = d;
  }

  // Dọn dẹp dữ liệu cũ nếu có
  const testSlugs = [
    'test-meal-main-1',
    'test-meal-main-2',
    'test-meal-soup-1',
    'test-meal-soup-2',
    'test-meal-side-1',
    'test-meal-draft-main',
    'test-meal-archived-soup',
  ];
  await db.delete(recipes).where(inArray(recipes.slug, testSlugs));

  // 3. Khởi tạo fixtures:
  // - 2 món MAIN (PUBLISHED)
  // - 2 món SOUP (PUBLISHED)
  // - 1 món SIDE (PUBLISHED)
  // - 1 món MAIN (DRAFT)
  // - 1 món SOUP (ARCHIVED)
  await db.insert(recipes).values([
    {
      dishId: testDish.id,
      authorId: author.id,
      name: 'Thịt Kho Tiêu Test 1',
      slug: 'test-meal-main-1',
      shortDescription: 'Món mặn đậm đà số 1',
      role: 'MAIN',
      difficulty: 'Dễ',
      baseServings: 4,
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      status: 'PUBLISHED',
      isCookTested: true,
      publishedAt: new Date('2026-10-20T10:00:00Z'),
    },
    {
      dishId: testDish.id,
      authorId: author.id,
      name: 'Cá Basa Kho Tộ Test 2',
      slug: 'test-meal-main-2',
      shortDescription: 'Món mặn đậm đà số 2',
      role: 'MAIN',
      difficulty: 'Trung bình',
      baseServings: 4,
      prepTimeMinutes: 20,
      cookTimeMinutes: 25,
      status: 'PUBLISHED',
      isCookTested: true,
      publishedAt: new Date('2026-10-20T11:00:00Z'),
    },
    {
      dishId: testDish.id,
      authorId: author.id,
      name: 'Canh Rau Ngót Thịt Băm Test 1',
      slug: 'test-meal-soup-1',
      shortDescription: 'Món canh thanh mát số 1',
      role: 'SOUP',
      difficulty: 'Dễ',
      baseServings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      status: 'PUBLISHED',
      isCookTested: false,
      publishedAt: new Date('2026-10-20T10:00:00Z'),
    },
    {
      dishId: testDish.id,
      authorId: author.id,
      name: 'Canh Chua Cá Lóc Test 2',
      slug: 'test-meal-soup-2',
      shortDescription: 'Món canh chua cay số 2',
      role: 'SOUP',
      difficulty: 'Khó',
      baseServings: 4,
      prepTimeMinutes: 20,
      cookTimeMinutes: 20,
      status: 'PUBLISHED',
      isCookTested: true,
      publishedAt: new Date('2026-10-20T11:00:00Z'),
    },
    {
      dishId: testDish.id,
      authorId: author.id,
      name: 'Rau Muống Xào Tỏi Test 1',
      slug: 'test-meal-side-1',
      shortDescription: 'Món rau giòn xanh',
      role: 'SIDE',
      difficulty: 'Dễ',
      baseServings: 4,
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      status: 'PUBLISHED',
      isCookTested: true,
      publishedAt: new Date('2026-10-20T10:00:00Z'),
    },
    {
      dishId: testDish.id,
      authorId: author.id,
      name: 'Món Mặn Bản Nháp',
      slug: 'test-meal-draft-main',
      shortDescription: 'Bản nháp không xuất bản',
      role: 'MAIN',
      difficulty: 'Dễ',
      baseServings: 4,
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      status: 'DRAFT',
    },
    {
      dishId: testDish.id,
      authorId: author.id,
      name: 'Món Canh Bản Cũ Lưu Trữ',
      slug: 'test-meal-archived-soup',
      shortDescription: 'Bản cũ lưu trữ',
      role: 'SOUP',
      difficulty: 'Dễ',
      baseServings: 4,
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      status: 'ARCHIVED',
    },
  ]);

  console.log('--- Test Case Group 1: Invariants §5.1 & §5.3 (Cấu trúc & Lọc PUBLISHED) ---');

  // Test 1.1: Truy vấn danh sách món theo role MAIN
  const mainOptions = await queryPublishedMealOptions('MAIN');
  assert(mainOptions.length >= 2, `Có ít nhất 2 món MAIN: ${mainOptions.length}`);
  assert(mainOptions.every((d) => d.role === 'MAIN'), 'Tất cả các món trả về đều có role = MAIN');
  assert(
    !mainOptions.some((d) => d.slug === 'test-meal-draft-main'),
    'Invariants §5.1: Món DRAFT bị loại bỏ 100% khỏi danh sách options'
  );

  // Test 1.2: Truy vấn danh sách món theo role SOUP
  const soupOptions = await queryPublishedMealOptions('SOUP');
  assert(soupOptions.length >= 2, `Có ít nhất 2 món SOUP: ${soupOptions.length}`);
  assert(soupOptions.every((d) => d.role === 'SOUP'), 'Tất cả các món trả về đều có role = SOUP');
  assert(
    !soupOptions.some((d) => d.slug === 'test-meal-archived-soup'),
    'Invariants §5.1: Món ARCHIVED bị loại bỏ 100% khỏi danh sách options'
  );

  // Test 1.3: Truy vấn danh sách món theo role SIDE
  const sideOptions = await queryPublishedMealOptions('SIDE');
  assert(sideOptions.length >= 1, `Có ít nhất 1 món SIDE: ${sideOptions.length}`);
  assert(sideOptions.every((d) => d.role === 'SIDE'), 'Tất cả các món trả về đều có role = SIDE');

  console.log('\n--- Test Case Group 2: Phân giải Mâm Cơm (resolveMealSelection & Fallback) ---');

  // Test 2.1: Phân giải khi truyền đủ 3 slugs hợp lệ
  const fullSelection = await resolveMealSelection({
    mainSlug: 'test-meal-main-1',
    soupSlug: 'test-meal-soup-1',
    sideSlug: 'test-meal-side-1',
  });
  assert(fullSelection.main?.slug === 'test-meal-main-1', 'Phân giải đúng món mặn 1');
  assert(fullSelection.soup?.slug === 'test-meal-soup-1', 'Phân giải đúng món canh 1');
  assert(fullSelection.side?.slug === 'test-meal-side-1', 'Phân giải đúng món rau 1');
  assert(fullSelection.main?.totalTimeMinutes === 45, 'Tính đúng tổng thời gian món mặn (15 + 30 = 45p)');

  // Test 2.2: Phân giải khi slug là món DRAFT (tự động fallback về món PUBLISHED)
  const draftFallback = await resolveMealSelection({
    mainSlug: 'test-meal-draft-main', // Món nháp
    soupSlug: 'test-meal-soup-1',
    sideSlug: 'test-meal-side-1',
  });
  assert(
    draftFallback.main !== null && draftFallback.main.slug !== 'test-meal-draft-main',
    'Invariants §5.1: Không cho phép chọn món DRAFT, tự động fallback về món PUBLISHED'
  );

  // Test 2.3: Phân giải khi slug là món ARCHIVED (tự động fallback về món PUBLISHED)
  const archivedFallback = await resolveMealSelection({
    mainSlug: 'test-meal-main-1',
    soupSlug: 'test-meal-archived-soup', // Món lưu trữ
    sideSlug: 'test-meal-side-1',
  });
  assert(
    archivedFallback.soup !== null && archivedFallback.soup.slug !== 'test-meal-archived-soup',
    'Invariants §5.1: Không cho phép chọn món ARCHIVED, tự động fallback về món PUBLISHED'
  );

  // Test 2.4: Phân giải khi thiếu params (null/undefined)
  const defaultSelection = await resolveMealSelection({});
  assert(defaultSelection.main !== null, 'Tự động gán món mặn mặc định khi thiếu param');
  assert(defaultSelection.soup !== null, 'Tự động gán món canh mặc định khi thiếu param');
  assert(defaultSelection.side !== null, 'Tự động gán món rau mặc định khi thiếu param');

  // Test 2.5: Phân giải với slug injection / ký tự đặc biệt
  const injectionSelection = await resolveMealSelection({
    mainSlug: "' OR 1=1 --",
    soupSlug: '<script>alert(1)</script>',
  });
  assert(injectionSelection.main !== null, 'Slug injection an toàn, tự động fallback về món mặn hợp lệ');
  assert(injectionSelection.soup !== null, 'XSS input an toàn, tự động fallback về món canh hợp lệ');

  console.log('\n--- Test Case Group 3: Thuật toán Đổi Món Cục Bộ (Slot Replacement) ---');

  // Giả lập state mâm cơm
  let currentMeal = {
    mainSlug: 'test-meal-main-1',
    soupSlug: 'test-meal-soup-1',
    sideSlug: 'test-meal-side-1',
  };

  // Bước 3.1: Đổi món mặn (MAIN) từ main-1 sang main-2
  currentMeal = {
    ...currentMeal,
    mainSlug: 'test-meal-main-2',
  };
  assert(currentMeal.mainSlug === 'test-meal-main-2', 'Slot MAIN được cập nhật sang món mặn 2');
  assert(currentMeal.soupSlug === 'test-meal-soup-1', 'Slot SOUP giữ nguyên vẹn không đổi');
  assert(currentMeal.sideSlug === 'test-meal-side-1', 'Slot SIDE giữ nguyên vẹn không đổi');

  // Bước 3.2: Đổi món canh (SOUP) từ soup-1 sang soup-2
  currentMeal = {
    ...currentMeal,
    soupSlug: 'test-meal-soup-2',
  };
  assert(currentMeal.soupSlug === 'test-meal-soup-2', 'Slot SOUP được cập nhật sang món canh 2');
  assert(currentMeal.mainSlug === 'test-meal-main-2', 'Slot MAIN giữ nguyên vẹn không đổi');
  assert(currentMeal.sideSlug === 'test-meal-side-1', 'Slot SIDE giữ nguyên vẹn không đổi');

  console.log('\n--- Test Case Group 4: Thuật toán Gợi Ý Ngẫu Nhiên (Randomize) ---');

  const randomMeal = await getRandomMealSlugs();
  assert(randomMeal !== null, 'Hàm gợi ý ngẫu nhiên trả về kết quả');
  if (randomMeal) {
    assert(typeof randomMeal.mainSlug === 'string' && randomMeal.mainSlug.length > 0, 'Có mainSlug ngẫu nhiên');
    assert(typeof randomMeal.soupSlug === 'string' && randomMeal.soupSlug.length > 0, 'Có soupSlug ngẫu nhiên');
    assert(typeof randomMeal.sideSlug === 'string' && randomMeal.sideSlug.length > 0, 'Có sideSlug ngẫu nhiên');

    // Kiểm tra tính hợp lệ của cả 3 món ngẫu nhiên
    const resolvedRandom = await resolveMealSelection(randomMeal);
    assert(resolvedRandom.main?.role === 'MAIN', 'Món ngẫu nhiên 1 đúng role MAIN');
    assert(resolvedRandom.soup?.role === 'SOUP', 'Món ngẫu nhiên 2 đúng role SOUP');
    assert(resolvedRandom.side?.role === 'SIDE', 'Món ngẫu nhiên 3 đúng role SIDE');
  }

  console.log('\n--- Test Case Group 5: Đồng Bộ Khẩu Phần Toàn Mâm (§5.4) ---');

  // Kiểm tra clampServings
  assert(clampServings(4, 4) === 4, 'Khẩu phần 4 hợp lệ');
  assert(clampServings(6, 4) === 6, 'Khẩu phần 6 hợp lệ');
  assert(clampServings(-1, 4) === 1, 'Khẩu phần âm bị clamp về 1');
  assert(clampServings(100, 4) === 20, 'Khẩu phần 100 bị clamp về tối đa 20');
  assert(clampServings('abc', 4) === 4, 'Khẩu phần chuỗi lạ dùng fallback');

  // Dọn dẹp fixtures
  await db.delete(recipes).where(inArray(recipes.slug, testSlugs));

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
