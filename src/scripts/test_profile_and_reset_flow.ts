import assert from 'node:assert/strict';
import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../lib/auth/password';
import { createResetToken, verifyResetToken, extractResetTokenUserId } from '../lib/auth/resetToken';
import { signToken, SESSION_COOKIE_NAME } from '../lib/auth/session';
import { POST as forgotPasswordHandler } from '../app/api/auth/forgot-password/route';
import { POST as resetPasswordHandler } from '../app/api/auth/reset-password/route';
import { GET as getProfileHandler, PATCH as updateProfileHandler } from '../app/api/user/profile/route';
import { POST as changePasswordHandler } from '../app/api/user/change-password/route';

process.env.AUTH_SECRET = 'test_valid_auth_secret_with_more_than_32_characters_for_angimom';
process.env.ALLOW_DEV_RESET_URL = 'true';
process.env.APP_URL = 'http://localhost:3000';

async function runProfileAndResetTests() {
  console.log('--- Bắt đầu kiểm thử Luồng Quên Mật Khẩu, Đổi Mật Khẩu & Hồ Sơ Cá Nhân ---');

  const testEmail = `test_profile_${Date.now()}@example.com`;
  const initialPassword = 'InitialPassword123!';
  const initialHash = await hashPassword(initialPassword);

  // 1. Tạo người dùng thử nghiệm
  const [createdUser] = await db
    .insert(users)
    .values({
      email: testEmail,
      displayName: 'Mẹ Bếp Thử Nghiệm',
      passwordHash: initialHash,
      role: 'COOK',
    })
    .returning();

  console.log('✓ Tạo người dùng thử nghiệm thành công (ID:', createdUser.id, ')');

  // 2. Kiểm thử Anti-Enumeration trên /api/auth/forgot-password
  const reqNonExistent = new Request('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'non_existent_email_12345@domain.com' }),
  });
  const resNonExistent = await forgotPasswordHandler(reqNonExistent);
  const dataNonExistent = await resNonExistent.json();
  assert.equal(resNonExistent.status, 200, 'Anti-enumeration: Phải trả về 200 ngay cả khi email không tồn tại');
  assert.equal(dataNonExistent.ok, true, 'Anti-enumeration: Phải trả về ok: true');
  assert.equal(dataNonExistent.devResetUrl, undefined, 'Không được trả về URL reset khi email không tồn tại');
  console.log('✓ Anti-enumeration: Email không tồn tại trả về thông điệp thành công chung an toàn');

  // 3. Yêu cầu đặt lại mật khẩu cho email có thật
  const reqExistent = new Request('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const resExistent = await forgotPasswordHandler(reqExistent);
  const dataExistent = await resExistent.json();
  assert.equal(resExistent.status, 200);
  assert.equal(dataExistent.ok, true);
  assert.ok(dataExistent.devResetUrl, 'Môi trường dev trả về devResetUrl để kiểm thử');
  console.log('✓ Forgot Password: Tạo liên kết đặt lại mật khẩu thành công');

  // 3b. Chống password reset poisoning: header Origin giả mạo không được đổi domain link
  process.env.APP_URL = 'https://angimom.example';
  const reqPoison = new Request('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
    body: JSON.stringify({ email: testEmail }),
  });
  const resPoison = await forgotPasswordHandler(reqPoison);
  const dataPoison = await resPoison.json();
  assert.ok(
    typeof dataPoison.devResetUrl === 'string' &&
      dataPoison.devResetUrl.startsWith('https://angimom.example/reset-password?token='),
    'Link reset phải dùng APP_URL cấu hình phía server'
  );
  assert.ok(!dataPoison.devResetUrl.includes('evil.example'), 'Không được dùng Origin do client gửi');
  process.env.APP_URL = 'http://localhost:3000';
  console.log('✓ Chống reset poisoning: bỏ qua header Origin giả mạo, chỉ dùng APP_URL');

  // 4. Kiểm thử Reset Token Helper trực tiếp
  const token = await createResetToken(createdUser);
  const extractedId = extractResetTokenUserId(token);
  assert.equal(extractedId, createdUser.id, 'extractResetTokenUserId phải giải mã đúng ID người dùng');

  const verified = await verifyResetToken(token, createdUser.passwordHash);
  assert.ok(verified, 'verifyResetToken phải xác thực thành công token hợp lệ');
  assert.equal(verified?.userId, createdUser.id);

  // Token giả mạo chữ ký
  const fakeToken = token.slice(0, -5) + 'xxxxx';
  const fakeVerified = await verifyResetToken(fakeToken, createdUser.passwordHash);
  assert.equal(fakeVerified, null, 'verifyResetToken phải từ chối token bị sửa chữ ký');
  console.log('✓ Cryptographic Token: Chữ ký HMAC-SHA256 bảo vệ toàn vẹn token');

  // 5. Kiểm thử API /api/auth/reset-password
  // 5a. Mật khẩu quá ngắn (< 8 ký tự)
  const reqShortPw = new Request('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword: 'short' }),
  });
  const resShortPw = await resetPasswordHandler(reqShortPw);
  assert.equal(resShortPw.status, 400, 'Phải từ chối mật khẩu < 8 ký tự');
  console.log('✓ Reset Password: Kiểm tra độ dài mật khẩu (>= 8 ký tự)');

  // 5b. Đặt lại mật khẩu thành công
  const updatedPassword = 'NewSecretPassword456!';
  const reqReset = new Request('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword: updatedPassword }),
  });
  const resReset = await resetPasswordHandler(reqReset);
  const dataReset = await resReset.json();
  assert.equal(resReset.status, 200);
  assert.equal(dataReset.ok, true);

  // Kiểm tra DB đã cập nhật mật khẩu mới
  const [refreshedUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, createdUser.id));
  const isMatchNew = await verifyPassword(updatedPassword, refreshedUser.passwordHash!);
  assert.equal(isMatchNew, true, 'Mật khẩu mới phải khớp khi xác minh verifyPassword');
  console.log('✓ Reset Password: Đặt lại mật khẩu thành công và băm an toàn trong DB');

  // 6. Kiểm thử Single-Use (chống phát lại cùng token)
  const reqReplay = new Request('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword: 'AnotherPassword789!' }),
  });
  const resReplay = await resetPasswordHandler(reqReplay);
  assert.equal(resReplay.status, 400, 'Single-use: Phải từ chối token đã từng sử dụng vì hash mật khẩu đã đổi');
  console.log('✓ Single-Use Invariant: Token lập tức vô hiệu hóa ngay sau khi đổi mật khẩu');

  // 7. Kiểm thử Profile APIs (/api/user/profile)
  // 7a. Chưa đăng nhập (không có cookie) -> 401
  const resUnauthProfile = await getProfileHandler();
  assert.equal(resUnauthProfile.status, 401, 'Không có session cookie phải trả về 401');
  console.log('✓ Profile API: Chặn truy cập chưa xác thực (HTTP 401)');

  // 7b. Tạo session token cho người dùng
  const sessionToken = await signToken({
    id: createdUser.id,
    email: createdUser.email,
    displayName: createdUser.displayName,
    role: createdUser.role,
  });

  // Giả lập request kèm cookie phiên
  const reqAuthProfile = new Request('http://localhost:3000/api/user/profile', {
    headers: {
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    },
  });

  // 7c. Đổi tên hiển thị (PATCH /api/user/profile)
  const reqPatch = new Request('http://localhost:3000/api/user/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    },
    body: JSON.stringify({ displayName: 'Mẹ Bếp Thông Thái' }),
  });
  const resPatch = await updateProfileHandler(reqPatch);
  const dataPatch = await resPatch.json();
  assert.equal(resPatch.status, 200);
  assert.equal(dataPatch.user.displayName, 'Mẹ Bếp Thông Thái');

  const [userAfterPatch] = await db
    .select()
    .from(users)
    .where(eq(users.id, createdUser.id));
  assert.equal(userAfterPatch.displayName, 'Mẹ Bếp Thông Thái');
  console.log('✓ Profile API: Cập nhật tên hiển thị thành công');

  // 8. Kiểm thử Đổi mật khẩu trong Profile (/api/user/change-password)
  // 8a. Nhập sai mật khẩu hiện tại
  const reqWrongCurrent = new Request('http://localhost:3000/api/user/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    },
    body: JSON.stringify({
      currentPassword: 'WrongPassword!',
      newPassword: 'BrandNewPassword999!',
    }),
  });
  const resWrongCurrent = await changePasswordHandler(reqWrongCurrent);
  assert.equal(resWrongCurrent.status, 400, 'Phải từ chối khi mật khẩu hiện tại sai');
  console.log('✓ Change Password: Chặn đổi mật khẩu khi sai mật khẩu hiện tại');

  // 8b. Mật khẩu mới trùng mật khẩu hiện tại
  const reqSamePw = new Request('http://localhost:3000/api/user/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    },
    body: JSON.stringify({
      currentPassword: updatedPassword,
      newPassword: updatedPassword,
    }),
  });
  const resSamePw = await changePasswordHandler(reqSamePw);
  assert.equal(resSamePw.status, 400, 'Phải từ chối khi mật khẩu mới trùng mật khẩu cũ');
  console.log('✓ Change Password: Yêu cầu mật khẩu mới khác mật khẩu cũ');

  // 8c. Đổi mật khẩu thành công
  const finalPassword = 'FinalSuperPassword888!';
  const reqSuccessChange = new Request('http://localhost:3000/api/user/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    },
    body: JSON.stringify({
      currentPassword: updatedPassword,
      newPassword: finalPassword,
    }),
  });
  const resSuccessChange = await changePasswordHandler(reqSuccessChange);
  assert.equal(resSuccessChange.status, 200);

  const [userFinal] = await db
    .select()
    .from(users)
    .where(eq(users.id, createdUser.id));
  const isMatchFinal = await verifyPassword(finalPassword, userFinal.passwordHash!);
  assert.equal(isMatchFinal, true, 'Mật khẩu mới đã được cập nhật chính xác');
  console.log('✓ Change Password: Đổi mật khẩu thành công trong trang hồ sơ');

  // 9. Dọn dẹp dữ liệu kiểm thử
  await db.delete(users).where(eq(users.id, createdUser.id));
  console.log('✓ Dọn dẹp dữ liệu người dùng kiểm thử thành công');

  console.log('================================================================');
  console.log('🎉 TOÀN BỘ CÁC BƯỚC TEST PROFILE, FORGOT & RESET PASSWORD ĐÃ PASS!');
  console.log('================================================================');

  process.exit(0);
}

runProfileAndResetTests().catch((err) => {
  console.error('❌ Lỗi kiểm thử:', err);
  process.exit(1);
});
