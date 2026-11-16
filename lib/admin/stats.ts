import { and, count, desc, eq, getTableName, gte, ilike, or, sql, type SQL } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { abuseReports, aiUsage, auditLog, creditBalances, payments, projects, sites, subscriptions, user } from "@/lib/db/schema";
import type { PlanId } from "@/lib/billing/plans";
import type { BillingStore, Payment, Subscription } from "@/lib/billing/store";

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
  /** Owners per plan right now (Free = everyone without an active subscription). */
  plans: Record<PlanId, number>;
  /** Active subscriptions by plan and period, for the estimated monthly revenue. */
  activeSubs: { plan: Subscription["plan"]; period: Subscription["period"]; n: number }[];
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
  plan: PlanId;
  /** End of the paid period; null on Free. */
  until: Date | null;
  sites: number;
  credits: number;
  aiCost30Nano: number;
}

export interface AdminUserDetail extends AdminUser {
  projects: { id: string; name: string; site: { slug: string; url: string | null; status: "pending" | "published" | "taken_down" } | null }[];
  payments: Pick<Payment, "id" | "product" | "amountMinor" | "status" | "createdAt">[];
}

export type PlanFilter = PlanId | "all";

export interface AdminStats {
  overview(now?: Date): Promise<Overview>;
  users(search: string, limit: number, plan?: PlanFilter): Promise<AdminUser[]>;
  user(id: string): Promise<AdminUserDetail | null>;
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

/** Estimated monthly revenue from active subscriptions (a yearly plan counts as 1/12 of its price), in santim. */
export function monthlyRevenueMinor(activeSubs: Overview["activeSubs"], prices: Record<`${Subscription["plan"]}_${Subscription["period"]}`, number>): number {
  return activeSubs.reduce((sum, s) => sum + s.n * (s.period === "year" ? Math.round(prices[`${s.plan}_year`] / 12) : prices[`${s.plan}_month`]), 0);
}

/**
 * The outer users.id, fully qualified. A bare `${user.id}` renders as `"id"`, which inside a
 * correlated subquery resolves to the subquery's own table (uuid) and fails with text = uuid.
 */
export const outerUserId = sql`${sql.identifier(getTableName(user))}.${sql.identifier(user.id.name)}`;

const activeSub = (extra?: SQL) =>
  sql`exists (select 1 from ${subscriptions} where ${subscriptions.userId} = ${outerUserId} and ${subscriptions.currentPeriodEnd} > now()${extra ? sql` and ${extra}` : sql``})`;

const contactOf = (email: string, phone: string | null) => (email.endsWith("@phone.gojoline.invalid") ? (phone ?? "") : email);

export class DbAdminStats implements AdminStats {
  constructor(private db: Database) {}

