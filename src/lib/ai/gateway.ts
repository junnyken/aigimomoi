// AG-27: AI Gateway & Budget Manager (Hỗ trợ DeepSeek + Gemini + OpenAI + Heuristic Fallback)
// Quản lý rate limit, token capping, timeout và chuỗi tự động Fallback theo thứ tự ưu tiên Admin cấu hình.
// Invariants Gate P4: Không gây chi phí không kiểm soát, không crash khi AI provider lỗi.

import type { AiProvider, AiCompletionOptions, AiCompletionResult, AiBudgetConfig } from './types';
import { DEFAULT_AI_BUDGET } from './types';
import { DeepSeekProvider } from './deepseekProvider';
import { GeminiProvider } from './geminiProvider';
import { OpenAiProvider } from './openaiProvider';
import { MockHeuristicProvider } from './mockProvider';
import { getEffectiveAiConfig } from './configStore';
import { logger } from '../logger';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class AiGateway {
  private customProviders: AiProvider[] | null = null;
  private budgetConfig: AiBudgetConfig;
  private rateLimitMap = new Map<string, RateLimitRecord>();

  constructor(providers?: AiProvider[], config?: Partial<AiBudgetConfig>) {
    this.budgetConfig = { ...DEFAULT_AI_BUDGET, ...config };

    if (providers && providers.length > 0) {
      this.customProviders = providers;
    }
  }

  /**
   * Xây dựng danh sách Provider động dựa trên cấu hình mới nhất trong Admin Portal & biến môi trường
   */
  private async resolveActiveProviders(): Promise<AiProvider[]> {
    if (this.customProviders && this.customProviders.length > 0) {
      return this.customProviders;
    }

    const cfg = await getEffectiveAiConfig();
    const deepseek = new DeepSeekProvider(cfg.deepseek.apiKey, cfg.deepseek.model, cfg.deepseek.baseUrl);
    const gemini = new GeminiProvider(cfg.gemini.apiKey, cfg.gemini.model);
    const openai = new OpenAiProvider(cfg.openai.apiKey, cfg.openai.model);
    const mock = new MockHeuristicProvider();

    if (cfg.primaryOrder === 'GEMINI_FIRST') {
      return [gemini, deepseek, openai, mock];
    }
    if (cfg.primaryOrder === 'OPENAI_FIRST') {
      return [openai, deepseek, gemini, mock];
    }
    // Mặc định: DEEPSEEK_FIRST (DeepSeek số 1 -> Gemini số 2 dự phòng -> OpenAI -> Mock)
    return [deepseek, gemini, openai, mock];
  }

  /**
   * Kiểm tra và áp dụng Rate Limiting theo Client IP hoặc Identifier.
   */
  checkRateLimit(clientId: string): { allowed: boolean; remaining: number; resetInSeconds: number } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 phút

    if (this.rateLimitMap.size > 500) {
      for (const [key, val] of this.rateLimitMap.entries()) {
        if (now >= val.resetAt) {
          this.rateLimitMap.delete(key);
        }
      }
    }

    let record = this.rateLimitMap.get(clientId);

    if (!record || now >= record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      this.rateLimitMap.set(clientId, record);
      return { allowed: true, remaining: this.budgetConfig.maxRequestsPerMinute - 1, resetInSeconds: 60 };
    }

    if (record.count >= this.budgetConfig.maxRequestsPerMinute) {
      const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);
      return { allowed: false, remaining: 0, resetInSeconds };
    }

    record.count++;
    const remaining = this.budgetConfig.maxRequestsPerMinute - record.count;
    const resetInSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: true, remaining, resetInSeconds };
  }

  /**
   * Reset rate limit (dùng cho testing)
   */
  resetRateLimit() {
    this.rateLimitMap.clear();
  }

  /**
   * Thực hiện gọi AI với cơ chế Capping & Automatic Fallback.
   */
  async complete(
    options: AiCompletionOptions,
    clientId = 'anonymous'
  ): Promise<AiCompletionResult> {
    // 1. Kiểm tra Rate Limit
    const rateStatus = this.checkRateLimit(clientId);
    if (!rateStatus.allowed) {
      logger.warn('AI Rate limit exceeded, falling back to Mock Heuristic Provider', {
        clientId,
        resetInSeconds: rateStatus.resetInSeconds,
      });

      const mock = new MockHeuristicProvider();
      const mockResult = await mock.generateCompletion(options);
      return {
        ...mockResult,
        isFallback: true,
      };
    }

    // 2. Chuẩn hóa Capping theo ngân sách
    const safeOptions: AiCompletionOptions = {
      ...options,
      maxTokens: Math.min(options.maxTokens || this.budgetConfig.maxOutputTokens, this.budgetConfig.maxOutputTokens),
      timeoutMs: Math.min(options.timeoutMs || this.budgetConfig.timeoutMs, this.budgetConfig.timeoutMs),
    };

    // 3. Chuỗi Fallback: Thử từng provider theo thứ tự ưu tiên đã cấu hình
    const activeProviders = await this.resolveActiveProviders();
    let lastError: Error | null = null;

    for (const provider of activeProviders) {
      if (!provider.isAvailable()) {
        continue;
      }

      try {
        logger.info(`Invoking AI Provider: ${provider.name}`, {
          maxTokens: safeOptions.maxTokens,
          timeoutMs: safeOptions.timeoutMs,
          jsonMode: safeOptions.jsonMode,
        });

        const result = await provider.generateCompletion(safeOptions);
        return result;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        logger.warn(`AI Provider ${provider.name} failed: ${lastError.message}. Trying next provider...`);
      }
    }

    // 4. Nếu toàn bộ provider lỗi, kích hoạt chốt chặn Mock Heuristic cuối cùng
    logger.warn('All configured AI providers failed, engaging ultimate Heuristic Fallback', {
      error: lastError?.message,
    });

    const ultimateMock = new MockHeuristicProvider();
    const fallbackResult = await ultimateMock.generateCompletion(safeOptions);

    return {
      ...fallbackResult,
      isFallback: true,
    };
  }
}

// Singleton gateway dùng chung trong app
export const aiGateway = new AiGateway();
