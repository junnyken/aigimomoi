// AG-39, AG-40, AG-41: Automated Test Suite for Phase P7
// Chạy: npx tsx src/scripts/test_p7_catalog_pantry_planner.ts

import { db, closeDb } from '../lib/db';
import { users, recipes, pantryItems, mealPlans, mealDiaryEntries, taxonomies } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from '../lib/auth/password';

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

async function runTests() {
  console.log('\n======================================================');
  console.log('  AG-39, AG-40, AG-41 — Test Suite: Phase P7');
  console.log('======================================================\n');

  const baseUrl = 'http://localhost:3000';
  const TEST_PASSWORD = 'TestPassword@123';
  const hashedPw = await hashPassword(TEST_PASSWORD);

  // Chuẩn bị User test A và User test B
  let [userA] = await db.select().from(users).where(eq(users.email, 'p7_user_a@angimom.vn')).limit(1);
  if (!userA) {
    [userA] = await db.insert(users).values({
      email: 'p7_user_a@angimom.vn',
      displayName: 'Mẹ Bắp P7',
      passwordHash: hashedPw,
      role: 'COOK',
    }).returning();
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, userA.id));
  }

  let [userB] = await db.select().from(users).where(eq(users.email, 'p7_user_b@angimom.vn')).limit(1);
  if (!userB) {
    [userB] = await db.insert(users).values({
      email: 'p7_user_b@angimom.vn',
      displayName: 'Bác Ba P7',
      passwordHash: hashedPw,
      role: 'COOK',
    }).returning();
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, userB.id));
  }

  async function loginAndGetCookie(email: string): Promise<string> {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    });
    return res.headers.get('set-cookie') || '';
  }

  const cookieA = await loginAndGetCookie('p7_user_a@angimom.vn');
  const cookieB = await loginAndGetCookie('p7_user_b@angimom.vn');

  const headersA = { 'Content-Type': 'application/json', 'Cookie': cookieA };
  const headersB = { 'Content-Type': 'application/json', 'Cookie': cookieB };


  // Dọn dẹp dữ liệu test cũ
  await db.delete(pantryItems).where(eq(pantryItems.userId, userA.id));
  await db.delete(pantryItems).where(eq(pantryItems.userId, userB.id));
  await db.delete(mealPlans).where(eq(mealPlans.userId, userA.id));
  await db.delete(mealPlans).where(eq(mealPlans.userId, userB.id));
  await db.delete(mealDiaryEntries).where(eq(mealDiaryEntries.userId, userA.id));

  // =========================================================================
  // TEST PHẦN 1: MỞ RỘNG CATALOG (AG-39)
  // =========================================================================
  console.log('--- TEST 1: Mở rộng Catalog (AG-39: Món nước, Món chay, Đồ uống, Tráng miệng) ---');

  // Lấy danh sách món nước
  const phoBo = await db.query.recipes.findFirst({
    where: eq(recipes.slug, 'pho-bo-ha-noi-truyen-thong'),
  });
  assert(!!phoBo, 'Món Phở bò Hà Nội tồn tại trong catalog');
  assert(phoBo?.role === 'ONE_DISH_MEAL', 'Phở bò có vai trò ONE_DISH_MEAL (Món nước trọn bữa)');

  const bunBo = await db.query.recipes.findFirst({
    where: eq(recipes.slug, 'bun-bo-hue-chuan-vi-co-do'),
  });
  assert(!!bunBo, 'Món Bún bò Huế tồn tại trong catalog');
  assert(bunBo?.role === 'ONE_DISH_MEAL', 'Bún bò Huế có vai trò ONE_DISH_MEAL');

  const dauHuChay = await db.query.recipes.findFirst({
    where: eq(recipes.slug, 'dau-hu-sot-ca-chua-chay-thanh-dam'),
    with: {
      tags: {
        with: {
          taxonomy: true,
        },
      },
    },
  });
  assert(!!dauHuChay, 'Món Đậu hũ sốt cà chua chay tồn tại');
  const hasVeganTag = dauHuChay?.tags?.some((t) => t.taxonomy.slug === 'an-chay-thuan');
  assert(Boolean(hasVeganTag), 'Món Đậu hũ có nhãn ăn chay thuần (Vegan) chuẩn mực');

  const cheBuoi = await db.query.recipes.findFirst({
    where: eq(recipes.slug, 'che-buoi-an-giang-gion-san-sat'),
  });
  assert(cheBuoi?.role === 'DESSERT', 'Chè bưởi An Giang có vai trò DESSERT (Món tráng miệng)');

  const nuocSam = await db.query.recipes.findFirst({
    where: eq(recipes.slug, 'nuoc-sam-bi-dao-la-dua-hat-chia'),
  });
  assert(nuocSam?.role === 'BEVERAGE', 'Nước sâm bí đao có vai trò BEVERAGE (Đồ uống)');

  // =========================================================================
  // TEST PHẦN 2: KHO THỰC PHẨM & TỦ LẠNH GIA ĐÌNH (AG-40)
  // =========================================================================
  console.log('\n--- TEST 2: Quản lý Kho Thực phẩm & Tủ lạnh Gia đình (AG-40) ---');

  // 2.1 Bảo mật: Chặn khách chưa đăng nhập
  const resUnauth = await fetch(`${baseUrl}/api/pantry`);
  assert(resUnauth.status === 401, 'Chặn truy cập xem kho thực phẩm khi chưa đăng nhập (HTTP 401)');

  // 2.2 Thêm thực phẩm vào tủ lạnh
  const resAdd1 = await fetch(`${baseUrl}/api/pantry`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      customName: 'Thịt bò phi lê',
      quantity: 500,
      unit: 'g',
      location: 'FREEZER',
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  assert(resAdd1.status === 201, 'Thêm Thịt bò phi lê vào Tủ đông thành công (HTTP 201)');
  const item1Data = await resAdd1.json();
  const item1Id = item1Data.item.id;

  // Thêm món sắp hết hạn (1 ngày nữa)
  const resAdd2 = await fetch(`${baseUrl}/api/pantry`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      customName: 'Hành lá tươi',
      quantity: 100,
      unit: 'g',
      location: 'FRIDGE',
      expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  const item2Data = await resAdd2.json();

  // 2.3 Lấy danh sách pantry & kiểm tra cờ cận date
  const resGetPantry = await fetch(`${baseUrl}/api/pantry`, { headers: headersA });
  assert(resGetPantry.status === 200, 'Lấy danh sách tủ lạnh thành công (HTTP 200)');
  const pantryData = await resGetPantry.json();
  assert(pantryData.items.length === 2, 'Tủ lạnh có đúng 2 mặt hàng');
  assert(pantryData.stats.freezerCount === 1, 'Thống kê có 1 món ngăn đông');
  assert(pantryData.stats.expiringSoonCount === 1, 'Phát hiện chính xác 1 món sắp hết hạn trong 3 ngày');

  // 2.4 Cập nhật số lượng
  const resUpdate = await fetch(`${baseUrl}/api/pantry/${item1Id}`, {
    method: 'PUT',
    headers: headersA,
    body: JSON.stringify({ quantity: 800 }),
  });
  assert(resUpdate.status === 200, 'Cập nhật số lượng thực phẩm thành công');
  const updatedItem = await resUpdate.json();
  assert(updatedItem.item.quantity === 800, 'Số lượng cập nhật chính xác là 800g');

  // 2.5 Đối chiếu công thức với Tủ lạnh (Smart Matching)
  if (phoBo) {
    const resCheck = await fetch(`${baseUrl}/api/recipes/${phoBo.id}/pantry-check`, { headers: headersA });
    assert(resCheck.status === 200, 'Đối chiếu nguyên liệu món Phở bò với tủ lạnh thành công (HTTP 200)');
    const checkData = await resCheck.json();
    assert(checkData.availableCount >= 1, 'Hệ thống nhận diện được nguyên liệu có sẵn trong nhà');
    assert(checkData.matchedIngredients.some((m: any) => m.name.toLowerCase().includes('bò')), 'Nhận diện đúng Thịt bò đã có trong tủ');
  }

  // 2.6 Đồng bộ từ Giỏ hàng sang Tủ lạnh (Sync from Shopping)
  const resSync = await fetch(`${baseUrl}/api/pantry/sync-from-shopping`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      items: [
        { name: 'Cà chua chín', quantity: 1, unit: 'kg', category: 'Rau củ tươi' },
        { name: 'Nước mắm truyền thống', quantity: 1, unit: 'chai', category: 'Gia vị cơ bản' },
      ],
    }),
  });
  assert(resSync.status === 200, 'Chuyển nguyên liệu từ Giỏ hàng vào Tủ lạnh thành công (HTTP 200)');
  const syncData = await resSync.json();
  assert(syncData.items.length === 2, 'Đã chuyển đủ 2 món vào kho');

  // 2.7 Quyền riêng tư: User B không thể sửa hoặc xóa đồ của User A
  const resHacker = await fetch(`${baseUrl}/api/pantry/${item1Id}`, {
    method: 'DELETE',
    headers: headersB,
  });
  assert(resHacker.status === 404, 'Chặn User B xóa đồ trong tủ lạnh của User A (HTTP 404)');

  // =========================================================================
  // TEST PHẦN 3: LẬP KẾ HOẠCH BỮA CƠM TUẦN (AG-41)
  // =========================================================================
  console.log('\n--- TEST 3: Lập Kế Hoạch Bữa Cơm Tuần (AG-41) ---');

  // 3.1 Thêm món vào kế hoạch tuần
  const mondayStr = '2026-10-26';
  const tuesdayStr = '2026-10-27';

  const resPlan1 = await fetch(`${baseUrl}/api/meal-plans`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      planDate: mondayStr,
      dayOfWeek: 1,
      mealType: 'LUNCH',
      recipeId: phoBo ? phoBo.id : null,
      servings: 4,
      notes: 'Bữa trưa đầu tuần cả nhà ăn phở',
    }),
  });
  assert(resPlan1.status === 201, 'Lên kế hoạch bữa trưa Thứ 2 ăn Phở bò thành công (HTTP 201)');
  const plan1Data = await resPlan1.json();
  const plan1Id = plan1Data.plan.id;

  const resPlan2 = await fetch(`${baseUrl}/api/meal-plans`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      planDate: tuesdayStr,
      dayOfWeek: 2,
      mealType: 'DINNER',
      recipeId: dauHuChay ? dauHuChay.id : null,
      servings: 4,
      notes: 'Bữa tối thanh đạm',
    }),
  });
  assert(resPlan2.status === 201, 'Lên kế hoạch bữa tối Thứ 3 ăn Đậu hũ chay thành công');
  const plan2Data = await resPlan2.json();
  const plan2Id = plan2Data.plan.id;

  // 3.2 Lấy danh sách kế hoạch tuần
  const resGetPlans = await fetch(`${baseUrl}/api/meal-plans?weekStart=${mondayStr}`, { headers: headersA });
  assert(resGetPlans.status === 200, 'Lấy kế hoạch tuần 7 ngày thành công (HTTP 200)');
  const weekPlansData = await resGetPlans.json();
  assert(weekPlansData.plans.length === 2, 'Tuần có đúng 2 bữa ăn được lên lịch');

  // 3.3 Tổng hợp nguyên liệu tuần sang Giỏ đi chợ (AG-41 to Shopping)
  const resToShopping = await fetch(`${baseUrl}/api/meal-plans/to-shopping`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({
      weekStart: mondayStr,
      excludePantry: true,
    }),
  });
  assert(resToShopping.status === 200, 'Tổng hợp nguyên liệu tuần vào Giỏ đi chợ thành công (HTTP 200)');
  const shoppingAggData = await resToShopping.json();
  assert(shoppingAggData.totalItems > 0, 'Giỏ đi chợ tổng hợp có nguyên liệu');
  assert(shoppingAggData.items.some((i: any) => i.name.toLowerCase().includes('bò') && i.inPantry === true), 'Hệ thống đánh dấu chính xác Thịt bò đã có sẵn trong tủ lạnh');

  // 3.4 Đánh dấu đã nấu xong & 1-chạm ghi nhật ký dinh dưỡng (Planner to Diary)
  const resLogDiary = await fetch(`${baseUrl}/api/meal-plans/${plan1Id}/log-to-diary`, {
    method: 'POST',
    headers: headersA,
  });
  const logDiaryText = await resLogDiary.text();
  let logDiaryData: any = {};
  try {
    logDiaryData = JSON.parse(logDiaryText);
  } catch (e) {
    console.error('LogDiary parse error, raw:', logDiaryText);
  }
  assert(resLogDiary.status === 200, `Hoàn thành món trong kế hoạch và ghi vào Nhật ký dinh dưỡng thành công (HTTP ${resLogDiary.status}: ${logDiaryText})`);
  assert(!!logDiaryData.diaryEntry, 'Bản ghi nhật ký đã được tự động khởi tạo');
  assert(logDiaryData.diaryEntry.mealType === 'LUNCH', 'Ghi chuẩn xác vào Bữa trưa');
  assert(logDiaryData.diaryEntry.calories > 0, 'Dinh dưỡng calo được sao chụp chuẩn xác');

  // Kiểm tra bảng meal_plans cập nhật isCompleted
  const checkCompleted = await db.query.mealPlans.findFirst({ where: eq(mealPlans.id, plan1Id) });
  assert(checkCompleted?.isCompleted === true, 'Kế hoạch món ăn đã được chuyển sang trạng thái HOÀN THÀNH');

  // 3.5 Quyền riêng tư: User B không thể xóa kế hoạch của User A
  const resHackerPlan = await fetch(`${baseUrl}/api/meal-plans/${plan2Id}`, {
    method: 'DELETE',
    headers: headersB,
  });
  assert(resHackerPlan.status === 404, 'Chặn User B xóa kế hoạch của User A (HTTP 404)');

  // User A tự xóa
  const resDelA = await fetch(`${baseUrl}/api/meal-plans/${plan2Id}`, {
    method: 'DELETE',
    headers: headersA,
  });
  assert(resDelA.status === 200, 'User A tự xóa món khỏi kế hoạch thành công (HTTP 200)');

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passed} PASS | ${failed} FAIL`);
  console.log('======================================================\n');

  await closeDb();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
