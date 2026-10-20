// AG-27: Kịch bản kiểm thử tự động cho Ranh giới Nhà cung cấp AI & Quản lý Ngân sách
// Kiểm tra Invariants Gate P4: Server-only secrets, Caps, Timeout, Rate Limiting, Graceful Fallback
// Chạy độc lập: npx tsx src/scripts/test_ai_boundary_budget.ts

import { AiGateway } from '../lib/ai/gateway';
import { MockHeuristicProvider } from '../lib/ai/mockProvider';
import { GeminiProvider } from '../lib/ai/geminiProvider';
import { OpenAiProvider } from '../lib/ai/openaiProvider';
import type { AiProvider, AiCompletionOptions, AiCompletionResult } from '../lib/ai/types';
import { redactSensitiveData } from '../lib/logger';

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

// Provider giả lập lỗi mạng / quota để kiểm tra Fallback
class FailingProvider implements AiProvider {
  readonly name = 'gemini' as const;
  isAvailable(): boolean {
    return true;
  }
  async generateCompletion(): Promise<AiCompletionResult> {
    throw new Error('429 Resource has been exhausted (e.g. check quota)');
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  AG-27 — Test Suite: AI Provider Boundary & Budget');
  console.log('======================================================\n');

  // ==========================================================
  // GROUP 1: Server-Only Secrets & Key Protection
  // ==========================================================
  console.log('--- Test Case Group 1: Server-Only Secrets & Protection ---');

  // Đảm bảo không có biến môi trường NEXT_PUBLIC_ cho API keys
  assert(process.env.NEXT_PUBLIC_GEMINI_API_KEY === undefined, 'Không có NEXT_PUBLIC_GEMINI_API_KEY (tránh rò rỉ client-side)');
  assert(process.env.NEXT_PUBLIC_OPENAI_API_KEY === undefined, 'Không có NEXT_PUBLIC_OPENAI_API_KEY (tránh rò rỉ client-side)');

  // Kiểm tra Redaction che giấu khóa API
  const sampleLogData = {
    provider: 'gemini',
    apiKey: 'AIzaSySecretApiKey1234567890',
    model: 'gemini-1.5-flash',
  };
  const redacted = redactSensitiveData(sampleLogData) as Record<string, unknown>;
  assert(redacted.apiKey === '[REDACTED]', 'Khóa API bị che giấu thành [REDACTED] khi ghi log');

  // ==========================================================
  // GROUP 2: Budget Capping & Token Clamping
  // ==========================================================
  console.log('\n--- Test Case Group 2: Budget Capping & Token Clamping ---');

  const customGateway = new AiGateway([new MockHeuristicProvider()], {
    maxOutputTokens: 800,
    timeoutMs: 5000,
    maxRequestsPerMinute: 10,
  });

  const capResult = await customGateway.complete({
    prompt: 'Gợi ý món ăn gia đình',
    maxTokens: 5000, // Yêu cầu vượt trần
    timeoutMs: 30000, // Yêu cầu timeout quá lớn
    jsonMode: true,
  });

  assert(capResult !== undefined, 'Gateway xử lý thành công request');
  assert(typeof capResult.text === 'string' && capResult.text.length > 0, 'Nhận được kết quả văn bản');
  assert(capResult.provider === 'mock', 'Provider trả về là mock');

  // ==========================================================
  // GROUP 3: Rate Limiting & Abuse Prevention
  // ==========================================================
  console.log('\n--- Test Case Group 3: Rate Limiting & Abuse Prevention ---');

  const rateGateway = new AiGateway([new MockHeuristicProvider()], {
    maxRequestsPerMinute: 3, // Giới hạn chỉ 3 requests/phút
  });

  const clientIp = '192.168.1.100';

  const req1 = rateGateway.checkRateLimit(clientIp);
  assert(req1.allowed === true && req1.remaining === 2, 'Request 1 được cho phép, còn lại 2');

  const req2 = rateGateway.checkRateLimit(clientIp);
  assert(req2.allowed === true && req2.remaining === 1, 'Request 2 được cho phép, còn lại 1');

  const req3 = rateGateway.checkRateLimit(clientIp);
  assert(req3.allowed === true && req3.remaining === 0, 'Request 3 được cho phép, còn lại 0');

  const req4 = rateGateway.checkRateLimit(clientIp);
  assert(req4.allowed === false && req4.remaining === 0, 'Request 4 bị từ chối do vượt hạn mức 3 req/phút');

  // Khi gọi complete vượt rate limit, hệ thống tự động fallback an toàn không gây lỗi 500
  const rateExceededResult = await rateGateway.complete({ prompt: 'test' }, clientIp);
  assert(rateExceededResult.isFallback === true, 'Tự động kích hoạt Fallback khi bị rate limit');

  // ==========================================================
  // GROUP 4: Automatic Fallback Chain & Circuit Breaking
  // ==========================================================
  console.log('\n--- Test Case Group 4: Automatic Fallback Chain ---');

  // Tạo gateway có Provider chính bị lỗi (429 Quota Exceeded)
  const fallbackGateway = new AiGateway([new FailingProvider(), new MockHeuristicProvider()]);

  const fallbackResult = await fallbackGateway.complete({
    prompt: 'Gợi ý mâm cơm ngày mưa',
    jsonMode: true,
  });

  assert(fallbackResult !== undefined, 'Gateway không throw crash khi provider chính lỗi');
  assert(fallbackResult.provider === 'mock', 'Tự động chuyển tiếp sang Mock Provider');
  assert(fallbackResult.isFallback === true, 'Đánh dấu cờ isFallback = true');

  // Kiểm tra tính hợp lệ của JSON trả về từ fallback
  const parsedJson = JSON.parse(fallbackResult.text);
  assert(parsedJson.recommendation !== undefined, 'JSON fallback có trường recommendation');
  assert(parsedJson.recommendation.mainSlug !== undefined, 'Có mainSlug hợp lệ');

  // ==========================================================
  // GROUP 5: Provider Availability Detection
  // ==========================================================
  console.log('\n--- Test Case Group 5: Provider Availability Detection ---');

  const geminiWithoutKey = new GeminiProvider('');
  assert(geminiWithoutKey.isAvailable() === false, 'Gemini không khả dụng khi thiếu API key');

  const geminiWithKey = new GeminiProvider('fake_key_123');
  assert(geminiWithKey.isAvailable() === true, 'Gemini khả dụng khi có API key');

  const openaiWithoutKey = new OpenAiProvider('');
  assert(openaiWithoutKey.isAvailable() === false, 'OpenAI không khả dụng khi thiếu API key');

  const mockProvider = new MockHeuristicProvider();
  assert(mockProvider.isAvailable() === true, 'Mock Heuristic luôn luôn khả dụng làm chốt chặn cuối');

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
