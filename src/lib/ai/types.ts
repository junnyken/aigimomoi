// AG-27: AI Provider Types & Contract Specification
// Tuân thủ Invariants Gate P4: Server-only secrets, Caps, Timeout, Graceful fallback

export interface AiCompletionOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  jsonMode?: boolean;
}

export interface AiTokensUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type AiProviderName = 'deepseek' | 'gemini' | 'openai' | 'mock';

export interface AiCompletionResult {
  text: string;
  provider: AiProviderName;
  model: string;
  tokensUsed?: AiTokensUsage;
  isFallback?: boolean;
}

export interface AiProvider {
  readonly name: AiProviderName;
  isAvailable(): boolean;
  generateCompletion(options: AiCompletionOptions): Promise<AiCompletionResult>;
}

export interface AiBudgetConfig {
  maxOutputTokens: number;
  timeoutMs: number;
  maxRequestsPerMinute: number;
}

export const DEFAULT_AI_BUDGET: AiBudgetConfig = {
  maxOutputTokens: 4096,
  timeoutMs: 15000, // 15 giây
  maxRequestsPerMinute: 25,
};
