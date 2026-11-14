import type Anthropic from "@anthropic-ai/sdk";

/**
 * LLM provider boundary. The agent depends only on this interface; the Anthropic
 * implementation lives in ./anthropic.ts and tests use ./fake.ts.
 *
 * Message and content shapes reuse the Anthropic SDK's beta types: assistant content
 * (including thinking blocks) must be replayed unchanged, so we keep it as-is.
 */
export type MessageParam = Anthropic.Beta.BetaMessageParam;
export type ContentBlock = Anthropic.Beta.BetaContentBlock;
export type ToolDefinition = Anthropic.Beta.BetaTool;
export type SystemBlock = Anthropic.Beta.BetaTextBlockParam;

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface LLMRequest {
  model: string;
  /** Stable first (cached), volatile last. The provider adds cache breakpoints. */
  system: SystemBlock[];
  tools: ToolDefinition[];
  messages: MessageParam[];
  maxTokens: number;
  effort?: Effort;
  /** Called with each streamed text fragment (for live chat UI). */
  onText?: (delta: string) => void;
  signal?: AbortSignal;
  /** For usage logging. */
  purpose: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface LLMResponse {
  content: ContentBlock[];
  stopReason: string | null;
  /** Model that actually served the request (can differ after a refusal fallback). */
  model: string;
  usage: TokenUsage;
  /** Integer nano-USD (1e-9 USD); never a float. */
  costNanoUsd: number;
  durationMs: number;
  /** Time to first streamed token, ms (null if nothing streamed). */
  firstTokenMs: number | null;
}

export interface LLMProvider {
  complete(request: LLMRequest): Promise<LLMResponse>;
}
