/**
 * Test Suite: R0 — Authentication Configuration & Secret Fail-Closed Hardening
 * Thực thi kiểm thử 10 kịch bản theo đúng tiêu chuẩn MINI_SPEC_PLAYBOOK.md
 * Sử dụng: npx tsx src/scripts/test_auth_hardening.ts
 */

import {
  getAuthSecret,
  signToken,
  verifyToken,
  isAuthConfigurationValid,
  AuthConfigurationError,
  BLACKLISTED_SECRETS,
  SESSION_COOKIE_NAME,
  type SessionUser,
} from '../lib/auth/session';
import { redactSensitiveData } from '../lib/logger';
import { proxy } from '../proxy';
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '../app/api/auth/login/route';
import { GET as healthHandler } from '../app/api/health/route';
import { POST as publishHandler } from '../app/api/recipes/[id]/publish/route';
import fs from 'node:fs';
import path from 'node:path';

let passedCount = 0;
let failedCount = 0;
const testErrors: string[] = [];

function assert(condition: boolean, message: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedCount++;
    testErrors.push(message);
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// Secret hợp lệ dùng cho môi trường kiểm thử (tối thiểu 32 ký tự, không trùng blacklist)
const TEST_VALID_SECRET = 'angimom_test_auth_secret_for_automated_testing_only_32c';

async function runAllTests() {
  console.log('================================================================');
  console.log('  KIỂM THỬ R0: AUTHENTICATION CONFIGURATION & FAIL-CLOSED');
  console.log('================================================================\n');

  // Lưu biến môi trường gốc để khôi phục sau test
  const originalAuthSecret = process.env.AUTH_SECRET;
  const originalJwtSecret = process.env.JWT_SECRET;

  try {
    // -------------------------------------------------------------------------
    // T01: Negative Unit Tests — Fail-Closed
    // -------------------------------------------------------------------------
    console.log('[T01] Negative Unit Tests — Fail-Closed:');

    // 1.1: Undefined / Empty
    delete process.env.AUTH_SECRET;
    let thrownError: Error | null = null;
    try {
      getAuthSecret();
    } catch (e) {
      thrownError = e as Error;
    }
    assert(
      thrownError instanceof AuthConfigurationError,
      'getAuthSecret() ném AuthConfigurationError khi AUTH_SECRET undefined'
    );

    process.env.AUTH_SECRET = '';
    thrownError = null;
    try {
      getAuthSecret();
    } catch (e) {
      thrownError = e as Error;
    }
    assert(
      thrownError instanceof AuthConfigurationError,
      'getAuthSecret() ném AuthConfigurationError khi AUTH_SECRET rỗng'
    );

    // 1.2: Whitespace only
    process.env.AUTH_SECRET = '   ';
    thrownError = null;
    try {
      getAuthSecret();
    } catch (e) {
      thrownError = e as Error;
    }
    assert(
      thrownError instanceof AuthConfigurationError,
      'getAuthSecret() ném AuthConfigurationError khi AUTH_SECRET chỉ có khoảng trắng'
    );

    // 1.3: Leading / Trailing Whitespace (Chống sửa đổi âm thầm)
    process.env.AUTH_SECRET = '  valid_length_secret_with_spaces_around_32c  ';
    thrownError = null;
    try {
      getAuthSecret();
    } catch (e) {
      thrownError = e as Error;
    }
    assert(
      thrownError instanceof AuthConfigurationError &&
      thrownError.message.includes('leading or trailing whitespace'),
      'Từ chối AUTH_SECRET có khoảng trắng đầu hoặc cuối, không tự ý trim âm thầm'
    );

    // 1.4: Quá ngắn (< 32 ký tự)
    process.env.AUTH_SECRET = 'short_secret_20_char';
    thrownError = null;
    try {
      getAuthSecret();
    } catch (e) {
      thrownError = e as Error;
    }
    assert(
      thrownError instanceof AuthConfigurationError &&
      thrownError.message.includes('too short'),
      'Từ chối AUTH_SECRET ngắn hơn 32 ký tự'
    );

    // 1.5: Trùng Blacklist placeholders
    for (const placeholder of BLACKLISTED_SECRETS) {
      process.env.AUTH_SECRET = placeholder;
      thrownError = null;
      try {
        getAuthSecret();
      } catch (e) {
        thrownError = e as Error;
      }
      assert(
        thrownError instanceof AuthConfigurationError &&
        thrownError.message.includes('insecure placeholder'),
        `Từ chối blacklist placeholder: "${placeholder.slice(0, 20)}..."`
      );
    }

    // 1.6: signToken ném lỗi, verifyToken trả về null khi config sai
    process.env.AUTH_SECRET = '';
    let signFailed = false;
    try {
      await signToken({ id: 1, email: 'test@angimom.vn', displayName: 'Test', role: 'COOK' });
    } catch (e) {
      signFailed = e instanceof AuthConfigurationError;
    }
    assert(signFailed, 'signToken() dừng và ném AuthConfigurationError khi thiếu secret');

    const verifyResultMissingSecret = await verifyToken('invalid.token');
    assert(verifyResultMissingSecret === null, 'verifyToken() trả về null an toàn khi thiếu secret');

    // -------------------------------------------------------------------------
    // T02: Negative Unit Tests — Legacy Name (JWT_SECRET không được dùng)
    // -------------------------------------------------------------------------
    console.log('\n[T02] Negative Unit Tests — Legacy Name Rejection:');
    delete process.env.AUTH_SECRET;
    process.env.JWT_SECRET = 'some_legacy_jwt_secret_value_at_least_32_characters';

    thrownError = null;
    try {
      getAuthSecret();
    } catch (e) {
      thrownError = e as Error;
    }
    assert(
      thrownError instanceof AuthConfigurationError,
      'Hệ thống fail-closed khi chỉ có JWT_SECRET mà không có AUTH_SECRET'
    );

    // -------------------------------------------------------------------------
    // T03: Positive Unit Test — Valid Secret
    // -------------------------------------------------------------------------
    console.log('\n[T03] Positive Unit Test — Valid Secret Session:');
    process.env.AUTH_SECRET = TEST_VALID_SECRET;

    const testUser: Omit<SessionUser, 'exp'> = {
      id: 99,
      email: 'admin.test@angimom.vn',
      displayName: 'Nguyễn Văn Admin',
      role: 'ADMIN',
    };

    const validToken = await signToken(testUser);
    assert(typeof validToken === 'string' && validToken.includes('.'), 'Ký token thành công dạng payload.sig');

    const verifiedUser = await verifyToken(validToken);
    assert(
      verifiedUser !== null &&
      verifiedUser.id === testUser.id &&
      verifiedUser.email === testUser.email &&
      verifiedUser.role === 'ADMIN' &&
      verifiedUser.exp > Date.now(),
      'Xác minh token thành công, khớp toàn vẹn thông tin SessionUser và hạn sử dụng'
    );

    // -------------------------------------------------------------------------
    // T04: Negative Unit Tests — Token Tampering & Expiry
    // -------------------------------------------------------------------------
    console.log('\n[T04] Negative Unit Tests — Token Tampering & Expiry:');
    process.env.AUTH_SECRET = TEST_VALID_SECRET;

    // 4.1: Tampered signature
    const [pB64, sB64] = validToken.split('.');
    const tamperedSig = sB64.slice(0, -2) + (sB64.endsWith('a') ? 'b' : 'a');
    const tamperedToken = `${pB64}.${tamperedSig}`;
    const tamperedResult = await verifyToken(tamperedToken);
    assert(tamperedResult === null, 'Từ chối token bị sửa chữ ký (signature tampered)');

    // 4.2: Malformed token
    assert((await verifyToken('not-a-token')) === null, 'Từ chối token không có dấu chấm phân cách');
    assert((await verifyToken('a.b.c')) === null, 'Từ chối token có cấu trúc thừa trường');
    assert((await verifyToken('.')) === null, 'Từ chối token chỉ có dấu chấm');

    // 4.3: Expired token
    const expiredPayload: SessionUser = {
      ...testUser,
      exp: Date.now() - 10000, // Đã hết hạn 10s trước
    };
    const encoder = new TextEncoder();
    const expPayloadB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(TEST_VALID_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expSigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(expPayloadB64));
    const expSigB64 = Buffer.from(expSigBytes).toString('base64url');
    const expiredToken = `${expPayloadB64}.${expSigB64}`;

    const expiredResult = await verifyToken(expiredToken);
    assert(expiredResult === null, 'Từ chối token có exp trong quá khứ');

    // -------------------------------------------------------------------------
    // T05: Negative Unit Tests — Old Fallback Token Rejection
    // -------------------------------------------------------------------------
    console.log('\n[T05] Negative Unit Tests — Old Fallback Token Rejection:');
    // Giả lập token ký bằng fallback secret cũ trước khi hardening
    const oldFallbackSecret = 'angimom_default_fallback_secret_must_be_overridden_in_production_32chars';
    const oldKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(oldFallbackSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const forgedAdminPayload: SessionUser = {
      id: 1,
      email: 'forged.admin@angimom.vn',
      displayName: 'Attacker Admin',
      role: 'ADMIN',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    const forgedPayloadB64 = Buffer.from(JSON.stringify(forgedAdminPayload)).toString('base64url');
    const forgedSigBytes = await crypto.subtle.sign('HMAC', oldKey, encoder.encode(forgedPayloadB64));
    const forgedToken = `${forgedPayloadB64}.${Buffer.from(forgedSigBytes).toString('base64url')}`;

    // Xác minh dưới runtime mới sử dụng TEST_VALID_SECRET
    process.env.AUTH_SECRET = TEST_VALID_SECRET;
    const oldFallbackVerification = await verifyToken(forgedToken);
    assert(
      oldFallbackVerification === null,
      'Token ký bằng khóa fallback cũ bị từ chối 100% dưới secret mới'
    );

    // -------------------------------------------------------------------------
    // T06: Integration Tests — Edge Proxy Guarding & Real RBAC Boundary
    // -------------------------------------------------------------------------
    console.log('\n[T06] Integration Tests — Real Proxy Guarding & RBAC Boundary:');
    process.env.AUTH_SECRET = TEST_VALID_SECRET;

    // Tạo token cho các vai trò
    const cookToken = await signToken({ id: 10, email: 'cook@test.local', displayName: 'Chef Cook', role: 'COOK' });
    const editorToken = await signToken({ id: 20, email: 'editor@test.local', displayName: 'Editor In Chief', role: 'EDITOR' });
    const adminToken = await signToken({ id: 30, email: 'admin@test.local', displayName: 'System Admin', role: 'ADMIN' });

    // 6.1: Proxy — Anonymous request to /admin -> Redirect to /login
    const anonReq = new NextRequest('http://localhost:3000/admin/dashboard');
    const anonRes = await proxy(anonReq);
    assert(
      anonRes.status === 307 || anonRes.status === 302,
      'Proxy redirect người dùng chưa đăng nhập khi truy cập /admin/*'
    );
    assert(
      Boolean(anonRes.headers.get('location')?.includes('/login')),
      'Redirect location trỏ về /login'
    );

    // 6.2: Proxy — COOK access /admin -> 403 Forbidden
    const cookAdminReq = new NextRequest('http://localhost:3000/admin/settings', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${cookToken}` },
    });
    const cookAdminRes = await proxy(cookAdminReq);
    assert(
      cookAdminRes.status === 403,
      'Proxy từ chối (403 Forbidden) khi COOK truy cập tuyến đường /admin/*'
    );

    // 6.3: Proxy — COOK access /editor -> 403 Forbidden
    const cookEditorReq = new NextRequest('http://localhost:3000/editor/recipes', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${cookToken}` },
    });
    const cookEditorRes = await proxy(cookEditorReq);
    assert(
      cookEditorRes.status === 403,
      'Proxy từ chối (403 Forbidden) khi COOK truy cập tuyến đường /editor/*'
    );

    // 6.4: Proxy — EDITOR access /editor -> 200 OK (NextResponse.next)
    const editorReq = new NextRequest('http://localhost:3000/editor/recipes', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${editorToken}` },
    });
    const editorRes = await proxy(editorReq);
    assert(
      editorRes.status === 200,
      'Proxy cho phép EDITOR truy cập tuyến đường /editor/*'
    );

    // 6.5: Proxy — ADMIN access /admin -> 200 OK
    const adminReq = new NextRequest('http://localhost:3000/admin/settings', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
    });
    const adminRes = await proxy(adminReq);
    assert(
      adminRes.status === 200,
      'Proxy cho phép ADMIN truy cập tuyến đường /admin/*'
    );

    // 6.6: API Handler Boundary — POST /api/recipes/[id]/publish
    // COOK gọi publish -> Phải bị từ chối 403 Forbidden
    const cookPublishReq = new NextRequest('http://localhost:3000/api/recipes/1/publish', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `${SESSION_COOKIE_NAME}=${cookToken}`,
      },
      body: JSON.stringify({ isEditorialReviewed: true, isCookTested: true, isNutritionVerified: false }),
    });
    // Gọi handler với context mock
    const cookPublishRes = await publishHandler(cookPublishReq, { params: Promise.resolve({ id: '1' }) });
    assert(
      cookPublishRes.status === 403,
      'Endpoint /api/recipes/[id]/publish từ chối người dùng COOK với mã 403 Forbidden'
    );

    // -------------------------------------------------------------------------
    // T07: Redaction & No Secret Leakage Verification
    // -------------------------------------------------------------------------
    console.log('\n[T07] Redaction & No Secret Leakage Verification:');
    // Khi AUTH_SECRET bị hỏng, login phải trả 500 với thông báo an toàn
    process.env.AUTH_SECRET = '';
    const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@angimom.vn', password: 'AnyPassword123' }),
    });

    const loginRes = await loginHandler(loginReq);
    assert(loginRes.status === 500, 'Login trả về HTTP 500 khi cấu hình auth không hợp lệ');

    const loginData = await loginRes.json();
    assert(
      loginData.error === 'Lỗi cấu hình xác thực hệ thống',
      'Login trả thông điệp tiếng Việt tổng quát an toàn, không rò rỉ stack trace'
    );
    assert(
      !JSON.stringify(loginData).includes(TEST_VALID_SECRET),
      'Response body tuyệt đối không chứa giá trị secret'
    );

    // Kiểm tra hàm redactSensitiveData
    const dirtyLog = {
      message: 'Failed to connect: postgres://angimom:secret_pass_123@db:5432/angimom_prod',
      auth_secret: TEST_VALID_SECRET,
      token: validToken,
      database_url: 'postgres://angimom:secret_pass_123@db:5432/angimom_prod',
    };
    const cleaned = redactSensitiveData(dirtyLog) as Record<string, unknown>;
    assert(cleaned.auth_secret === '[REDACTED]', 'redactSensitiveData() che giấu auth_secret');
    assert(cleaned.token === '[REDACTED]', 'redactSensitiveData() che giấu token');
    assert(cleaned.database_url === '[REDACTED]', 'redactSensitiveData() che giấu trường database_url');
    assert(
      String(cleaned.message).includes('postgres://angimom:[REDACTED]@db:5432'),
      'redactSensitiveData() che giấu mật khẩu PostgreSQL connection string trong message text'
    );

    // -------------------------------------------------------------------------
    // T08: Infrastructure Config Validation
    // -------------------------------------------------------------------------
    console.log('\n[T08] Infrastructure Config Validation:');
    const prodComposePath = path.resolve(process.cwd(), 'docker-compose.prod.yml');
    const devComposePath = path.resolve(process.cwd(), 'docker-compose.yml');

    const prodComposeContent = fs.readFileSync(prodComposePath, 'utf8');
    const devComposeContent = fs.readFileSync(devComposePath, 'utf8');

    assert(
      prodComposeContent.includes('AUTH_SECRET: "${AUTH_SECRET:?'),
      'docker-compose.prod.yml yêu cầu bắt buộc AUTH_SECRET qua cú pháp fail-fast'
    );
    assert(
      !prodComposeContent.includes('JWT_SECRET'),
      'docker-compose.prod.yml không còn chứa biến JWT_SECRET'
    );
    assert(
      prodComposeContent.includes('POSTGRES_PASSWORD: "${POSTGRES_PASSWORD:?'),
      'docker-compose.prod.yml yêu cầu bắt buộc POSTGRES_PASSWORD qua cú pháp fail-fast'
    );
    assert(
      !prodComposeContent.includes('angimom_super_secret_jwt_key_production_2026'),
      'docker-compose.prod.yml không còn fallback secret mặc định'
    );
    assert(
      !prodComposeContent.includes('angimom_secure_password_2026'),
      'docker-compose.prod.yml không còn fallback password DB mặc định'
    );
    assert(
      devComposeContent.includes('AUTH_SECRET: "${AUTH_SECRET:?'),
      'docker-compose.yml (dev) yêu cầu bắt buộc AUTH_SECRET từ file .env không fallback'
    );

    // -------------------------------------------------------------------------
    // T09: Observability & Readiness Probe (/api/health)
    // -------------------------------------------------------------------------
    console.log('\n[T09] Observability & Readiness Probe (/api/health):');

    // 9.1: Khi AUTH_SECRET không hợp lệ -> /api/health trả về 503 Service Unavailable
    process.env.AUTH_SECRET = '';
    assert(
      !isAuthConfigurationValid(),
      'isAuthConfigurationValid() trả về false khi thiếu AUTH_SECRET'
    );

    const healthUnconfiguredRes = await healthHandler();
    assert(
      healthUnconfiguredRes.status === 503,
      '/api/health trả về HTTP 503 khi AUTH_SECRET thiếu hoặc không hợp lệ'
    );
    const healthUnconfiguredData = await healthUnconfiguredRes.json();
    assert(
      healthUnconfiguredData.status === 'unhealthy' && healthUnconfiguredData.auth === 'unconfigured',
      'Health response phản ánh chính xác status="unhealthy" và auth="unconfigured"'
    );

    // 9.2: Khi AUTH_SECRET hợp lệ -> isAuthConfigurationValid() trả về true
    process.env.AUTH_SECRET = TEST_VALID_SECRET;
    assert(
      isAuthConfigurationValid(),
      'isAuthConfigurationValid() trả về true khi AUTH_SECRET đạt chuẩn'
    );

  } finally {
    // Khôi phục biến môi trường
    if (originalAuthSecret !== undefined) {
      process.env.AUTH_SECRET = originalAuthSecret;
    } else {
      delete process.env.AUTH_SECRET;
    }
    if (originalJwtSecret !== undefined) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  }

  // ---------------------------------------------------------------------------
  // Tổng kết kết quả
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passedCount} PASS, ${failedCount} FAIL`);
  console.log('================================================================');

  if (failedCount > 0) {
    console.error('\nCÁC KIỂM THỬ THẤT BẠI:');
    for (const err of testErrors) {
      console.error(` - ${err}`);
    }
    process.exit(1);
  } else {
    console.log('\n>>> TOÀN BỘ CÁC CA KIỂM THỬ R0 ĐÃ ĐẠT CHUẨN PASS! <<<\n');
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Lỗi ngoại lệ trong tiến trình test:', err);
  process.exit(1);
});
