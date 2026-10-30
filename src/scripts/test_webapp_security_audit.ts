/**
 * Test Suite: WebApp Security Hardening & Verification (F-01 .. F-06)
 * Kiểm thử toàn diện các chốt chặn bảo mật theo chuẩn skill `webapp-security`:
 * - F-01: Chống SSRF (IP nội bộ, loopback, cloud metadata, IPv6-mapped IPv4, redirect sang nội bộ, tràn bộ nhớ stream)
 * - F-02: Chặn BFLA & vượt cổng xuất bản trên PATCH /api/editor/recipes/[id]/quick-badges
 * - F-03: Chặn IDOR gián tiếp làm lộ công thức DRAFT trên POST /api/diary
 * - F-04: Chặn CSRF (Cross-Site Sec-Fetch-Site / Origin), Rate Limit và cổng An toàn thực phẩm khi sửa bài PUT
 * - F-05: Thu hồi phiên (sessionVersion) tại tầng Proxy Middleware (/admin, /editor)
 * - F-06: Ẩn chi tiết lỗi 500 trên /api/editor/safety-audit, tối giản /api/health công khai & chống giả mạo X-Forwarded-For
 *
 * Chạy bằng lệnh: npx tsx src/scripts/test_webapp_security_audit.ts
 */

import { NextRequest } from 'next/server';
import {
  isPrivateOrReservedIp,
  validateOutboundUrl,
  safeFetchText,
  UnsafeOutboundUrlError,
} from '../lib/security/safeUrl';
import { getClientIp, checkRateLimit } from '../lib/auth/rateLimit';
import { signToken, SESSION_COOKIE_NAME } from '../lib/auth/session';
import { auditRecipeSafetyAndQuality } from '../lib/safety/foodSafetyAuditor';
import { PATCH as quickBadgesHandler } from '../app/api/editor/recipes/[id]/quick-badges/route';
import { POST as diaryPostHandler } from '../app/api/diary/route';
import { POST as contributePostHandler } from '../app/api/contribute/recipes/route';
import { PUT as contributePutHandler, DELETE as contributeDeleteHandler } from '../app/api/contribute/recipes/[id]/route';
import { POST as recipesPostHandler } from '../app/api/recipes/route';
import { POST as aiDraftPostHandler } from '../app/api/ai/recipe-draft/route';
import { POST as safetyAuditPostHandler } from '../app/api/editor/safety-audit/route';
import { POST as nutritionPostHandler } from '../app/api/recipes/[id]/nutrition/route';
import { POST as pantryPostHandler } from '../app/api/pantry/route';
import { POST as claimPostHandler } from '../app/api/recipes/[id]/claim/route';
import { GET as aiSettingsGetHandler, PUT as aiSettingsPutHandler, POST as aiSettingsPostHandler } from '../app/api/editor/ai-settings/route';
import { encryptConfigPayload, decryptConfigPayload, maskApiKey } from '../lib/ai/configStore';
import { GET as healthGetHandler } from '../app/api/health/route';
import { proxy } from '../proxy';
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.error(`  ✗ FAIL: ${message}`);
  }
}

const TEST_SECRET = 'angimom_webapp_security_verification_secret_2026_32chars';

async function expectUnsafeUrl(
  url: string,
  expectedCode: string | string[],
  description: string,
  resolveDns?: (host: string) => Promise<string[]>
) {
  let caught: UnsafeOutboundUrlError | null = null;
  try {
    await validateOutboundUrl(url, resolveDns ? { resolveDns } : undefined);
  } catch (err) {
    if (err instanceof UnsafeOutboundUrlError) {
      caught = err;
    }
  }
  const codes = Array.isArray(expectedCode) ? expectedCode : [expectedCode];
  assert(
    caught !== null && codes.includes(caught.code),
    `${description} (mã lỗi: ${caught?.code ?? 'NONE'})`
  );
}

