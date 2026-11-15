import type { Entitlements, EntitlementsResolver } from "./entitlements";
import { PLAN_FEATURES, PRODUCTS, ROLLOVER_CAP_MONTHS, TOPUP_CREDITS, type Product } from "./plans";
import { canonicalReference, type BillingStore, type PaymentMethod } from "./store";

const REFUNDS_PER_DAY = 5;

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

  /** Grants already applied in this process: skips two queries on almost every edit. */
  private granted = new Set<string>();

  /** Adds this month's edits once (idempotent), rolling unused ones over up to a cap. */
  async ensureMonthlyGrant(userId: string): Promise<void> {
    const { plan } = await this.plan(userId);
    const ref = `${plan}:${monthRef(this.now())}`;
    const key = `${userId}:${ref}`;
    if (this.granted.has(key)) return;
    const allowance = PLAN_FEATURES[plan].monthlyEdits;
    const balance = await this.db.balance(userId);
    const grant = Math.max(0, Math.min(allowance, allowance * ROLLOVER_CAP_MONTHS - balance));
    await this.db.addCredits(userId, grant, "monthly_grant", ref);
    if (this.granted.size > 50_000) this.granted.clear();
    this.granted.add(key);
  }

  async creditsLeft(userId: string): Promise<number> {
    await this.ensureMonthlyGrant(userId);
    return this.db.balance(userId);
  }

  /** Takes one AI edit credit for this request, atomically; false when none are left. */
  async consumeEdit(userId: string, ref: string): Promise<boolean> {
    await this.ensureMonthlyGrant(userId);
    return this.db.debit(userId, ref);
  }

  /**
   * Gives the credit back when a change failed on our side (once per request, and at most
   * REFUNDS_PER_DAY a day so failed or abandoned runs can't become unlimited free AI).
   */
  async refundEdit(userId: string, ref: string): Promise<boolean> {
    const today = new Date(this.now());
    today.setUTCHours(0, 0, 0, 0);
    if ((await this.db.countSince(userId, "refund", today)) >= REFUNDS_PER_DAY) return false;
    return this.db.addCredits(userId, 1, "refund", ref);
  }

  async submitPayment(userId: string, input: { product: Product; method: PaymentMethod; reference: string; receipt: Buffer | null }) {
    const reference = canonicalReference(input.reference);
    const payment = await this.db.createPayment({ userId, ...input, reference, amountMinor: PRODUCTS[input.product].amountMinor });
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
      try {
        const product = PRODUCTS[payment.product];
        if (product.plan) {
          await this.db.extendSubscription(payment.userId, product.plan, product.period, this.now());
          // This month's allowance for the plan (same ref as the monthly grant, so it is given once).
          await this.ensureMonthlyGrant(payment.userId);
        } else {
          await this.db.addCredits(payment.userId, TOPUP_CREDITS, "topup", paymentId);
        }
      } catch (error) {
        // Nothing half-applied stays "approved": the admin can simply try again.
        await this.db.unreview(paymentId);
        throw error;
      }
    }
    await this.db.audit({ actorId: adminId, action: `payment.${decision === "approve" ? "approved" : "rejected"}`, targetType: "payment", targetId: paymentId, data: { userId: payment.userId, product: payment.product, amountMinor: payment.amountMinor, note } });
    return "ok";
  }
}

/** Admins are listed by the founder in env; only a verified email or verified phone counts. */
export function isAdmin(
  user: { email: string | null; phone: string | null; emailVerified: boolean; phoneVerified: boolean } | null,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!user) return false;
  const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return (
    (user.emailVerified && !!user.email && list(env.ADMIN_EMAILS).includes(user.email.toLowerCase())) ||
    (user.phoneVerified && !!user.phone && list(env.ADMIN_PHONES).includes(user.phone.toLowerCase()))
  );
}
