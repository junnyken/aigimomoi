// Task R1 — Data Honesty & Verification Badges Test Suite
// Chạy độc lập: npx tsx src/scripts/test_data_honesty.ts
// Kiểm tra toàn diện tính trung thực của dữ liệu seed, phân loại ảnh minh họa,
// nhãn kiểm chứng bếp, và các guardrails theo Quyết định D23 & Mini-Spec R1.

import fs from 'node:fs';
import path from 'node:path';
import { isIllustrationImage } from '../lib/recipes/labels';

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

async function runDataHonestyTests() {
  console.log('\n======================================================');
  console.log('  TASK R1 — DATA HONESTY & VERIFICATION BADGES AUDIT  ');
  console.log('======================================================\n');

  // ==========================================================
  // GROUP 1: isIllustrationImage Helper Unit Tests
  // ==========================================================
  console.log('--- Group 1: isIllustrationImage Classification Unit Tests ---');

  // 1.1 Unsplash & Stock images
  assert(
    isIllustrationImage('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80') === true,
    'Unsplash URL chuẩn được nhận diện là ảnh minh họa (true)'
  );
  assert(
    isIllustrationImage('https://unsplash.com/photos/dish-sample') === true,
    'Domain unsplash.com được nhận diện là ảnh minh họa (true)'
  );
  assert(
    isIllustrationImage('https://images.pexels.com/photos/123/food.jpg') === true,
    'Domain pexels.com được nhận diện là ảnh minh họa (true)'
  );
  assert(
    isIllustrationImage('https://pixabay.com/get/food.jpg') === true,
    'Domain pixabay.com được nhận diện là ảnh minh họa (true)'
  );
  assert(
    isIllustrationImage('https://example.com/placeholder-food.jpg') === true,
    'URL chứa placeholder được nhận diện là ảnh minh họa (true)'
  );
  assert(
    isIllustrationImage('https://random-stock-site.com/image.jpg') === true,
    'URL HTTPS ngoài không thuộc uploads được coi là ảnh minh họa (true)'
  );

  // 1.2 Local uploads (Ảnh chụp bếp thật nội bộ)
  assert(
    isIllustrationImage('/uploads/recipes/thit-ba-chi-kho-tieu-that.webp') === false,
    'Đường dẫn nội bộ /uploads/... không phải ảnh minh họa (false)'
  );
  assert(
    isIllustrationImage('/uploads/2026/10/canh-chua-bep-nha.jpg') === false,
    'Ảnh chụp bếp trong /uploads/... nhận diện đúng là ảnh thực tế (false)'
  );
  assert(
    isIllustrationImage('https://angimom.vn/uploads/dishes/hero.webp') === false,
    'URL tuyệt đối chứa /uploads/ nhận diện đúng là ảnh thực tế (false)'
  );

  // 1.3 Empty / falsy inputs
  assert(isIllustrationImage(null) === false, 'null trả về false');
  assert(isIllustrationImage(undefined) === false, 'undefined trả về false');
  assert(isIllustrationImage('') === false, 'Chuỗi rỗng trả về false');
  assert(isIllustrationImage('   ') === false, 'Chuỗi khoảng trắng trả về false');

  // ==========================================================
  // GROUP 2: Seed Catalogs Data Honesty Audit (Static Analysis)
  // ==========================================================
  console.log('\n--- Group 2: Seed Catalogs Data Honesty Audit (D23 Compliance) ---');

  const rootDir = path.resolve(__dirname, '../..');
  const prodSeedPath = path.join(rootDir, 'src/scripts/seed_production_catalog.ts');
  const p7SeedPath = path.join(rootDir, 'src/scripts/seed_p7_catalog.ts');

  assert(fs.existsSync(prodSeedPath), 'Tập tin seed_production_catalog.ts tồn tại');
  assert(fs.existsSync(p7SeedPath), 'Tập tin seed_p7_catalog.ts tồn tại');

  const prodSeedContent = fs.readFileSync(prodSeedPath, 'utf8');
  const p7SeedContent = fs.readFileSync(p7SeedPath, 'utf8');

  // 2.1 Kiểm tra seed_production_catalog.ts
  assert(
    prodSeedContent.includes('isCookTested: false'),
    'seed_production_catalog.ts gán isCookTested: false (D23)'
  );
  assert(
    !prodSeedContent.match(/isCookTested:\s*true/),
    'seed_production_catalog.ts TUYỆT ĐỐI KHÔNG còn dòng nào gán isCookTested: true'
  );
  assert(
    prodSeedContent.includes('isEditorialReviewed: true'),
    'seed_production_catalog.ts giữ cờ isEditorialReviewed: true (công nhận công tác biên tập)'
  );

  // 2.2 Kiểm tra seed_p7_catalog.ts
  assert(
    p7SeedContent.includes('isCookTested: false'),
    'seed_p7_catalog.ts gán isCookTested: false (D23)'
  );
  assert(
    !p7SeedContent.match(/isCookTested:\s*true/),
    'seed_p7_catalog.ts TUYỆT ĐỐI KHÔNG còn dòng nào gán isCookTested: true'
  );

  // 2.3 Đếm số lượng món và xác nhận ảnh Unsplash
  const unsplashMatchesProd = (prodSeedContent.match(/images\.unsplash\.com/g) || []).length;
  assert(unsplashMatchesProd >= 12, `seed_production_catalog.ts có ít nhất 12 ảnh Unsplash (tìm thấy: ${unsplashMatchesProd})`);

  const unsplashMatchesP7 = (p7SeedContent.match(/images\.unsplash\.com/g) || []).length;
  assert(unsplashMatchesP7 >= 5, `seed_p7_catalog.ts có ít nhất 5 ảnh Unsplash (tìm thấy: ${unsplashMatchesP7})`);

  // ==========================================================
  // GROUP 3: Verification Badges Component Logic
  // ==========================================================
  console.log('\n--- Group 3: Verification Badges Degradation Logic ---');

  const badgesPath = path.join(rootDir, 'src/components/recipe/VerificationBadges.tsx');
  assert(fs.existsSync(badgesPath), 'Tập tin VerificationBadges.tsx tồn tại');
  const badgesContent = fs.readFileSync(badgesPath, 'utf8');

  assert(
    badgesContent.includes('isCookTested &&') && badgesContent.includes("'Đã nấu thử'"),
    'VerificationBadges chỉ hiển thị Đã nấu thử khi isCookTested === true'
  );
  assert(
    badgesContent.includes('Chờ kiểm nghiệm bếp mẫu'),
    'VerificationBadges hiển thị "Chờ kiểm nghiệm bếp mẫu" khi chưa nấu thử (D23 degrade trung thực)'
  );
  assert(
    badgesContent.includes('isAwaitingCookTest = !isCookTested'),
    'VerificationBadges xác định trạng thái chờ nghiệm thu chính xác'
  );

  // ==========================================================
  // GROUP 4: UI Surfaces Inspection (Image Badges & Honesty)
  // ==========================================================
  console.log('\n--- Group 4: UI Surfaces Image Badges & Honesty ---');

  // 4.1 RecipeCard.tsx
  const recipeCardPath = path.join(rootDir, 'src/components/recipe/RecipeCard.tsx');
  const recipeCardContent = fs.readFileSync(recipeCardPath, 'utf8');
  assert(
    recipeCardContent.includes('Ảnh minh họa'),
    'RecipeCard.tsx có nhãn "Ảnh minh họa"'
  );
  assert(
    recipeCardContent.includes('recipe.isCookTested &&'),
    'RecipeCard.tsx chỉ hiển thị "Đã nấu thử" khi recipe.isCookTested === true'
  );

  // 4.2 cong-thuc/[slug]/page.tsx
  const detailPagePath = path.join(rootDir, 'src/app/cong-thuc/[slug]/page.tsx');
  const detailPageContent = fs.readFileSync(detailPagePath, 'utf8');
  assert(
    detailPageContent.includes('Ảnh minh họa'),
    'Trang chi tiết /cong-thuc/[slug] có nhãn "Ảnh minh họa" trên hero image'
  );
  assert(
    detailPageContent.includes('Bếp Ăn Gì Mom đang tiến hành nấu thử để cập nhật hình ảnh đĩa cơm thực tế'),
    'Trang chi tiết có chú thích minh bạch chân thành về hình ảnh đĩa cơm thực tế'
  );

  // 4.3 MealSlotCard.tsx & SwapDishModal.tsx
  const mealSlotCardPath = path.join(rootDir, 'src/components/meal/MealSlotCard.tsx');
  const mealSlotCardContent = fs.readFileSync(mealSlotCardPath, 'utf8');
  assert(
    mealSlotCardContent.includes('Ảnh minh họa'),
    'MealSlotCard.tsx có nhãn "Ảnh minh họa"'
  );
  assert(
    mealSlotCardContent.includes('dish.isCookTested &&'),
    'MealSlotCard.tsx chỉ hiển thị "Đã nấu thử" khi dish.isCookTested === true'
  );

  const swapDishModalPath = path.join(rootDir, 'src/components/meal/SwapDishModal.tsx');
  const swapDishModalContent = fs.readFileSync(swapDishModalPath, 'utf8');
  assert(
    swapDishModalContent.includes('Minh họa'),
    'SwapDishModal.tsx có nhãn "Minh họa" trên thumbnail món ăn'
  );

  // ==========================================================
  // GROUP 5: Query Contracts & Invariants
  // ==========================================================
  console.log('\n--- Group 5: Query Contracts & Invariants ---');

  const publicQueriesPath = path.join(rootDir, 'src/lib/recipes/publicQueries.ts');
  const publicQueriesContent = fs.readFileSync(publicQueriesPath, 'utf8');
  assert(
    publicQueriesContent.includes('isIllustration: boolean'),
    'PublicRecipe và PublicRecipeCard có trường isIllustration: boolean'
  );
  assert(
    publicQueriesContent.includes('isIllustrationImage(row.heroImage)'),
    'queryPublishedRecipeBySlug tính toán isIllustration tự động'
  );

  const searchQueriesPath = path.join(rootDir, 'src/lib/recipes/searchQueries.ts');
  const searchQueriesContent = fs.readFileSync(searchQueriesPath, 'utf8');
  // R7: tìm kiếm dùng chung mapPublicCardRow (publicQueries.ts) — hàm này phải tính isIllustration
  const mapperComputesIllustration = /export function mapPublicCardRow[\s\S]*?isIllustrationImage\(r\.heroImage\)/.test(
    publicQueriesContent
  );
  assert(
    searchQueriesContent.includes('isIllustrationImage(r.heroImage)') ||
      (searchQueriesContent.includes('rows.map(mapPublicCardRow)') && mapperComputesIllustration),
    'searchPublishedRecipes tính toán isIllustration tự động'
  );
  assert(
    searchQueriesContent.includes('eq(recipes.isCookTested, true)'),
    'searchPublishedRecipes lọc testedOnly theo đúng eq(recipes.isCookTested, true)'
  );

  // ==========================================================
  // GROUP 6: Regression Guard on test_p3_pilot_gate.ts
  // ==========================================================
  console.log('\n--- Group 6: Regression Guard on Pilot Gate ---');

  const p3TestPath = path.join(rootDir, 'src/scripts/test_p3_pilot_gate.ts');
  const p3TestContent = fs.readFileSync(p3TestPath, 'utf8');
  assert(
    !p3TestContent.includes('!r.isCookTested || !r.isEditorialReviewed'),
    'test_p3_pilot_gate.ts đã được sửa, không còn ép buộc r.isCookTested === true giả mạo'
  );

  // ==========================================================
  // TỔNG KẾT
  // ==========================================================
  console.log('\n======================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ DATA HONESTY: ${passCount} PASS / ${failCount} FAIL`);
  console.log('======================================================\n');

  if (failCount > 0) {
    console.error(`❌ CÓ ${failCount} TEST CASES THẤT BẠI!`);
    process.exit(1);
  } else {
    console.log('🎉 100% TEST CASES ĐẠT CHUẨN TRUNG THỰC DỮ LIỆU (D23 & R1)!');
    process.exit(0);
  }
}

runDataHonestyTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
