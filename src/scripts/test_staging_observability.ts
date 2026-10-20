// AG-25: Kịch bản kiểm thử tự động cho Triển khai Staging, Giám sát hệ thống & Logging an toàn
// Kiểm tra Invariant "log không lộ secrets", endpoint /api/health, và cấu hình container/proxy.
// Chạy độc lập: npx tsx src/scripts/test_staging_observability.ts

import fs from 'node:fs';
import path from 'node:path';
import { redactSensitiveData, logger } from '../lib/logger';
import { GET, type HealthResponse } from '../app/api/health/route';

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
  console.log('  AG-25 — Test Suite: Staging Deploy & Observability');
  console.log('======================================================\n');

  console.log('--- Test Case Group 1: Logger & Sensitive Data Redaction ---');

  // 1.1 Khử mật khẩu đơn giản
  const rawObj = {
    username: 'chef_mom',
    password: 'super_secret_password_123',
    role: 'EDITOR',
  };
  const redactedObj = redactSensitiveData(rawObj) as Record<string, unknown>;
  assert(redactedObj.username === 'chef_mom', 'Giữ nguyên trường không nhạy cảm');
  assert(redactedObj.password === '[REDACTED]', 'Che giấu mật khẩu thành [REDACTED]');
  assert(!JSON.stringify(redactedObj).includes('super_secret_password_123'), 'Chuỗi JSON không chứa mật khẩu gốc');

  // 1.2 Khử chuỗi kết nối PostgreSQL
  const dbUrl = 'postgres://angimom:secret_pass_999@db.internal:5432/angimom_prod';
  const redactedDbUrl = redactSensitiveData(dbUrl) as string;
  assert(redactedDbUrl.includes('postgres://angimom:[REDACTED]@db.internal:5432/angimom_prod'), 'Che giấu mật khẩu trong PostgreSQL URL');
  assert(!redactedDbUrl.includes('secret_pass_999'), 'Chuỗi không rò rỉ secret_pass_999');

  // 1.3 Khử Bearer Token & JWT
  const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.do_not_leak_this';
  const redactedAuth = redactSensitiveData(authHeader) as string;
  assert(redactedAuth.includes('Bearer [REDACTED]'), 'Che giấu Bearer header');
  assert(!redactedAuth.includes('do_not_leak_this'), 'Không để lộ token signature');

  // 1.4 Khử đối tượng lồng nhau (Nested object & arrays)
  const complexData = {
    apiResponse: {
      status: 200,
      tokens: {
        accessToken: 'secret_token_abc',
        refreshToken: 'secret_refresh_xyz',
      },
      cookies: ['session=secret_sess_id; Path=/'],
    },
    items: [{ id: 1, name: 'Bí đỏ' }],
  };
  const redactedComplex = redactSensitiveData(complexData) as any;
  assert(redactedComplex.apiResponse.tokens.accessToken === '[REDACTED]', 'Che giấu accessToken lồng nhau');
  assert(redactedComplex.apiResponse.tokens.refreshToken === '[REDACTED]', 'Che giấu refreshToken lồng nhau');
  assert(redactedComplex.items[0].name === 'Bí đỏ', 'Bảo toàn mảng nguyên liệu bình thường');

  // 1.5 Kiểm tra logger method không throw error
  let logSuccess = false;
  try {
    const entry = logger.info('Test log event', { secret: 'hidden_pass', safe: 'visible_val' });
    logSuccess = entry.level === 'INFO';
  } catch {
    logSuccess = false;
  }
  assert(logSuccess, 'Logger hoạt động an toàn');

  console.log('\n--- Test Case Group 2: Healthcheck API Route (/api/health) ---');

  const healthRes = await GET();
  assert(healthRes.status === 200, 'Healthcheck trả về HTTP 200 khi DB kết nối thành công');

  const cacheHeader = healthRes.headers.get('Cache-Control');
  assert(Boolean(cacheHeader?.includes('no-store')), 'Healthcheck không được cache (Cache-Control: no-store)');

  const healthBody = (await healthRes.json()) as HealthResponse;
  assert(healthBody.status === 'healthy', 'Status trả về "healthy"');
  assert(healthBody.database === 'connected', 'Database trả về "connected"');
  assert(typeof healthBody.uptimeSeconds === 'number' && healthBody.uptimeSeconds >= 0, 'Có uptimeSeconds hợp lệ');
  assert(healthBody.version === '0.1.0', 'Khai báo đúng phiên bản 0.1.0');
  assert(typeof healthBody.timestamp === 'string', 'Có ISO timestamp');

  // Đảm bảo không chứa secrets
  const serializedHealth = JSON.stringify(healthBody);
  assert(!serializedHealth.includes('angimom_password'), 'Payload healthcheck tuyệt đối không chứa DB password');
  assert(!serializedHealth.includes('5432'), 'Payload healthcheck không để lộ port nội bộ');

  console.log('\n--- Test Case Group 3: Healthcheck Error Resilience ---');

  // Giả lập xử lý lỗi an toàn không rò rỉ credential
  const simulatedDbError = new Error('connect ECONNREFUSED postgres://angimom:super_secret_db_pass@127.0.0.1:5432');
  const sanitizedSimulatedError = redactSensitiveData(simulatedDbError) as { message: string };
  assert(!sanitizedSimulatedError.message.includes('super_secret_db_pass'), 'Sanitize error message khử triệt để password khi có sự cố kết nối');
  assert(sanitizedSimulatedError.message.includes('[REDACTED]'), 'Password được thay bằng [REDACTED]');

  console.log('\n--- Test Case Group 4: Containerization & Infrastructure Validation ---');

  const rootDir = path.resolve(__dirname, '../..');
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
  const caddyfilePath = path.join(rootDir, 'Caddyfile');

  // 4.1 Kiểm tra Dockerfile
  assert(fs.existsSync(dockerfilePath), 'Tồn tại Dockerfile');
  const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
  assert(dockerfileContent.includes('FROM node:22-alpine'), 'Sử dụng base image nhẹ node:22-alpine');
  assert(dockerfileContent.includes('USER nextjs'), 'Chạy dưới user không đặc quyền (non-root USER nextjs)');
  assert(dockerfileContent.includes('.next/standalone'), 'Tận dụng standalone output build');
  assert(dockerfileContent.includes('EXPOSE 3000'), 'Expose cổng 3000');

  // 4.2 Kiểm tra docker-compose.yml
  assert(fs.existsSync(dockerComposePath), 'Tồn tại docker-compose.yml');
  const composeContent = fs.readFileSync(dockerComposePath, 'utf-8');
  assert(composeContent.includes('angimom_postgres'), 'Định nghĩa container postgres');
  assert(composeContent.includes('angimom_web'), 'Định nghĩa container web');
  assert(composeContent.includes('angimom_caddy'), 'Định nghĩa container caddy reverse proxy');
  assert(composeContent.includes('pgdata:'), 'Lưu trữ volume bền vững pgdata cho database');
  assert(composeContent.includes('uploads_data:'), 'Lưu trữ volume bền vững uploads_data cho ảnh tải lên');
  assert(composeContent.includes('caddy_data:'), 'Lưu trữ volume bền vững caddy_data cho chứng chỉ SSL');
  assert(composeContent.includes('/api/health'), 'Cấu hình healthcheck probe trỏ vào /api/health');
  assert(composeContent.includes('condition: service_healthy'), 'Caddy phụ thuộc vào trạng thái service_healthy của web');

  // 4.3 Kiểm tra Caddyfile
  assert(fs.existsSync(caddyfilePath), 'Tồn tại Caddyfile');
  const caddyContent = fs.readFileSync(caddyfilePath, 'utf-8');
  assert(caddyContent.includes('reverse_proxy web:3000'), 'Caddy reverse proxy tới web:3000');
  assert(caddyContent.includes('encode gzip zstd'), 'Kích hoạt nén gzip và zstd tối ưu đường truyền');

  console.log('\n======================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Lỗi ngoại lệ khi chạy test suite:', err);
  process.exit(1);
});
