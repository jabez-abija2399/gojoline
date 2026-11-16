import type { Entitlements, EntitlementsResolver } from "./entitlements";
import { entitlementsOf, PLAN_FEATURES, PRODUCTS, TOPUP_CREDITS, type Product } from "./plans";
import { loadBillingSettings, MemorySettingsStore, type BillingSettings, type SettingsStore } from "./settings";
import { randomUUID } from "node:crypto";
import { canonicalReference, type BillingStore, type PaymentMethod, type Subscription } from "./store";

const REFUNDS_PER_DAY = 5;
/**
 * Free first builds (a project's very first AI run) per owner per calendar month: one per site
 * the plan allows (Free 1, Starter 1, Business 3), so new sites can't become a supply of free AI.
 */
export const freeFirstBuildsPerMonth = (plan: Entitlements["plan"]) => PLAN_FEATURES[plan].maxSites;

const monthRef = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export class Billing {
  constructor(
    private db: BillingStore,
    private now: () => Date = () => new Date(),
    private readonly settingsStore: SettingsStore = new MemorySettingsStore(),
  ) {}

  /** Current prices and payment accounts (admin-editable, with safe defaults). */
  settings(): Promise<BillingSettings> {
    return loadBillingSettings(this.settingsStore);
  }

  async saveSettings(adminId: string, next: BillingSettings): Promise<void> {
    const before = await this.settings();
    await this.settingsStore.set("billing", next as unknown as Record<string, unknown>, adminId);
    await this.db.audit({ actorId: adminId, action: "settings.billing", targetType: "settings", targetId: "billing", data: { before, after: next } });
  }

  /** Direct store access for read-only listings. */
  store(): BillingStore {
    return this.db;
  }

  async plan(userId: string): Promise<{ plan: Entitlements["plan"]; until: Date | null }> {
    const s = await this.db.subscription(userId);
    if (!s || s.currentPeriodEnd <= this.now()) return { plan: "free", until: null };
    return { plan: s.plan, until: s.currentPeriodEnd };
  }

  entitlements: EntitlementsResolver = async (userId) => entitlementsOf((await this.plan(userId)).plan);

  /** Grants already applied in this process: skips two queries on almost every edit. */
  private granted = new Set<string>();

  /**
   * Adds this month's edits once (idempotent). Paid plans keep unused changes up to two
   * months' allowance; Free is topped up to one month's allowance (no rollover).
   */
  async ensureMonthlyGrant(userId: string): Promise<void> {
    const { plan } = await this.plan(userId);
    const ref = `${plan}:${monthRef(this.now())}`;
    const key = `${userId}:${ref}`;
    if (this.granted.has(key)) return;
    const { monthlyEdits: allowance, rolloverMonths } = PLAN_FEATURES[plan];
    const yearAgo = new Date(this.now().getTime() - 365 * 86_400_000);
    const [balance, bought] = await Promise.all([this.db.balance(userId), this.db.sumSince(userId, ["topup", "admin"], yearAgo)]);
    // Bought or gifted changes never eat into the rollover cap: only unused monthly changes are capped.
    const kept = allowance * rolloverMonths + Math.min(balance, bought);
    const grant = Math.max(0, Math.min(allowance, kept - balance));
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

  /**
   * A project's first build costs no change, up to one per site the plan allows each calendar
   * month (every attempt counts, so failing or abandoned first builds can't loop for free).
   * Callers serialize this per owner (see the builder's lock), so parallel requests can't race past the cap.
   */
  async freeFirstBuild(userId: string, ref: string): Promise<boolean> {
    const n = this.now();
    const monthStart = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
    const { plan } = await this.plan(userId);
    if ((await this.db.countSince(userId, "first_build", monthStart)) >= freeFirstBuildsPerMonth(plan)) return false;
    return this.db.addCredits(userId, 0, "first_build", ref);
  }

  /** Admin gift of extra changes (comps, apologies). Each call is its own ledger row; audited. */
  async adminGrantCredits(adminId: string, userId: string, n: number, reason: string, key: string = randomUUID()): Promise<void> {
    // The form's one-time key: a double submit or retried request grants once.
    const ref = `admin:${key}`;
    if (!(await this.db.addCredits(userId, n, "admin", ref))) return;
    await this.db.audit({ actorId: adminId, action: "credits.granted", targetType: "user", targetId: userId, data: { n, reason, ref } });
  }

  /**
   * Admin plan change for comps and corrections: a paid plan starts or extends by one period
   * (with its monthly changes); "free" ends the current plan now (nothing is deleted). Audited.
   */
  async adminSetPlan(adminId: string, userId: string, plan: Subscription["plan"] | "free", period: Subscription["period"], reason: string): Promise<void> {
    const before = await this.plan(userId);
    if (plan === "free") {
      const s = await this.db.subscription(userId);
      if (s && s.currentPeriodEnd > this.now()) await this.db.setSubscription({ ...s, currentPeriodEnd: this.now() });
    } else {
      await this.db.extendSubscription(userId, plan, period, this.now());
      await this.ensureMonthlyGrant(userId);
    }
    const after = await this.plan(userId);
    await this.db.audit({
      actorId: adminId,
      action: "plan.set",
      targetType: "user",
      targetId: userId,
      data: { reason, period: plan === "free" ? null : period, before: { plan: before.plan, until: before.until?.toISOString() ?? null }, after: { plan: after.plan, until: after.until?.toISOString() ?? null } },
    });
  }

  async submitPayment(userId: string, input: { product: Product; method: PaymentMethod; reference: string; receipt: Buffer | null }) {
    const reference = canonicalReference(input.reference);
    // The price at the time of payment is recorded on the payment (later price changes don't affect it).
    const { prices } = await this.settings();
    const payment = await this.db.createPayment({ userId, ...input, reference, amountMinor: prices[input.product] });
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
