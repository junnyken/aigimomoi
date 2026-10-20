// AG-31: Kịch bản kiểm thử tự động toàn diện cho Tính năng Contributor Submissions
// Kiểm tra Invariants Gate P5:
// 1. Không tự ý xuất bản (chỉ DRAFT hoặc SUBMITTED).
// 2. Provenance bắt buộc 'COMMUNITY_SUBMITTED', authorId = user.id.
// 3. Quyền sở hữu an toàn (Chỉ tác giả mới sửa được; Contributor B không sửa được bài của Contributor A).
// 4. Khóa bài khi SUBMITTED (không cho sửa đè khi đang chờ duyệt).
// 5. Nộp lại thành công khi NEEDS_CHANGES.
// Chạy độc lập: npx tsx src/scripts/test_contributor_submissions.ts

import fs from 'fs';
import path from 'path';

// Đọc .env để đồng bộ AUTH_SECRET với Next.js runtime
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  // Bỏ qua nếu không đọc được
}

import { db } from '../lib/db';
import { recipes, users, ingredients } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
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
  console.log('  AG-31 — Test Suite: Contributor Submissions');
  console.log('======================================================\n');

  const BASE_URL = 'http://localhost:3000';
  const TEST_PASSWORD = 'TestPassword@123';
  const hashedPw = await hashPassword(TEST_PASSWORD);

  // 1. Chuẩn bị 2 Contributor Users (role COOK)
  let cook1 = await db.query.users.findFirst({
    where: eq(users.email, 'cook1_ag31@angimom.vn'),
  });
  if (!cook1) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'cook1_ag31@angimom.vn',
        passwordHash: hashedPw,
        displayName: 'Mẹ Bếp Hà Nội',
        role: 'COOK',
      })
      .returning();
    cook1 = u;
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, cook1.id));
  }

  let cook2 = await db.query.users.findFirst({
    where: eq(users.email, 'cook2_ag31@angimom.vn'),
  });
  if (!cook2) {
    const [u] = await db
      .insert(users)
      .values({
        email: 'cook2_ag31@angimom.vn',
        passwordHash: hashedPw,
        displayName: 'Bố Đảm Sài Gòn',
        role: 'COOK',
      })
      .returning();
    cook2 = u;
  } else {
    await db.update(users).set({ passwordHash: hashedPw }).where(eq(users.id, cook2.id));
  }

  // Đăng nhập qua API để lấy Set-Cookie chuẩn từ Next.js server
  const login1Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cook1.email, password: TEST_PASSWORD }),
  });
  const cookieHeader1 = login1Res.headers.get('set-cookie')?.split(';')[0] || '';

  const login2Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cook2.email, password: TEST_PASSWORD }),
  });
  const cookieHeader2 = login2Res.headers.get('set-cookie')?.split(';')[0] || '';

  // Lấy 1 nguyên liệu có sẵn để gắn vào bài test
  const existingIng = await db.query.ingredients.findFirst();
  const testIngId = existingIng ? existingIng.id : 1;

  let createdRecipeId: number | null = null;

  // ----------------------------------------------------
  // TEST 1: Yêu cầu đăng nhập (401 khi không có session)
  // ----------------------------------------------------
  console.log('Test 1: Chặn truy cập khi chưa đăng nhập (Auth Invariant)');
  const unauthRes = await fetch(`${BASE_URL}/api/contribute/recipes`, {
    method: 'GET',
  });
  assert(unauthRes.status === 401, 'Trả về 401 Unauthorized khi không có session cookie');

  // ----------------------------------------------------
  // TEST 2: Tạo bài đóng góp ở trạng thái DRAFT
  // ----------------------------------------------------
  console.log('\nTest 2: Contributor tạo bản nháp công thức gia đình (DRAFT)');
  const createDraftPayload = {
    name: 'Canh Chua Cá Bông Lau Kiểu Ngoại',
    shortDescription: 'Công thức nấu canh chua ngọt dịu của bà ngoại ở miền Tây sông nước',
    role: 'SOUP',
    baseServings: 4,
    prepTimeMinutes: 20,
    cookTimeMinutes: 25,
    difficulty: 'Dễ',
    submitNow: false, // Lưu nháp
    ingredients: [
      {
        ingredientId: testIngId,
        amount: 500,
        unit: 'g',
        scalePolicy: 'LINEAR',
        preparation: 'cắt khúc vừa ăn',
      },
    ],
    steps: [
      {
        phaseName: 'Sơ chế',
        instruction: 'Rửa sạch cá bông lau với muối và chanh để khử tanh.',
        timerSeconds: 300,
      },
      {
        phaseName: 'Nấu canh',
        instruction: 'Nấu sôi nước me, cho cá vào chín tới thì nêm nếm gia vị vừa miệng.',
        timerSeconds: 900,
      },
    ],
  };

  const createDraftRes = await fetch(`${BASE_URL}/api/contribute/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader1,
    },
    body: JSON.stringify(createDraftPayload),
  });

  const draftData = await createDraftRes.json();
  if (createDraftRes.status !== 200) {
    console.error('DEBUG Test 2 Failed:', createDraftRes.status, draftData);
  }
  assert(createDraftRes.status === 200 && draftData.success === true, 'Tạo bản nháp công thức thành công');
  createdRecipeId = draftData.recipe?.id;
  assert(typeof createdRecipeId === 'number', `Recipe ID được tạo: ${createdRecipeId}`);

  // ----------------------------------------------------
  // TEST 3: Invariant Gate P5 - Provenance, Author, Status, Review flags
  // ----------------------------------------------------
  console.log('\nTest 3: Kiểm tra Invariants Gate P5 trong cơ sở dữ liệu');
  if (createdRecipeId) {
    const dbRec = await db.query.recipes.findFirst({
      where: eq(recipes.id, createdRecipeId),
    });
    assert(dbRec?.provenance === 'COMMUNITY_SUBMITTED', 'provenance bắt buộc phải là COMMUNITY_SUBMITTED');
    assert(dbRec?.authorId === cook1.id, `authorId khớp với ID của Contributor 1 (${cook1.id})`);
    assert(dbRec?.status === 'DRAFT', 'status bắt đầu là DRAFT');
    assert(dbRec?.isEditorialReviewed === false, 'isEditorialReviewed mặc định là false');
    assert(dbRec?.isCookTested === false, 'isCookTested mặc định là false');
  }

  // ----------------------------------------------------
  // TEST 4: Danh sách công thức của tác giả (Data Isolation)
  // ----------------------------------------------------
  console.log('\nTest 4: Danh sách công thức cá nhân (GET /api/contribute/recipes)');
  const list1Res = await fetch(`${BASE_URL}/api/contribute/recipes`, {
    headers: { Cookie: cookieHeader1 },
  });
  const list1Data = await list1Res.json();
  assert(
    list1Data.success === true && list1Data.recipes.some((r: any) => r.id === createdRecipeId),
    'Contributor 1 thấy bài của mình trong danh sách Bếp Nhà'
  );

  const list2Res = await fetch(`${BASE_URL}/api/contribute/recipes`, {
    headers: { Cookie: cookieHeader2 },
  });
  const list2Data = await list2Res.json();
  assert(
    list2Data.success === true && !list2Data.recipes.some((r: any) => r.id === createdRecipeId),
    'Contributor 2 KHÔNG thấy bài nháp của Contributor 1 (Cô lập dữ liệu)'
  );

  // ----------------------------------------------------
  // TEST 5: Quyền sở hữu - Contributor 2 không thể sửa hoặc xóa bài của Contributor 1
  // ----------------------------------------------------
  console.log('\nTest 5: Bảo vệ quyền sở hữu (Ownership Guard - Chặn Contributor 2)');
  if (createdRecipeId) {
    const editOtherRes = await fetch(`${BASE_URL}/api/contribute/recipes/${createdRecipeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader2,
      },
      body: JSON.stringify({ name: 'Hacker chiếm đoạt công thức' }),
    });
    assert(editOtherRes.status === 404, 'Contributor 2 bị từ chối sửa bài của Contributor 1 (404 Not Found / Unauthorized)');

    const deleteOtherRes = await fetch(`${BASE_URL}/api/contribute/recipes/${createdRecipeId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieHeader2 },
    });
    assert(deleteOtherRes.status === 404, 'Contributor 2 bị từ chối xóa bài của Contributor 1 (404 Not Found / Unauthorized)');
  }

  // ----------------------------------------------------
  // TEST 6: Nộp bài vào hàng đợi kiểm duyệt (SUBMITTED) & Khóa sửa đổi
  // ----------------------------------------------------
  console.log('\nTest 6: Nộp bài vào Hàng đợi Kiểm duyệt (SUBMITTED) và Khóa sửa đổi');
  if (createdRecipeId) {
    const submitRes = await fetch(`${BASE_URL}/api/contribute/recipes/${createdRecipeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader1,
      },
      body: JSON.stringify({
        submitNow: true, // Gửi duyệt
      }),
    });
    const submitData = await submitRes.json();
    assert(submitRes.status === 200 && submitData.success === true, 'Nộp bài vào hàng đợi kiểm duyệt thành công');

    const submittedRec = await db.query.recipes.findFirst({
      where: eq(recipes.id, createdRecipeId),
    });
    assert(submittedRec?.status === 'SUBMITTED', 'Trạng thái chuyển sang SUBMITTED');

    // Thử sửa đổi khi bài đang SUBMITTED -> Phải bị chặn (409 Conflict)
    const lockedEditRes = await fetch(`${BASE_URL}/api/contribute/recipes/${createdRecipeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader1,
      },
      body: JSON.stringify({ name: 'Tự ý sửa khi đang chờ duyệt' }),
    });
    assert(lockedEditRes.status === 409, 'Chặn sửa bài khi đang ở trạng thái SUBMITTED (409 Conflict)');

    // Thử xóa khi bài đang SUBMITTED -> Phải bị chặn (409 Conflict)
    const lockedDeleteRes = await fetch(`${BASE_URL}/api/contribute/recipes/${createdRecipeId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieHeader1 },
    });
    assert(lockedDeleteRes.status === 409, 'Chặn xóa bài khi đang ở trạng thái SUBMITTED (409 Conflict)');
  }

  // ----------------------------------------------------
  // TEST 7: Luồng NEEDS_CHANGES -> Tác giả cập nhật & nộp lại
  // ----------------------------------------------------
  console.log('\nTest 7: Biên tập viên yêu cầu góp ý (NEEDS_CHANGES) -> Tác giả sửa & nộp lại');
  if (createdRecipeId) {
    // Giả lập Editor yêu cầu sửa đổi trong DB
    await db
      .update(recipes)
      .set({ status: 'NEEDS_CHANGES' })
      .where(eq(recipes.id, createdRecipeId));

    // Contributor 1 sửa đổi và nộp lại
    const resubmitRes = await fetch(`${BASE_URL}/api/contribute/recipes/${createdRecipeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader1,
      },
      body: JSON.stringify({
        name: 'Canh Chua Cá Bông Lau Chuẩn Vị Miền Tây (Đã thêm định lượng me)',
        submitNow: true,
      }),
    });
    const resubmitData = await resubmitRes.json();
    assert(resubmitRes.status === 200 && resubmitData.success === true, 'Contributor nộp lại thành công sau khi sửa');

    const updatedRec = await db.query.recipes.findFirst({
      where: eq(recipes.id, createdRecipeId),
    });
    assert(updatedRec?.status === 'SUBMITTED', 'Công thức trở lại hàng đợi SUBMITTED sau khi nộp lại');
    assert(
      updatedRec?.name === 'Canh Chua Cá Bông Lau Chuẩn Vị Miền Tây (Đã thêm định lượng me)',
      'Tên công thức đã được cập nhật chuẩn xác'
    );
  }

  // Dọn dẹp dữ liệu test
  if (createdRecipeId) {
    await db.delete(recipes).where(eq(recipes.id, createdRecipeId));
  }

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ AG-31: PASS ${passCount} / ${passCount + failCount}`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Lỗi thực thi test suite AG-31:', err);
  process.exit(1);
});
