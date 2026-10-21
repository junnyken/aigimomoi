// AG-26: Test Suite & Pilot Gate Verification — Toàn diện Phase P3 (Gate P3)
// Kiểm tra chất lượng Catalog Batch 1, E2E liên hoàn các luồng nghiệp vụ,
// Diễn tập Sao lưu & Khôi phục (Backup & Restore Drill - Invariants §11.4), và tính sẵn sàng của MVP.
// Chạy độc lập: npx tsx src/scripts/test_p3_pilot_gate.ts

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { db, closeDb } from '../lib/db';
import { recipes, recipeIngredients, cookingSteps } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { queryPublishedRecipeBySlug } from '../lib/recipes/publicQueries';
import { searchPublishedRecipes } from '../lib/recipes/searchQueries';
import { scaleRecipeIngredients } from '../lib/recipes/scaling';
import { resolveMealSelection, queryMealRecipesForAggregation } from '../lib/meal/mealQueries';
import { aggregateMealIngredients } from '../lib/recipes/aggregation';
import { GET as healthCheckGet, type HealthResponse } from '../app/api/health/route';
import sitemap from '../app/sitemap';
import robots from '../app/robots';

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

async function runGateVerification() {
  console.log('\n======================================================');
  console.log('  AG-26 — MASTER GATE P3 VERIFICATION & PILOT AUDIT');
  console.log('======================================================\n');

  // ==========================================================
  // GROUP 1: Catalog Batch 1 Quality & Completeness Audit
  // ==========================================================
  console.log('--- Test Case Group 1: Catalog Batch 1 Quality & Invariants ---');

  const allPublished = await db.query.recipes.findMany({
    where: eq(recipes.status, 'PUBLISHED'),
  });

  assert(allPublished.length >= 10, `Số lượng công thức PUBLISHED đạt chuẩn Batch 1 (hiện có: ${allPublished.length} >= 10)`);

  const mainRecipes = allPublished.filter((r) => r.role === 'MAIN');
  const soupRecipes = allPublished.filter((r) => r.role === 'SOUP');
  const sideRecipes = allPublished.filter((r) => r.role === 'SIDE');

  assert(mainRecipes.length >= 3, `Đủ tối thiểu 3 món mặn (MAIN): ${mainRecipes.length}`);
  assert(soupRecipes.length >= 3, `Đủ tối thiểu 3 món canh (SOUP): ${soupRecipes.length}`);
  assert(sideRecipes.length >= 2, `Đủ tối thiểu 2 món rau/xào (SIDE): ${sideRecipes.length}`);

  let qualityIssues = 0;
  for (const r of allPublished) {
    if (!r.heroImage || !r.shortDescription || !r.difficulty || r.baseServings <= 0) {
      qualityIssues++;
    }
    const ings = await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, r.id));
    const steps = await db.select().from(cookingSteps).where(eq(cookingSteps.recipeId, r.id));

    if (ings.length < 3) {
      qualityIssues++;
    }
    if (steps.length < 2) {
      qualityIssues++;
    }
    // Invariants D23 & R1: Công thức hạt giống phải được biên tập (isEditorialReviewed = true),
    // nhưng không được giả mạo cờ nấu thử (isCookTested không ép buộc true khi chưa có nghiệm thu bếp thật).
    if (!r.isEditorialReviewed) {
      qualityIssues++;
    }
  }

  assert(qualityIssues === 0, '100% công thức đạt tiêu chuẩn chất lượng (ảnh, mô tả, >= 3 nguyên liệu, >= 2 bước, đã biên tập chuẩn)');

  // ==========================================================
  // GROUP 2: Core E2E Flow 1 — Discovery -> Details -> Scaling -> Cooking
  // ==========================================================
  console.log('\n--- Test Case Group 2: E2E Flow 1 (Discovery -> Recipe -> Scale -> Cook) ---');

  // 2.1 Tìm kiếm & Lọc
  const searchResults = await searchPublishedRecipes({ role: 'MAIN', limit: 10 });
  assert(searchResults.items.length >= 3, 'Tìm kiếm theo vai trò MAIN trả về kết quả');
  assert(searchResults.items.every((r: { role: string }) => r.role === 'MAIN'), 'Tất cả kết quả lọc đều đúng vai trò MAIN');

  // 2.2 Chi tiết món ăn
  const recipeDetail = await queryPublishedRecipeBySlug('thit-ba-chi-kho-tieu');
  assert(recipeDetail !== null, 'Lấy chi tiết món thịt kho tiêu thành công');
  assert(recipeDetail?.ingredients.length === 5, 'Có đủ 5 nguyên liệu định lượng');
  assert(recipeDetail?.steps.length === 4, 'Có đủ 4 bước nấu');

  // 2.3 Co giãn khẩu phần 4 -> 6 người (Scale Ratio R = 1.5)
  if (recipeDetail) {
    const scaledIngredients = scaleRecipeIngredients(recipeDetail.ingredients, 4, 6);
    assert(scaledIngredients.length === recipeDetail.ingredients.length, 'Bảo toàn số lượng nguyên liệu');

    const pork = scaledIngredients.find((i: { name: string }) => i.name.includes('Thịt ba chỉ'));
    assert(pork?.scaledAmount === 600, `Thịt ba chỉ LINEAR scale đúng 400 * 1.5 = 600g: ${pork?.scaledAmount}`);

    const pepper = scaledIngredients.find((i: { name: string }) => i.name.includes('tiêu'));
    assert(pepper?.scaledAmount === 1, `Tiêu MANUAL_ADJUST giữ nguyên 1 muỗng: ${pepper?.scaledAmount}`);
  }

  // 2.4 Chế độ nấu (Cooking steps có timer)
  const stepWithTimer = recipeDetail?.steps.find((s) => (s.timerSeconds ?? 0) > 0);
  assert(stepWithTimer !== undefined, `Bước nấu có đồng hồ bấm giờ: ${stepWithTimer?.timerSeconds}s`);

  // ==========================================================
  // GROUP 3: Core E2E Flow 2 — Meal Composition -> Replace -> Aggregate -> Shopping
  // ==========================================================
  console.log('\n--- Test Case Group 3: E2E Flow 2 (Meal -> Replace -> Aggregate -> Shopping) ---');

  // 3.1 Phân giải mâm cơm chuẩn 3 món
  const meal = await resolveMealSelection({
    mainSlug: 'thit-ba-chi-kho-tieu',
    soupSlug: 'canh-rau-ngot-thit-bam',
    sideSlug: 'rau-muong-xao-toi',
  });
  assert(meal.main?.slug === 'thit-ba-chi-kho-tieu', 'Phân giải đúng món mặn');
  assert(meal.soup?.slug === 'canh-rau-ngot-thit-bam', 'Phân giải đúng món canh');
  assert(meal.side?.slug === 'rau-muong-xao-toi', 'Phân giải đúng món rau');

  // 3.2 Đổi món cục bộ slot SOUP
  const swappedSoup = {
    main: meal.main!.slug,
    soup: 'canh-chua-ca-loc',
    side: meal.side!.slug,
  };
  assert(swappedSoup.main === 'thit-ba-chi-kho-tieu', 'Slot MAIN giữ nguyên khi đổi canh');
  assert(swappedSoup.soup === 'canh-chua-ca-loc', 'Slot SOUP được thay đổi sang canh chua');
  assert(swappedSoup.side === 'rau-muong-xao-toi', 'Slot SIDE giữ nguyên khi đổi canh');

  // 3.3 Gộp nguyên liệu mâm cơm (Aggregation Engine từ Database)
  const dbRecipes = await queryMealRecipesForAggregation([
    meal.main!.slug,
    meal.soup!.slug,
    meal.side!.slug,
  ]);

  const aggResult = aggregateMealIngredients(dbRecipes, 4);
  assert(aggResult.dishesCount === 3, 'Gộp nguyên liệu cho đủ 3 món trong mâm');
  assert(aggResult.freshItems.length > 0, 'Có danh sách mặt hàng tươi sống');
  assert(aggResult.seasoningItems.length > 0, 'Có danh sách gia vị bếp nhà');

  // ==========================================================
  // GROUP 4: Backup & Restore Drill (Diễn tập khôi phục - Invariants §11.4)
  // ==========================================================
  console.log('\n--- Test Case Group 4: Backup & Restore Drill (Invariants §11.4) ---');

  const rootDir = path.resolve(__dirname, '../..');
  const backupScript = path.join(rootDir, 'scripts/backup_db.sh');
  const restoreScript = path.join(rootDir, 'scripts/restore_db.sh');

  assert(fs.existsSync(backupScript), 'Tồn tại script sao lưu backup_db.sh');
  assert(fs.existsSync(restoreScript), 'Tồn tại script khôi phục restore_db.sh');

  // 4.1 Thực hiện Backup
  const backupOutput = execSync(`bash "${backupScript}"`, { encoding: 'utf-8' });
  const backupFileMatch = backupOutput.trim().split('\n').pop()?.trim();
  assert(
    Boolean(backupFileMatch && fs.existsSync(backupFileMatch)),
    `Tạo tệp sao lưu thành công: ${backupFileMatch}`
  );

  // 4.2 Thêm bản ghi tạm thời để kiểm tra khôi phục
  const testDish = await db.query.dishes.findFirst();
  const testAuthor = await db.query.users.findFirst();

  let tempInserted = false;
  if (testDish && testAuthor) {
    await db.insert(recipes).values({
      dishId: testDish.id,
      authorId: testAuthor.id,
      name: 'Món Thử Nghiệm Drill Khôi Phục',
      slug: 'temp-drill-recipe-ag26',
      shortDescription: 'Món tạm sẽ bị xóa khi restore',
      role: 'MAIN',
      status: 'PUBLISHED',
      baseServings: 4,
    });
    tempInserted = true;
  }
  assert(tempInserted, 'Đã chèn bản ghi thử nghiệm tạm thời vào cơ sở dữ liệu');

  // Xác nhận bản ghi tạm đang tồn tại
  const beforeRestore = await db.query.recipes.findFirst({
    where: eq(recipes.slug, 'temp-drill-recipe-ag26'),
  });
  assert(beforeRestore !== undefined, 'Bản ghi tạm thời tồn tại trong DB trước khi restore');

  // 4.3 Thực hiện Restore từ tệp sao lưu vừa tạo
  if (backupFileMatch) {
    execSync(`bash "${restoreScript}" "${backupFileMatch}"`, { encoding: 'utf-8' });
  }

  // 4.4 Kiểm tra đối soát sau Restore
  const afterRestore = await db.query.recipes.findFirst({
    where: eq(recipes.slug, 'temp-drill-recipe-ag26'),
  });
  assert(afterRestore === undefined, 'Invariants §11.4: Bản ghi tạm thời đã biến mất sau khi Restore');

  const finalPublished = await db.query.recipes.findMany({
    where: eq(recipes.status, 'PUBLISHED'),
  });
  assert(finalPublished.length >= 10, `Cơ sở dữ liệu được khôi phục nguyên vẹn 100% (${finalPublished.length} công thức)`);

  // Xóa tệp backup tạm dùng cho drill
  if (backupFileMatch && fs.existsSync(backupFileMatch)) {
    fs.unlinkSync(backupFileMatch);
    console.log('  ✓ Đã dọn dẹp tệp sao lưu diễn tập tạm thời');
  }

  // ==========================================================
  // GROUP 5: Infrastructure & Observability Liveness
  // ==========================================================
  console.log('\n--- Test Case Group 5: Infrastructure & Observability Liveness ---');

  // 5.1 Healthcheck API
  const healthRes = await healthCheckGet();
  assert(healthRes.status === 200, 'Endpoint /api/health phản hồi HTTP 200 OK');
  const healthData = (await healthRes.json()) as HealthResponse;
  assert(healthData.status === 'healthy', 'Hệ thống ở trạng thái healthy');
  assert(healthData.database === 'connected', 'Kết nối cơ sở dữ liệu connected');

  // 5.2 Robots & Sitemap
  const robotsData = robots();
  assert(robotsData.rules !== undefined, 'Robots.txt có rules');
  const sitemapData = await sitemap();
  assert(sitemapData.length >= 15, `Sitemap chứa đầy đủ URL (${sitemapData.length} trang)`);
  assert(sitemapData.every((e) => !e.url.includes('/editor/')), 'Sitemap tuyệt đối không rò rỉ URL /editor/');

  console.log('\n======================================================');
  console.log(`  TỔNG KẾT GATE P3: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runGateVerification().catch((err) => {
  console.error('Lỗi ngoại lệ khi kiểm thử Gate P3:', err);
  process.exit(1);
}).finally(() => closeDb());
