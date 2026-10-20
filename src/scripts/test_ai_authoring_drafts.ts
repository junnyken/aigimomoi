// AG-29 Test Suite: AI Recipe Authoring Drafts & Provenance Verification
// Kiểm thử tự động 6 tiêu chuẩn Gate P4:
// 1. Schema Validity: Output từ AI tuân thủ 100% cấu trúc Recipe (name, description, ingredients, steps, scalePolicy).
// 2. Invariants Check: Bản nháp luôn có status = 'DRAFT' và provenance = 'AI_ASSISTED'.
// 3. Invariants Check: Bản nháp tuyệt đối không được tự động bật cờ kiểm chứng (isCookTested = false, isEditorialReviewed = false).
// 4. Database Persistence: Lưu bản nháp trực tiếp vào database bảo toàn trọn vẹn invariants và quan hệ khóa ngoại.
// 5. Ingredient Linking: Tự động map và chuẩn hóa nguyên liệu với từ điển ingredients trong DB.
// 6. Role Variation & Fallback: Hỗ trợ tạo bản thảo cho các vai trò khác nhau (MAIN, SOUP, SIDE).

import { db } from '../lib/db';
import { recipes, recipeIngredients, cookingSteps, ingredients, users } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateRecipeDraft, saveAiDraftToDatabase } from '../lib/ai/recipeDraftGenerator';

