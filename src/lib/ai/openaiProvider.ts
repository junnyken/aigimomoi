// AG-27: OpenAI-Compatible Provider Adapter
// Invariants Gate P4: Server-only secrets (OPENAI_API_KEY), caps, strict timeout

import type { AiProvider, AiCompletionOptions, AiCompletionResult } from './types';
import { logger } from '../logger';

export class OpenAiProvider implements AiProvider {
  readonly name = 'openai' as const;
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(apiKey?: string, modelName = 'gpt-4o-mini', baseUrl?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.modelName = modelName;
    this.baseUrl = baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateCompletion(options: AiCompletionOptions): Promise<AiCompletionResult> {
    if (!this.isAvailable()) {
      throw new Error('OPENAI_API_KEY is not configured or empty');
    }

    const maxTokens = Math.min(options.maxTokens || 1200, 1500); // Áp trần ngân sách
    const timeoutMs = Math.min(options.timeoutMs || 10000, 15000); // Áp trần timeout 10-15s

    const endpoint = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;

    const messages: Array<{ role: string; content: string }> = [];
    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: options.prompt });

    const requestBody: Record<string, unknown> = {
      model: this.modelName,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: maxTokens,
      ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
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
        const errorText = await response.text();
        throw new Error(`OpenAI API error [${response.status}]: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';

      const promptTokens = data.usage?.prompt_tokens || Math.ceil(options.prompt.length / 4);
      const completionTokens = data.usage?.completion_tokens || Math.ceil(text.length / 4);

      return {
        text,
        provider: 'openai',
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
      const msg = isAbort ? `OpenAI API timed out after ${timeoutMs}ms` : (err as Error)?.message || String(err);
      logger.warn('OpenAI Provider completion failed, will trigger fallback', { error: msg });
      throw new Error(msg);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
