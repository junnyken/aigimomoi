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

export interface AiCompletionResult {
  text: string;
  provider: 'gemini' | 'openai' | 'mock';
  model: string;
  tokensUsed?: AiTokensUsage;
  isFallback?: boolean;
}

export interface AiProvider {
  readonly name: 'gemini' | 'openai' | 'mock';
  isAvailable(): boolean;
  generateCompletion(options: AiCompletionOptions): Promise<AiCompletionResult>;
}

export interface AiBudgetConfig {
  maxOutputTokens: number;
  timeoutMs: number;
  maxRequestsPerMinute: number;
}

export const DEFAULT_AI_BUDGET: AiBudgetConfig = {
  maxOutputTokens: 1200,
  timeoutMs: 10000, // 10 giây
  maxRequestsPerMinute: 15,
};
