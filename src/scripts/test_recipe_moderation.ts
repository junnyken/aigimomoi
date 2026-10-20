// AG-32: Kịch bản kiểm thử tự động toàn diện cho Tính năng Kiểm duyệt Nội dung & Báo cáo Vi phạm
// Kiểm tra Invariants Gate P5:
// 1. Khách vãng lai gửi báo cáo vi phạm không bị ép đăng nhập.
// 2. Thành viên có session gửi báo cáo ghi nhận chính xác reporterId.
// 3. Phân quyền chặt chẽ: COOK bị chặn 403 khi vào hàng đợi kiểm duyệt /api/editor/reports.
// 4. EDITOR có quyền xem và xử lý báo cáo (RESOLVED, DISMISSED, TAKEDOWN).
// 5. Takedown tự động chuyển công thức sang NEEDS_CHANGES và biến mất khỏi catalog công khai.
// 6. Tác giả sửa đổi và nộp lại sau khi bị yêu cầu sửa.
// Chạy độc lập: npx tsx src/scripts/test_recipe_moderation.ts

import { db } from '../lib/db';
import { recipes, users, recipeReports, dishes } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../lib/auth/password';
import { queryPublishedRecipeBySlug } from '../lib/recipes/publicQueries';

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
  console.log('  AG-32 — Test Suite: Moderation & Abuse Reports');
  console.log('======================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const TEST_PASSWORD = 'TestPassword@123';
  const hashedPw = await hashPassword(TEST_PASSWORD);

  // 1. Chuẩn bị 1 Editor và 1 Contributor (Cook)
  let editor = await db.query.users.findFirst({
    where: eq(users.email, 'editor_ag32@angimom.vn'),
  });
  if (!editor) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'editor_ag32@angimom.vn',
        passwordHash: hashedPw,
        displayName: 'Biên Tập Viên Trưởng',
        role: 'EDITOR',
      })
      .returning();
    editor = u;
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, editor.id));
  }

  let contributor = await db.query.users.findFirst({
    where: eq(users.email, 'author_ag32@angimom.vn'),
  });
  if (!contributor) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'author_ag32@angimom.vn',
        passwordHash: hashedPw,
        displayName: 'Mẹ Bếp Nam Bộ',
        role: 'COOK',
      })
      .returning();
    contributor = u;
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, contributor.id));
  }

  // Đăng nhập lấy cookies
  const editorLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: editor.email, password: TEST_PASSWORD }),
  });
  const editorCookie = editorLogin.headers.get('set-cookie')?.split(';')[0] || '';

  const cookLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: contributor.email, password: TEST_PASSWORD }),
  });
  const cookCookie = cookLogin.headers.get('set-cookie')?.split(';')[0] || '';

  // 2. Tạo một món ăn mẫu ở trạng thái PUBLISHED để thử nghiệm báo cáo
  let testDish = await db.query.dishes.findFirst({
    where: eq(dishes.slug, 'test-dish-ag32'),
  });
  if (!testDish) {
    const [d] = await db
      .insert(dishes)
      .values({
        name: 'Món Thử Nghiệm Kiểm Duyệt',
        slug: 'test-dish-ag32',
        defaultRole: 'MAIN',
      })
      .returning();
    testDish = d;
  }

  const [testRecipe] = await db
    .insert(recipes)
    .values({
      dishId: testDish.id,
      slug: `test-recipe-moderation-${Date.now()}`,
      name: 'Thịt Kho Măng Có Lá Lạ',
      shortDescription: 'Công thức nấu thịt kho măng chứa nguyên liệu nghi vấn',
      role: 'MAIN',
      status: 'PUBLISHED',
      authorId: contributor.id,
      provenance: 'COMMUNITY_SUBMITTED',
      isEditorialReviewed: true,
      isCookTested: true,
      baseServings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 30,
    })
    .returning();

  let guestReportId: number | null = null;
  let cookReportId: number | null = null;

  // ----------------------------------------------------
  // TEST 1: Khách vãng lai gửi báo cáo vi phạm an toàn thực phẩm
  // ----------------------------------------------------
  console.log('Test 1: Khách vãng lai gửi báo cáo vi phạm an toàn thực phẩm');
  const guestReportRes = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reason: 'UNSAFE_FOOD',
      details: 'Lá lạ này có thể chứa độc tố nếu không nấu kỹ, đề nghị ban biên tập kiểm tra lại.',
      reporterEmail: 'khachhang@example.com',
    }),
  });
  const guestData = await guestReportRes.json();
  assert(guestReportRes.status === 200 && guestData.success === true, 'Khách gửi báo cáo thành công không cần login');
  guestReportId = guestData.reportId;
  assert(typeof guestReportId === 'number', `Report ID được tạo: ${guestReportId}`);

  if (guestReportId) {
    const rep = await db.query.recipeReports.findFirst({
      where: eq(recipeReports.id, guestReportId),
    });
    assert(rep?.status === 'PENDING', 'Trạng thái ban đầu của báo cáo là PENDING');
    assert(rep?.reporterId === null, 'reporterId của khách là null');
    assert(rep?.reporterEmail === 'khachhang@example.com', 'reporterEmail ghi nhận chính xác');
  }

  // ----------------------------------------------------
  // TEST 2: Thành viên đăng nhập gửi báo cáo vi phạm
  // ----------------------------------------------------
  console.log('\nTest 2: Thành viên đã đăng nhập gửi báo cáo vi phạm bản quyền');
  const userReportRes = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookCookie,
    },
    body: JSON.stringify({
      reason: 'COPYRIGHT',
      details: 'Ảnh bìa món ăn sao chép từ sách ẩm thực mà chưa được sự đồng ý.',
    }),
  });
  const userData = await userReportRes.json();
  assert(userReportRes.status === 200 && userData.success === true, 'Thành viên gửi báo cáo thành công');
  cookReportId = userData.reportId;

  if (cookReportId) {
    const rep = await db.query.recipeReports.findFirst({
      where: eq(recipeReports.id, cookReportId),
    });
    assert(rep?.reporterId === contributor.id, `reporterId gắn với user.id (${contributor.id})`);
  }

  // ----------------------------------------------------
  // TEST 3: Chặn báo cáo thiếu lý do hợp lệ
  // ----------------------------------------------------
  console.log('\nTest 3: Chặn báo cáo thiếu lý do hoặc không hợp lệ');
  const invalidRes = await fetch(`${BASE_URL}/api/recipes/${testRecipe.id}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reason: 'INVALID_REASON',
    }),
  });
  assert(invalidRes.status === 400, 'Trả về 400 Bad Request khi lý do không hợp lệ');

  // ----------------------------------------------------
  // TEST 4: Phân quyền - Người dùng thường (COOK) bị chặn vào hàng đợi kiểm duyệt
  // ----------------------------------------------------
  console.log('\nTest 4: Bảo vệ hàng đợi báo cáo (Chặn vai trò COOK - 403 Forbidden)');
  const cookAccessRes = await fetch(`${BASE_URL}/api/editor/reports`, {
    headers: { Cookie: cookCookie },
  });
  assert(cookAccessRes.status === 403, 'COOK bị chặn truy cập /api/editor/reports (HTTP 403)');

  // ----------------------------------------------------
  // TEST 5: Biên tập viên (EDITOR) xem danh sách báo cáo
  // ----------------------------------------------------
  console.log('\nTest 5: Biên tập viên xem danh sách hàng đợi báo cáo');
  const editorListRes = await fetch(`${BASE_URL}/api/editor/reports?status=PENDING`, {
    headers: { Cookie: editorCookie },
  });
  const editorListData = await editorListRes.json();
  assert(editorListRes.status === 200 && editorListData.success === true, 'EDITOR tải thành công danh sách báo cáo');
  assert(
    editorListData.reports.some((r: any) => r.id === guestReportId),
    'Báo cáo của khách hiển thị trong hàng đợi PENDING'
  );

  // ----------------------------------------------------
  // TEST 6: Biên tập viên thực hiện Takedown bài viết vi phạm
  // ----------------------------------------------------
  console.log('\nTest 6: Biên tập viên xử lý Takedown công thức về NEEDS_CHANGES');
  if (guestReportId) {
    const takedownRes = await fetch(`${BASE_URL}/api/editor/reports/${guestReportId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: editorCookie,
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        action: 'TAKEDOWN',
        moderatorNotes: 'Công thức dùng nguyên liệu chưa rõ nguồn gốc an toàn, yêu cầu thay thế bằng lá lốt thông dụng.',
      }),
    });
    const takedownData = await takedownRes.json();
    assert(takedownRes.status === 200 && takedownData.success === true, 'Xử lý báo cáo và gỡ bài thành công');

    // Kiểm tra trạng thái trong cơ sở dữ liệu
    const updatedRecipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, testRecipe.id),
    });
    assert(updatedRecipe?.status === 'NEEDS_CHANGES', 'Công thức đã chuyển sang trạng thái NEEDS_CHANGES');
    assert(
      Boolean(updatedRecipe?.reviewNotes?.includes('lá lốt')),
      'reviewNotes ghi nhận đúng hướng dẫn sửa đổi của Biên tập viên'
    );

    const updatedReport = await db.query.recipeReports.findFirst({
      where: eq(recipeReports.id, guestReportId),
    });
    assert(updatedReport?.status === 'RESOLVED', 'Báo cáo vi phạm đã chuyển sang RESOLVED');
    assert(updatedReport?.resolvedById === editor.id, 'resolvedById ghi nhận đúng ID của Biên tập viên');
  }

  // ----------------------------------------------------
  // TEST 7: Invariants §5.1 - Công thức bị gỡ không còn hiển thị công khai
  // ----------------------------------------------------
  console.log('\nTest 7: Invariants §5.1 - Công thức bị gỡ biến mất khỏi catalog công khai');
  const publicCheck = await queryPublishedRecipeBySlug(testRecipe.slug);
  assert(publicCheck === null, 'Công thức ở trạng thái NEEDS_CHANGES không thể đọc từ public catalog (bảo vệ độc giả)');

  // ----------------------------------------------------
  // TEST 8: Tác giả nhận được góp ý, cập nhật công thức và nộp lại
  // ----------------------------------------------------
  console.log('\nTest 8: Tác giả xem góp ý, sửa đổi công thức và nộp lại thành công');
  const resubmitRes = await fetch(`${BASE_URL}/api/contribute/recipes/${testRecipe.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookCookie,
    },
    body: JSON.stringify({
      name: 'Thịt Kho Măng Lá Lốt An Toàn Chuẩn Vị',
      shortDescription: 'Đã thay thế nguyên liệu nghi vấn bằng lá lốt tươi sạch an toàn',
      submitNow: true, // Gửi duyệt lại
    }),
  });
  const resubmitData = await resubmitRes.json();
  assert(resubmitRes.status === 200 && resubmitData.success === true, 'Tác giả sửa bài và nộp lại thành công');

  const reSubmittedRecipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, testRecipe.id),
  });
  assert(reSubmittedRecipe?.status === 'SUBMITTED', 'Công thức trở lại hàng đợi SUBMITTED sau khi nộp lại');
  assert(
    reSubmittedRecipe?.name === 'Thịt Kho Măng Lá Lốt An Toàn Chuẩn Vị',
    'Tên công thức đã được sửa đổi an toàn'
  );

  // Dọn dẹp dữ liệu test
  await db.delete(recipes).where(eq(recipes.id, testRecipe.id));

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ AG-32: PASS ${passCount} / ${passCount + failCount}`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Lỗi thực thi test suite AG-32:', err);
  process.exit(1);
});
