import { and, gte, lte, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { analyticsDaily } from "@/lib/db/schema";
import { reportError } from "@/lib/observability/report";

export type AnalyticsEvent = (typeof analyticsDaily.$inferSelect)["event"];

export interface EventRow {
  day: string; // YYYY-MM-DD, Addis Ababa
  event: AnalyticsEvent;
  key: string;
  n: number;
}

/** Daily counters for admin analytics (clicks, publishes). Counts only, nothing about who. */
export interface EventStore {
  bump(day: string, event: AnalyticsEvent, key: string): Promise<void>;
  /** Rows from `from` to `to` (inclusive days). */
  rows(from: string, to: string): Promise<EventRow[]>;
}

/** Postgres error for a table that doesn't exist (migration 0021 not applied yet). */
const missingTable = (e: unknown) => {
  const err = e as { code?: string; cause?: { code?: string } } | null;
  return err?.code === "42P01" || err?.cause?.code === "42P01";
};

export class DbEventStore implements EventStore {
  constructor(private db: Database) {}

  async bump(day: string, event: AnalyticsEvent, key: string) {
    try {
      await this.db
        .insert(analyticsDaily)
        .values({ day, event, key, n: 1 })
        .onConflictDoUpdate({ target: [analyticsDaily.day, analyticsDaily.event, analyticsDaily.key], set: { n: sql`${analyticsDaily.n} + 1` } });
    } catch (e) {
      // Counting must never break what the owner was doing; until the migration runs, nothing is counted.
      if (!missingTable(e)) reportError("analytics bump failed", e, { event });
    }
  }

  async rows(from: string, to: string): Promise<EventRow[]> {
    try {
      const rows = await this.db.select().from(analyticsDaily).where(and(gte(analyticsDaily.day, from), lte(analyticsDaily.day, to)));
      return rows.map((r) => ({ ...r, n: Number(r.n) }));
    } catch (e) {
      if (missingTable(e)) return [];
      throw e;
    }
  }
}

export class MemoryEventStore implements EventStore {
  private counts = new Map<string, EventRow>();

  async bump(day: string, event: AnalyticsEvent, key: string) {
    const k = `${day}|${event}|${key}`;
    const cur = this.counts.get(k) ?? { day, event, key, n: 0 };
    cur.n++;
    this.counts.set(k, cur);
  }

  async rows(from: string, to: string) {
    return [...this.counts.values()].filter((r) => r.day >= from && r.day <= to).map((r) => ({ ...r }));
  }
}
