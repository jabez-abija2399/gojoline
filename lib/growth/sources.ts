import { and, gte, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { signupSources, user } from "@/lib/db/schema";
import { classifySource, SOURCES, type Attribution, type Source } from "./attribution";

export type SourceCounts = Record<Source, number>;
export interface SourceBreakdown {
  d7: SourceCounts;
  d30: SourceCounts;
}

/** Where owners first came from, saved once per account at sign-up. */
export interface SignupSourceStore {
  /** Saves the first touch for a new account (once: later calls change nothing). */
  record(userId: string, a: Attribution | null): Promise<void>;
  /** Sign-ups in the last 7 and 30 days by source (accounts without a record count as direct). */
  breakdown(now?: Date): Promise<SourceBreakdown>;
}

export const emptySourceCounts = (): SourceCounts => Object.fromEntries(SOURCES.map((s) => [s, 0])) as SourceCounts;

function row(userId: string, a: Attribution | null) {
  return {
    userId,
    source: classifySource(a),
    ref: a?.r ?? null,
    utmSource: a?.s ?? null,
    utmMedium: a?.m ?? null,
    utmCampaign: a?.c ?? null,
    referrerHost: a?.h ?? null,
    firstSeenAt: a ? new Date(a.t) : null,
  };
}

export class DbSignupSourceStore implements SignupSourceStore {
  constructor(private db: Database) {}

  async record(userId: string, a: Attribution | null): Promise<void> {
    await this.db.insert(signupSources).values(row(userId, a)).onConflictDoNothing();
  }

  async breakdown(now = new Date()): Promise<SourceBreakdown> {
    const d7 = new Date(now.getTime() - 7 * 86_400_000);
    const d30 = new Date(now.getTime() - 30 * 86_400_000);
    const source = sql<string>`coalesce(${signupSources.source}, 'direct')`;
    const rows = await this.db
      .select({ source, d7: sql<number>`count(*) filter (where ${user.createdAt} >= ${d7})::int`, d30: sql<number>`count(*)::int` })
      .from(user)
      .leftJoin(signupSources, sql`${signupSources.userId} = ${user.id}`)
      .where(and(gte(user.createdAt, d30)))
      .groupBy(source);
    const out = { d7: emptySourceCounts(), d30: emptySourceCounts() };
    for (const r of rows) {
      const s = (SOURCES as readonly string[]).includes(r.source) ? (r.source as Source) : "other";
      out.d7[s] += Number(r.d7);
      out.d30[s] += Number(r.d30);
    }
    return out;
  }
}

/** Development and e2e: sign-ups recorded in this process. */
export class MemorySignupSourceStore implements SignupSourceStore {
  readonly rows = new Map<string, ReturnType<typeof row> & { createdAt: Date }>();
  constructor(private now: () => Date = () => new Date()) {}

  async record(userId: string, a: Attribution | null): Promise<void> {
    if (!this.rows.has(userId)) this.rows.set(userId, { ...row(userId, a), createdAt: this.now() });
  }

  async breakdown(now = new Date()): Promise<SourceBreakdown> {
    const out = { d7: emptySourceCounts(), d30: emptySourceCounts() };
    for (const r of this.rows.values()) {
      const age = now.getTime() - r.createdAt.getTime();
      if (age <= 30 * 86_400_000) out.d30[r.source]++;
      if (age <= 7 * 86_400_000) out.d7[r.source]++;
    }
    return out;
  }
}
