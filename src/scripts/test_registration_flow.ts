/**
 * Test Suite: User Registration Flow (/api/auth/register) — luồng 2 bước OTP
 * Kiểm tra: validation, honeypot, Turnstile bắt buộc ở máy chủ (fail-closed), OTP không lộ ở production,
 * giới hạn gửi/nhập OTP theo email, tạo tài khoản COOK + phiên đăng nhập, trùng email.
 * Cần PostgreSQL: DATABASE_URL=... npx tsx src/scripts/test_registration_flow.ts
 */

import { NextRequest } from 'next/server';
import { inArray, like } from 'drizzle-orm';
import { POST as registerHandler } from '../app/api/auth/register/route';
import { SESSION_COOKIE_NAME, getSessionUser } from '../lib/auth/session';
import { db, closeDb } from '../lib/db';
import { users, rateLimitBuckets } from '../lib/db/schema';

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

const env = process.env as Record<string, string | undefined>;
const RUN_ID = Date.now();
const createdEmails: string[] = [];
let ipCounter = 1;

// Mỗi request một IP riêng để không đụng giới hạn theo IP (giới hạn theo email được test riêng)
function registerRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.77.${RUN_ID % 200}.${ipCounter++ % 250}` },
    body: JSON.stringify({ formElapsedMs: 5000, ...body }),
  });
}

function testEmail(tag: string): string {
  const email = `reg_${tag}_${RUN_ID}@example.com`;
  createdEmails.push(email);
  return email;
}

async function sendOtp(email: string, extra: Record<string, unknown> = {}) {
  const res = await registerHandler(
    registerRequest({ step: 'send-otp', displayName: 'Mẹ Bắp', email, password: 'password123', ...extra })
  );
  return { res, data: await res.json() };
}

async function withProductionEnv<T>(overrides: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const saved: Record<string, string | undefined> = { NODE_ENV: env.NODE_ENV };
  for (const k of Object.keys(overrides)) saved[k] = env[k];
  env.NODE_ENV = 'production';
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete env[k];
      else env[k] = v;
    }
  }
}

async function withMockedFetch<T>(impl: typeof fetch, fn: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    return await fn();
  } finally {
    globalThis.fetch = original;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  KIỂM THỬ LUỒNG ĐĂNG KÝ TÀI KHOẢN (/api/auth/register)');
  console.log('================================================================');

  env.AUTH_SECRET = 'angimom_registration_test_secret_32_characters_long';
  delete env.TURNSTILE_SECRET_KEY;
  delete env.SMTP_HOST;
  delete env.RESEND_API_KEY;

  console.log('\n--- 1. Validation đầu vào ---');
  {
    const { res } = await sendOtp(testEmail('x'), { displayName: '' });
    assert(res.status === 400, 'Từ chối họ tên rỗng (HTTP 400)');
  }
  {
    const { res } = await sendOtp('invalid-email');
    assert(res.status === 400, 'Từ chối email không hợp lệ (HTTP 400)');
  }
  {
    const { res } = await sendOtp(testEmail('x'), { password: 'short' });
    assert(res.status === 400, 'Từ chối mật khẩu dưới 8 ký tự (HTTP 400)');
  }
  {
    const { res } = await sendOtp(`bot_${RUN_ID}@yopmail.com`);
    assert(res.status === 400, 'Chặn email tạm (yopmail) (HTTP 400)');
  }
  {
    const { res } = await sendOtp(testEmail('hp'), { honeypot: 'http://spam.example' });
    assert(res.status === 400, 'Chặn bot dính bẫy honeypot (HTTP 400)');
  }

  console.log('\n--- 2. Chống Bot ở máy chủ (production, fail-closed) ---');
  await withProductionEnv({ TURNSTILE_SECRET_KEY: undefined }, async () => {
    // Payload bypass cũ: client tự khai đã là người thật + tự chấm phép tính
    const { res, data } = await sendOtp(testEmail('bypass'), {
      humanVerified: true,
      challengeAnswer: 1,
      challengeExpected: 1,
    });
    assert(res.status === 503, 'Production thiếu TURNSTILE_SECRET_KEY → chặn đăng ký (503), không tin humanVerified/challenge');
    assert(!data.otpToken && !data.demoOtpCode, 'Không phát OTP khi chưa qua chống Bot');
  });

  await withProductionEnv({ TURNSTILE_SECRET_KEY: 'test-turnstile-secret' }, async () => {
    const { res } = await sendOtp(testEmail('notoken'), { humanVerified: true, challengeAnswer: 8, challengeExpected: 8 });
    assert(res.status === 400, 'Thiếu turnstileToken → 400 (không còn chế độ dự phòng tự khai)');

    let siteverifyCalls = 0;
    await withMockedFetch(
      (async () => {
        siteverifyCalls++;
        throw new Error('network down');
      }) as typeof fetch,
      async () => {
        const { res: r } = await sendOtp(testEmail('cfdown'), { turnstileToken: 'tok' });
        assert(r.status === 503, 'Cloudflare lỗi kết nối → từ chối (fail-closed, 503)');
      }
    );
    assert(siteverifyCalls === 1, 'Máy chủ thực sự gọi Cloudflare siteverify');

    await withMockedFetch(
      (async () => new Response(JSON.stringify({ success: false }), { status: 200 })) as typeof fetch,
      async () => {
        const { res: r } = await sendOtp(testEmail('cffail'), { turnstileToken: 'tok' });
        assert(r.status === 400, 'Turnstile trả success=false → 400');
      }
    );

    await withMockedFetch(
      (async () => new Response(JSON.stringify({ success: true }), { status: 200 })) as typeof fetch,
      async () => {
        const { res: r, data } = await sendOtp(testEmail('nosmtp'), { turnstileToken: 'tok' });
        assert(r.status === 503, 'Production không gửi được email → 503');
        assert(data.demoOtpCode === undefined && data.otpToken === undefined, 'Production KHÔNG BAO GIỜ trả mã OTP về trình duyệt');
      }
    );
  });

  console.log('\n--- 3. Gửi & xác thực OTP (dev, chưa gắn SMTP) ---');
  const email = testEmail('ok');
  const { res: sendRes, data: sendData } = await sendOtp(email.toUpperCase());
  assert(sendRes.status === 200 && sendData.step === 'OTP_REQUIRED', 'Bước 1 trả OTP_REQUIRED (HTTP 200)');
  assert(typeof sendData.demoOtpCode === 'string' && /^\d{6}$/.test(sendData.demoOtpCode), 'Dev chưa gắn SMTP: hiển thị mã OTP 6 số để kiểm thử');

  {
    const wrong = sendData.demoOtpCode === '000000' ? '111111' : '000000';
    const res = await registerHandler(
      registerRequest({ step: 'verify-otp', displayName: 'Mẹ Bắp', email, password: 'password123', otpCode: wrong, otpToken: sendData.otpToken })
    );
    assert(res.status === 400, 'Sai mã OTP → 400');
  }
  {
    const res = await registerHandler(
      registerRequest({ step: 'verify-otp', displayName: 'Kẻ Đổi Tên', email, password: 'password123', otpCode: sendData.demoOtpCode, otpToken: sendData.otpToken })
    );
    assert(res.status === 400, 'Token OTP gắn với họ tên đã khai — đổi tên giữa chừng bị từ chối');
  }

  const verifyRes = await registerHandler(
    registerRequest({ step: 'verify-otp', displayName: 'Mẹ Bắp', email, password: 'password123', otpCode: sendData.demoOtpCode, otpToken: sendData.otpToken })
  );
  const verifyData = await verifyRes.json();
  assert(verifyRes.status === 201, 'Đúng mã OTP → tạo tài khoản (HTTP 201)');
  assert(verifyData.user?.email === email.toLowerCase(), 'Email được chuẩn hóa chữ thường');
  assert(verifyData.user?.role === 'COOK', 'Tài khoản mới luôn có vai trò COOK');

  const cookie = verifyRes.headers.get('set-cookie') || '';
  const token = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`))?.[1];
  assert(Boolean(token) && cookie.toLowerCase().includes('httponly'), 'Cấp cookie phiên HttpOnly');
  const sessionUser = token ? await getSessionUser(token) : null;
  assert(sessionUser?.email === email.toLowerCase(), 'Cookie phiên hợp lệ và trỏ đúng tài khoản');

  {
    const { res } = await sendOtp(email);
    assert(res.status === 409, 'Email đã tồn tại → 409');
  }

  console.log('\n--- 4. Giới hạn theo email ---');
  {
    const limitEmail = testEmail('verifylimit');
    const { data } = await sendOtp(limitEmail);
    const wrong = data.demoOtpCode === '000000' ? '111111' : '000000';
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await registerHandler(
        registerRequest({ step: 'verify-otp', displayName: 'Mẹ Bắp', email: limitEmail, password: 'password123', otpCode: wrong, otpToken: data.otpToken })
      );
      statuses.push(res.status);
    }
    assert(statuses.slice(0, 5).every((s) => s === 400) && statuses[5] === 429, 'Nhập sai OTP quá 5 lần → 429 (chống dò mã 6 số)');

    const res = await registerHandler(
      registerRequest({ step: 'verify-otp', displayName: 'Mẹ Bắp', email: limitEmail, password: 'password123', otpCode: data.demoOtpCode, otpToken: data.otpToken })
    );
    assert(res.status === 429, 'Sau khi bị khóa, kể cả mã đúng cũng phải chờ');
  }
  {
    const sendEmail = testEmail('sendlimit');
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) statuses.push((await sendOtp(sendEmail)).res.status);
    assert(statuses.slice(0, 3).every((s) => s === 200) && statuses[3] === 429, 'Gửi mã quá 3 lần / 10 phút cho một email → 429');
  }

  console.log('\n================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ ĐĂNG KÝ: ${passed} PASS / ${failed} FAIL`);
  console.log('================================================================');
}

runTests()
  .catch((err) => {
    failed++;
    console.error('❌ Lỗi kiểm thử:', err);
  })
  .finally(async () => {
    const lowered = createdEmails.map((e) => e.toLowerCase());
    if (lowered.length > 0) await db.delete(users).where(inArray(users.email, lowered)).catch(() => {});
    await db.delete(rateLimitBuckets).where(like(rateLimitBuckets.key, `%${RUN_ID}%`)).catch(() => {});
    await closeDb();
    process.exit(failed > 0 ? 1 : 0);
  });
