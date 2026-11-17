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
  /** Called when the model starts a new content block (for progress: thinking, text or a tool call). */
  onBlockStart?: (block: { type: "thinking" | "text" | "tool_use"; name?: string }) => void;
  /** Called with each streamed fragment of a tool call's JSON input (for progress). */
  onToolInput?: (partialJson: string) => void;
  signal?: AbortSignal;
  /** For usage logging. */
  purpose: string;
  /** Forces a call to this tool (structured answers from small classifiers). */
  toolChoice?: { type: "tool"; name: string };
  /** Per-request limits for short, blocking calls (defaults: the SDK's, which allow minutes). */
  timeoutMs?: number;
  maxRetries?: number;
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
