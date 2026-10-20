// AG-34: Kịch bản kiểm thử tự động toàn diện cho Tính năng Cooked-it Feedback & Photos
// Kiểm tra Invariants Gate P5:
// 1. Khách vãng lai gửi feedback và ảnh thành phẩm vào hàng đợi (PENDING).
// 2. Chặn các giá trị sao không hợp lệ (<1 hoặc >5).
// 3. User đăng nhập gửi feedback: ảnh thì PENDING, text sạch thì APPROVED.
// 4. API công khai GET /api/recipes/[id]/feedback chỉ trả feedback APPROVED và tính thống kê trung thực.
// 5. Phân quyền: COOK bị chặn 403 khi vào hàng đợi duyệt /api/editor/feedbacks.
// 6. EDITOR xem danh sách và duyệt ảnh thành phẩm (status -> APPROVED).
// 7. Feedback sau khi duyệt lập tức xuất hiện ở API công khai.
// 8. Chống spam: User nộp lại trên cùng công thức sẽ thực hiện Upsert.
// Chạy độc lập: npx tsx src/scripts/test_cooked_feedback.ts

import { db } from '../lib/db';
import { recipes, users, recipeCookedFeedbacks, dishes } from '../lib/db/schema';
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
  console.log('  AG-34 — Test Suite: Cooked-it Feedback & Photos');
  console.log('======================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const TEST_PASSWORD = 'TestPassword@123';
  const hashedPw = await hashPassword(TEST_PASSWORD);

  // 1. Chuẩn bị 1 Editor và 1 Cook
  let editor = await db.query.users.findFirst({
    where: eq(users.email, 'editor_ag34@angimom.vn'),
  });
  if (!editor) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'editor_ag34@angimom.vn',
        passwordHash: hashedPw,
        displayName: 'Biên Tập Viên Duyệt Ảnh',
        role: 'EDITOR',
      })
      .returning();
    editor = u;
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, editor.id));
  }

  let cookUser = await db.query.users.findFirst({
    where: eq(users.email, 'cook_ag34@angimom.vn'),
  });
  if (!cookUser) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'cook_ag34@angimom.vn',
        passwordHash: hashedPw,
        displayName: 'Mẹ Bắp Thích Nấu Ăn',
        role: 'COOK',
      })
      .returning();
    cookUser = u;
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, cookUser.id));
  }

  // 2. Chuẩn bị 1 công thức test PUBLISHED
  let testDish = await db.query.dishes.findFirst({
    where: eq(dishes.slug, 'mon-test-feedback-ag34'),
  });
  if (!testDish) {
    const [d] = await db
      .insert(dishes)
      .values({
        name: 'Món Test Đánh Giá Feedback',
        slug: 'mon-test-feedback-ag34',
        description: 'Món mẫu để kiểm thử tính năng nấu thử và ảnh thành phẩm',
      })
      .returning();
    testDish = d;
  }

  let testRecipe = await db.query.recipes.findFirst({
    where: eq(recipes.slug, 'mon-test-feedback-ag34-recipe'),
  });
  if (!testRecipe) {
    const [r] = await db
      .insert(recipes)
      .values({
        dishId: testDish.id,
        authorId: editor.id,
        slug: 'mon-test-feedback-ag34-recipe',
        name: 'Món Test Đánh Giá Feedback Chuẩn',
        shortDescription: 'Công thức dùng để test AG-34',
        status: 'PUBLISHED',
      })
      .returning();
    testRecipe = r;
  } else {
    await db
      .update(recipes)
      .set({ status: 'PUBLISHED' })
      .where(eq(recipes.id, testRecipe.id));
  }

  // Xóa sạch các feedback cũ của test recipe để kết quả test độc lập
  await db
    .delete(recipeCookedFeedbacks)
    .where(eq(recipeCookedFeedbacks.recipeId, testRecipe.id));

  // Helper login lấy session cookie
  async function loginAndGetCookie(email: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    });
    const setCookie = res.headers.get('set-cookie');
    return setCookie || '';
  }

  const editorCookie = await loginAndGetCookie('editor_ag34@angimom.vn');
  const cookCookie = await loginAndGetCookie('cook_ag34@angimom.vn');

  console.log('--- TEST 1: Validation đầu vào phản hồi nấu thử ---');
  // 1.1: Rating ngoài khoảng 1..5
  const resBadRating = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cookName: 'Khách Test',
      rating: 6, // Không hợp lệ
      notes: 'Thử chấm 6 sao',
    }),
  });
  assert(resBadRating.status === 400, 'Từ chối phản hồi có rating = 6 (HTTP 400)');

  // 1.2: Thiếu tên người nấu
  const resMissingName = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: 5,
    }),
  });
  assert(resMissingName.status === 400, 'Từ chối phản hồi không có tên người nấu (HTTP 400)');

  // 1.3: Recipe không tồn tại
  const resNotFound = await fetch(`${BASE_URL}/api/recipes/999999/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cookName: 'Khách Test',
      rating: 5,
    }),
  });
  assert(resNotFound.status === 404, 'Từ chối gửi phản hồi cho recipe không tồn tại (HTTP 404)');

  console.log('\n--- TEST 2: Khách vãng lai gửi ảnh thành phẩm và feedback (Invariants Gate P5) ---');
  const resGuest = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cookName: 'Chị Lan Hải Phòng',
      cookEmail: 'lanhp@gmail.com',
      rating: 5,
      notes: 'Mình kho lửa nhỏ 45 phút, nước sốt sánh keo rất ngon!',
      photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    }),
  });
  assert(resGuest.status === 200, 'Khách gửi phản hồi thành công (HTTP 200)');
  const guestData = await resGuest.json();
  assert(
    guestData.feedback.status === 'PENDING',
    'Phản hồi từ khách có ảnh thành phẩm mặc định PENDING để kiểm duyệt'
  );

  console.log('\n--- TEST 3: Độc giả đăng nhập gửi feedback text thuần ---');
  const resCookUser = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookCookie,
    },
    body: JSON.stringify({
      rating: 4,
      notes: 'Nhà mình ăn nhạt nên bớt 1 thìa nước mắm thì chuẩn vị.',
    }),
  });
  assert(resCookUser.status === 200, 'Thành viên gửi phản hồi thành công (HTTP 200)');
  const cookData = await resCookUser.json();
  assert(
    cookData.feedback.status === 'APPROVED',
    'Thành viên gửi text thuần không ảnh được auto-approve'
  );
  assert(
    cookData.feedback.userId === cookUser.id,
    'Phản hồi gắn chính xác userId của thành viên đăng nhập'
  );

  console.log('\n--- TEST 4: Danh mục công khai GET /api/recipes/[id]/feedback chỉ lộ APPROVED ---');
  const resPublic = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/feedback`);
  assert(resPublic.status === 200, 'Lấy danh sách phản hồi công khai (HTTP 200)');
  const publicData = await resPublic.json();
  
  assert(
    publicData.feedbacks.length === 1,
    `Chỉ có 1 feedback APPROVED được hiển thị (hiện có: ${publicData.feedbacks.length})`
  );
  assert(
    publicData.feedbacks[0].cookName === 'Mẹ Bắp Thích Nấu Ăn',
    'Feedback hiển thị chính là của thành viên được APPROVED'
  );
  assert(
    publicData.stats.totalCookedCount === 1,
    'Tổng số lượt nấu thống kê là 1'
  );
  assert(
    publicData.stats.averageRating === 4,
    'Điểm đánh giá trung bình tính toán chính xác là 4.0'
  );

  console.log('\n--- TEST 5: Phân quyền Hàng đợi Kiểm duyệt Feedback (Gate P5) ---');
  // COOK truy cập /api/editor/feedbacks -> 403
  const resCookForbidden = await fetch(`${BASE_URL}/api/editor/feedbacks`, {
    headers: { Cookie: cookCookie },
  });
  assert(
    resCookForbidden.status === 403,
    'Thành viên vai trò COOK bị chặn 403 khi vào hàng đợi kiểm duyệt ảnh'
  );

  // EDITOR truy cập -> 200
  const resEditorQueue = await fetch(`${BASE_URL}/api/editor/feedbacks?status=ALL`, {
    headers: { Cookie: editorCookie },
  });
  assert(resEditorQueue.status === 200, 'EDITOR truy cập hàng đợi thành công (HTTP 200)');
  const queueData = await resEditorQueue.json();
  assert(queueData.feedbacks.length >= 2, 'EDITOR nhìn thấy cả bài PENDING và APPROVED');

  console.log('\n--- TEST 6: EDITOR duyệt ảnh và feedback của khách ---');
  const guestFeedbackId = guestData.feedback.id;
  const resApprove = await fetch(`${BASE_URL}/api/editor/feedbacks/${guestFeedbackId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: editorCookie,
    },
    body: JSON.stringify({ status: 'APPROVED' }),
  });
  assert(resApprove.status === 200, 'EDITOR duyệt feedback thành công (HTTP 200)');

  // Kiểm tra lại danh mục công khai
  const resPublicAfter = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/feedback`);
  const publicAfterData = await resPublicAfter.json();
  assert(
    publicAfterData.feedbacks.length === 2,
    'Sau khi duyệt, công chúng nhìn thấy cả 2 phản hồi'
  );
  assert(
    publicAfterData.stats.totalCookedCount === 2,
    'Tổng số lượt nấu tăng lên 2'
  );
  // (4 + 5) / 2 = 4.5
  assert(
    publicAfterData.stats.averageRating === 4.5,
    `Điểm trung bình cập nhật thành 4.5 (thực tế: ${publicAfterData.stats.averageRating})`
  );

  console.log('\n--- TEST 7: Chống Spam & Upsert phản hồi của thành viên ---');
  const resUpdate = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookCookie,
    },
    body: JSON.stringify({
      rating: 5,
      notes: 'Lần 2 nấu cho cả nhà ăn ai cũng khen nức nở!',
    }),
  });
  assert(resUpdate.status === 200, 'Cập nhật phản hồi thành công');
  
  const resCheckDuplicates = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/feedback`);
  const checkData = await resCheckDuplicates.json();
  assert(
    checkData.feedbacks.length === 2,
    'Không tạo thêm bản ghi trùng lặp, duy trì đúng 2 phản hồi'
  );
  assert(
    checkData.stats.averageRating === 5,
    'Điểm trung bình cập nhật theo đánh giá mới (5 + 5)/2 = 5.0'
  );

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
