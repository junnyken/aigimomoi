/**
 * Test Suite: User Registration Flow (/api/auth/register)
 * Kiểm tra các kịch bản đăng ký: validation, fail-closed, trùng lặp email, băm mật khẩu và tự động đăng nhập.
 * Chạy độc lập: npx tsx src/scripts/test_registration_flow.ts
 */

import { NextRequest } from 'next/server';
import { POST as registerHandler } from '../app/api/auth/register/route';
import { GET as meHandler } from '../app/api/auth/me/route';
import { SESSION_COOKIE_NAME, signToken } from '../lib/auth/session';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  KIỂM THỬ LUỒNG ĐĂNG KÝ TÀI KHOẢN (/api/auth/register)');
  console.log('================================================================');

  // Đảm bảo có AUTH_SECRET cho môi trường test
  process.env.AUTH_SECRET = 'angimom_registration_test_secret_32_characters_long';

  // 1. Thiếu thông tin
  console.log('\n--- 1. Kiểm tra Validation Đầu vào ---');
  {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ displayName: '', email: 'test@example.com', password: 'password123' }),
    });
    const res = await registerHandler(req);
    assert(res.status === 400, 'Từ chối họ tên rỗng (HTTP 400)');
  }

  {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Mẹ Bắp', email: 'invalid-email', password: 'password123' }),
    });
    const res = await registerHandler(req);
    assert(res.status === 400, 'Từ chối email không hợp lệ (HTTP 400)');
  }

  {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Mẹ Bắp', email: 'test@example.com', password: 'short' }),
    });
    const res = await registerHandler(req);
    assert(res.status === 400, 'Từ chối mật khẩu dưới 8 ký tự (HTTP 400)');
  }

  // 2. Đăng ký thành công và nhận cookie phiên
  console.log('\n--- 2. Đăng ký tài khoản thành công & Phiên đăng nhập ---');
  const uniqueEmail = `test_user_${Date.now()}@angimom.vn`;
  let sessionCookieValue = '';

  {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'Mẹ Bắp Test',
        email: uniqueEmail,
        password: 'SecurePassword123!',
      }),
    });
    const res = await registerHandler(req);
    assert(res.status === 201, 'Đăng ký thành công trả về HTTP 201');

    const data = await res.json();
    assert(data.ok === true, 'Phản hồi ok: true');
    assert(data.user.email === uniqueEmail.toLowerCase(), 'Email chuẩn hóa chữ thường');
    assert(data.user.role === 'COOK', 'Role mặc định là COOK');
    assert(data.user.displayName === 'Mẹ Bắp Test', 'DisplayName khớp với dữ liệu gửi lên');
    assert(data.user.passwordHash === undefined, 'Không để lộ passwordHash ra client');

    const setCookie = res.headers.get('set-cookie');
    assert(Boolean(setCookie && setCookie.includes(SESSION_COOKIE_NAME)), 'Tạo session cookie HttpOnly ngay sau khi đăng ký');
    if (setCookie) {
      const match = setCookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
      if (match) sessionCookieValue = match[1];
    }
  }

  // 3. Đăng ký trùng email
  console.log('\n--- 3. Ngăn chặn trùng lặp email ---');
  {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'Người Dùng Khác',
        email: uniqueEmail,
        password: 'AnotherPassword123!',
      }),
    });
    const res = await registerHandler(req);
    assert(res.status === 409, 'Từ chối email đã tồn tại với HTTP 409 Conflict');
    const data = await res.json();
    assert(Boolean(data.error), 'Trả về thông báo lỗi rõ ràng');
  }

  // 4. Fail-closed khi thiếu AUTH_SECRET
  console.log('\n--- 4. Fail-Closed khi cấu hình AUTH_SECRET không hợp lệ ---');
  const savedSecret = process.env.AUTH_SECRET;
  try {
    delete process.env.AUTH_SECRET;
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        displayName: 'Hacker',
        email: `hack_${Date.now()}@angimom.vn`,
        password: 'SecurePassword123!',
      }),
    });
    const res = await registerHandler(req);
    assert(res.status === 503, 'Trả về HTTP 503 Service Unavailable khi thiếu AUTH_SECRET');
  } finally {
    process.env.AUTH_SECRET = savedSecret;
  }

  console.log('\n================================================================');
  console.log(`  KẾT QUẢ: ${passed} PASS / ${failed} FAIL (tổng ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests();
