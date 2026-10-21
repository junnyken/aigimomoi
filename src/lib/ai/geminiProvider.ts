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
    this.modelName = modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateCompletion(options: AiCompletionOptions): Promise<AiCompletionResult> {
    if (!this.isAvailable()) {
      throw new Error('GEMINI_API_KEY is not configured or empty');
    }

    const maxTokens = Math.min(options.maxTokens || 1200, 1500); // Áp trần ngân sách
    const timeoutMs = Math.min(options.timeoutMs || 10000, 15000); // Áp trần timeout 10-15s

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;

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
        throw new Error(`Gemini API error [${response.status}]: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || '';

      const promptTokens = data.usageMetadata?.promptTokenCount || Math.ceil(options.prompt.length / 4);
      const completionTokens = data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);

      return {
        text,
        provider: 'gemini',
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
      const msg = isAbort ? `Gemini API timed out after ${timeoutMs}ms` : (err as Error)?.message || String(err);
      logger.warn('Gemini Provider completion failed, will trigger fallback', { error: msg });
      throw new Error(msg);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
