import { and, count, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { abuseReports, aiUsage, auditLog, creditBalances, payments, projects, sites, subscriptions, user } from "@/lib/db/schema";

export interface DayPoint {
  day: string; // YYYY-MM-DD (UTC)
  value: number;
}

export interface Overview {
  users: number;
  usersNew7: number;
  usersPrev7: number;
  sitesLive: number;
  projects: number;
  pendingPayments: number;
  openReports: number;
  revenueMonthMinor: number;
  aiCost30Nano: number;
  paidUsers: number;
  signups: DayPoint[];
  revenue: DayPoint[];
  aiCost: DayPoint[];
  activity: { actorId: string; action: string; targetType: string; targetId: string; createdAt: Date }[];
}

export interface AdminUser {
  id: string;
  name: string;
  contact: string;
  joined: Date;
  plan: "free" | "starter" | "business";
  sites: number;
  credits: number;
}

export interface AdminStats {
  overview(now?: Date): Promise<Overview>;
  users(search: string, limit: number): Promise<AdminUser[]>;
}

/** Fills missing days with 0 so every chart has the same 30 bars. */
export function lastDays(rows: { day: string; value: number }[], days: number, now: Date): DayPoint[] {
  const by = new Map(rows.map((r) => [r.day, Number(r.value)]));
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ day: d, value: by.get(d) ?? 0 });
  }
  return out;
}


export class DbAdminStats implements AdminStats {
  constructor(private db: Database) {}

  async overview(now = new Date()): Promise<Overview> {
    const d7 = new Date(now.getTime() - 7 * 86_400_000);
    const d14 = new Date(now.getTime() - 14 * 86_400_000);
    const d30 = new Date(now.getTime() - 30 * 86_400_000);
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const n = (q: Promise<{ n: number | string | null }[]>) => q.then((r) => Number(r[0]?.n ?? 0));
    const day = (col: typeof user.createdAt | typeof aiUsage.createdAt) => sql<string>`to_char(${col} at time zone 'UTC', 'YYYY-MM-DD')`;
    const [users, usersNew7, usersPrev7, sitesLive, projectCount, pending, reports, revenueMonth, aiCost30, paid, signups, revenue, ai, activity] = await Promise.all([
      n(this.db.select({ n: count() }).from(user)),
      n(this.db.select({ n: count() }).from(user).where(gte(user.createdAt, d7))),
      n(this.db.select({ n: count() }).from(user).where(and(gte(user.createdAt, d14), sql`${user.createdAt} < ${d7}`))),
      n(this.db.select({ n: count() }).from(sites).where(eq(sites.status, "published"))),
      n(this.db.select({ n: count() }).from(projects)),
      n(this.db.select({ n: count() }).from(payments).where(eq(payments.status, "pending"))),
      n(this.db.select({ n: count() }).from(abuseReports).where(eq(abuseReports.status, "open"))),
      n(this.db.select({ n: sql<number>`coalesce(sum(${payments.amountMinor}),0)::bigint` }).from(payments).where(and(eq(payments.status, "approved"), gte(payments.reviewedAt, month)))),
      n(this.db.select({ n: sql<number>`coalesce(sum(${aiUsage.costNanoUsd}),0)::bigint` }).from(aiUsage).where(gte(aiUsage.createdAt, d30))),
      n(this.db.select({ n: count() }).from(subscriptions).where(gte(subscriptions.currentPeriodEnd, now))),
      this.db.select({ day: day(user.createdAt), value: sql<number>`count(*)::int` }).from(user).where(gte(user.createdAt, d30)).groupBy(day(user.createdAt)),
      this.db.select({ day: sql<string>`to_char(${payments.reviewedAt} at time zone 'UTC', 'YYYY-MM-DD')`, value: sql<number>`sum(${payments.amountMinor})::bigint` }).from(payments).where(and(eq(payments.status, "approved"), gte(payments.reviewedAt, d30))).groupBy(sql`1`),
      this.db.select({ day: day(aiUsage.createdAt), value: sql<number>`sum(${aiUsage.costNanoUsd})::bigint` }).from(aiUsage).where(gte(aiUsage.createdAt, d30)).groupBy(day(aiUsage.createdAt)),
      this.db.select({ actorId: auditLog.actorId, action: auditLog.action, targetType: auditLog.targetType, targetId: auditLog.targetId, createdAt: auditLog.createdAt }).from(auditLog).orderBy(desc(auditLog.createdAt)).limit(12),
    ]);
    return {
      users, usersNew7, usersPrev7, sitesLive, projects: projectCount, pendingPayments: pending, openReports: reports,
      revenueMonthMinor: revenueMonth, aiCost30Nano: aiCost30, paidUsers: paid,
      signups: lastDays(signups, 30, now), revenue: lastDays(revenue, 30, now), aiCost: lastDays(ai, 30, now), activity,
    };
  }

  async users(search: string, limit: number): Promise<AdminUser[]> {
    const q = search.trim().slice(0, 100);
    const where = q ? or(ilike(user.email, `%${q}%`), ilike(user.phoneNumber, `%${q}%`), ilike(user.name, `%${q}%`)) : undefined;
    const rows = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        joined: user.createdAt,
        plan: sql<string | null>`(select ${subscriptions.plan} from ${subscriptions} where ${subscriptions.userId} = ${user.id} and ${subscriptions.currentPeriodEnd} > now())`,
        sites: sql<number>`(select count(*)::int from ${sites} where ${sites.ownerId} = ${user.id} and ${sites.status} = 'published')`,
        credits: sql<number>`coalesce((select ${creditBalances.balance} from ${creditBalances} where ${creditBalances.userId} = ${user.id}), 0)`,
      })
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      contact: r.email.endsWith("@phone.gojoline.invalid") ? (r.phone ?? "") : r.email,
      joined: r.joined,
      plan: (r.plan as AdminUser["plan"] | null) ?? "free",
      sites: Number(r.sites),
      credits: Number(r.credits),
    }));
  }
}

/** Without a database (development, e2e): what the in-memory stores can tell. */
export class MemoryAdminStats implements AdminStats {
  constructor(private counts: () => Promise<{ pendingPayments: number; openReports: number; sitesLive: number }>) {}
  async overview(now = new Date()): Promise<Overview> {
    const c = await this.counts();
    return {
      users: 0, usersNew7: 0, usersPrev7: 0, projects: 0, revenueMonthMinor: 0, aiCost30Nano: 0, paidUsers: 0, ...c,
      signups: lastDays([], 30, now), revenue: lastDays([], 30, now), aiCost: lastDays([], 30, now), activity: [],
    };
  }
  async users(): Promise<AdminUser[]> {
    return [];
  }
}