  async overview(now = new Date()): Promise<Overview> {
    const d7 = new Date(now.getTime() - 7 * 86_400_000);
    const d14 = new Date(now.getTime() - 14 * 86_400_000);
    const d30 = new Date(now.getTime() - 30 * 86_400_000);
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const n = (q: Promise<{ n: number | string | null }[]>) => q.then((r) => Number(r[0]?.n ?? 0));
    const day = (col: typeof user.createdAt | typeof aiUsage.createdAt) => sql<string>`to_char(${col} at time zone 'UTC', 'YYYY-MM-DD')`;
    const [users, usersNew7, usersPrev7, sitesLive, projectCount, pending, reports, revenueMonth, aiCost30, subs, signups, revenue, ai, activity] = await Promise.all([
      n(this.db.select({ n: count() }).from(user)),
      n(this.db.select({ n: count() }).from(user).where(gte(user.createdAt, d7))),
      n(this.db.select({ n: count() }).from(user).where(and(gte(user.createdAt, d14), sql`${user.createdAt} < ${d7}`))),
      n(this.db.select({ n: count() }).from(sites).where(eq(sites.status, "published"))),
      n(this.db.select({ n: count() }).from(projects)),
      n(this.db.select({ n: count() }).from(payments).where(eq(payments.status, "pending"))),
      n(this.db.select({ n: count() }).from(abuseReports).where(eq(abuseReports.status, "open"))),
      n(this.db.select({ n: sql<number>`coalesce(sum(${payments.amountMinor}),0)::bigint` }).from(payments).where(and(eq(payments.status, "approved"), gte(payments.reviewedAt, month)))),
      n(this.db.select({ n: sql<number>`coalesce(sum(${aiUsage.costNanoUsd}),0)::bigint` }).from(aiUsage).where(gte(aiUsage.createdAt, d30))),
      this.db.select({ plan: subscriptions.plan, period: subscriptions.period, n: sql<number>`count(*)::int` }).from(subscriptions).where(gte(subscriptions.currentPeriodEnd, now)).groupBy(subscriptions.plan, subscriptions.period),
      this.db.select({ day: day(user.createdAt), value: sql<number>`count(*)::int` }).from(user).where(gte(user.createdAt, d30)).groupBy(day(user.createdAt)),
      this.db.select({ day: sql<string>`to_char(${payments.reviewedAt} at time zone 'UTC', 'YYYY-MM-DD')`, value: sql<number>`sum(${payments.amountMinor})::bigint` }).from(payments).where(and(eq(payments.status, "approved"), gte(payments.reviewedAt, d30))).groupBy(sql`1`),
      this.db.select({ day: day(aiUsage.createdAt), value: sql<number>`sum(${aiUsage.costNanoUsd})::bigint` }).from(aiUsage).where(gte(aiUsage.createdAt, d30)).groupBy(day(aiUsage.createdAt)),
      this.db.select({ actorId: auditLog.actorId, action: auditLog.action, targetType: auditLog.targetType, targetId: auditLog.targetId, createdAt: auditLog.createdAt }).from(auditLog).orderBy(desc(auditLog.createdAt)).limit(12),
    ]);
    const activeSubs = subs.map((s) => ({ ...s, n: Number(s.n) }));
    const paid = (p: Subscription["plan"]) => activeSubs.filter((s) => s.plan === p).reduce((x, s) => x + s.n, 0);
    const paidUsers = paid("starter") + paid("business");
    return {
      users, usersNew7, usersPrev7, sitesLive, projects: projectCount, pendingPayments: pending, openReports: reports,
      revenueMonthMinor: revenueMonth, aiCost30Nano: aiCost30, paidUsers,
      plans: { free: Math.max(0, users - paidUsers), starter: paid("starter"), business: paid("business") },
      activeSubs,
      signups: lastDays(signups, 30, now), revenue: lastDays(revenue, 30, now), aiCost: lastDays(ai, 30, now), activity,
    };
  }

  /** The users query, built separately so a test can check its SQL. */
  usersQuery(search: string, limit: number, plan: PlanFilter = "all", id?: string) {
    // Plain substring match: % _ and \ typed by the admin are literal characters.
    const q = search.trim().slice(0, 100).replace(/[\\%_]/g, (c) => `\\${c}`);
    const where = and(
      id ? eq(user.id, id) : undefined,
      q ? or(ilike(user.email, `%${q}%`), ilike(user.phoneNumber, `%${q}%`), ilike(user.name, `%${q}%`)) : undefined,
      plan === "all" ? undefined : plan === "free" ? sql`not ${activeSub()}` : activeSub(sql`${subscriptions.plan} = ${plan}`),
    );
    return this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        joined: user.createdAt,
        plan: sql<string | null>`(select ${subscriptions.plan} from ${subscriptions} where ${subscriptions.userId} = ${outerUserId} and ${subscriptions.currentPeriodEnd} > now())`,
        until: sql<Date | string | null>`(select ${subscriptions.currentPeriodEnd} from ${subscriptions} where ${subscriptions.userId} = ${outerUserId} and ${subscriptions.currentPeriodEnd} > now())`,
        sites: sql<number>`(select count(*)::int from ${sites} where ${sites.ownerId} = ${outerUserId} and ${sites.status} = 'published')`,
        credits: sql<number>`coalesce((select ${creditBalances.balance} from ${creditBalances} where ${creditBalances.userId} = ${outerUserId}), 0)`,
        aiCost30Nano: sql<number>`(select coalesce(sum(${aiUsage.costNanoUsd}), 0)::bigint from ${aiUsage} where ${aiUsage.userId} = ${outerUserId} and ${aiUsage.createdAt} >= now() - interval '30 days')`,
      })
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(limit);
  }

  async users(search: string, limit: number, plan: PlanFilter = "all"): Promise<AdminUser[]> {
    const rows = await this.usersQuery(search, limit, plan);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      contact: contactOf(r.email, r.phone),
      joined: r.joined,
      plan: (r.plan as PlanId | null) ?? "free",
      until: r.until ? new Date(r.until) : null,
      sites: Number(r.sites),
      credits: Number(r.credits),
      aiCost30Nano: Number(r.aiCost30Nano),
    }));
  }

  async user(id: string): Promise<AdminUserDetail | null> {
    const [rows, projectRows, paymentRows] = await Promise.all([
      this.usersQuery("", 1, "all", id),
      this.db
        .select({ id: projects.id, name: projects.name, slug: sites.slug, url: sites.url, status: sites.status })
        .from(projects)
        .leftJoin(sites, eq(sites.projectId, projects.id))
        .where(eq(projects.ownerId, id))
        .orderBy(desc(projects.updatedAt))
        .limit(20),
      this.db
        .select({ id: payments.id, product: payments.product, amountMinor: payments.amountMinor, status: payments.status, createdAt: payments.createdAt })
        .from(payments)
        .where(eq(payments.userId, id))
        .orderBy(desc(payments.createdAt))
        .limit(10),
    ]);
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      contact: contactOf(r.email, r.phone),
      joined: r.joined,
      plan: (r.plan as PlanId | null) ?? "free",
      until: r.until ? new Date(r.until) : null,
      sites: Number(r.sites),
      credits: Number(r.credits),
      aiCost30Nano: Number(r.aiCost30Nano),
      projects: projectRows.map((p) => ({ id: p.id, name: p.name, site: p.slug && p.status ? { slug: p.slug, url: p.url, status: p.status } : null })),
      payments: paymentRows,
    };
  }
}

