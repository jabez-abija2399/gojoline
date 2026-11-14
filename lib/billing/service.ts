import type { Entitlements, EntitlementsResolver } from "./entitlements";
import { PLAN_FEATURES, PRODUCTS, ROLLOVER_CAP_MONTHS, TOPUP_CREDITS, type Product } from "./plans";
import type { BillingStore, PaymentMethod } from "./store";

const monthRef = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export class Billing {
  constructor(
    private db: BillingStore,
    private now: () => Date = () => new Date(),
  ) {}

  /** Direct store access for read-only listings. */
  store(): BillingStore {
    return this.db;
  }

  async plan(userId: string): Promise<{ plan: Entitlements["plan"]; until: Date | null }> {
    const s = await this.db.subscription(userId);
    if (!s || s.currentPeriodEnd <= this.now()) return { plan: "free", until: null };
    return { plan: s.plan, until: s.currentPeriodEnd };
  }

  entitlements: EntitlementsResolver = async (userId) => {
    const { plan } = await this.plan(userId);
    const { monthlyEdits: _edits, ...entitlements } = PLAN_FEATURES[plan];
    void _edits;
    return entitlements;
  };

  /** Adds this month's edits once (idempotent), rolling unused ones over up to a cap. */
  async ensureMonthlyGrant(userId: string): Promise<void> {
    const { plan } = await this.plan(userId);
    const allowance = PLAN_FEATURES[plan].monthlyEdits;
    const balance = await this.db.balance(userId);
    const grant = Math.max(0, Math.min(allowance, allowance * ROLLOVER_CAP_MONTHS - balance));
    await this.db.addCredits(userId, grant, "monthly_grant", `${plan}:${monthRef(this.now())}`);
  }

  async creditsLeft(userId: string): Promise<number> {
    await this.ensureMonthlyGrant(userId);
    return this.db.balance(userId);
  }

  /** Takes one AI edit credit for this request; false when none are left. */
  async consumeEdit(userId: string, ref: string): Promise<boolean> {
    if ((await this.creditsLeft(userId)) < 1) return false;
    return this.db.addCredits(userId, -1, "ai_edit", ref);
  }

  /** Gives the credit back when a change failed (once per request). */
  async refundEdit(userId: string, ref: string): Promise<void> {
    await this.db.addCredits(userId, 1, "refund", ref);
  }

  async submitPayment(userId: string, input: { product: Product; method: PaymentMethod; reference: string; receipt: Buffer | null }) {
    const payment = await this.db.createPayment({ userId, ...input, amountMinor: PRODUCTS[input.product].amountMinor });
    if (payment) await this.db.audit({ actorId: userId, action: "payment.submitted", targetType: "payment", targetId: payment.id, data: { product: input.product, method: input.method } });
    return payment;
  }

  /** Admin decision. Approving a plan extends it; a top-up adds credits. Each payment applies once. */
  async review(adminId: string, paymentId: string, decision: "approve" | "reject", note: string | null): Promise<"ok" | "not_found" | "already_reviewed"> {
    const payment = await this.db.payment(paymentId);
    if (!payment) return "not_found";
    const changed = await this.db.review(paymentId, decision === "approve" ? "approved" : "rejected", adminId, note);
    if (!changed) return "already_reviewed";
    if (decision === "approve") {
      const product = PRODUCTS[payment.product];
      if (product.plan) {
        const current = await this.db.subscription(payment.userId);
        const start = current && current.currentPeriodEnd > this.now() && current.plan === product.plan ? current.currentPeriodEnd : this.now();
        const end = new Date(start);
        if (product.period === "year") end.setUTCFullYear(end.getUTCFullYear() + 1);
        else end.setUTCMonth(end.getUTCMonth() + 1);
        await this.db.setSubscription({ userId: payment.userId, plan: product.plan, period: product.period, currentPeriodEnd: end });
        // The new plan's allowance starts now.
        await this.db.addCredits(payment.userId, PLAN_FEATURES[product.plan].monthlyEdits, "admin", `plan-start:${paymentId}`);
      } else {
        await this.db.addCredits(payment.userId, TOPUP_CREDITS, "topup", paymentId);
      }
    }
    await this.db.audit({ actorId: adminId, action: `payment.${decision === "approve" ? "approved" : "rejected"}`, targetType: "payment", targetId: paymentId, data: { userId: payment.userId, product: payment.product, amountMinor: payment.amountMinor, note } });
    return "ok";
  }
}

/** Admins are listed by the founder in env (verified email or phone). */
export function isAdmin(user: { email: string | null; phone: string | null; verified: boolean } | null, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!user?.verified) return false;
  const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return (!!user.email && list(env.ADMIN_EMAILS).includes(user.email.toLowerCase())) || (!!user.phone && list(env.ADMIN_PHONES).includes(user.phone.toLowerCase()));
}
