import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { auditLog, creditLedger, payments, subscriptions } from "@/lib/db/schema";
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
  private ledger: { userId: string; delta: number; reason: LedgerReason; ref: string }[] = [];
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
    this.ledger.push({ userId, delta, reason, ref });
    return true;
  }
  async createPayment(p: { userId: string; product: Product; amountMinor: number; method: PaymentMethod; reference: string; receipt: Buffer | null }) {
    if (this.pays.some((x) => x.method === p.method && x.reference === p.reference)) return null;
    const pay = { ...p, id: randomUUID(), currency: "ETB" as const, hasReceipt: !!p.receipt, status: "pending" as const, reviewedBy: null, reviewedAt: null, note: null, createdAt: new Date() };
    this.pays.push(pay);
    return strip(pay);
  }
  async paymentsFor(userId: string) {
    return this.pays.filter((p) => p.userId === userId).reverse().map(strip);
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
    const [row] = await this.db.select({ n: sql<number>`coalesce(sum(${creditLedger.delta}), 0)::int` }).from(creditLedger).where(eq(creditLedger.userId, userId));
    return Number(row?.n ?? 0);
  }
  async addCredits(userId: string, delta: number, reason: LedgerReason, ref: string) {
    const rows = await this.db.insert(creditLedger).values({ userId, delta, reason, ref }).onConflictDoNothing().returning({ id: creditLedger.id });
    return rows.length === 1;
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
    return (await this.db.select(paymentCols).from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)).limit(50)) as Payment[];
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
