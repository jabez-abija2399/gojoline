import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, gte, inArray, ne, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { auditLog, creditBalances, creditLedger, discountCodes, payments, subscriptions, user } from "@/lib/db/schema";
import type { RequestSize } from "./credits";
import type { DiscountCode, DiscountInput } from "./discounts";
import type { Product } from "./plans";

export interface Subscription {
  userId: string;
  plan: "starter" | "business";
  period: "month" | "year";
  currentPeriodEnd: Date;
}

/** "first_build" rows have delta 0: they only count free first builds. */
export type LedgerReason = "monthly_grant" | "topup" | "ai_edit" | "refund" | "admin" | "first_build";
export type PaymentMethod = "telebirr" | "cbe" | "other";

/** Shown in the owner's history: how big an AI change was and what it was about. */
export interface LedgerMeta {
  size?: RequestSize | null;
  note?: string | null;
}

export interface LedgerEntry {
  delta: number;
  reason: LedgerReason;
  size: RequestSize | null;
  note: string | null;
  createdAt: Date;
}

/** What a payment's discount was (all null when none applied). */
export interface PaymentDiscount {
  originalAmountMinor: number | null;
  discountMinor: number | null;
  discountSource: "code" | "offer" | null;
  discountCode: string | null;
}

export type NewPayment = { userId: string; product: Product; amountMinor: number; method: PaymentMethod; reference: string; receipt: Buffer | null } & Partial<PaymentDiscount>;

export interface Payment extends PaymentDiscount {
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
  addCredits(userId: string, delta: number, reason: LedgerReason, ref: string, meta?: LedgerMeta): Promise<boolean>;
  /**
   * Takes `n` credits atomically (parallel requests can't overspend); false when fewer than n
   * are left or this ref was already charged.
   */
  debit(userId: string, ref: string, n?: number, meta?: LedgerMeta): Promise<boolean>;
  /**
   * Gives back up to `n` changes for a failed request, atomically within the daily cap: the
   * day's refunds are counted on the balance row in the same update (parallel refunds can't
   * pass the cap). Returns how many were given (0 when the cap is reached or the ref was refunded).
   */
  refund(userId: string, ref: string, n: number, cap: number, day: string, meta?: LedgerMeta): Promise<number>;
  /** The owner's credit movements, newest first. */
  ledger(userId: string, limit: number, offset: number): Promise<LedgerEntry[]>;
  /** Ledger entries of this kind since the given time (e.g. refunds today). */
  countSince(userId: string, reason: LedgerReason, since: Date): Promise<number>;
  /** Sum of credits added for these reasons since the given time (e.g. bought changes this year). */
  sumSince(userId: string, reasons: LedgerReason[], since: Date): Promise<number>;
  /** Atomically extends (same plan, still active) or starts (otherwise) the subscription by one period. */
  extendSubscription(userId: string, plan: Subscription["plan"], period: Subscription["period"], now: Date): Promise<void>;
  /** Puts an approved/rejected payment back to pending (when applying the decision failed). */
  unreview(id: string): Promise<void>;
  /** Pending payments with the customer's contact, for admins only. */
  pendingForAdmin(): Promise<(Payment & { contact: string | null })[]>;
  /** The customer's real email (not a phone placeholder) and phone, for payment notices. */
  contactFor(userId: string): Promise<{ email: string | null; phone: string | null } | null>;
  createPayment(p: NewPayment): Promise<Payment | null>;
  /** True when the user has an approved payment (other than `exceptId`). */
  hasApprovedPayment(userId: string, exceptId?: string): Promise<boolean>;
  /** True when the user has an approved payment that used this code. */
  hasUsedCode(userId: string, code: string): Promise<boolean>;
  discountByCode(code: string): Promise<DiscountCode | null>;
  /** Null when the code already exists. */
  createDiscount(input: Omit<DiscountInput, "kind">, by: string): Promise<DiscountCode | null>;
  discounts(): Promise<DiscountCode[]>;
  setDiscountActive(id: string, active: boolean): Promise<DiscountCode | null>;
  /**
   * Counts one use of a code for an approved payment, atomically: false when the code is
   * switched off, ended before the payment was sent, at its maximum uses, for first payments
   * and the user has another approved one, or once per customer and the user already used it.
   */
  useDiscount(code: string, userId: string, paymentId: string, paymentCreatedAt: Date): Promise<boolean>;
  /** Gives a use back (approving the payment failed after the use was counted). */
  releaseDiscountUse(code: string): Promise<void>;
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
  private rows: { userId: string; delta: number; reason: LedgerReason; ref: string; at: Date; size: RequestSize | null; note: string | null }[] = [];
  private codes: DiscountCode[] = [];
  private refunded = new Map<string, { day: string; used: number }>();
  private pays: (Payment & { receipt: Buffer | null })[] = [];
  private log: { actorId: string; action: string; targetType: string; targetId: string; data: Record<string, unknown> | null; createdAt: Date }[] = [];

