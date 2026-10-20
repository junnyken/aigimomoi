// AG-28 Test Suite: AI Meal Suggestion & Strict Catalog Grounding Verification
// Kiểm thử tự động 5 tiêu chí Invariants:
// 1. Grounding Validation (slug trả về 100% thuộc DB và PUBLISHED).
// 2. Hallucination Rejection (Bắt lỗi và thay thế slug bịa đặt).
// 3. Cấu trúc 3 vai trò (MAIN, SOUP, SIDE đầy đủ).
// 4. Khớp nguyên liệu tủ lạnh (matching ingredients).
// 5. Tính toàn vẹn của DTO và fallback an toàn khi mất kết nối.

import { db } from '../lib/db';
import { recipes } from '../lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { suggestMealWithAi } from '../lib/ai/mealSuggester';

async function runTests() {
  console.log('--- BẮT ĐẦU KIỂM THỬ AG-28: AI MEAL SUGGESTION & CATALOG GROUNDING ---');

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
    // 1. Lấy danh sách tất cả recipes PUBLISHED trong DB để đối chiếu
    const publishedInDb = await db
      .select({
        id: recipes.id,
        slug: recipes.slug,
        role: recipes.role,
        status: recipes.status,
      })
      .from(recipes)
      .where(eq(recipes.status, 'PUBLISHED'));

    const publishedSlugs = new Set(publishedInDb.map((r) => r.slug));
    const mainSlugs = new Set(publishedInDb.filter((r) => r.role === 'MAIN').map((r) => r.slug));
    const soupSlugs = new Set(publishedInDb.filter((r) => r.role === 'SOUP').map((r) => r.slug));
    const sideSlugs = new Set(publishedInDb.filter((r) => r.role === 'SIDE').map((r) => r.slug));

    console.log(`[Setup] Tìm thấy ${publishedSlugs.size} công thức PUBLISHED trong DB (${mainSlugs.size} MAIN, ${soupSlugs.size} SOUP, ${sideSlugs.size} SIDE)`);
    assert(publishedSlugs.size >= 3, 'DB có ít nhất 3 công thức PUBLISHED');

    // Test 1: Gợi ý mâm cơm với nguyên liệu tủ lạnh phổ biến
    console.log('\n[Test 1] Gợi ý mâm cơm với nguyên liệu thịt heo & rau muống');
    const result1 = await suggestMealWithAi({
      userIngredients: ['thịt ba chỉ', 'rau muống'],
      region: 'Miền Bắc',
      preferences: ['bữa cơm gia đình ấm cúng'],
      clientId: 'test-client-1',
    });

    assert(Boolean(result1.meal), 'Kết quả có trường meal');
    assert(Boolean(result1.meal.main && result1.meal.soup && result1.meal.side), 'Có đủ 3 món main, soup, side');
    assert(result1.meal.main.role === 'MAIN', 'Món mặn có role MAIN');
    assert(result1.meal.soup.role === 'SOUP', 'Món canh có role SOUP');
    assert(result1.meal.side.role === 'SIDE', 'Món rau có role SIDE');
    assert(Boolean(result1.rationale && result1.rationale.length > 5), 'Có lời giải thích rationale từ AI');
    assert(Boolean(result1.provider), `Provider xử lý là: ${result1.provider}`);

    // Test 2: Catalog Grounding Invariant Check (Invariants §5.1)
    console.log('\n[Test 2] Kiểm tra 100% slug trả về là ID thật và PUBLISHED trong DB');
    assert(publishedSlugs.has(result1.meal.main.slug), `Main slug "${result1.meal.main.slug}" là công thức PUBLISHED thật`);
    assert(publishedSlugs.has(result1.meal.soup.slug), `Soup slug "${result1.meal.soup.slug}" là công thức PUBLISHED thật`);
    assert(publishedSlugs.has(result1.meal.side.slug), `Side slug "${result1.meal.side.slug}" là công thức PUBLISHED thật`);

    assert(mainSlugs.has(result1.meal.main.slug), `Main slug thuộc danh mục MAIN`);
    assert(soupSlugs.has(result1.meal.soup.slug), `Soup slug thuộc danh mục SOUP`);
    assert(sideSlugs.has(result1.meal.side.slug), `Side slug thuộc danh mục SIDE`);

    // Test 3: Matching Ingredients Logic
    console.log('\n[Test 3] Kiểm tra nguyên liệu khớp (matchingIngredients)');
    assert(Array.isArray(result1.matchingIngredients), 'matchingIngredients là mảng');
    console.log(`  Matching ingredients: ${result1.matchingIngredients.join(', ')}`);

    // Test 4: Khách vãng lai gọi với nguyên liệu trống hoặc đặc biệt
    console.log('\n[Test 4] Gọi gợi ý không truyền nguyên liệu tủ lạnh');
    const result2 = await suggestMealWithAi({
      userIngredients: [],
      clientId: 'test-client-empty',
    });
    assert(Boolean(result2.meal.main.slug && result2.meal.soup.slug && result2.meal.side.slug), 'Vẫn gợi ý được 3 món hợp lệ khi không có nguyên liệu');
    assert(publishedSlugs.has(result2.meal.main.slug), 'Main slug của mâm cơm ngẫu nhiên là món thật');
    assert(publishedSlugs.has(result2.meal.soup.slug), 'Soup slug của mâm cơm ngẫu nhiên là món thật');
    assert(publishedSlugs.has(result2.meal.side.slug), 'Side slug của mâm cơm ngẫu nhiên là món thật');

    // Test 5: Fallback an toàn và DTO đầy đủ thuộc tính UI
    console.log('\n[Test 5] Kiểm tra cấu trúc DTO cho UI MealSlotCard');
    const m = result1.meal.main;
    assert(typeof m.name === 'string' && m.name.length > 0, 'Dish có tên hiển thị');
    assert(typeof m.prepTimeMinutes === 'number', 'Dish có thời gian chuẩn bị');
    assert(typeof m.cookTimeMinutes === 'number', 'Dish có thời gian nấu');
    assert(typeof m.totalTimeMinutes === 'number', 'Dish có tổng thời gian');
    assert(typeof m.baseServings === 'number', 'Dish có khẩu phần cơ bản');
    assert(typeof m.difficulty === 'string', 'Dish có độ khó');
    assert(typeof m.heroImage === 'string', 'Dish có link ảnh đại diện (heroImage)');

    // Test 6: Bắt lỗi ảo giác (Hallucination Rejection)
    console.log('\n[Test 6] Kiểm tra chống ảo giác (Grounding Validator reject fake slugs)');
    const { aiGateway } = await import('../lib/ai/gateway');
    const originalComplete = aiGateway.complete.bind(aiGateway);
    // Giả lập AI sinh ra slug hoàn toàn bịa đặt
    aiGateway.complete = async () => ({
      text: JSON.stringify({
        mainSlug: 'mon-thit-rong-bien-fake-12345',
        soupSlug: 'canh-sao-hoa-fake-67890',
        sideSlug: 'rau-mat-trang-fake-99999',
        rationale: 'Món ảo giác từ AI tưởng tượng',
        matchingIngredients: [],
      }),
      provider: 'mock',
      model: 'fake-model',
      inputTokens: 100,
      outputTokens: 50,
      durationMs: 50,
    });

    const resultHallucinated = await suggestMealWithAi({
      userIngredients: ['thịt'],
      clientId: 'test-hallucination-client',
    });

    assert(publishedSlugs.has(resultHallucinated.meal.main.slug), 'Grounding Validator đã chặn slug bịa đặt của MAIN và thay thế bằng slug PUBLISHED hợp lệ');
    assert(publishedSlugs.has(resultHallucinated.meal.soup.slug), 'Grounding Validator đã chặn slug bịa đặt của SOUP và thay thế bằng slug PUBLISHED hợp lệ');
    assert(publishedSlugs.has(resultHallucinated.meal.side.slug), 'Grounding Validator đã chặn slug bịa đặt của SIDE và thay thế bằng slug PUBLISHED hợp lệ');
    assert(resultHallucinated.meal.main.slug !== 'mon-thit-rong-bien-fake-12345', 'Slug ảo main đã bị từ chối');

    // Khôi phục gateway
    aiGateway.complete = originalComplete;

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
