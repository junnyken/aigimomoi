// AG-27: Google Gemini AI Provider Adapter
// Invariants Gate P4: Server-only secrets (GEMINI_API_KEY), caps, strict timeout

import type { AiProvider, AiCompletionOptions, AiCompletionResult } from './types';
import { logger } from '../logger';

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini' as const;
  private readonly apiKey: string | undefined;
  private readonly modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey =
      apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.AI_GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const rawModel = (modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
    // Tự động sửa nếu cấu hình cũ lưu nhầm tên model không tồn tại 'gemini-3.5-flash-lite'
    this.modelName = rawModel === 'gemini-3.5-flash-lite' ? 'gemini-2.5-flash' : rawModel;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateCompletion(options: AiCompletionOptions): Promise<AiCompletionResult> {
    if (!this.isAvailable()) {
      throw new Error('GEMINI_API_KEY is not configured or empty');
    }

    const maxTokens = Math.min(options.maxTokens || 2500, 4096);
    const timeoutMs = Math.min(options.timeoutMs || 15000, 20000);

    const candidateModels = Array.from(
      new Set([
        this.modelName,
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.5-flash-lite',
        'gemini-1.5-flash',
      ])
    );

    let lastErr: Error | null = null;

    for (const model of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      const supportsThinkingConfig = model.startsWith('gemini-2.5') && !model.includes('lite');

      const requestBody: Record<string, unknown> = {
        contents: [
          {
            role: 'user',
            parts: [{ text: options.prompt }],
          },
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: maxTokens,
          ...(supportsThinkingConfig ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      };

      if (options.systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastErr = new Error(`Gemini API error [${response.status}] (${model}): ${errorText.slice(0, 200)}`);
          // Nếu lỗi 400/403 do API key không hợp lệ hoặc bị khóa thì dừng ngay, không thử model khác
          if (
            response.status === 403 ||
            errorText.includes('API_KEY_INVALID') ||
            errorText.includes('API key not valid') ||
            errorText.includes('leaked')
          ) {
            throw lastErr;
          }
          continue;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const parts: Array<{ thought?: boolean; text?: string }> = candidate?.content?.parts || [];
        const text =
          parts
            .filter((p) => !p.thought && typeof p.text === 'string')
            .map((p) => p.text)
            .join('\n') ||
          parts[0]?.text ||
          '';

        const promptTokens = data.usageMetadata?.promptTokenCount || Math.ceil(options.prompt.length / 4);
        const completionTokens = data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);

        return {
          text,
          provider: 'gemini',
          model,
          tokensUsed: {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
          },
          isFallback: false,
        };
      } catch (err: unknown) {
        const isAbort = (err as Error)?.name === 'AbortError';
        const msg = isAbort ? `Gemini API timed out after ${timeoutMs}ms` : (err as Error)?.message || String(err);
        lastErr = new Error(msg);
        if (
          msg.includes('API_KEY_INVALID') ||
          msg.includes('API key not valid') ||
          msg.includes('leaked') ||
          msg.includes('[403]')
        ) {
          break;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    const finalMsg = lastErr?.message || 'Gemini Provider completion failed';
    logger.warn('Gemini Provider completion failed, will trigger fallback', { error: finalMsg });
    throw new Error(finalMsg);
  }
}
