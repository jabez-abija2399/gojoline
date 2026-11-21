import { and, eq, gte, like, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { payments, signupSources, user } from "@/lib/db/schema";
import { classifySource, SOURCES, type Attribution, type Source } from "./attribution";

export type SourceCounts = Record<Source, number>;
export interface SourceBreakdown {
  d7: SourceCounts;
  d30: SourceCounts;
}

/** Where owners first came from, saved once per account at sign-up. */
export interface SignupSourceStore {
  /** Saves the first touch for a new account (once: later calls change nothing). */
  record(userId: string, a: Attribution | null, hashes?: SignupHashes): Promise<void>;
  /** Where the account was made (keyed hashes), if recorded. */
  hashes(userId: string): Promise<SignupHashes | null>;
  /** Sign-ups in the last 7 and 30 days by source (accounts without a record count as direct). */
  breakdown(now?: Date): Promise<SourceBreakdown>;
  /** Sign-ups that came from Gojoline's own posts (utm_campaign post-<day>) since a date, with how many of them paid. */
  fromPosts(since: Date): Promise<PostSignups[]>;
}

export interface PostSignups {
  /** "post-2026-11-23" */
  campaign: string;
  /** The network (utm_source). */
  source: string;
  signups: number;
  paid: number;
}

export interface SignupHashes {
  ipHash: string | null;
  deviceHash: string | null;
}

export const emptySourceCounts = (): SourceCounts => Object.fromEntries(SOURCES.map((s) => [s, 0])) as SourceCounts;

function row(userId: string, a: Attribution | null, h?: SignupHashes) {
  return {
    ipHash: h?.ipHash ?? null,
    deviceHash: h?.deviceHash ?? null,
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

  async record(userId: string, a: Attribution | null, hashes?: SignupHashes): Promise<void> {
    await this.db.insert(signupSources).values(row(userId, a, hashes)).onConflictDoNothing();
  }

  async hashes(userId: string): Promise<SignupHashes | null> {
    const [r] = await this.db.select({ ipHash: signupSources.ipHash, deviceHash: signupSources.deviceHash }).from(signupSources).where(eq(signupSources.userId, userId)).limit(1);
    return r ?? null;
  }

  async fromPosts(since: Date): Promise<PostSignups[]> {
    const rows = await this.db
      .select({
        campaign: signupSources.utmCampaign,
        source: signupSources.utmSource,
        signups: sql<number>`count(*)`.mapWith(Number),
        paid: sql<number>`count(*) filter (where exists (select 1 from ${payments} where ${payments.userId} = ${signupSources.userId} and ${payments.status} = 'approved'))`.mapWith(Number),
      })
      .from(signupSources)
      .innerJoin(user, eq(user.id, signupSources.userId))
      .where(and(like(signupSources.utmCampaign, "post-%"), gte(user.createdAt, since)))
      .groupBy(signupSources.utmCampaign, signupSources.utmSource);
    return rows.map((r) => ({ campaign: r.campaign ?? "", source: r.source ?? "other", signups: r.signups, paid: r.paid }));
  }

  async breakdown(now = new Date()): Promise<SourceBreakdown> {
    const d7 = new Date(now.getTime() - 7 * 86_400_000);
    const d30 = new Date(now.getTime() - 30 * 86_400_000);
    const source = sql<string>`coalesce(${signupSources.source}, 'direct')`;
    const rows = await this.db
      .select({ source, d7: sql<number>`count(*) filter (where ${user.createdAt} >= ${d7})::int`, d30: sql<number>`count(*)::int` })
      .from(user)
      .leftJoin(signupSources, sql`${signupSources.userId} = ${user.id}`)
      .where(gte(user.createdAt, d30))
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

  async record(userId: string, a: Attribution | null, hashes?: SignupHashes): Promise<void> {
    if (!this.rows.has(userId)) this.rows.set(userId, { ...row(userId, a, hashes), createdAt: this.now() });
  }

  async hashes(userId: string): Promise<SignupHashes | null> {
    const r = this.rows.get(userId);
    return r ? { ipHash: r.ipHash, deviceHash: r.deviceHash } : null;
  }

  async fromPosts(since: Date): Promise<PostSignups[]> {
    const out = new Map<string, PostSignups>();
    for (const r of this.rows.values()) {
      if (!r.utmCampaign?.startsWith("post-") || r.createdAt < since) continue;
      const k = `${r.utmCampaign}|${r.utmSource ?? "other"}`;
      const e = out.get(k) ?? { campaign: r.utmCampaign, source: r.utmSource ?? "other", signups: 0, paid: 0 };
      e.signups++;
      out.set(k, e);
    }
    return [...out.values()];
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
