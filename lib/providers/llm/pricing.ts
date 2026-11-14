import type { TokenUsage } from "./types";

/**
 * Prices in nano-USD per token (= USD per million tokens × 1000), integers only.
 * Source: Anthropic pricing, checked 2026-11-14. Cache writes use the 5-minute TTL rate (1.25× input).
 * Haiku 5.5 prices are for prompts up to 100K tokens; our prompts stay well below that.
 */
export const MODEL_PRICES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-5-5": { input: 4_000, output: 20_000, cacheRead: 200, cacheWrite: 5_000 },
  "claude-sonnet-5-5": { input: 2_000, output: 10_000, cacheRead: 100, cacheWrite: 2_500 },
  "claude-haiku-5-5": { input: 100, output: 500, cacheRead: 10, cacheWrite: 125 },
  // Possible refusal-fallback targets for Opus 5.5.
  "claude-opus-5": { input: 5_000, output: 25_000, cacheRead: 500, cacheWrite: 6_250 },
  "claude-opus-4-8": { input: 5_000, output: 25_000, cacheRead: 500, cacheWrite: 6_250 },
};

export const DEFAULT_MODEL = "claude-opus-5-5";

/** Cost of one request in integer nano-USD. Unknown models are priced as the most expensive known one. */
export function costNanoUsd(model: string, usage: TokenUsage): number {
  const price =
    MODEL_PRICES[model] ??
    Object.values(MODEL_PRICES).reduce((max, p) => (p.output > max.output ? p : max));
  return (
    usage.inputTokens * price.input +
    usage.outputTokens * price.output +
    usage.cacheReadTokens * price.cacheRead +
    usage.cacheWriteTokens * price.cacheWrite
  );
}

/** For display only: nano-USD as a dollar string. */
export function formatUsd(nano: number, digits = 4): string {
  return `$${(nano / 1e9).toFixed(digits)}`;
}
