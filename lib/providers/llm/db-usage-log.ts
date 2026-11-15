import { desc, gte, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { aiUsage } from "@/lib/db/schema";
import type { CostRow, UsageLogger, UsageRecord, UsageReport, UsageSummary } from "./usage-log";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Writes every AI request to ai_usage. Logging must never break the user's request. */
export class DbUsageLogger implements UsageLogger, UsageReport {
  constructor(private db: Database) {}
  async log(r: UsageRecord) {
    try {
      await this.db.insert(aiUsage).values({ ...r, projectId: r.projectId && UUID.test(r.projectId) ? r.projectId : null });
    } catch (error) {
      console.error("ai_usage insert failed", error instanceof Error ? error.message : "unknown");
    }
  }

  async summary(since: Date): Promise<UsageSummary> {
    const cost = sql<number>`coalesce(sum(${aiUsage.costNanoUsd}), 0)::bigint`;
    const n = sql<number>`count(*)::int`;
    const where = gte(aiUsage.createdAt, since);
    const day = sql<string>`to_char(${aiUsage.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
    const [total, byDay, byPurpose, topUsers] = await Promise.all([
      this.db.select({ cost, n }).from(aiUsage).where(where),
      this.db.select({ key: day, cost, n }).from(aiUsage).where(where).groupBy(day).orderBy(desc(day)),
      this.db.select({ key: aiUsage.purpose, cost, n }).from(aiUsage).where(where).groupBy(aiUsage.purpose).orderBy(desc(cost)),
      this.db.select({ key: aiUsage.userId, cost, n }).from(aiUsage).where(sql`${where} and ${aiUsage.userId} is not null`).groupBy(aiUsage.userId).orderBy(desc(cost)).limit(10),
    ]);
    const rows = (xs: { key: string | null; cost: number; n: number }[]): CostRow[] => xs.map((x) => ({ key: x.key ?? "", costNanoUsd: Number(x.cost), requests: Number(x.n) }));
    return { costNanoUsd: Number(total[0]?.cost ?? 0), requests: Number(total[0]?.n ?? 0), byDay: rows(byDay), byPurpose: rows(byPurpose), topUsers: rows(topUsers) };
  }
}