export interface MemoryAdminDeps {
  counts: () => Promise<{ pendingPayments: number; openReports: number; sitesLive: number }>;
  /** Accounts known to the in-memory auth store (development, e2e). */
  accounts?: () => { id: string; name: string; email: string; phoneNumber?: string | null; createdAt: Date }[];
  billing?: BillingStore;
  projects?: (ownerId: string) => Promise<{ id: string; name: string }[]>;
}

/** Without a database (development, e2e): what the in-memory stores can tell. */
export class MemoryAdminStats implements AdminStats {
  constructor(private deps: MemoryAdminDeps) {}

  private async all(): Promise<AdminUser[]> {
    const now = new Date();
    const list = [...(this.deps.accounts?.() ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return Promise.all(
      list.map(async (a) => {
        const sub = await this.deps.billing?.subscription(a.id);
        const active = sub && sub.currentPeriodEnd > now ? sub : null;
        return {
          id: a.id,
          name: a.name,
          contact: contactOf(a.email, a.phoneNumber ?? null),
          joined: new Date(a.createdAt),
          plan: active?.plan ?? "free",
          until: active?.currentPeriodEnd ?? null,
          sites: 0,
          credits: (await this.deps.billing?.balance(a.id)) ?? 0,
          aiCost30Nano: 0,
        };
      }),
    );
  }

  async overview(now = new Date()): Promise<Overview> {
    const c = await this.deps.counts();
    const all = await this.all();
    const by = (p: PlanId) => all.filter((u) => u.plan === p).length;
    return {
      users: all.length, usersNew7: 0, usersPrev7: 0, projects: 0, revenueMonthMinor: 0, aiCost30Nano: 0, paidUsers: by("starter") + by("business"), ...c,
      plans: { free: by("free"), starter: by("starter"), business: by("business") },
      activeSubs: [],
      signups: lastDays([], 30, now), revenue: lastDays([], 30, now), aiCost: lastDays([], 30, now), activity: [],
    };
  }

  async users(search: string, limit: number, plan: PlanFilter = "all"): Promise<AdminUser[]> {
    const q = search.trim().toLowerCase();
    return (await this.all()).filter((u) => (plan === "all" || u.plan === plan) && (!q || `${u.name} ${u.contact}`.toLowerCase().includes(q))).slice(0, limit);
  }

  async user(id: string): Promise<AdminUserDetail | null> {
    const u = (await this.all()).find((x) => x.id === id);
    if (!u) return null;
    const projects = ((await this.deps.projects?.(id)) ?? []).map((p) => ({ id: p.id, name: p.name, site: null }));
    const payments = ((await this.deps.billing?.paymentsFor(id)) ?? []).slice(0, 10).map((p) => ({ id: p.id, product: p.product, amountMinor: p.amountMinor, status: p.status, createdAt: p.createdAt }));
    return { ...u, projects, payments };
  }
}
