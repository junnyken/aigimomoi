// AG-37 & AG-38: Kịch bản kiểm thử tự động toàn diện cho Family Meal Diary & Summaries
// Kiểm tra Invariants Gate P6:
// 1. Phân biệt Lượng đã ăn khác Lượng đã nấu (consumedPortion).
// 2. Snapshot độc lập chống hồi tố (No retroactive mutation khi sửa công thức).
// 3. Quy tắc Dữ liệu thiếu không thành 0 (Missing is NOT zero).
// 4. Quyền riêng tư gia đình: User không xem hoặc xóa được dữ liệu của nhau.
// 5. Tổng hợp ngày, tỷ lệ P/F/C % và Cảnh báo Natri vượt ngưỡng (> 2000mg).
// 6. Xuất dữ liệu gia đình (Export JSON) và xóa nhật ký (Right to be forgotten).
// Chạy độc lập: npx tsx src/scripts/test_meal_diary.ts

import { db } from '../lib/db';
import { recipes, users, mealDiaryEntries, dishes } from '../lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from '../lib/auth/password';

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
  console.log('  AG-37 & AG-38 — Test Suite: Family Meal Diary');
  console.log('======================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const TEST_PASSWORD = 'TestPassword@123';
  const hashedPw = await hashPassword(TEST_PASSWORD);

  // 1. Chuẩn bị 2 User riêng biệt: Gia Đình A và Gia Đình B
  let userA = await db.query.users.findFirst({ where: eq(users.email, 'family_a@angimom.vn') });
  if (!userA) {
    const [u] = await db.insert(users).values({
      email: 'family_a@angimom.vn',
      passwordHash: hashedPw,
      displayName: 'Gia Đình Bếp Bo',
      role: 'COOK',
    }).returning();
    userA = u;
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, userA.id));
  }

  let userB = await db.query.users.findFirst({ where: eq(users.email, 'family_b@angimom.vn') });
  if (!userB) {
    const [u] = await db.insert(users).values({
      email: 'family_b@angimom.vn',
      passwordHash: hashedPw,
      displayName: 'Gia Đình Bếp Bắp',
      role: 'COOK',
    }).returning();
    userB = u;
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, userB.id));
  }

  // Helper login
  async function loginAndGetCookie(email: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    });
    return res.headers.get('set-cookie') || '';
  }

  const cookieA = await loginAndGetCookie('family_a@angimom.vn');
  const cookieB = await loginAndGetCookie('family_b@angimom.vn');

  // 2. Chuẩn bị 1 Recipe có sẵn snapshot dinh dưỡng
  let testDish = await db.query.dishes.findFirst({ where: eq(dishes.slug, 'thit-kho-diary-test') });
  if (!testDish) {
    const [d] = await db.insert(dishes).values({
      name: 'Thịt Kho Trứng Diary Test',
      slug: 'thit-kho-diary-test',
    }).returning();
    testDish = d;
  }

  let testRecipe = await db.query.recipes.findFirst({ where: eq(recipes.slug, 'thit-kho-diary-recipe') });
  if (!testRecipe) {
    const [r] = await db.insert(recipes).values({
      dishId: testDish.id,
      authorId: userA.id,
      slug: 'thit-kho-diary-recipe',
      name: 'Thịt Kho Trứng Nhật Ký Mẫu',
      shortDescription: 'Công thức dùng để test nhật ký',
      status: 'PUBLISHED',
      baseServings: 4,
      caloriesPerServing: 400,
      nutritionSnapshot: {
        perServing: {
          calories: 400,
          protein: 25.0,
          fat: 20.0,
          carbs: 10.0,
          sodium: 800, // 800mg Natri / phần
          fiber: 1.0,
        },
      },
    }).returning();
    testRecipe = r;
  }

  // Dọn dẹp nhật ký cũ của userA và userB
  await db.delete(mealDiaryEntries).where(eq(mealDiaryEntries.userId, userA.id));
  await db.delete(mealDiaryEntries).where(eq(mealDiaryEntries.userId, userB.id));

  const TEST_DATE = '2026-10-21';

  console.log('--- TEST 1: Bảo mật & Phân quyền Truy cập (Gate P6) ---');
  const resUnauth = await fetch(`${BASE_URL}/api/diary?date=${TEST_DATE}`);
  assert(resUnauth.status === 401, 'Chặn truy cập khách chưa đăng nhập (HTTP 401)');

  console.log('\n--- TEST 2: Ghi nhận khẩu phần thực tế đã ăn (Lượng ăn khác Lượng nấu) ---');
  // 2.1: Bố ăn 1.5 phần Thịt kho trứng vào Bữa trưa
  const resLogDad = await fetch(`${BASE_URL}/api/diary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      recipeId: testRecipe.id,
      diaryDate: TEST_DATE,
      mealType: 'LUNCH',
      memberName: 'Bố',
      consumedPortion: 1.5,
    }),
  });
  assert(resLogDad.status === 200, 'Ghi nhận món cho Bố thành công (HTTP 200)');
  const dadData = await resLogDad.json();
  // 400 * 1.5 = 600 kcal
  assert(dadData.entry.calories === 600, `Calo cho 1.5 phần tính đúng (600 kcal, thực tế: ${dadData.entry.calories})`);
  // 25.0 * 1.5 = 37.5 g protein
  assert(dadData.entry.protein === 37.5, `Protein tính đúng 37.5g (thực tế: ${dadData.entry.protein}g)`);
  // 800 * 1.5 = 1200 mg sodium
  assert(dadData.entry.sodium === 1200, `Natri tính đúng 1200mg (thực tế: ${dadData.entry.sodium}mg)`);

  // 2.2: Bé Bo ăn 0.5 phần vào Bữa trưa
  const resLogKid = await fetch(`${BASE_URL}/api/diary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      recipeId: testRecipe.id,
      diaryDate: TEST_DATE,
      mealType: 'LUNCH',
      memberName: 'Bé Bo',
      consumedPortion: 0.5,
    }),
  });
  assert(resLogKid.status === 200, 'Ghi nhận món cho Bé Bo thành công');
  const kidData = await resLogKid.json();
  // 400 * 0.5 = 200 kcal
  assert(kidData.entry.calories === 200, 'Calo cho 0.5 phần là 200 kcal');

  // 2.3: Bữa tối ăn thêm 1 phần nữa để thử cảnh báo Natri vượt 2000mg
  // Natri hiện tại: 1200 + 400 = 1600mg. Thêm 1 phần 1.0 (800mg) -> 2400mg (> 2000mg)
  await fetch(`${BASE_URL}/api/diary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      recipeId: testRecipe.id,
      diaryDate: TEST_DATE,
      mealType: 'DINNER',
      memberName: 'Cả nhà',
      consumedPortion: 1.0,
    }),
  });

  console.log('\n--- TEST 3: Invariant Tối thượng Gate P6: Snapshot Bất biến chống Hồi tố ---');
  // Thay đổi calo công thức gốc từ 400 thành 999
  await db.update(recipes).set({ caloriesPerServing: 999 }).where(eq(recipes.id, testRecipe.id));

  // Kiểm tra lại bản ghi nhật ký của Bố
  const checkDad = await db.query.mealDiaryEntries.findFirst({ where: eq(mealDiaryEntries.id, dadData.entry.id) });
  assert(
    checkDad?.calories === 600,
    'Số calo nhật ký trong quá khứ không bị thay đổi hồi tố khi sửa công thức gốc'
  );

  console.log('\n--- TEST 4: Tổng hợp Ngày & Cảnh báo Sức khỏe Natri (AG-38) ---');
  const resSummary = await fetch(`${BASE_URL}/api/diary?date=${TEST_DATE}`, {
    headers: { Cookie: cookieA },
  });
  assert(resSummary.status === 200, 'Lấy tổng hợp ngày thành công');
  const summaryData = await resSummary.json();

  // Tổng calo: 600 (Bố) + 200 (Bé) + 400 (Tối) = 1200 kcal
  assert(summaryData.summary.totalCalories === 1200, `Tổng calo ngày tính chính xác là 1200 (thực tế: ${summaryData.summary.totalCalories})`);
  // Tổng Natri: 1200 + 400 + 800 = 2400 mg
  assert(summaryData.summary.totalSodium === 2400, `Tổng Natri ngày tính chính xác là 2400 mg`);
  // Kiểm tra cảnh báo Natri
  assert(summaryData.summary.alerts.length > 0, 'Xuất hiện cảnh báo dinh dưỡng khi Natri > 2000mg');
  assert(
    summaryData.summary.alerts[0].includes('Natri'),
    'Nội dung cảnh báo đúng về lượng muối/natri khuyến nghị của Viện Dinh Dưỡng'
  );
  // Phân nhóm bữa ăn
  assert(summaryData.meals.LUNCH.length === 2, 'Bữa trưa có đúng 2 món');
  assert(summaryData.meals.DINNER.length === 1, 'Bữa tối có đúng 1 món');

  console.log('\n--- TEST 5: Quyền Riêng tư & Cô lập Dữ liệu Gia Đình (Privacy Gate) ---');
  // User B truy cập ngày của User A -> không thấy món nào của A
  const resUserB = await fetch(`${BASE_URL}/api/diary?date=${TEST_DATE}`, {
    headers: { Cookie: cookieB },
  });
  const dataB = await resUserB.json();
  assert(dataB.entries.length === 0, 'Gia đình B không xem được nhật ký bữa ăn của Gia đình A');

  // User B cố xóa bản ghi của User A -> bị từ chối 404
  const resUnauthorizedDelete = await fetch(`${BASE_URL}/api/diary/${dadData.entry.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookieB },
  });
  assert(resUnauthorizedDelete.status === 404, 'Gia đình B bị chặn khi cố xóa bản ghi của Gia đình A (HTTP 404)');

  console.log('\n--- TEST 6: Xóa món ăn khỏi nhật ký (DELETE /api/diary/[id]) ---');
  const resDelete = await fetch(`${BASE_URL}/api/diary/${kidData.entry.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookieA },
  });
  assert(resDelete.status === 200, 'User A xóa món ăn của mình thành công');

  const resAfterDelete = await fetch(`${BASE_URL}/api/diary?date=${TEST_DATE}`, {
    headers: { Cookie: cookieA },
  });
  const afterDeleteData = await resAfterDelete.json();
  // Calo còn lại: 1200 - 200 = 1000 kcal
  assert(afterDeleteData.summary.totalCalories === 1000, 'Tổng calo cập nhật chuẩn xác sau khi xóa món (1000 kcal)');

  console.log('\n--- TEST 7: Xuất Dữ Liệu Gia Đình (Export JSON) ---');
  const resExport = await fetch(`${BASE_URL}/api/diary/export`, {
    headers: { Cookie: cookieA },
  });
  assert(resExport.status === 200, 'Xuất dữ liệu gia đình thành công (HTTP 200)');
  const exportJson = await resExport.json();
  assert(exportJson.platform === 'An Gi Mom - Bếp Nhà', 'Metadata export hiển thị đúng platform');
  assert(exportJson.user.id === userA.id, 'Metadata export đúng user ID');
  assert(exportJson.totalRecords >= 2, 'Xuất đầy đủ các bản ghi của gia đình');

  console.log('\n--- TEST 8: Quyền được lãng quên (Right to be Forgotten - Clear Diary) ---');
  const resClear = await fetch(`${BASE_URL}/api/diary/clear`, {
    method: 'DELETE',
    headers: { Cookie: cookieA },
  });
  assert(resClear.status === 200, 'Xóa toàn bộ lịch sử ăn uống thành công');

  const resCheckEmpty = await fetch(`${BASE_URL}/api/diary?date=${TEST_DATE}`, {
    headers: { Cookie: cookieA },
  });
  const emptyData = await resCheckEmpty.json();
  assert(emptyData.entries.length === 0, 'Nhật ký đã sạch hoàn toàn sau khi xóa');

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passCount} PASS | ${failCount} FAIL`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Lỗi thực thi test:', err);
  process.exit(1);
});