async function runTests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ AG-29: AI RECIPE AUTHORING DRAFTS & PROVENANCE ---');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 0. Setup: Lấy hoặc tạo user test có vai trò EDITOR
    let [testEditor] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'EDITOR'))
      .limit(1);

    if (!testEditor) {
      const [newEditor] = await db
        .insert(users)
        .values({
          email: 'editor_test_ag29@angimom.com',
          displayName: 'Test Editor AG29',
          role: 'EDITOR',
        })
        .returning({ id: users.id });
      testEditor = newEditor;
    }

    console.log(`[Setup] Sử dụng Editor ID: ${testEditor.id}`);

    // Test 1: Khởi tạo bản thảo AI cho món mặn (MAIN)
    console.log('\n[Test 1] Khởi tạo bản thảo cho món "Cá lóc kho tộ miền Tây" (MAIN)');
    const result1 = await generateRecipeDraft({
      dishTitle: 'Cá lóc kho tộ miền Tây',
      role: 'MAIN',
      region: 'Miền Nam',
      styleNotes: 'Kho bằng nồi đất, đậm vị, thơm mùi tiêu',
      baseServings: 4,
      clientId: 'test-editor-1',
    });

    const draft1 = result1.draft;
    assert(Boolean(draft1), 'Nhận được đối tượng draft từ Engine');
    assert(typeof draft1.name === 'string' && draft1.name.length > 5, `Tên công thức: "${draft1.name}"`);
    assert(typeof draft1.shortDescription === 'string' && draft1.shortDescription.length > 10, 'Có tóm tắt ngắn hợp lệ');
    assert(draft1.role === 'MAIN', 'Vai trò đúng là MAIN');
    assert(draft1.baseServings === 4, 'Khẩu phần cơ sở = 4');
    assert(draft1.prepTimeMinutes > 0 && draft1.cookTimeMinutes > 0, 'Có thời gian nấu và chuẩn bị hợp lệ');

    // Test 2: Invariants Gate P4 (Draft, Provenance, Unverified Flags)
    console.log('\n[Test 2] Kiểm tra Invariants Gate P4 trên bản nháp sinh ra');
    assert(draft1.status === 'DRAFT', 'Invariants §5.1: status BẮT BUỘC là "DRAFT"');
    assert(draft1.provenance === 'AI_ASSISTED', 'Invariants §5.5: provenance BẮT BUỘC là "AI_ASSISTED"');
    assert(draft1.isCookTested === false, 'Master Plan §8.2: isCookTested = false (chưa nấu thử)');
    assert(draft1.isEditorialReviewed === false, 'Master Plan §8.2: isEditorialReviewed = false (chưa duyệt)');
    assert(draft1.isNutritionVerified === false, 'isNutritionVerified = false');

    // Test 3: Schema nguyên liệu & các bước nấu
    console.log('\n[Test 3] Kiểm tra cấu trúc định lượng nguyên liệu và bước nấu');
    assert(Array.isArray(draft1.ingredients) && draft1.ingredients.length >= 2, `Có ${draft1.ingredients.length} nguyên liệu định lượng`);
    for (const ing of draft1.ingredients) {
      assert(ing.ingredientId > 0, `Nguyên liệu "${ing.name}" có ingredientId hợp lệ (${ing.ingredientId})`);
      assert(ing.amount > 0, `Định lượng "${ing.amount}" > 0`);
      assert(['LINEAR', 'FIXED', 'MANUAL_ADJUST'].includes(ing.scalePolicy), `scalePolicy "${ing.scalePolicy}" chuẩn mực`);
    }

    assert(Array.isArray(draft1.steps) && draft1.steps.length >= 2, `Có ${draft1.steps.length} bước thực hiện`);
    for (const st of draft1.steps) {
      assert(st.stepNumber > 0, `Bước #${st.stepNumber}`);
      assert(['Sơ chế', 'Chế biến', 'Hoàn thành'].includes(st.phaseName), `phaseName "${st.phaseName}" chuẩn mực`);
      assert(st.instruction.length > 10, `Nội dung bước #${st.stepNumber} rõ ràng`);
    }

    // Test 4: Lưu trực tiếp bản nháp vào Database
    console.log('\n[Test 4] Lưu bản nháp vào DB và xác thực bảo toàn Invariants trong PostgreSQL');
    const saved = await saveAiDraftToDatabase(draft1, testEditor.id);
    assert(saved.recipeId > 0, `Đã lưu công thức mới vào DB với ID: ${saved.recipeId}`);

    // Truy vấn lại từ DB để kiểm tra tính toàn vẹn
    const [dbRecipe] = await db
      .select({
        id: recipes.id,
        slug: recipes.slug,
        status: recipes.status,
        provenance: recipes.provenance,
        isCookTested: recipes.isCookTested,
        isEditorialReviewed: recipes.isEditorialReviewed,
        publishedAt: recipes.publishedAt,
      })
      .from(recipes)
      .where(eq(recipes.id, saved.recipeId));

    assert(Boolean(dbRecipe), 'Truy vấn thành công công thức vừa lưu trong DB');
    assert(dbRecipe.status === 'DRAFT', 'Trong DB: status = DRAFT');
    assert(dbRecipe.provenance === 'AI_ASSISTED', 'Trong DB: provenance = AI_ASSISTED');
    assert(dbRecipe.isCookTested === false, 'Trong DB: isCookTested = false');
    assert(dbRecipe.isEditorialReviewed === false, 'Trong DB: isEditorialReviewed = false');
    assert(dbRecipe.publishedAt === null, 'Trong DB: publishedAt = null (chưa xuất bản)');

    // Kiểm tra nguyên liệu và bước nấu trong DB
    const dbIngs = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, saved.recipeId));
    assert(dbIngs.length === draft1.ingredients.length, `DB lưu đủ ${dbIngs.length} dòng nguyên liệu`);

    const dbSteps = await db
      .select()
      .from(cookingSteps)
      .where(eq(cookingSteps.recipeId, saved.recipeId));
    assert(dbSteps.length === draft1.steps.length, `DB lưu đủ ${dbSteps.length} bước nấu`);

    // Dọn dẹp bản ghi test vừa chèn
    await db.delete(recipes).where(eq(recipes.id, saved.recipeId));
    console.log('  [Cleanup] Đã dọn dẹp an toàn bản ghi test trong DB');

    // Test 5: Khởi tạo bản thảo cho món Canh (SOUP)
    console.log('\n[Test 5] Khởi tạo bản thảo cho món Canh chua cá bông lau (SOUP)');
    const resultSoup = await generateRecipeDraft({
      dishTitle: 'Canh chua cá bông lau',
      role: 'SOUP',
      region: 'Miền Nam',
      clientId: 'test-editor-soup',
    });
    assert(resultSoup.draft.role === 'SOUP', 'Món canh có role SOUP');
    assert(resultSoup.draft.status === 'DRAFT', 'Món canh có status DRAFT');
    assert(resultSoup.draft.provenance === 'AI_ASSISTED', 'Món canh có provenance AI_ASSISTED');

    // Test 6: Khởi tạo bản thảo cho món Rau (SIDE)
    console.log('\n[Test 6] Khởi tạo bản thảo cho món Bông cải xanh xào nấm (SIDE)');
    const resultSide = await generateRecipeDraft({
      dishTitle: 'Bông cải xanh xào nấm',
      role: 'SIDE',
      region: 'Toàn quốc',
      clientId: 'test-editor-side',
    });
    assert(resultSide.draft.role === 'SIDE', 'Món rau có role SIDE');
    assert(resultSide.draft.status === 'DRAFT', 'Món rau có status DRAFT');
    assert(resultSide.draft.provenance === 'AI_ASSISTED', 'Món rau có provenance AI_ASSISTED');

    console.log(`\n======================================================`);
    console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Lỗi ngoại lệ trong quá trình chạy kiểm thử:', err);
    process.exit(1);
  }
}

runTests();
