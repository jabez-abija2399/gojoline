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

export interface CostRow {
  key: string;
  costNanoUsd: number;
  requests: number;
}

export interface UsageSummary {
  costNanoUsd: number;
  requests: number;
  byDay: CostRow[];
  byPurpose: CostRow[];
  topUsers: CostRow[];
}

/** Admin cost view. */
export interface UsageReport {
  summary(since: Date): Promise<UsageSummary>;
}

function rollup(records: UsageRecord[], key: (r: UsageRecord) => string): CostRow[] {
  const m = new Map<string, CostRow>();
  for (const r of records) {
    const k = key(r);
    const row = m.get(k) ?? { key: k, costNanoUsd: 0, requests: 0 };
    row.costNanoUsd += r.costNanoUsd;
    row.requests += 1;
    m.set(k, row);
  }
  return [...m.values()];
}

export class MemoryUsageLogger implements UsageLogger, UsageReport {
  readonly records: UsageRecord[] = [];
  async log(record: UsageRecord) {
    this.records.push(record);
  }
  async summary(since: Date): Promise<UsageSummary> {
    const rs = this.records.filter((r) => r.createdAt >= since);
    const byCost = (a: CostRow, b: CostRow) => b.costNanoUsd - a.costNanoUsd;
    return {
      costNanoUsd: rs.reduce((n, r) => n + r.costNanoUsd, 0),
      requests: rs.length,
      byDay: rollup(rs, (r) => r.createdAt.toISOString().slice(0, 10)).sort((a, b) => b.key.localeCompare(a.key)),
      byPurpose: rollup(rs, (r) => r.purpose).sort(byCost),
      topUsers: rollup(rs.filter((r) => r.userId), (r) => r.userId!).sort(byCost).slice(0, 10),
    };
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
