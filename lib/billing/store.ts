import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { auditLog, creditBalances, creditLedger, payments, subscriptions, user } from "@/lib/db/schema";
import type { Product } from "./plans";

export interface Subscription {
  userId: string;
  plan: "starter" | "business";
  period: "month" | "year";
  currentPeriodEnd: Date;
}

export type LedgerReason = "monthly_grant" | "topup" | "ai_edit" | "refund" | "admin";
export type PaymentMethod = "telebirr" | "cbe" | "other";

export interface Payment {
  id: string;
  userId: string;
  product: Product;
  amountMinor: number;
  currency: "ETB";
  method: PaymentMethod;
  reference: string;
  hasReceipt: boolean;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: Date | null;
  note: string | null;
  createdAt: Date;
}

export interface BillingStore {
  subscription(userId: string): Promise<Subscription | null>;
  setSubscription(s: Subscription): Promise<void>;
  balance(userId: string): Promise<number>;
  /** Idempotent: false when (user, reason, ref) already exists. */
  addCredits(userId: string, delta: number, reason: LedgerReason, ref: string): Promise<boolean>;
  /** Takes one credit atomically (parallel requests can't overspend); false when none are left. */
  debit(userId: string, ref: string): Promise<boolean>;
  /** Ledger entries of this kind since the given time (e.g. refunds today). */
  countSince(userId: string, reason: LedgerReason, since: Date): Promise<number>;
  /** Atomically extends (same plan, still active) or starts (otherwise) the subscription by one period. */
  extendSubscription(userId: string, plan: Subscription["plan"], period: Subscription["period"], now: Date): Promise<void>;
  /** Puts an approved/rejected payment back to pending (when applying the decision failed). */
  unreview(id: string): Promise<void>;
  /** Pending payments with the customer's contact, for admins only. */
  pendingForAdmin(): Promise<(Payment & { contact: string | null })[]>;
  createPayment(p: { userId: string; product: Product; amountMinor: number; method: PaymentMethod; reference: string; receipt: Buffer | null }): Promise<Payment | null>;
  paymentsFor(userId: string): Promise<Payment[]>;
  pendingPayments(): Promise<Payment[]>;
  payment(id: string): Promise<Payment | null>;
  receipt(id: string): Promise<Buffer | null>;
  /** Moves a pending payment to approved/rejected; false if it wasn't pending (no double approval). */
  review(id: string, status: "approved" | "rejected", reviewer: string, note: string | null): Promise<boolean>;
  audit(entry: { actorId: string; action: string; targetType: string; targetId: string; data?: Record<string, unknown> }): Promise<void>;
  auditFor(targetType: string, targetId: string): Promise<{ actorId: string; action: string; data: Record<string, unknown> | null; createdAt: Date }[]>;
}

export class MemoryBillingStore implements BillingStore {
  private subs = new Map<string, Subscription>();
  private ledger: { userId: string; delta: number; reason: LedgerReason; ref: string; at: Date }[] = [];
  private pays: (Payment & { receipt: Buffer | null })[] = [];
  private log: { actorId: string; action: string; targetType: string; targetId: string; data: Record<string, unknown> | null; createdAt: Date }[] = [];

