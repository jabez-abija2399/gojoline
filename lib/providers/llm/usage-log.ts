import type { LLMResponse } from "./types";

export interface UsageRecord {
  userId: string | null;
  projectId: string | null;
  purpose: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costNanoUsd: number;
  durationMs: number;
  firstTokenMs: number | null;
  stopReason: string | null;
  ok: boolean;
  createdAt: Date;
}

/** Every AI request is logged (docs/QUALITY.md). Postgres implementation lands in Slice 2. */
export interface UsageLogger {
  log(record: UsageRecord): Promise<void>;
}

export class MemoryUsageLogger implements UsageLogger {
  readonly records: UsageRecord[] = [];
  async log(record: UsageRecord) {
    this.records.push(record);
  }
}

export function usageRecord(
  response: LLMResponse,
  ctx: { userId: string | null; projectId: string | null; purpose: string },
): UsageRecord {
  return {
    ...ctx,
    model: response.model,
    ...response.usage,
    costNanoUsd: response.costNanoUsd,
    durationMs: response.durationMs,
    firstTokenMs: response.firstTokenMs,
    stopReason: response.stopReason,
    ok: response.stopReason !== "refusal",
    createdAt: new Date(),
  };
}
