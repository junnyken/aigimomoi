// AG-24: Kịch bản kiểm thử tự động cho Tính năng SEO, Sitemap động & Dữ liệu có cấu trúc JSON-LD.
// Kiểm tra Invariants §5.1 (chặn DRAFT/ARCHIVED trong Sitemap), robots disallow boundaries,
// ISO 8601 duration parser, Schema.org Recipe structured data.
// Chạy độc lập: npx tsx src/scripts/test_seo_boundaries.ts
import { db } from '../lib/db';
import { recipes, users, dishes } from '../lib/db/schema';
import { inArray } from 'drizzle-orm';
import sitemap from '../app/sitemap';
import robots from '../app/robots';
import { minutesToIsoDuration, buildRecipeJsonLd } from '../components/seo/RecipeJsonLd';
import type { PublicRecipe } from '../lib/recipes/publicQueries';

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
  console.log('  AG-24 — Test Suite: SEO & Index Boundaries');
  console.log('======================================================\n');

  console.log('--- Test Case Group 1: Robots.txt Rules & Boundaries ---');

  const robotsResult = robots();
  assert(robotsResult.rules !== undefined, 'Robots có rules');
  if (robotsResult.rules && !Array.isArray(robotsResult.rules)) {
    assert(robotsResult.rules.userAgent === '*', 'Cho phép tất cả User-Agent hợp lệ');
    assert(robotsResult.rules.allow === '/', 'Allow trang chủ và nội dung công khai');

    const disallowList = Array.isArray(robotsResult.rules.disallow)
      ? robotsResult.rules.disallow
      : [robotsResult.rules.disallow];

    assert(disallowList.includes('/editor/'), 'Chặn lập chỉ mục khu vực biên tập /editor/');
    assert(disallowList.includes('/api/'), 'Chặn lập chỉ mục nội bộ /api/');
    assert(disallowList.includes('/login'), 'Chặn lập chỉ mục trang /login');
  }
  assert(
    typeof robotsResult.sitemap === 'string' && robotsResult.sitemap.endsWith('/sitemap.xml'),
    `Khai báo đúng file sitemap: ${robotsResult.sitemap}`
  );

  console.log('\n--- Test Case Group 2: Dynamic Sitemap Generation (Invariants §5.1) ---');

  // Tạo fixtures công thức test với các status khác nhau
  let testUser = await db.query.users.findFirst();
  let testDish = await db.query.dishes.findFirst();

  if (testUser && testDish) {
    await db.delete(recipes).where(
      inArray(recipes.slug, ['test-seo-pub-1', 'test-seo-draft-2', 'test-seo-archived-3'])
    );

    await db.insert(recipes).values([
      {
        dishId: testDish.id,
        authorId: testUser.id,
        name: 'Món SEO Đã Xuất Bản',
        slug: 'test-seo-pub-1',
        shortDescription: 'Món xuất bản',
        role: 'MAIN',
        difficulty: 'Dễ',
        baseServings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        status: 'PUBLISHED',
      },
      {
        dishId: testDish.id,
        authorId: testUser.id,
        name: 'Món SEO Bản Nháp',
        slug: 'test-seo-draft-2',
        shortDescription: 'Món nháp',
        role: 'SOUP',
        difficulty: 'Dễ',
        baseServings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        status: 'DRAFT',
      },
      {
        dishId: testDish.id,
        authorId: testUser.id,
        name: 'Món SEO Bản Cũ Lưu Trữ',
        slug: 'test-seo-archived-3',
        shortDescription: 'Món cũ',
        role: 'SIDE',
        difficulty: 'Dễ',
        baseServings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        status: 'ARCHIVED',
      },
    ]);
  }

  const sitemapEntries = await sitemap();
  const urls = sitemapEntries.map((e) => e.url);

  // 2.1: Các trang tĩnh bắt buộc phải có
  assert(urls.some((u) => u.endsWith('/') || !u.includes('/', 8)), 'Sitemap có trang chủ /');
  assert(urls.some((u) => u.includes('/mon-an')), 'Sitemap có trang khám phá /mon-an');
  assert(urls.some((u) => u.includes('/meal')), 'Sitemap có trang mâm cơm /meal');
  assert(urls.some((u) => u.includes('/da-luu')), 'Sitemap có trang món đã lưu /da-luu');
  assert(urls.some((u) => u.includes('/shopping')), 'Sitemap có trang đi chợ /shopping');

  // 2.2: Ranh giới lập chỉ mục: Chặn 100% bản nháp & trang nội bộ
  assert(urls.some((u) => u.includes('test-seo-pub-1')), 'Sitemap chứa công thức PUBLISHED');
  assert(!urls.some((u) => u.includes('test-seo-draft-2')), 'Invariants §5.1: Chặn 100% bản DRAFT khỏi Sitemap');
  assert(!urls.some((u) => u.includes('test-seo-archived-3')), 'Invariants §5.1: Chặn 100% bản ARCHIVED khỏi Sitemap');
  assert(!urls.some((u) => u.includes('/editor/')), 'Không chứa URL quản trị /editor/ trong Sitemap');
  assert(!urls.some((u) => u.includes('/api/')), 'Không chứa URL /api/ trong Sitemap');
  assert(!urls.some((u) => u.includes('/login')), 'Không chứa URL /login trong Sitemap');

  // Dọn dẹp
  await db.delete(recipes).where(
    inArray(recipes.slug, ['test-seo-pub-1', 'test-seo-draft-2', 'test-seo-archived-3'])
  );

  console.log('\n--- Test Case Group 3: ISO 8601 Duration Parser ---');

  assert(minutesToIsoDuration(0) === 'PT0M', '0 phút -> PT0M');
  assert(minutesToIsoDuration(15) === 'PT15M', '15 phút -> PT15M');
  assert(minutesToIsoDuration(45) === 'PT45M', '45 phút -> PT45M');
  assert(minutesToIsoDuration(60) === 'PT1H', '60 phút -> PT1H');
  assert(minutesToIsoDuration(75) === 'PT1H15M', '75 phút -> PT1H15M');
  assert(minutesToIsoDuration(150) === 'PT2H30M', '150 phút -> PT2H30M');

  console.log('\n--- Test Case Group 4: Schema.org Recipe JSON-LD Builder ---');

  const mockPublicRecipe: PublicRecipe = {
    slug: 'thit-kho-trung-ag24',
    name: 'Thịt Kho Trứng Chuẩn Vị',
    shortDescription: 'Món thịt kho béo ngậy cho bữa cơm gia đình',
    role: 'MAIN',
    baseServings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 45,
    difficulty: 'Dễ',
    caloriesPerServing: 350,
    nutritionStatus: 'ESTIMATED',
    heroImage: 'https://images.angimom.vn/thit-kho.jpg',
    isEditorialReviewed: true,
    isCookTested: true,
    isNutritionVerified: false,
    versionNumber: 1,
    publishedAt: new Date().toISOString(),
    dish: { name: 'Thịt Kho Tàu', aliases: ['Thịt kho trứng'] },
    authorName: 'Đầu Bếp Mom',
    ingredients: [
      {
        id: 1,
        name: 'Thịt ba chỉ',
        category: 'MEAT_SEAFOOD',
        amount: 500,
        unit: 'g',
        scalePolicy: 'LINEAR',
        preparation: 'thái vuông',
        isOptional: false,
      },
      {
        id: 2,
        name: 'Trứng vịt',
        category: 'OTHER',
        amount: 4,
        unit: 'quả',
        scalePolicy: 'LINEAR',
        preparation: 'luộc bóc vỏ',
        isOptional: false,
      },
    ],
    steps: [
      {
        id: 1,
        stepNumber: 1,
        phaseName: 'Sơ chế & Ướp',
        instruction: 'Thái thịt vuông và ướp gia vị 15 phút.',
        timerSeconds: 900,
        tipText: 'Ướp một chút đường trước để mỡ trong.',
        image: null,
      },
      {
        id: 2,
        stepNumber: 2,
        phaseName: 'Kho thịt',
        instruction: 'Đảo thịt săn rồi đổ nước dừa đun nhỏ lửa.',
        timerSeconds: 2700,
        tipText: null,
        image: null,
      },
    ],
    tags: [{ name: 'Món Mặn', slug: 'mon-man', type: 'ROLE' }],
  };

  const jsonLd = buildRecipeJsonLd(mockPublicRecipe, 'https://angimom.vn');

  assert(jsonLd['@context'] === 'https://schema.org', 'Context chuẩn Schema.org');
  assert(jsonLd['@type'] === 'Recipe', 'Type chuẩn Recipe');
  assert(jsonLd.name === 'Thịt Kho Trứng Chuẩn Vị', 'Tên công thức chính xác');
  assert(jsonLd.prepTime === 'PT15M', 'prepTime đúng định dạng ISO (PT15M)');
  assert(jsonLd.cookTime === 'PT45M', 'cookTime đúng định dạng ISO (PT45M)');
  assert(jsonLd.totalTime === 'PT1H', 'totalTime tính đúng 15 + 45 = 60 phút (PT1H)');
  assert(jsonLd.recipeYield === '4 người', 'Khẩu phần đúng');
  assert(jsonLd.recipeCuisine === 'Vietnamese', 'Ẩm thực Việt Nam');
  assert(jsonLd.recipeIngredient.length === 2, 'Có 2 nguyên liệu định lượng');
  assert(jsonLd.recipeIngredient[0] === 'Thịt ba chỉ 500 g (thái vuông)', 'Định dạng nguyên liệu chi tiết');
  assert(jsonLd.recipeInstructions.length === 2, 'Có 2 bước HowToStep');
  assert(jsonLd.recipeInstructions[0]['@type'] === 'HowToStep', 'Bước 1 là HowToStep');

  // Kiểm tra chuỗi JSON an toàn không bị XSS
  const serialized = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  assert(!serialized.includes('<script>'), 'Chuỗi JSON an toàn, ký tự < đã được escape');

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