  async subscription(userId: string) {
    return this.subs.get(userId) ?? null;
  }
  async setSubscription(s: Subscription) {
    this.subs.set(s.userId, s);
  }
  async balance(userId: string) {
    return this.ledger.filter((l) => l.userId === userId).reduce((n, l) => n + l.delta, 0);
  }
  async addCredits(userId: string, delta: number, reason: LedgerReason, ref: string) {
    if (this.ledger.some((l) => l.userId === userId && l.reason === reason && l.ref === ref)) return false;
    this.ledger.push({ userId, delta, reason, ref, at: new Date() });
    return true;
  }
  async debit(userId: string, ref: string) {
    // Single-threaded: check and insert happen without an await in between.
    const bal = this.ledger.filter((l) => l.userId === userId).reduce((n, l) => n + l.delta, 0);
    if (bal < 1 || this.ledger.some((l) => l.userId === userId && l.reason === "ai_edit" && l.ref === ref)) return false;
    this.ledger.push({ userId, delta: -1, reason: "ai_edit", ref, at: new Date() });
    return true;
  }
  async countSince(userId: string, reason: LedgerReason, since: Date) {
    return this.ledger.filter((l) => l.userId === userId && l.reason === reason && l.at >= since).length;
  }
  async extendSubscription(userId: string, plan: Subscription["plan"], period: Subscription["period"], now: Date) {
    const cur = this.subs.get(userId);
    const end = new Date(cur && cur.plan === plan && cur.currentPeriodEnd > now ? cur.currentPeriodEnd : now);
    if (period === "year") end.setUTCFullYear(end.getUTCFullYear() + 1);
    else end.setUTCMonth(end.getUTCMonth() + 1);
    this.subs.set(userId, { userId, plan, period, currentPeriodEnd: end });
  }
  async unreview(id: string) {
    const p = this.pays.find((x) => x.id === id);
    if (p) Object.assign(p, { status: "pending", reviewedBy: null, reviewedAt: null });
  }
  async pendingForAdmin() {
    return (await this.pendingPayments()).map((p) => ({ ...p, contact: null }));
  }
  async createPayment(p: { userId: string; product: Product; amountMinor: number; method: PaymentMethod; reference: string; receipt: Buffer | null }) {
    if (this.pays.some((x) => x.reference === p.reference)) return null;
    const pay = { ...p, id: randomUUID(), currency: "ETB" as const, hasReceipt: !!p.receipt, status: "pending" as const, reviewedBy: null, reviewedAt: null, note: null, createdAt: new Date() };
    this.pays.push(pay);
    return strip(pay);
  }
  async paymentsFor(userId: string) {
    return this.pays.filter((p) => p.userId === userId).reverse().map(strip).map(forOwner);
  }
  async pendingPayments() {
    return this.pays.filter((p) => p.status === "pending").map(strip);
  }
  async payment(id: string) {
    const p = this.pays.find((x) => x.id === id);
    return p ? strip(p) : null;
  }
  async receipt(id: string) {
    return this.pays.find((x) => x.id === id)?.receipt ?? null;
  }
  async review(id: string, status: "approved" | "rejected", reviewer: string, note: string | null) {
    const p = this.pays.find((x) => x.id === id);
    if (!p || p.status !== "pending") return false;
    Object.assign(p, { status, reviewedBy: reviewer, reviewedAt: new Date(), note });
    return true;
  }
  async audit(e: { actorId: string; action: string; targetType: string; targetId: string; data?: Record<string, unknown> }) {
    this.log.push({ ...e, data: e.data ?? null, createdAt: new Date() });
  }
  async auditFor(targetType: string, targetId: string) {
    return this.log.filter((l) => l.targetType === targetType && l.targetId === targetId);
  }
}

/** Owners don't see which admin reviewed their payment. */
const forOwner = (p: Payment): Payment => ({ ...p, reviewedBy: null });

function strip(p: Payment & { receipt: Buffer | null }): Payment {
  const { receipt, ...rest } = p;
  return { ...rest, hasReceipt: !!receipt };
}

const paymentCols = {
  id: payments.id,
  userId: payments.userId,
  product: payments.product,
  amountMinor: payments.amountMinor,
  currency: payments.currency,
  method: payments.method,
  reference: payments.reference,
  hasReceipt: sql<boolean>`${payments.receipt} is not null`,
  status: payments.status,
  reviewedBy: payments.reviewedBy,
  reviewedAt: payments.reviewedAt,
  note: payments.note,
  createdAt: payments.createdAt,
};