  async subscription(userId: string) {
    return this.subs.get(userId) ?? null;
  }
  async setSubscription(s: Subscription) {
    this.subs.set(s.userId, s);
  }
  async balance(userId: string) {
    return this.rows.filter((l) => l.userId === userId).reduce((n, l) => n + l.delta, 0);
  }
  async addCredits(userId: string, delta: number, reason: LedgerReason, ref: string, meta: LedgerMeta = {}) {
    if (this.rows.some((l) => l.userId === userId && l.reason === reason && l.ref === ref)) return false;
    this.rows.push({ userId, delta, reason, ref, at: new Date(), size: meta.size ?? null, note: meta.note ?? null });
    return true;
  }
  async debit(userId: string, ref: string, n = 1, meta: LedgerMeta = {}) {
    if (!Number.isInteger(n) || n < 1) return false;
    // Single-threaded: check and insert happen without an await in between.
    const bal = this.rows.filter((l) => l.userId === userId).reduce((sum, l) => sum + l.delta, 0);
    if (bal < n || this.rows.some((l) => l.userId === userId && l.reason === "ai_edit" && l.ref === ref)) return false;
    this.rows.push({ userId, delta: -n, reason: "ai_edit", ref, at: new Date(), size: meta.size ?? null, note: meta.note ?? null });
    return true;
  }
  async refund(userId: string, ref: string, n: number, cap: number, day: string, meta: LedgerMeta = {}) {
    // Single-threaded: the check and the write happen without an await in between.
    const r = this.refunded.get(userId);
    const used = r?.day === day ? r.used : 0;
    const give = Math.min(n, cap - used);
    if (give < 1 || this.rows.some((l) => l.userId === userId && l.reason === "refund" && l.ref === ref)) return 0;
    this.rows.push({ userId, delta: give, reason: "refund", ref, at: new Date(), size: meta.size ?? null, note: meta.note ?? null });
    this.refunded.set(userId, { day, used: used + give });
    return give;
  }
  async ledger(userId: string, limit: number, offset: number) {
    return this.rows
      .filter((l) => l.userId === userId)
      .reverse()
      .slice(offset, offset + limit)
      .map((l) => ({ delta: l.delta, reason: l.reason, size: l.size, note: l.note, createdAt: l.at }));
  }
  async countSince(userId: string, reason: LedgerReason, since: Date) {
    return this.rows.filter((l) => l.userId === userId && l.reason === reason && l.at >= since).length;
  }
  async sumSince(userId: string, reasons: LedgerReason[], since: Date) {
    return this.rows.filter((l) => l.userId === userId && reasons.includes(l.reason) && l.at >= since && l.delta > 0).reduce((n, l) => n + l.delta, 0);
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
  async contactFor() {
    return null;
  }
  async createPayment(p: NewPayment) {
    if (this.pays.some((x) => x.reference === p.reference)) return null;
    const pay = { originalAmountMinor: null, discountMinor: null, discountSource: null, discountCode: null, ...p, id: randomUUID(), currency: "ETB" as const, hasReceipt: !!p.receipt, status: "pending" as const, reviewedBy: null, reviewedAt: null, note: null, createdAt: new Date() };
    this.pays.push(pay);
    return strip(pay);
  }
  async hasApprovedPayment(userId: string, exceptId?: string) {
    return this.pays.some((p) => p.userId === userId && p.status === "approved" && p.id !== exceptId);
  }
  async hasUsedCode(userId: string, code: string) {
    return this.pays.some((p) => p.userId === userId && p.status === "approved" && p.discountSource === "code" && p.discountCode === code);
  }
  async discountByCode(code: string) {
    const c = this.codes.find((x) => x.code === code);
    return c ? { ...c } : null;
  }
  async createDiscount(input: Omit<DiscountInput, "kind">) {
    if (this.codes.some((x) => x.code === input.code)) return null;
    const c: DiscountCode = { ...input, id: randomUUID(), uses: 0, active: true, createdAt: new Date() };
    this.codes.push(c);
    return { ...c };
  }
  async discounts() {
    return [...this.codes].reverse().map((c) => ({ ...c }));
  }
  async setDiscountActive(id: string, active: boolean) {
    const c = this.codes.find((x) => x.id === id);
    if (!c) return null;
    c.active = active;
    return { ...c };
  }
  async useDiscount(code: string, userId: string, paymentId: string, paymentCreatedAt: Date) {
    // Single-threaded: the checks and the count happen without an await in between.
    const c = this.codes.find((x) => x.code === code);
    if (!c || !c.active || (c.expiresAt && c.expiresAt <= paymentCreatedAt) || (c.maxUses !== null && c.uses >= c.maxUses)) return false;
    const others = this.pays.filter((p) => p.userId === userId && p.status === "approved" && p.id !== paymentId);
    if (c.firstPaymentOnly && others.length) return false;
    if (c.perCustomerOnce && others.some((p) => p.discountSource === "code" && p.discountCode === code)) return false;
    c.uses += 1;
    return true;
  }
  async releaseDiscountUse(code: string) {
    const c = this.codes.find((x) => x.code === code);
    if (c && c.uses > 0) c.uses -= 1;
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
  originalAmountMinor: payments.originalAmountMinor,
  discountMinor: payments.discountMinor,
  discountSource: payments.discountSource,
  discountCode: payments.discountCode,
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
  async addCredits(userId: string, delta: number, reason: LedgerReason, ref: string, meta: LedgerMeta = {}) {
    const rows = await this.db.execute(sql`
      with ins as (
        insert into credit_ledger (user_id, delta, reason, ref, size, note) values (${userId}, ${delta}, ${reason}, ${ref}, ${meta.size ?? null}, ${meta.note ?? null})
        on conflict do nothing returning delta
      )
      insert into credit_balances (user_id, balance) select ${userId}, delta from ins
      on conflict (user_id) do update set balance = credit_balances.balance + excluded.balance
      returning 1 as ok`);
    return rowsOf(rows).length === 1;
  }
  async debit(userId: string, ref: string, n = 1, meta: LedgerMeta = {}) {
    if (!Number.isInteger(n) || n < 1) return false;
    // The row lock makes concurrent debits wait and re-check balance >= n. A ref already
    // charged takes nothing; if two race with the same ref, the unique index fails the
    // second statement as a whole (its balance change is rolled back with it).
    try {
      const rows = await this.db.execute(sql`
        with dec as (
          update credit_balances set balance = balance - ${n}
          where user_id = ${userId} and balance >= ${n}
            and not exists (select 1 from credit_ledger where user_id = ${userId} and reason = 'ai_edit' and ref = ${ref})
          returning user_id
        )
        insert into credit_ledger (user_id, delta, reason, ref, size, note) select user_id, ${-n}::int, 'ai_edit', ${ref}, ${meta.size ?? null}, ${meta.note ?? null} from dec
        returning 1 as ok`);
      return rowsOf(rows).length === 1;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }
  async refund(userId: string, ref: string, n: number, cap: number, day: string, meta: LedgerMeta = {}) {
    if (!Number.isInteger(n) || n < 1) return 0;
    // The balance row is locked by the update, and its WHERE and SET are re-checked against the
    // newest row when refunds race, so the day's total can't pass the cap.
    const used = sql`(case when credit_balances.refund_day = ${day}::date then credit_balances.refund_used else 0 end)`;
    const give = sql`least(${n}::int, ${cap}::int - ${used})`;
    try {
      const rows = await this.db.execute(sql`
        with upd as (
          update credit_balances set
            refund_last = ${give},
            refund_used = ${used} + ${give},
            refund_day = ${day}::date,
            balance = credit_balances.balance + ${give}
          where user_id = ${userId} and ${used} < ${cap}::int
            and not exists (select 1 from credit_ledger where user_id = ${userId} and reason = 'refund' and ref = ${ref})
          returning user_id, refund_last
        )
        insert into credit_ledger (user_id, delta, reason, ref, size, note) select user_id, refund_last, 'refund', ${ref}, ${meta.size ?? null}, ${meta.note ?? null} from upd
        returning delta`);
      return Number((rowsOf(rows)[0] as { delta?: number } | undefined)?.delta ?? 0);
    } catch (error) {
      if (isUniqueViolation(error)) return 0;
      throw error;
    }
  }
  async ledger(userId: string, limit: number, offset: number) {
    const rows = await this.db
      .select({ delta: creditLedger.delta, reason: creditLedger.reason, size: creditLedger.size, note: creditLedger.note, createdAt: creditLedger.createdAt })
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId))
      .orderBy(desc(creditLedger.createdAt), desc(creditLedger.id))
      .limit(limit)
      .offset(offset);
    return rows;
  }
  async countSince(userId: string, reason: LedgerReason, since: Date) {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(creditLedger)
      .where(and(eq(creditLedger.userId, userId), eq(creditLedger.reason, reason), gte(creditLedger.createdAt, since)));
    return Number(row?.n ?? 0);
  }
  async sumSince(userId: string, reasons: LedgerReason[], since: Date) {
    if (!reasons.length) return 0;
    const [row] = await this.db
      .select({ n: sql<number>`coalesce(sum(${creditLedger.delta}), 0)::int` })
      .from(creditLedger)
      .where(and(eq(creditLedger.userId, userId), inArray(creditLedger.reason, reasons), gte(creditLedger.createdAt, since), gt(creditLedger.delta, 0)));
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
  async contactFor(userId: string) {
    const [row] = await this.db.select({ email: user.email, emailVerified: user.emailVerified, phone: user.phoneNumber }).from(user).where(eq(user.id, userId)).limit(1);
    if (!row) return null;
    const real = !row.email.endsWith("@phone.gojoline.invalid") && row.emailVerified;
    return { email: real ? row.email : null, phone: row.phone ?? null };
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
  async createPayment(p: NewPayment) {
    const rows = await this.db
      .insert(payments)
      .values({ ...p, currency: "ETB", status: "pending" })
      .onConflictDoNothing()
      .returning(paymentCols);
    return (rows[0] as Payment | undefined) ?? null;
  }
  async hasUsedCode(userId: string, code: string) {
    const [row] = await this.db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.status, "approved"), eq(payments.discountSource, "code"), eq(payments.discountCode, code)))
      .limit(1);
    return !!row;
  }
  async hasApprovedPayment(userId: string, exceptId?: string) {
    const conds = [eq(payments.userId, userId), eq(payments.status, "approved")];
    if (exceptId) conds.push(ne(payments.id, exceptId));
    const [row] = await this.db.select({ id: payments.id }).from(payments).where(and(...conds)).limit(1);
    return !!row;
  }
  async discountByCode(code: string) {
    const [row] = await this.db.select().from(discountCodes).where(eq(discountCodes.code, code)).limit(1);
    return row ? toDiscount(row) : null;
  }
  async createDiscount(input: Omit<DiscountInput, "kind">, by: string) {
    const rows = await this.db
      .insert(discountCodes)
      .values({ ...input, products: input.products, createdBy: by })
      .onConflictDoNothing()
      .returning();
    return rows[0] ? toDiscount(rows[0]) : null;
  }
  async discounts() {
    return (await this.db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt)).limit(200)).map(toDiscount);
  }
  async setDiscountActive(id: string, active: boolean) {
    const [row] = await this.db.update(discountCodes).set({ active }).where(eq(discountCodes.id, id)).returning();
    return row ? toDiscount(row) : null;
  }
  async useDiscount(code: string, userId: string, paymentId: string, paymentCreatedAt: Date) {
    // One statement: the row lock serializes concurrent approvals, each re-checking uses < max_uses.
    const rows = await this.db.execute(sql`
      update discount_codes set uses = uses + 1
      where code = ${code}
        and active
        and (expires_at is null or expires_at > ${paymentCreatedAt.toISOString()}::timestamptz)
        and (max_uses is null or uses < max_uses)
        and (not first_payment_only or not exists (
          select 1 from payments where user_id = ${userId} and status = 'approved' and id <> ${paymentId}::uuid
        ))
        and (not per_customer_once or not exists (
          select 1 from payments where user_id = ${userId} and status = 'approved' and discount_source = 'code' and discount_code = ${code} and id <> ${paymentId}::uuid
        ))
      returning 1 as ok`);
    return rowsOf(rows).length === 1;
  }
  async releaseDiscountUse(code: string) {
    await this.db.execute(sql`update discount_codes set uses = uses - 1 where code = ${code} and uses > 0`);
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

function toDiscount(row: typeof discountCodes.$inferSelect): DiscountCode {
  return { ...row, products: row.products as Product[] };
}

/** Postgres unique_violation (also when wrapped by the driver as `cause`). */
function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) => (e && typeof e === "object" ? (e as { code?: unknown }).code : undefined);
  return code(error) === "23505" || code((error as { cause?: unknown })?.cause) === "23505";
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
