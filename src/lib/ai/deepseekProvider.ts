// DeepSeek AI Provider Adapter (DeepSeek-V3 `deepseek-chat` & DeepSeek-R1 `deepseek-reasoner`)
// Tuân thủ Invariants Gate P4 & webapp-security:
// - Khóa API chỉ chạy trên server (từ Admin Config AES-256-GCM hoặc biến môi trường DEEPSEEK_API_KEY).
// - Kiểm tra baseUrl qua validateOutboundUrl chống SSRF.
// - Hỗ trợ JSON Mode chuẩn xác cho soạn thảo công thức & kiểm định độc chất học.

import type { AiProvider, AiCompletionOptions, AiCompletionResult } from './types';
import { validateOutboundUrl } from '../security/safeUrl';
import { logger } from '../logger';

export class DeepSeekProvider implements AiProvider {
  readonly name = 'deepseek' as const;
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(apiKey?: string, modelName?: string, baseUrl?: string) {
    this.apiKey = (apiKey || process.env.DEEPSEEK_API_KEY || '').trim() || undefined;
    this.modelName = (modelName || process.env.DEEPSEEK_MODEL || 'deepseek-chat').trim();
    this.baseUrl = (baseUrl || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').trim();
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  async generateCompletion(options: AiCompletionOptions): Promise<AiCompletionResult> {
    if (!this.isAvailable() || !this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured or empty');
    }

    const maxTokens = Math.min(options.maxTokens || 2800, 4096);
    const timeoutMs = Math.min(Math.max(options.timeoutMs || 20000, 12000), 28000);

    const normalizedBase = this.baseUrl.replace(/\/+$/, '');
    const endpoint = normalizedBase.endsWith('/v1')
      ? `${normalizedBase}/chat/completions`
      : `${normalizedBase}/chat/completions`;

    // Kiểm tra SSRF cho endpoint DeepSeek
    await validateOutboundUrl(endpoint);

    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemInstruction) {
      messages.push({
        role: 'system',
        content: options.jsonMode
          ? `${options.systemInstruction}\n\nLƯU Ý BẮT BUỘC: Phản hồi duy nhất bằng chuỗi JSON hợp lệ (valid JSON object), không bọc ngoài bằng lời chào.`
          : options.systemInstruction,
      });
    }
    messages.push({ role: 'user', content: options.prompt });

    const isReasoner = this.modelName.includes('reasoner');
    const requestBody: Record<string, unknown> = {
      model: this.modelName,
      messages,
      max_tokens: maxTokens,
      ...(!isReasoner ? { temperature: options.temperature ?? 0.3 } : {}),
      ...(options.jsonMode && !isReasoner ? { response_format: { type: 'json_object' } } : {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`DeepSeek API error [${response.status}]: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      const promptTokens = data.usage?.prompt_tokens || Math.ceil(options.prompt.length / 4);
      const completionTokens = data.usage?.completion_tokens || Math.ceil(text.length / 4);

      return {
        text,
        provider: 'deepseek',
        model: this.modelName,
        tokensUsed: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        isFallback: false,
      };
    } catch (err: unknown) {
      const isAbort = (err as Error)?.name === 'AbortError';
      const msg = isAbort
        ? `DeepSeek API timed out after ${timeoutMs}ms`
        : (err as Error)?.message || String(err);
      logger.warn('DeepSeek Provider completion failed, will trigger fallback', { error: msg });
      throw new Error(msg);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
