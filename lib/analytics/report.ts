import { and, eq, gte, isNotNull, lt, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { outerUserId } from "@/lib/admin/stats";
import type { Database } from "@/lib/db/client";
import { aiUsage, feedback, formSubmissions, messages, payments, projects, signupSources, sites, siteVisitsDaily, user } from "@/lib/db/schema";
import { parseClickKey, type ClickName, type ClickPage } from "./clicks";
import { addisStart, bucketEnd, bucketOf, buckets, fill, type Period } from "./periods";
import type { EventStore } from "./store";

/** The measures each period shows, in the order the admin sees them. */
export const METRICS = ["signups", "sitesStarted", "aiChanges", "published", "republished", "visits", "leads", "payments", "revenue", "aiCost", "feedback", "clicks"] as const;
export type Metric = (typeof METRICS)[number];

export interface Point {
  day: string;
  value: number;
}

export interface AnalyticsReport {
  period: Period;
  /** Bucket starts, oldest first; the last is the current, unfinished one. */
  buckets: string[];
  series: Record<Metric, Point[]>;
  /** Of the people who signed up in the current bucket: how many started, published, paid. */
  funnel: { signedUp: number; started: number; published: number; paid: number };
  /** Current bucket: clicks per link (with the pages they came from), most first. */
  clicks: { name: ClickName; total: number; pages: { page: ClickPage; n: number }[] }[];
  /** Current bucket: templates sites started from, most first (null = from a chat description). */
  templates: { id: string | null; n: number }[];
  /** Current bucket: where new owners came from. */
  sources: { source: string; n: number }[];
}

export interface AnalyticsSource {
  report(period: Period, now?: Date): Promise<AnalyticsReport>;
}

const ZONE = "Africa/Addis_Ababa";

/** Clicks and publishes from the event store, bucketed. Shared by the database and memory reports. */
async function fromEvents(events: EventStore, period: Period, all: string[]) {
  const first = all[0]!;
  const end = bucketEnd(all.at(-1)!, period);
  const rows = (await events.rows(first, end)).filter((r) => r.day < end);
  const current = all.at(-1)!;
  const clickRows = rows.filter((r) => r.event === "click");
  const byName = new Map<ClickName, Map<ClickPage, number>>();
  for (const r of clickRows) {
    if (bucketOf(r.day, period) !== current) continue;
    const k = parseClickKey(r.key);
    if (!k) continue;
    const pages = byName.get(k.name) ?? new Map<ClickPage, number>();
    pages.set(k.page, (pages.get(k.page) ?? 0) + r.n);
    byName.set(k.name, pages);
  }
  const clicks = [...byName].map(([name, pages]) => ({ name, total: [...pages.values()].reduce((a, b) => a + b, 0), pages: [...pages].map(([page, n]) => ({ page, n })).sort((a, b) => b.n - a.n) })).sort((a, b) => b.total - a.total);
  const bucketed = (pred: (r: (typeof rows)[number]) => boolean) => fill(rows.filter(pred).map((r) => ({ bucket: bucketOf(r.day, period), value: r.n })), all);
  return { clicks, clickSeries: bucketed((r) => r.event === "click"), republished: bucketed((r) => r.event === "publish" && r.key === "update") };
}

export class DbAnalytics implements AnalyticsSource {
  constructor(
    private db: Database,
    private events: EventStore,
  ) {}

  async report(period: Period, now = new Date()): Promise<AnalyticsReport> {
    const all = buckets(period, now);
    const from = addisStart(all[0]!);
    const cur = all.at(-1)!;
    const curFrom = addisStart(cur);
    const curTo = addisStart(bucketEnd(cur, period));
    const unit = sql.raw(`'${period}'`);
    // The bucket's first day, in Addis Ababa time.
    const b = (col: AnyColumn) => sql<string>`to_char(date_trunc(${unit}, ${col} at time zone ${ZONE}), 'YYYY-MM-DD')`;
    const filled = (q: PromiseLike<{ bucket: string; value: number | string | null }[]>) => Promise.resolve(q).then((r) => fill(r, all));
    const count = sql<number>`count(*)::int`;
    const since = (col: AnyColumn, extra?: SQL) => and(gte(col, from), extra);
    const inCur = (col: AnyColumn) => and(gte(col, curFrom), lt(col, curTo));

    const [signups, started, aiChanges, published, visits, leads, paid, revenue, aiCost, fb, ev, funnel, templates, sources] = await Promise.all([
      filled(this.db.select({ bucket: b(user.createdAt), value: count }).from(user).where(since(user.createdAt)).groupBy(sql`1`)),
      filled(this.db.select({ bucket: b(projects.createdAt), value: count }).from(projects).where(since(projects.createdAt)).groupBy(sql`1`)),
      filled(this.db.select({ bucket: b(messages.createdAt), value: count }).from(messages).where(since(messages.createdAt, and(eq(messages.role, "assistant"), eq(messages.status, "changed")))).groupBy(sql`1`)),
      // A site's row is made at its first publish.
      filled(this.db.select({ bucket: b(sites.createdAt), value: count }).from(sites).where(since(sites.createdAt, isNotNull(sites.publishedAt))).groupBy(sql`1`)),
      // Visits are stored per Addis Ababa day already (a date, not a time).
      this.db
        .select({ bucket: sql<string>`to_char(date_trunc(${unit}, ${siteVisitsDaily.day}::timestamp), 'YYYY-MM-DD')`, value: sql<number>`sum(${siteVisitsDaily.views})::int` })
        .from(siteVisitsDaily)
        .where(gte(siteVisitsDaily.day, all[0]!))
        .groupBy(sql`1`)
        .then((r) => fill(r, all)),
      filled(this.db.select({ bucket: b(formSubmissions.createdAt), value: count }).from(formSubmissions).where(since(formSubmissions.createdAt)).groupBy(sql`1`)),
      filled(this.db.select({ bucket: b(payments.reviewedAt), value: count }).from(payments).where(since(payments.reviewedAt, eq(payments.status, "approved"))).groupBy(sql`1`)),
      filled(this.db.select({ bucket: b(payments.reviewedAt), value: sql<number>`sum(${payments.amountMinor})::bigint` }).from(payments).where(since(payments.reviewedAt, eq(payments.status, "approved"))).groupBy(sql`1`)),
      filled(this.db.select({ bucket: b(aiUsage.createdAt), value: sql<number>`sum(${aiUsage.costNanoUsd})::bigint` }).from(aiUsage).where(since(aiUsage.createdAt)).groupBy(sql`1`)),
      filled(this.db.select({ bucket: b(feedback.createdAt), value: count }).from(feedback).where(since(feedback.createdAt)).groupBy(sql`1`)),
      fromEvents(this.events, period, all),
      this.db
        .select({
          signedUp: sql<number>`count(*)::int`,
          started: sql<number>`count(*) filter (where exists (select 1 from ${projects} where ${projects.ownerId} = ${outerUserId}))::int`,
          published: sql<number>`count(*) filter (where exists (select 1 from ${sites} where ${sites.ownerId} = ${outerUserId} and ${sites.publishedAt} is not null))::int`,
          paid: sql<number>`count(*) filter (where exists (select 1 from ${payments} where ${payments.userId} = ${outerUserId} and ${payments.status} = 'approved'))::int`,
        })
        .from(user)
        .where(inCur(user.createdAt)),
      this.db.select({ id: projects.templateId, n: sql<number>`count(*)::int` }).from(projects).where(inCur(projects.createdAt)).groupBy(projects.templateId).orderBy(sql`2 desc`).limit(8),
      this.db.select({ source: signupSources.source, n: sql<number>`count(*)::int` }).from(signupSources).where(inCur(signupSources.createdAt)).groupBy(signupSources.source).orderBy(sql`2 desc`),
    ]);
    const f = funnel[0];
    return {
      period,
      buckets: all,
      series: { signups, sitesStarted: started, aiChanges, published, republished: ev.republished, visits, leads, payments: paid, revenue, aiCost, feedback: fb, clicks: ev.clickSeries },
      funnel: { signedUp: Number(f?.signedUp ?? 0), started: Number(f?.started ?? 0), published: Number(f?.published ?? 0), paid: Number(f?.paid ?? 0) },
      clicks: ev.clicks,
      templates: templates.map((t) => ({ id: t.id, n: Number(t.n) })),
      sources: sources.map((s) => ({ source: s.source, n: Number(s.n) })),
    };
  }
}

/** Without a database (development, e2e): sign-ups from the memory accounts, clicks and publishes from the event store. */
export class MemoryAnalytics implements AnalyticsSource {
  constructor(
    private events: EventStore,
    private accounts: () => { createdAt: Date }[],
  ) {}

  async report(period: Period, now = new Date()): Promise<AnalyticsReport> {
    const all = buckets(period, now);
    const zero = fill([], all);
    const ev = await fromEvents(this.events, period, all);
    const addisDay = (d: Date) => new Date(new Date(d).getTime() + 3 * 3_600_000).toISOString().slice(0, 10);
    const signups = fill(this.accounts().map((a) => ({ bucket: bucketOf(addisDay(a.createdAt), period), value: 1 })), all);
    const series = Object.fromEntries(METRICS.map((m) => [m, zero])) as Record<Metric, Point[]>;
    return {
      period,
      buckets: all,
      series: { ...series, signups, republished: ev.republished, clicks: ev.clickSeries },
      funnel: { signedUp: signups.at(-1)!.value, started: 0, published: 0, paid: 0 },
      clicks: ev.clicks,
      templates: [],
      sources: [],
    };
  }
}