async function runSecurityVerificationSuite() {
  console.log('================================================================');
  console.log('  KIỂM THỬ BẢO MẬT WEBAPP-SECURITY (F-01 -> F-06)');
  console.log('================================================================\n');

  const originalSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = TEST_SECRET;

  try {
    // =========================================================================
    // [F-01] SSRF Protection: Positive, Negative & Bypass Tests
    // =========================================================================
    console.log('[F-01] Kiểm thử chống SSRF (safeUrl / fetchExternalRecipeContent):');

    // 1.1: Kiểm tra bộ lọc IP nội bộ / dự trữ / metadata / IPv6
    assert(isPrivateOrReservedIp('127.0.0.1') === true, 'Chặn IPv4 loopback 127.0.0.1');
    assert(isPrivateOrReservedIp('127.255.255.254') === true, 'Chặn dải 127.0.0.0/8');
    assert(isPrivateOrReservedIp('0.0.0.0') === true, 'Chặn 0.0.0.0');
    assert(isPrivateOrReservedIp('10.0.0.1') === true, 'Chặn RFC1918 10.0.0.1');
    assert(isPrivateOrReservedIp('172.16.0.1') === true, 'Chặn RFC1918 172.16.0.1');
    assert(isPrivateOrReservedIp('172.31.255.255') === true, 'Chặn RFC1918 172.31.255.255');
    assert(isPrivateOrReservedIp('192.168.1.1') === true, 'Chặn RFC1918 192.168.1.1');
    assert(isPrivateOrReservedIp('169.254.169.254') === true, 'Chặn AWS/GCP/Cloud Metadata IP 169.254.169.254');
    assert(isPrivateOrReservedIp('100.64.0.1') === true, 'Chặn Carrier-Grade NAT 100.64.0.1');
    assert(isPrivateOrReservedIp('::1') === true, 'Chặn IPv6 loopback ::1');
    assert(isPrivateOrReservedIp('::ffff:127.0.0.1') === true, 'Chặn Bypass IPv4-mapped IPv6 ::ffff:127.0.0.1');
    assert(isPrivateOrReservedIp('::ffff:169.254.169.254') === true, 'Chặn Bypass IPv4-mapped IPv6 metadata ::ffff:169.254.169.254');
    assert(isPrivateOrReservedIp('::ffff:7f00:1') === true, 'Chặn Bypass IPv4-mapped IPv6 dạng hex ::ffff:7f00:1');
    assert(isPrivateOrReservedIp('fc00::1') === true, 'Chặn IPv6 Unique Local fc00::1');
    assert(isPrivateOrReservedIp('fe80::1%eth0') === true, 'Chặn IPv6 Link-Local kèm zone index fe80::1%eth0');

    // Positive IP check
    assert(isPrivateOrReservedIp('172.15.0.1') === false, 'Cho phép IP công cộng 172.15.0.1 (ngoài dải 172.16/12)');
    assert(isPrivateOrReservedIp('172.32.0.1') === false, 'Cho phép IP công cộng 172.32.0.1 (ngoài dải 172.16/12)');
    assert(isPrivateOrReservedIp('8.8.8.8') === false, 'Cho phép IP công cộng 8.8.8.8');
    assert(isPrivateOrReservedIp('2606:4700:4700::1111') === false, 'Cho phép IPv6 công cộng');

    // 1.2: Kiểm tra validateOutboundUrl (Negative & Bypass)
    await expectUnsafeUrl('file:///etc/passwd', 'INVALID_PROTOCOL', 'Chặn giao thức file://');
    await expectUnsafeUrl('ftp://monngonmoingay.com/recipe', 'INVALID_PROTOCOL', 'Chặn giao thức ftp://');
    await expectUnsafeUrl('http://admin:secret@example.com/', 'CREDENTIALS_IN_URL', 'Chặn URL nhúng user:pass@host');
    await expectUnsafeUrl('http://example.com:5432/db', 'NON_STANDARD_PORT', 'Chặn cổng nội bộ phi tiêu chuẩn (:5432)');
    await expectUnsafeUrl('http://localhost/admin', 'BLOCKED_HOSTNAME', 'Chặn hostname localhost');
    await expectUnsafeUrl('http://sub.localhost/api', 'BLOCKED_HOSTNAME', 'Chặn tên miền *.localhost');
    await expectUnsafeUrl('http://metadata.google.internal/computeMetadata/v1/', 'BLOCKED_HOSTNAME', 'Chặn metadata.google.internal');
    await expectUnsafeUrl('http://redis.svc.cluster.local/', 'BLOCKED_HOSTNAME', 'Chặn Kubernetes *.svc.cluster.local');
    await expectUnsafeUrl('http://2130706433/', ['OBFUSCATED_IP', 'PRIVATE_IP_LITERAL'], 'Chặn Bypass IP dạng số nguyên thập phân (2130706433 = 127.0.0.1)');
    await expectUnsafeUrl('http://0x7f000001/', ['OBFUSCATED_IP', 'PRIVATE_IP_LITERAL'], 'Chặn Bypass IP dạng hex (0x7f000001)');
    await expectUnsafeUrl('http://169.254.169.254/latest/meta-data/', 'PRIVATE_IP_LITERAL', 'Chặn IP literal 169.254.169.254');
    await expectUnsafeUrl('http://[::1]/', 'PRIVATE_IP_LITERAL', 'Chặn IPv6 literal [::1]');
    await expectUnsafeUrl(
      'https://evil-rebind.example.com/recipe',
      'PRIVATE_RESOLVED_IP',
      'Chặn DNS trả về IP nội bộ 10.0.0.8 (DNS Rebinding / A record nội bộ)',
      async () => ['93.184.216.34', '10.0.0.8']
    );

    // Positive URL validation
    const validParsed = await validateOutboundUrl('https://monngonmoingay.com/canh-chua-ca-loc/', {
      resolveDns: async () => ['104.26.10.22'],
    });
    assert(validParsed.hostname === 'monngonmoingay.com', 'Cho phép URL công cộng hợp lệ khi DNS trả về IP public');

    // 1.3: Kiểm tra Bypass qua HTTP Redirect (302 chuyển hướng về 169.254.169.254)
    let redirectBlocked = false;
    try {
      await safeFetchText('https://public-blog.example.com/recipe', {
        resolveDns: async () => ['104.26.10.22'],
        fetchImpl: async () =>
          new Response(null, {
            status: 302,
            headers: { location: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/' },
          }),
      });
    } catch (err) {
      redirectBlocked = err instanceof UnsafeOutboundUrlError && err.code === 'PRIVATE_IP_LITERAL';
    }
    assert(redirectBlocked, 'Chặn Bypass SSRF qua Redirect 302 từ trang công khai sang Cloud Metadata 169.254.169.254');

    // 1.4: Kiểm tra giới hạn dung lượng phản hồi (Chống OOM)
    let sizeCapBlocked = false;
    try {
      await safeFetchText('https://public-blog.example.com/huge', {
        maxBytes: 1024,
        resolveDns: async () => ['104.26.10.22'],
        fetchImpl: async () => new Response('A'.repeat(4096), { status: 200 }),
      });
    } catch (err) {
      sizeCapBlocked = err instanceof UnsafeOutboundUrlError && err.code === 'RESPONSE_TOO_LARGE';
    }
    assert(sizeCapBlocked, 'Chặn phản hồi vượt quá giới hạn maxBytes (RESPONSE_TOO_LARGE)');

    // =========================================================================
    // [F-02] BFLA & Gate Bypass Protection on PATCH /api/editor/recipes/[id]/quick-badges
    // =========================================================================
    console.log('\n[F-02] Kiểm thử chặn BFLA & vượt cổng xuất bản trên quick-badges:');

    const anonQuickReq = new NextRequest('http://localhost:3000/api/editor/recipes/1/quick-badges', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ isEditorialReviewed: true }),
    });
    const anonQuickRes = await quickBadgesHandler(anonQuickReq, { params: Promise.resolve({ id: '1' }) });
    assert(anonQuickRes.status === 401, 'Chặn người dùng ẩn danh gọi PATCH /api/editor/recipes/[id]/quick-badges (401)');

    const crossSiteQuickReq = new NextRequest('http://localhost:3000/api/editor/recipes/1/quick-badges', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        host: 'localhost:3000',
        origin: 'https://attacker.evil.com',
        'sec-fetch-site': 'cross-site',
      },
      body: JSON.stringify({ isEditorialReviewed: true }),
    });
    const crossSiteQuickRes = await quickBadgesHandler(crossSiteQuickReq, { params: Promise.resolve({ id: '1' }) });
    assert(crossSiteQuickRes.status === 403, 'Chặn yêu cầu Cross-Site (CSRF) vào quick-badges (403)');

    // Kiểm tra mã nguồn route quick-badges đã khóa cứng role === 'ADMIN' và cấm truyền status
    const quickBadgesSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/api/editor/recipes/[id]/quick-badges/route.ts'),
      'utf8'
    );
    assert(
      quickBadgesSource.includes("user.role !== 'ADMIN'") &&
        !quickBadgesSource.includes("user.role !== 'EDITOR'"),
      'Route quick-badges chỉ cho phép duy nhất vai trò ADMIN (chặn EDITOR theo D31)'
    );
    assert(
      quickBadgesSource.includes("'status' in body") &&
        quickBadgesSource.includes('validateVerificationFlags'),
      'Route quick-badges chặn truyền trực tiếp status/caloriesPerServing và bắt buộc kiểm tra validateVerificationFlags (D23/R7)'
    );

    // =========================================================================
    // [F-03] Indirect IDOR Protection on POST /api/diary
    // =========================================================================
    console.log('\n[F-03] Kiểm thử chống IDOR gián tiếp trên POST /api/diary:');

    const diarySource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/api/diary/route.ts'),
      'utf8'
    );
    assert(
      diarySource.includes("recipe.status === 'PUBLISHED' || recipe.authorId === user.id || isStaff"),
      'POST /api/diary kiểm tra quyền sở hữu / trạng thái PUBLISHED trước khi đọc tên & dinh dưỡng công thức'
    );

    const crossSiteDiaryReq = new NextRequest('http://localhost:3000/api/diary', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        host: 'localhost:3000',
        origin: 'https://evil.example.org',
        'sec-fetch-site': 'cross-site',
      },
      body: JSON.stringify({ recipeId: 999, consumedPortion: 1 }),
    });
    const crossSiteDiaryRes = await diaryPostHandler(crossSiteDiaryReq);
    assert(crossSiteDiaryRes.status === 403, 'POST /api/diary từ chối yêu cầu Cross-Site CSRF với mã 403');

    // =========================================================================
    // [F-04] CSRF, Rate Limit & PUT Food Safety Audit Enforcement
    // =========================================================================
    console.log('\n[F-04] Kiểm thử CSRF, Rate Limit & Chốt An toàn Thực phẩm khi cập nhật (PUT):');

    const csrfTestRoutes: Array<{ name: string; call: (req: NextRequest) => Promise<Response> }> = [
      { name: 'POST /api/contribute/recipes', call: (r) => contributePostHandler(r) },
      { name: 'PUT /api/contribute/recipes/[id]', call: (r) => contributePutHandler(r, { params: Promise.resolve({ id: '1' }) }) },
      { name: 'DELETE /api/contribute/recipes/[id]', call: (r) => contributeDeleteHandler(r, { params: Promise.resolve({ id: '1' }) }) },
      { name: 'POST /api/recipes', call: (r) => recipesPostHandler(r) },
      { name: 'POST /api/ai/recipe-draft', call: (r) => aiDraftPostHandler(r) },
      { name: 'POST /api/editor/safety-audit', call: (r) => safetyAuditPostHandler(r) },
      { name: 'POST /api/recipes/[id]/nutrition', call: (r) => nutritionPostHandler(r, { params: Promise.resolve({ id: '1' }) }) },
      { name: 'POST /api/pantry', call: (r) => pantryPostHandler(r) },
      { name: 'POST /api/recipes/[id]/claim', call: (r) => claimPostHandler(r, { params: Promise.resolve({ id: '1' }) }) },
    ];

    for (const item of csrfTestRoutes) {
      const evilReq = new NextRequest('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          host: 'localhost:3000',
          origin: 'https://csrf-attacker.example.com',
          'sec-fetch-site': 'cross-site',
        },
        body: JSON.stringify({}),
      });
      const res = await item.call(evilReq);
      assert(res.status === 403, `${item.name} chặn yêu cầu Cross-Site (CSRF) với HTTP 403`);
    }

    // Kiểm tra PUT /api/contribute/recipes/[id] có gọi auditRecipeSafetyAndQuality và chặn DANGER (422)
    const contributePutSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/api/contribute/recipes/[id]/route.ts'),
      'utf8'
    );
    assert(
      contributePutSource.includes('auditRecipeSafetyAndQuality') &&
        contributePutSource.includes("safetyAudit.verdict === 'DANGER'"),
      'PUT /api/contribute/recipes/[id] bắt buộc chạy auditRecipeSafetyAndQuality và chặn 422 khi verdict === DANGER'
    );

    // Kiểm thử trực tiếp bộ kiểm định độc chất học với món nguy hiểm (tiết canh / cá nóc)
    const toxicAudit = auditRecipeSafetyAndQuality({
      name: 'Tiết canh lợn tươi đánh tại nhà',
      shortDescription: 'Món tiết canh sống truyền thống',
      baseServings: 4,
      prepTimeMinutes: 15,
      cookTimeMinutes: 0,
      ingredients: [{ name: 'Tiết lợn sống', amount: 300, unit: 'ml' }],
      steps: [{ phaseName: 'Pha chế', instruction: 'Hãm tiết sống với nước mắm rồi đánh đông không nấu chín.' }],
    });
    assert(
      toxicAudit.verdict === 'DANGER' && toxicAudit.safetyScore < 40,
      'Bộ kiểm định an toàn thực phẩm trả về DANGER cho món Tiết canh sống'
    );

    // =========================================================================
    // [F-05] Session Revocation at Proxy Middleware
    // =========================================================================
    console.log('\n[F-05] Kiểm thử thu hồi phiên (sessionVersion) tại Proxy Middleware:');

    const proxySource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/proxy.ts'),
      'utf8'
    );
    assert(
      proxySource.includes('getSessionUser') && proxySource.includes("typeof decoded.sv === 'number'"),
      'Proxy Middleware đối chiếu getSessionUser (kiểm tra sessionVersion & role trong CSDL) đối với token phiên thực'
    );

    // Token có sv: 999 nhưng user không tồn tại trong CSDL (hoặc đã bị xóa/thu hồi) -> Proxy phải từ chối và redirect về /admin-login
    const revokedAdminToken = await signToken({
      id: 999999,
      email: 'revoked.admin@angimom.vn',
      displayName: 'Revoked Admin',
      role: 'ADMIN',
      sv: 99,
    });
    const revokedProxyReq = new NextRequest('http://localhost:3000/editor/recipes', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${revokedAdminToken}` },
    });
    const revokedProxyRes = await proxy(revokedProxyReq);
    assert(
      (revokedProxyRes.status === 307 || revokedProxyRes.status === 302) &&
        new URL(revokedProxyRes.headers.get('location') || 'http://x/').pathname === '/admin-login',
      'Proxy chặn ngay token có sv không khớp/đã thu hồi trong CSDL và chuyển hướng về /admin-login'
    );

    // =========================================================================
    // [F-06] Error Detail Redaction, /api/health Minimization & getClientIp Hardening
    // =========================================================================
    console.log('\n[F-06] Kiểm thử ẩn chi tiết lỗi 500, tối giản /api/health & chống giả mạo IP:');

    const safetyAuditSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/api/editor/safety-audit/route.ts'),
      'utf8'
    );
    assert(
      !safetyAuditSource.includes('details: String(error)'),
      'Route /api/editor/safety-audit không còn trả details: String(error) ra JSON 500'
    );

    // Kiểm tra /api/health cho khách ẩn danh không lộ uptimeSeconds / environment / version
    process.env.AUTH_SECRET = '';
    const publicHealthRes = await healthGetHandler();
    const publicHealthJson = await publicHealthRes.json();
    assert(
      publicHealthJson.uptimeSeconds === undefined &&
        publicHealthJson.environment === undefined &&
        publicHealthJson.version === undefined,
      '/api/health ẩn uptimeSeconds, environment và version đối với truy vấn công khai không có quyền ADMIN'
    );
    process.env.AUTH_SECRET = TEST_SECRET;

    // Kiểm tra getClientIp chống giả mạo X-Forwarded-For đầu chuỗi
    const spoofedIpReq = new Request('http://localhost:3000/api/auth/login', {
      headers: {
        'x-forwarded-for': '1.1.1.1, 2.2.2.2, 203.0.113.55',
      },
    });
    assert(
      getClientIp(spoofedIpReq) === '203.0.113.55',
      'getClientIp() lấy phần tử cuối (rightmost hop) của X-Forwarded-For, chống kẻ tấn công chèn IP giả ở đầu chuỗi'
    );

    const realIpPriorityReq = new Request('http://localhost:3000/api/auth/login', {
      headers: {
        'x-real-ip': '198.51.100.42',
        'x-forwarded-for': '9.9.9.9, 8.8.8.8',
      },
    });
    assert(
      getClientIp(realIpPriorityReq) === '198.51.100.42',
      'getClientIp() ưu tiên x-real-ip từ reverse proxy biên trước x-forwarded-for'
    );

    const maliciousHeaderReq = new Request('http://localhost:3000/api/auth/login', {
      headers: {
        'x-forwarded-for': '<script>alert(1)</script>, 198.51.100.77',
      },
    });
    assert(
      getClientIp(maliciousHeaderReq) === '198.51.100.77',
      'getClientIp() loại bỏ chuỗi IP chứa ký tự độc hại / không hợp lệ'
    );

    // Kiểm tra bộ đếm Rate Limit hoạt động chính xác
    const rlNamespace = `sec-verify-${Date.now()}`;
    const r1 = checkRateLimit(rlNamespace, '203.0.113.55', 2, 60_000);
    const r2 = checkRateLimit(rlNamespace, '203.0.113.55', 2, 60_000);
    const r3 = checkRateLimit(rlNamespace, '203.0.113.55', 2, 60_000);
    assert(r1.allowed && r2.allowed && !r3.allowed, 'Rate Limiter chặn chính xác yêu cầu vượt ngưỡng tối đa');

    // =========================================================================
    // [F-07] DeepSeek AI Settings Encryption (AES-256-GCM) & RBAC/CSRF Protection
    // =========================================================================
    console.log('\n[F-07] Kiểm thử mã hóa AES-256-GCM & phân quyền cho cổng Kết nối AI DeepSeek:');

    const sampleSecretKey = 'sk-deepseek-secret-key-9876543210abcd';
    const encrypted = encryptConfigPayload({
      primaryOrder: 'DEEPSEEK_FIRST',
      deepseekApiKey: sampleSecretKey,
      deepseekModel: 'deepseek-chat',
    });
    assert(
      encrypted.startsWith('v1:') && !encrypted.includes(sampleSecretKey),
      'encryptConfigPayload() mã hóa AES-256-GCM không để lộ plaintext API key'
    );

    const decrypted = decryptConfigPayload(encrypted);
    assert(
      decrypted !== null &&
        decrypted.primaryOrder === 'DEEPSEEK_FIRST' &&
        decrypted.deepseekApiKey === sampleSecretKey,
      'decryptConfigPayload() giải mã chính xác cấu hình AI đã mã hóa'
    );

    const masked = maskApiKey(sampleSecretKey);
    assert(
      masked === 'sk-••••••••••••abcd' && !masked.includes('9876543210'),
      'maskApiKey() che giấu toàn bộ thân khóa, chỉ giữ 3 ký tự đầu và 4 ký tự cuối'
    );

    const anonAiGet = await aiSettingsGetHandler(
      new NextRequest('http://localhost:3000/api/editor/ai-settings')
    );
    assert(anonAiGet.status === 401, 'GET /api/editor/ai-settings chặn khách chưa đăng nhập (401)');

    const csrfAiPut = await aiSettingsPutHandler(
      new NextRequest('http://localhost:3000/api/editor/ai-settings', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          host: 'localhost:3000',
          origin: 'https://evil-attacker.example.com',
          'sec-fetch-site': 'cross-site',
        },
        body: JSON.stringify({ deepseekApiKey: 'sk-123' }),
      })
    );
    assert(csrfAiPut.status === 403, 'PUT /api/editor/ai-settings chặn yêu cầu Cross-Site CSRF (403)');

    const csrfAiPost = await aiSettingsPostHandler(
      new NextRequest('http://localhost:3000/api/editor/ai-settings', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          host: 'localhost:3000',
          origin: 'https://evil-attacker.example.com',
          'sec-fetch-site': 'cross-site',
        },
        body: JSON.stringify({ provider: 'deepseek' }),
      })
    );
    assert(csrfAiPost.status === 403, 'POST /api/editor/ai-settings chặn yêu cầu Cross-Site CSRF (403)');
  } finally {
    if (originalSecret !== undefined) {
      process.env.AUTH_SECRET = originalSecret;
    } else {
      delete process.env.AUTH_SECRET;
    }
  }

  console.log('\n================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ BẢO MẬT: ${passed} PASS / ${failed} FAIL`);
  console.log('================================================================');

  if (failed > 0) {
    console.error('\nCÁC KIỂM THỬ THẤT BẠI:');
    for (const f of failures) {
      console.error(` - ${f}`);
    }
    process.exit(1);
  } else {
    console.log('\n>>> TOÀN BỘ CA KIỂM THỬ BẢO MẬT F-01 .. F-06 ĐẠT 100% PASS! <<<\n');
    process.exit(0);
  }
}

runSecurityVerificationSuite().catch((err) => {
  console.error('Lỗi ngoại lệ khi chạy bộ kiểm thử bảo mật:', err);
  process.exit(1);
});
