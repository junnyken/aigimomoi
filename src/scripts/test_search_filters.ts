// AG-17: Kịch bản kiểm thử tự động toàn diện cho hệ thống Tìm kiếm & Bộ lọc công thức công khai.
// Chạy độc lập trên DB thật: npx tsx src/scripts/test_search_filters.ts
import { db } from '../lib/db';
import { recipes, users, dishes } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { searchPublishedRecipes, getSearchFilterMeta } from '../lib/recipes/searchQueries';

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
  console.log('  AG-17 — Test Suite: Search & Filters Capabilities');
  console.log('======================================================\n');

  // Lấy hoặc tạo user tác giả test
  let author = await db.query.users.findFirst({
    where: eq(users.email, 'test_search_author@angimom.vn'),
  });
  if (!author) {
    const [created] = await db
      .insert(users)
      .values({
        email: 'test_search_author@angimom.vn',
        passwordHash: 'dummy_hash',
        displayName: 'Search Test Author',
        role: 'EDITOR',
      })
      .returning();
    author = created;
  }

  // Lấy hoặc tạo dish test
  let testDish = await db.query.dishes.findFirst({
    where: eq(dishes.name, 'Món Test Tìm Kiếm AG-17'),
  });
  if (!testDish) {
    const [d] = await db
      .insert(dishes)
      .values({
        name: 'Món Test Tìm Kiếm AG-17',
        slug: 'mon-test-tim-kiem-ag17',
        description: 'Món ăn phục vụ kiểm thử tìm kiếm',
      })
      .returning();
    testDish = d;
  }

  const testSlugs = [
    'test-ag17-published-main-easy',
    'test-ag17-published-soup-hard',
    'test-ag17-published-side-quick',
    'test-ag17-draft-hidden',
    'test-ag17-submitted-hidden',
    'test-ag17-archived-hidden',
  ];

  // Dọn dẹp dữ liệu cũ nếu còn tồn đọng
  await db.delete(recipes).where(inArray(recipes.slug, testSlugs));

  console.log('1. Thiết lập fixtures kiểm thử đa trạng thái & đa trục...');
  // 1. Published: MAIN, Dễ, 15p + 30p = 45p, tested = true, name: "Thịt bò xào ớt chuông đặc biệt"
  await db.insert(recipes).values({
    slug: 'test-ag17-published-main-easy',
    name: 'Thịt bò xào ớt chuông đặc biệt',
    shortDescription: 'Món mặn giàu dinh dưỡng xào nhanh cho bữa cơm gia đình',
    dishId: testDish.id,
    authorId: author.id,
    role: 'MAIN',
    status: 'PUBLISHED',
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: 'Dễ',
    isCookTested: true,
    isNutritionVerified: true,
    caloriesPerServing: 350,
  });

  // 2. Published: SOUP, Khó, 20p + 40p = 60p, tested = false, name: "Canh chua cá lăng hoa điên điển"
  await db.insert(recipes).values({
    slug: 'test-ag17-published-soup-hard',
    name: 'Canh chua cá lăng hoa điên điển',
    shortDescription: 'Món canh thanh mát chuẩn vị miền Tây Nam Bộ',
    dishId: testDish.id,
    authorId: author.id,
    role: 'SOUP',
    status: 'PUBLISHED',
    prepTimeMinutes: 20,
    cookTimeMinutes: 40,
    difficulty: 'Khó',
    isCookTested: false,
    isNutritionVerified: false,
    caloriesPerServing: 220,
  });

  // 3. Published: SIDE, Dễ, 5p + 10p = 15p, tested = true, name: "Rau muống xào tỏi giòn xanh"
  await db.insert(recipes).values({
    slug: 'test-ag17-published-side-quick',
    name: 'Rau muống xào tỏi giòn xanh',
    shortDescription: 'Món rau quen thuộc xanh giòn tỏi thơm nức',
    dishId: testDish.id,
    authorId: author.id,
    role: 'SIDE',
    status: 'PUBLISHED',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    difficulty: 'Dễ',
    isCookTested: true,
    isNutritionVerified: false,
    caloriesPerServing: 110,
  });

  // 4, 5, 6: Các bản ghi không công khai
  await db.insert(recipes).values([
    {
      slug: 'test-ag17-draft-hidden',
      name: 'Thịt bò nháp chưa duyệt',
      shortDescription: 'Bản nháp',
      dishId: testDish.id,
      authorId: author.id,
      role: 'MAIN',
      status: 'DRAFT',
    },
    {
      slug: 'test-ag17-submitted-hidden',
      name: 'Canh cá chờ duyệt',
      shortDescription: 'Bản chờ duyệt',
      dishId: testDish.id,
      authorId: author.id,
      role: 'SOUP',
      status: 'SUBMITTED',
    },
    {
      slug: 'test-ag17-archived-hidden',
      name: 'Rau muống bản cũ đã lưu trữ',
      shortDescription: 'Bản cũ',
      dishId: testDish.id,
      authorId: author.id,
      role: 'SIDE',
      status: 'ARCHIVED',
    },
  ]);

  console.log('\n2. Kiểm tra Invariant §5.1: Tuyệt đối chỉ tìm thấy công thức PUBLISHED');
  {
    const res = await searchPublishedRecipes({ limit: 100 });
    const slugs = res.items.map((i) => i.slug);

    assert(slugs.includes('test-ag17-published-main-easy'), 'Công thức PUBLISHED 1 xuất hiện');
    assert(slugs.includes('test-ag17-published-soup-hard'), 'Công thức PUBLISHED 2 xuất hiện');
    assert(slugs.includes('test-ag17-published-side-quick'), 'Công thức PUBLISHED 3 xuất hiện');

    assert(!slugs.includes('test-ag17-draft-hidden'), 'Bản DRAFT bị ẩn hoàn toàn khỏi kết quả');
    assert(!slugs.includes('test-ag17-submitted-hidden'), 'Bản SUBMITTED bị ẩn hoàn toàn');
    assert(!slugs.includes('test-ag17-archived-hidden'), 'Bản ARCHIVED bị ẩn hoàn toàn');
  }

  console.log('\n3. Kiểm tra tìm kiếm từ khóa (Keyword search q)');
  {
    // Tìm "ớt chuông"
    const res1 = await searchPublishedRecipes({ q: 'ớt chuông' });
    const slugs1 = res1.items.map((i) => i.slug);
    assert(slugs1.includes('test-ag17-published-main-easy'), 'Tìm "ớt chuông" thấy bò xào');
    assert(!slugs1.includes('test-ag17-published-soup-hard'), 'Không lẫn món canh');

    // Tìm trong mô tả: "thanh mát"
    const res2 = await searchPublishedRecipes({ q: 'thanh mát' });
    const slugs2 = res2.items.map((i) => i.slug);
    assert(slugs2.includes('test-ag17-published-soup-hard'), 'Tìm theo mô tả "thanh mát" thấy canh chua');

    // Tìm ký tự đặc biệt / SQL Injection: "thịt%_'"
    const res3 = await searchPublishedRecipes({ q: "thịt%_'" });
    assert(Array.isArray(res3.items), 'Truy vấn với ký tự đặc biệt an toàn, không crash DB');

    // Tìm từ khóa không tồn tại
    const res4 = await searchPublishedRecipes({ q: 'tu-khoa-khong-the-tim-thay-xyz' });
    assert(res4.items.length === 0 && res4.totalCount === 0, 'Từ khóa lạ trả về 0 kết quả chính xác');
  }

  console.log('\n4. Kiểm tra bộ lọc vai trò bữa ăn (Role filter)');
  {
    const resMain = await searchPublishedRecipes({ role: 'MAIN' });
    assert(resMain.items.every((i) => i.role === 'MAIN'), 'Tất cả kết quả khi lọc role=MAIN đều là món mặn');
    assert(resMain.items.some((i) => i.slug === 'test-ag17-published-main-easy'), 'Món mặn test xuất hiện');

    const resSoup = await searchPublishedRecipes({ role: 'SOUP' });
    assert(resSoup.items.every((i) => i.role === 'SOUP'), 'Tất cả kết quả khi lọc role=SOUP đều là món canh');
    assert(resSoup.items.some((i) => i.slug === 'test-ag17-published-soup-hard'), 'Món canh test xuất hiện');
  }

  console.log('\n5. Kiểm tra bộ lọc thời gian tối đa (maxTime filter)');
  {
    // maxTime = 20p: Chỉ có rau muống (5 + 10 = 15p <= 20p)
    const resQuick = await searchPublishedRecipes({ maxTime: 20 });
    const slugs = resQuick.items.map((i) => i.slug);
    assert(slugs.includes('test-ag17-published-side-quick'), 'Món rau (15p) nằm trong ngưỡng <= 20p');
    assert(!slugs.includes('test-ag17-published-main-easy'), 'Món bò (45p) bị loại khỏi ngưỡng <= 20p');
    assert(!slugs.includes('test-ag17-published-soup-hard'), 'Món canh (60p) bị loại khỏi ngưỡng <= 20p');

    // maxTime = 50p: Bao gồm rau (15p) và bò (45p), không có canh (60p)
    const resMed = await searchPublishedRecipes({ maxTime: 50 });
    const slugsMed = resMed.items.map((i) => i.slug);
    assert(slugsMed.includes('test-ag17-published-side-quick'), 'Món rau có trong ngưỡng <= 50p');
    assert(slugsMed.includes('test-ag17-published-main-easy'), 'Món bò có trong ngưỡng <= 50p');
    assert(!slugsMed.includes('test-ag17-published-soup-hard'), 'Món canh (60p) bị loại khỏi ngưỡng <= 50p');
  }

  console.log('\n6. Kiểm tra bộ lọc độ khó (Difficulty filter)');
  {
    const resHard = await searchPublishedRecipes({ difficulty: 'Khó' });
    const slugs = resHard.items.map((i) => i.slug);
    assert(slugs.includes('test-ag17-published-soup-hard'), 'Món canh độ khó "Khó" xuất hiện');
    assert(!slugs.includes('test-ag17-published-main-easy'), 'Món bò độ khó "Dễ" không xuất hiện');
  }

  console.log('\n7. Kiểm tra bộ lọc nhãn kiểm chứng (Verification filters)');
  {
    const resTested = await searchPublishedRecipes({ testedOnly: true });
    const slugs = resTested.items.map((i) => i.slug);
    assert(slugs.includes('test-ag17-published-main-easy'), 'Món bò có nhãn tested=true xuất hiện');
    assert(slugs.includes('test-ag17-published-side-quick'), 'Món rau có nhãn tested=true xuất hiện');
    assert(!slugs.includes('test-ag17-published-soup-hard'), 'Món canh tested=false bị lọc bỏ');

    const resNutri = await searchPublishedRecipes({ nutritionOnly: true });
    const slugsNutri = resNutri.items.map((i) => i.slug);
    assert(slugsNutri.includes('test-ag17-published-main-easy'), 'Món bò có nhãn nutritionVerified=true xuất hiện');
    assert(!slugsNutri.includes('test-ag17-published-side-quick'), 'Món rau nutritionVerified=false bị lọc bỏ');
  }

  console.log('\n8. Kiểm tra bộ lọc kết hợp đa trục (Composite Filter)');
  {
    // Tìm: q="xào" + role="MAIN" + maxTime=50 + testedOnly=true
    const resComposite = await searchPublishedRecipes({
      q: 'xào',
      role: 'MAIN',
      maxTime: 50,
      testedOnly: true,
    });
    const slugs = resComposite.items.map((i) => i.slug);
    assert(slugs.length === 1 && slugs[0] === 'test-ag17-published-main-easy', 'Lọc kết hợp đa tiêu chí trả về chính xác 1 món duy nhất');
  }

  console.log('\n9. Kiểm tra sắp xếp (Sorting)');
  {
    // Sắp xếp theo nhanh nhất: quickest
    const resQuickest = await searchPublishedRecipes({
      sort: 'quickest',
      limit: 10,
    });
    const testItems = resQuickest.items.filter((i) =>
      ['test-ag17-published-main-easy', 'test-ag17-published-soup-hard', 'test-ag17-published-side-quick'].includes(i.slug)
    );
    assert(testItems[0]?.slug === 'test-ag17-published-side-quick', 'Món 15p đứng trước');
    assert(testItems[1]?.slug === 'test-ag17-published-main-easy', 'Món 45p đứng nhì');
    assert(testItems[2]?.slug === 'test-ag17-published-soup-hard', 'Món 60p đứng sau cùng');
  }

  console.log('\n10. Kiểm tra phân trang và siêu dữ liệu (Pagination & Meta)');
  {
    const resPage1 = await searchPublishedRecipes({ limit: 2, page: 1 });
    assert(resPage1.items.length === 2, 'Page 1 trả về đúng 2 kết quả theo limit=2');
    assert(resPage1.totalPages >= 2, 'Tổng số trang được tính đúng');

    const meta = await getSearchFilterMeta();
    assert(meta.totalPublished >= 3, 'Meta đếm đúng tổng số món PUBLISHED');
    assert(typeof meta.roleCounts['MAIN'] === 'number', 'Role count MAIN hợp lệ');
  }

  console.log('\n11. Dọn dẹp dữ liệu kiểm thử...');
  await db.delete(recipes).where(inArray(recipes.slug, testSlugs));
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
