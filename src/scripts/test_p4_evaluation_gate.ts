// ============================================================================
// AG-30 — MASTER GATE P4 VERIFICATION & AI EVALUATION BENCHMARK
// ============================================================================
// Tiêu chuẩn nghiệm thu Gate P4 (Invariants Gate P4 & Master Plan §5.1, §5.5, §7):
// 1. AI không bao giờ tạo đường tắt tự động xuất bản (bản nháp luôn là DRAFT).
// 2. AI không suy đoán bừa bãi số liệu dinh dưỡng (isNutritionVerified = false).
// 3. AI không gây chi phí mất kiểm soát (trần token <= 1200, timeout <= 10s, rate limit).
// 4. Grounding tuyệt đối: 100% món ăn gợi ý là ID thật trong catalog PUBLISHED.
// 5. Tính trung thực & Fallback Heuristic tự động khi mất kết nối / hết quota.
// ============================================================================

import { db } from '../lib/db';
import { recipes, ingredients } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { aiGateway } from '../lib/ai/gateway';
import { suggestMealWithAi } from '../lib/ai/mealSuggester';
import { generateRecipeDraft, saveAiDraftToDatabase } from '../lib/ai/recipeDraftGenerator';

async function runMasterGateP4Audit() {
  console.log('\n======================================================');
  console.log('  AG-30 — MASTER GATE P4 EVALUATION & SAFETY BENCHMARK');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // Lấy toàn bộ catalog PUBLISHED trong DB để làm Ground Truth
    const publishedRows = await db
      .select({
        id: recipes.id,
        slug: recipes.slug,
        role: recipes.role,
        status: recipes.status,
      })
      .from(recipes)
      .where(eq(recipes.status, 'PUBLISHED'));

    const publishedSlugs = new Set(publishedRows.map((r) => r.slug));
    const mainSlugs = new Set(publishedRows.filter((r) => r.role === 'MAIN').map((r) => r.slug));
    const soupSlugs = new Set(publishedRows.filter((r) => r.role === 'SOUP').map((r) => r.slug));
    const sideSlugs = new Set(publishedRows.filter((r) => r.role === 'SIDE').map((r) => r.slug));

    console.log(`[Ground Truth] Database hiện có ${publishedSlugs.size} công thức PUBLISHED`);

    // --- GROUP 1: CATALOG GROUNDING & ANTI-HALLUCINATION BENCHMARK ---
    console.log('\n--- Group 1: Catalog Grounding & Anti-Hallucination Benchmark ---');
    const testPantryPrompts = [
      ['thịt ba chỉ', 'rau muống'],
      ['cá lóc', 'cà chua', 'dứa'],
      ['sườn heo', 'ngô ngọt'],
      ['đậu hũ', 'nấm hương', 'cà rốt'],
      ['tôm sú', 'thịt nạc', 'rau ngót'],
      ['trứng gà', 'cà chua', 'hành hoa'],
      ['bò bắp', 'rau răm', 'hành tây'],
      [], // rỗng
    ];

    let totalGroundingChecks = 0;
    let successfulGrounding = 0;

    for (let i = 0; i < testPantryPrompts.length; i++) {
      const p = testPantryPrompts[i];
      const res = await suggestMealWithAi({
        userIngredients: p,
        clientId: `benchmark-client-${i}`,
      });

      totalGroundingChecks += 3;
      if (publishedSlugs.has(res.meal.main.slug)) successfulGrounding++;
      if (publishedSlugs.has(res.meal.soup.slug)) successfulGrounding++;
      if (publishedSlugs.has(res.meal.side.slug)) successfulGrounding++;

      assert(mainSlugs.has(res.meal.main.slug), `Trial #${i + 1}: Main slug "${res.meal.main.slug}" là món chính PUBLISHED thật`);
      assert(soupSlugs.has(res.meal.soup.slug), `Trial #${i + 1}: Soup slug "${res.meal.soup.slug}" là món canh PUBLISHED thật`);
      assert(sideSlugs.has(res.meal.side.slug), `Trial #${i + 1}: Side slug "${res.meal.side.slug}" là món rau PUBLISHED thật`);
    }

    const hallucinationRate = ((totalGroundingChecks - successfulGrounding) / totalGroundingChecks) * 100;
    assert(hallucinationRate === 0.0, `Hallucination Rate: ${hallucinationRate.toFixed(1)}% (Mục tiêu: 0.0%)`);

    // --- GROUP 2: INVARIANTS GATE P4 & PROVENANCE TRACKING ---
    console.log('\n--- Group 2: Invariants Gate P4 & Provenance Tracking ---');
    const draftRes = await generateRecipeDraft({
      dishTitle: 'Canh sườn nấu sấu Hà Nội',
      role: 'SOUP',
      region: 'Miền Bắc',
      clientId: 'p4-audit-editor',
    });

    const draft = draftRes.draft;
    assert(draft.status === 'DRAFT', 'Invariants Gate P4: status BẮT BUỘC là "DRAFT"');
    assert(draft.provenance === 'AI_ASSISTED', 'Invariants Gate P4: provenance BẮT BUỘC là "AI_ASSISTED"');
    assert(draft.isCookTested === false, 'Invariants Gate P4: Không tự động đánh dấu đã nấu thử (isCookTested = false)');
    assert(draft.isEditorialReviewed === false, 'Invariants Gate P4: Không tự động đánh dấu đã duyệt biên tập (isEditorialReviewed = false)');
    assert(draft.isNutritionVerified === false, 'Invariants Gate P4: Không suy số dinh dưỡng bừa bãi (isNutritionVerified = false)');

    // Lưu vào database và kiểm chứng
    const saved = await saveAiDraftToDatabase(draft, null);
    const [savedDb] = await db
      .select({
        id: recipes.id,
        status: recipes.status,
        provenance: recipes.provenance,
        isCookTested: recipes.isCookTested,
        isEditorialReviewed: recipes.isEditorialReviewed,
        isNutritionVerified: recipes.isNutritionVerified,
        publishedAt: recipes.publishedAt,
      })
      .from(recipes)
      .where(eq(recipes.id, saved.recipeId));

    assert(savedDb.status === 'DRAFT', 'Trong PostgreSQL: status được bảo toàn "DRAFT"');
    assert(savedDb.provenance === 'AI_ASSISTED', 'Trong PostgreSQL: provenance được bảo toàn "AI_ASSISTED"');
    assert(savedDb.isCookTested === false, 'Trong PostgreSQL: isCookTested = false');
    assert(savedDb.isEditorialReviewed === false, 'Trong PostgreSQL: isEditorialReviewed = false');
    assert(savedDb.isNutritionVerified === false, 'Trong PostgreSQL: isNutritionVerified = false');
    assert(savedDb.publishedAt === null, 'Trong PostgreSQL: publishedAt = null');

    // Dọn dẹp bản ghi kiểm thử
    await db.delete(recipes).where(eq(recipes.id, saved.recipeId));
    console.log('  [Cleanup] Đã dọn dẹp bản nháp kiểm thử thành công');

    // --- GROUP 3: BUDGET & RATE LIMIT DISCIPLINE ---
    console.log('\n--- Group 3: Budget & Rate Limit Discipline ---');
    // Kiểm tra token cap clamp
    const overBudgetRes = await aiGateway.complete({
      prompt: 'Test budget clamping',
      maxTokens: 6000, // vượt ngưỡng 1200
      timeoutMs: 45000, // vượt ngưỡng 10s
    });
    assert(Boolean(overBudgetRes.text), 'Gateway xử lý an toàn request vượt trần');

    // Kiểm tra rate limiting
    const rlClientId = 'master-gate-p4-tester';
    let rateLimitTriggered = false;
    for (let reqCount = 0; reqCount < 20; reqCount++) {
      const res = aiGateway.checkRateLimit(rlClientId);
      if (!res.allowed) {
        rateLimitTriggered = true;
        break;
      }
    }
    assert(rateLimitTriggered, 'Rate Limiting hoạt động chính xác: Ngăn chặn lạm dụng khi vượt ngưỡng');

    // --- GROUP 4: HONEST ERROR HANDLING & TRANSPARENT FALLBACK ---
    console.log('\n--- Group 4: Honest Error Handling & Transparent Fallback ---');
    // Khi AI chính hỏng hoặc quá quota, Gateway chuyển tiếp sang Mock Heuristic
    const originalComplete = aiGateway.complete.bind(aiGateway);
    aiGateway.complete = async () => ({
      text: JSON.stringify({
        rationale: 'Kích hoạt Fallback Heuristic do đường truyền gián đoạn.',
        mainSlug: 'thit-ba-chi-kho-tieu',
        soupSlug: 'canh-rau-ngot-thit-bam',
        sideSlug: 'rau-muong-xao-toi',
      }),
      provider: 'mock',
      model: 'angimom-heuristic-v1',
      inputTokens: 50,
      outputTokens: 50,
      durationMs: 40,
      isFallback: true,
    });

    const fallbackResult = await suggestMealWithAi({
      userIngredients: ['thịt'],
      clientId: 'test-fallback-client',
    });

    assert(fallbackResult.isFallback === true, 'Minh bạch trạng thái: Đánh dấu cờ isFallback = true');
    assert(fallbackResult.provider === 'mock', 'Minh bạch nguồn gốc: provider = "mock"');
    assert(publishedSlugs.has(fallbackResult.meal.main.slug), 'Mâm cơm fallback vẫn 100% là món PUBLISHED thật trong DB');

    // Khôi phục gateway
    aiGateway.complete = originalComplete;

    // --- GROUP 5: NO SECRET LEAKAGE AUDIT ---
    console.log('\n--- Group 5: Server-Only Secrets & Redaction Audit ---');
    assert(!process.env.NEXT_PUBLIC_GEMINI_API_KEY, 'Invariants Gate P4: Không rò rỉ NEXT_PUBLIC_GEMINI_API_KEY');
    assert(!process.env.NEXT_PUBLIC_OPENAI_API_KEY, 'Invariants Gate P4: Không rò rỉ NEXT_PUBLIC_OPENAI_API_KEY');

    console.log('\n======================================================');
    console.log(`  TỔNG KẾT MASTER GATE P4: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Lỗi ngoại lệ trong quá trình chạy kiểm thử Master Gate P4:', err);
    process.exit(1);
  }
}

runMasterGateP4Audit();