export class DbBillingStore implements BillingStore {
  constructor(private db: Database) {}
  async subscription(userId: string) {
    const [row] = await this.db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
    return row ?? null;
  }
  async setSubscription(s: Subscription) {
    await this.db
      .insert(subscriptions)
      .values({ ...s, updatedAt: new Date() })
      .onConflictDoUpdate({ target: subscriptions.userId, set: { plan: s.plan, period: s.period, currentPeriodEnd: s.currentPeriodEnd, updatedAt: new Date() } });
  }
  async balance(userId: string) {
    const [row] = await this.db.select({ n: creditBalances.balance }).from(creditBalances).where(eq(creditBalances.userId, userId)).limit(1);
    return Number(row?.n ?? 0);
  }
  /** One statement: the ledger row and the balance change happen together or not at all. */
  async addCredits(userId: string, delta: number, reason: LedgerReason, ref: string) {
    const rows = await this.db.execute(sql`
      with ins as (
        insert into credit_ledger (user_id, delta, reason, ref) values (${userId}, ${delta}, ${reason}, ${ref})
        on conflict do nothing returning delta
      )
      insert into credit_balances (user_id, balance) select ${userId}, delta from ins
      on conflict (user_id) do update set balance = credit_balances.balance + excluded.balance
      returning 1 as ok`);
    return rowsOf(rows).length === 1;
  }
  async debit(userId: string, ref: string) {
    // The row lock makes concurrent debits wait and re-check balance >= 1.
    const rows = await this.db.execute(sql`
      with dec as (
        update credit_balances set balance = balance - 1 where user_id = ${userId} and balance >= 1 returning user_id
      )
      insert into credit_ledger (user_id, delta, reason, ref) select user_id, -1, 'ai_edit', ${ref} from dec
      returning 1 as ok`);
    return rowsOf(rows).length === 1;
  }
  async countSince(userId: string, reason: LedgerReason, since: Date) {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(creditLedger)
      .where(and(eq(creditLedger.userId, userId), eq(creditLedger.reason, reason), gte(creditLedger.createdAt, since)));
    return Number(row?.n ?? 0);
  }
  async extendSubscription(userId: string, plan: Subscription["plan"], period: Subscription["period"], now: Date) {
    const step = period === "year" ? sql`interval '1 year'` : sql`interval '1 month'`;
    const at = now.toISOString();
    await this.db.execute(sql`
      insert into subscriptions (user_id, plan, period, current_period_end, updated_at)
      values (${userId}, ${plan}, ${period}, ${at}::timestamptz + ${step}, ${at}::timestamptz)
      on conflict (user_id) do update set
        current_period_end = case
          when subscriptions.plan = excluded.plan and subscriptions.current_period_end > ${at}::timestamptz
          then subscriptions.current_period_end + ${step}
          else ${at}::timestamptz + ${step} end,
        plan = excluded.plan, period = excluded.period, updated_at = excluded.updated_at`);
  }
  async unreview(id: string) {
    await this.db.update(payments).set({ status: "pending", reviewedBy: null, reviewedAt: null }).where(eq(payments.id, id));
  }
  async pendingForAdmin() {
    const rows = await this.db
      .select({ ...paymentCols, email: user.email, phone: user.phoneNumber })
      .from(payments)
      .innerJoin(user, eq(user.id, payments.userId))
      .where(eq(payments.status, "pending"))
      .orderBy(payments.createdAt)
      .limit(200);
    return rows.map(({ email, phone, ...p }) => ({ ...(p as Payment), contact: phone ?? (email.endsWith("@phone.gojoline.invalid") ? null : email) }));
  }
  async createPayment(p: { userId: string; product: Product; amountMinor: number; method: PaymentMethod; reference: string; receipt: Buffer | null }) {
    const rows = await this.db
      .insert(payments)
      .values({ ...p, currency: "ETB", status: "pending" })
      .onConflictDoNothing()
      .returning(paymentCols);
    return (rows[0] as Payment | undefined) ?? null;
  }
  async paymentsFor(userId: string) {
    return ((await this.db.select(paymentCols).from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)).limit(50)) as Payment[]).map(forOwner);
  }
  async pendingPayments() {
    return (await this.db.select(paymentCols).from(payments).where(eq(payments.status, "pending")).orderBy(payments.createdAt).limit(200)) as Payment[];
  }
  async payment(id: string) {
    const [row] = await this.db.select(paymentCols).from(payments).where(eq(payments.id, id)).limit(1);
    return (row as Payment | undefined) ?? null;
  }
  async receipt(id: string) {
    const [row] = await this.db.select({ r: payments.receipt }).from(payments).where(eq(payments.id, id)).limit(1);
    return row?.r ?? null;
  }
  async review(id: string, status: "approved" | "rejected", reviewer: string, note: string | null) {
    const rows = await this.db
      .update(payments)
      .set({ status, reviewedBy: reviewer, reviewedAt: new Date(), note })
      .where(and(eq(payments.id, id), eq(payments.status, "pending")))
      .returning({ id: payments.id });
    return rows.length === 1;
  }
  async audit(e: { actorId: string; action: string; targetType: string; targetId: string; data?: Record<string, unknown> }) {
    await this.db.insert(auditLog).values({ ...e, data: e.data ?? null });
  }
  async auditFor(targetType: string, targetId: string) {
    return this.db
      .select({ actorId: auditLog.actorId, action: auditLog.action, data: auditLog.data, createdAt: auditLog.createdAt })
      .from(auditLog)
      .where(and(eq(auditLog.targetType, targetType), eq(auditLog.targetId, targetId)))
      .orderBy(auditLog.createdAt);
  }
}

/** neon-http returns { rows }, PGlite returns { rows } too; some drivers return the array itself. */
function rowsOf(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  return ((result as { rows?: unknown[] }).rows ?? []) as unknown[];
}

/** Transaction numbers are compared without spaces, dashes or case, across all payment methods. */
export function canonicalReference(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
