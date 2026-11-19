import type { Entitlements, EntitlementsResolver } from "./entitlements";
import { nextMonthlyGrant, type CreditSettings } from "./credits";
import { CODE_PATTERN, codeProblem, publicCodeProblem, normalizeCode, quote, type CodeProblem, type DiscountCode, type DiscountInput, type LaunchOffer, type LaunchOfferTerms, type Quote } from "./discounts";
import { entitlementsOf, PLAN_FEATURES, PRODUCTS, type Product } from "./plans";
import { loadBillingSettings, loadCreditSettings, loadLaunchOffer, MemorySettingsStore, type BillingSettings, type SettingsStore } from "./settings";
import { randomUUID } from "node:crypto";
import { reportError } from "@/lib/observability/report";
import { canonicalReference, type BillingStore, type LedgerMeta, type LedgerReason, type Payment, type PaymentMethod, type Subscription } from "./store";

/**
 * Changes given back per owner per day when AI changes fail on our side (counted in changes,
 * not requests: three large failures or a dozen small ones), so failed or abandoned runs
 * can't become unlimited free AI.
 */
export const REFUND_CREDITS_PER_DAY = 12;
/** Credit settings are read on every AI request: kept this long per server instance. */
const CREDIT_SETTINGS_TTL_MS = 10_000;
/**
 * Free first builds (a project's very first AI run) per owner per calendar month: one per site
 * the plan allows (Free 1, Starter 1, Business 3), so new sites can't become a supply of free AI.
 */
export const freeFirstBuildsPerMonth = (plan: Entitlements["plan"]) => PLAN_FEATURES[plan].maxSites;

/** Bought or gifted changes: kept on top of the monthly rollover cap. */
const GIFTED: LedgerReason[] = ["topup", "admin", "referral"];

const monthRef = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export class Billing {
  constructor(
    private db: BillingStore,
    private now: () => Date = () => new Date(),
    private readonly settingsStore: SettingsStore = new MemorySettingsStore(),
  ) {}

  /**
   * Runs after a payment is approved and applied (the referral reward). Its failure is reported,
   * never undoes the approval.
   */
  onApproved: ((payment: Payment, adminId: string) => Promise<void>) | null = null;

  /** Current prices and payment accounts (admin-editable, with safe defaults). */
  settings(): Promise<BillingSettings> {
    return loadBillingSettings(this.settingsStore);
  }

  async saveSettings(adminId: string, next: BillingSettings): Promise<void> {
    const before = await this.settings();
    await this.settingsStore.set("billing", next as unknown as Record<string, unknown>, adminId);
    await this.db.audit({ actorId: adminId, action: "settings.billing", targetType: "settings", targetId: "billing", data: { before, after: next } });
  }

  private creditMemo: { at: number; value: CreditSettings } | null = null;

  /** Monthly changes, rollover, sizes and cost cap (admin-editable, with safe defaults). */
  async credits(): Promise<CreditSettings> {
    const memo = this.creditMemo;
    if (memo && Date.now() - memo.at < CREDIT_SETTINGS_TTL_MS) return memo.value;
    const value = await loadCreditSettings(this.settingsStore);
    this.creditMemo = { at: Date.now(), value };
    return value;
  }

  /** Takes effect from each owner's next monthly grant; nobody loses changes they have. Audited. */
  async saveCreditSettings(adminId: string, next: CreditSettings): Promise<void> {
    const before = await loadCreditSettings(this.settingsStore);
    await this.settingsStore.set("credits", next as unknown as Record<string, unknown>, adminId);
    this.creditMemo = null;
    await this.db.audit({ actorId: adminId, action: "settings.credits", targetType: "settings", targetId: "credits", data: { before, after: next } });
  }

  launchOffer(): Promise<LaunchOffer | null> {
    return loadLaunchOffer(this.settingsStore);
  }

  async saveLaunchOffer(adminId: string, next: LaunchOffer): Promise<void> {
    const before = await this.launchOffer();
    await this.settingsStore.set("offer", next as unknown as Record<string, unknown>, adminId);
    await this.db.audit({ actorId: adminId, action: "settings.offer", targetType: "settings", targetId: "offer", data: { before, after: next } });
  }

  /**
   * The offer form: percent, products, last day and name, in one atomic change that leaves
   * on/off alone (a switch made at the same moment is never undone). A new offer starts off. Audited.
   */
  async saveLaunchOfferTerms(adminId: string, terms: LaunchOfferTerms): Promise<void> {
    const before = await this.launchOffer();
    const patch: Record<string, unknown> = { percent: terms.percent, products: terms.products };
    if (terms.until) patch.until = terms.until;
    if (terms.name) patch.name = terms.name;
    const remove = (["until", "name"] as const).filter((k) => !terms[k]);
    const after = await this.settingsStore.merge("offer", patch, [...remove], adminId, { active: false });
    await this.db.audit({ actorId: adminId, action: "settings.offer", targetType: "settings", targetId: "offer", data: { before, after } });
  }

  /**
   * The one-click on/off switch: changes only `active`, atomically, keeping percent, products,
   * last day and name. "none" when no offer was saved yet (nothing to switch on). Audited.
   */
  async setLaunchOfferActive(adminId: string, active: boolean): Promise<"ok" | "none"> {
    const before = await this.launchOffer();
    if (!before) return "none";
    const after = await this.settingsStore.merge("offer", { active }, [], adminId, null);
    if (!after) return "none";
    await this.db.audit({ actorId: adminId, action: "settings.offer_switch", targetType: "settings", targetId: "offer", data: { before, after } });
    return "ok";
  }

  /** A new discount code; null when the code already exists. Audited. */
  async createDiscount(adminId: string, input: DiscountInput): Promise<DiscountCode | null> {
    // The kind only chooses which amount is set; the store keeps the amounts.
    const rest = { code: input.code, percentOff: input.percentOff, amountOffMinor: input.amountOffMinor, products: input.products, maxUses: input.maxUses, expiresAt: input.expiresAt, firstPaymentOnly: input.firstPaymentOnly, perCustomerOnce: input.perCustomerOnce };
    const created = await this.db.createDiscount(rest, adminId);
    if (created) await this.db.audit({ actorId: adminId, action: "discount.created", targetType: "discount", targetId: created.id, data: { ...rest, expiresAt: rest.expiresAt?.toISOString() ?? null } });
    return created;
  }

  /** Codes are switched off, never deleted (payments keep them). Audited. */
  async setDiscountActive(adminId: string, id: string, active: boolean): Promise<DiscountCode | null> {
    const changed = await this.db.setDiscountActive(id, active);
    if (changed) await this.db.audit({ actorId: adminId, action: active ? "discount.activated" : "discount.deactivated", targetType: "discount", targetId: id, data: { code: changed.code } });
    return changed;
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
    const cs = await this.credits();
    const allowance = cs.monthly[plan];
    const rolloverMonths = cs.rollover[plan];
    const yearAgo = new Date(this.now().getTime() - 365 * 86_400_000);
    const [balance, bought] = await Promise.all([this.db.balance(userId), this.db.sumSince(userId, GIFTED, yearAgo)]);
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

  /** Takes `n` AI changes for this request, atomically; false when fewer than n are left. */
  async consumeEdit(userId: string, ref: string, n = 1, meta: LedgerMeta = {}): Promise<boolean> {
    await this.ensureMonthlyGrant(userId);
    return this.db.debit(userId, ref, n, meta);
  }

  /**
   * Gives the `n` changes back when a change failed on our side (once per request). At most
   * REFUND_CREDITS_PER_DAY changes a day; past that, only what is left of the day's cap.
   */
  async refundEdit(userId: string, ref: string, n = 1, meta: LedgerMeta = {}): Promise<boolean> {
    return (await this.giveBack(userId, ref, n, meta)) > 0;
  }

  /** As `refundEdit`, returning how many changes were given back (fewer near the daily cap, 0 past it). */
  async giveBack(userId: string, ref: string, n = 1, meta: LedgerMeta = {}): Promise<number> {
    const day = this.now().toISOString().slice(0, 10);
    return this.db.refund(userId, ref, n, REFUND_CREDITS_PER_DAY, day, meta);
  }

  /** Plan, changes left, and what the Plan page explains about them. */
  async allowance(userId: string) {
    const [{ plan, until }, credits, cs] = await Promise.all([this.plan(userId), this.creditsLeft(userId), this.credits()]);
    return {
      plan,
      until,
      credits,
      monthly: cs.monthly[plan],
      rolloverMonths: cs.rollover[plan],
      /** Unused monthly changes kept at most (bought and gifted ones are kept on top). */
      keptMax: cs.monthly[plan] * cs.rollover[plan],
      nextGrant: nextMonthlyGrant(this.now()),
    };
  }

  /** Bought or gifted changes (last 12 months) still in the balance: the rollover cap never takes them. */
  async boughtLeft(userId: string): Promise<number> {
    const yearAgo = new Date(this.now().getTime() - 365 * 86_400_000);
    const [balance, bought] = await Promise.all([this.db.balance(userId), this.db.sumSince(userId, GIFTED, yearAgo)]);
    return Math.max(0, Math.min(balance, bought));
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

  /**
   * The price to pay for a product now: the launch offer or a discount code, whichever takes
   * more off (they never stack). A code that can't be used says why.
   */
  async quote(userId: string, product: Product, rawCode?: string | null): Promise<{ ok: true; quote: Quote } | { ok: false; error: CodeProblem }> {
    const now = this.now();
    const [{ prices }, offer] = await Promise.all([this.settings(), this.launchOffer()]);
    let code: DiscountCode | null = null;
    const typed = rawCode ? normalizeCode(rawCode) : "";
    if (typed) {
      code = CODE_PATTERN.test(typed) ? await this.db.discountByCode(typed) : null;
      const [paidBefore, usedBefore] = await Promise.all([
        code?.firstPaymentOnly ? this.db.hasApprovedPayment(userId) : false,
        code?.perCustomerOnce ? this.db.hasUsedCode(userId, code.code) : false,
      ]);
      const problem = codeProblem(code, product, now, paidBefore, usedBefore);
      if (problem) return { ok: false, error: publicCodeProblem(problem) };
    }
    return { ok: true, quote: quote(product, prices[product], { offer, code, now }) };
  }

  async submitPayment(
    userId: string,
    input: { product: Product; method: PaymentMethod; reference: string; receipt: Buffer | null; code?: string | null },
  ): Promise<{ ok: true; payment: Payment } | { ok: false; error: "duplicate" | CodeProblem }> {
    const reference = canonicalReference(input.reference);
    // The price at the time of payment is recorded on the payment (later price changes don't affect it).
    const q = await this.quote(userId, input.product, input.code);
    if (!q.ok) return q;
    const { finalMinor, originalMinor, discountMinor, source, code } = q.quote;
    const discount = source ? { originalAmountMinor: originalMinor, discountMinor, discountSource: source, discountCode: code } : {};
    const payment = await this.db.createPayment({ userId, product: input.product, method: input.method, receipt: input.receipt, reference, amountMinor: finalMinor, ...discount });
    if (!payment) return { ok: false, error: "duplicate" };
    await this.db.audit({ actorId: userId, action: "payment.submitted", targetType: "payment", targetId: payment.id, data: { product: input.product, method: input.method, ...discount } });
    return { ok: true, payment };
  }

  /**
   * Admin decision. Approving a plan extends it; a top-up adds changes. Each payment applies
   * once. A discount code's use is counted here (not on submit), atomically against its maximum.
   */
  async review(adminId: string, paymentId: string, decision: "approve" | "reject", note: string | null): Promise<"ok" | "not_found" | "already_reviewed" | "discount_unavailable"> {
    const payment = await this.db.payment(paymentId);
    if (!payment) return "not_found";
    const changed = await this.db.review(paymentId, decision === "approve" ? "approved" : "rejected", adminId, note);
    if (!changed) return "already_reviewed";
    if (decision === "approve") {
      const code = payment.discountSource === "code" ? payment.discountCode : null;
      if (code) {
        let usable: boolean;
        try {
          usable = await this.db.useDiscount(code, payment.userId, paymentId, payment.createdAt);
        } catch (error) {
          await this.db.unreview(paymentId);
          throw error;
        }
        // The code ran out (or this isn't the customer's first payment): left pending for the admin to reject.
        if (!usable) {
          await this.db.unreview(paymentId);
          return "discount_unavailable";
        }
      }
      try {
        const product = PRODUCTS[payment.product];
        if (product.plan) {
          await this.db.extendSubscription(payment.userId, product.plan, product.period, this.now());
          // This month's allowance for the plan (same ref as the monthly grant, so it is given once).
          await this.ensureMonthlyGrant(payment.userId);
        } else {
          await this.db.addCredits(payment.userId, (await this.credits()).topupCredits, "topup", paymentId);
        }
      } catch (error) {
        // Nothing half-applied stays "approved": the admin can simply try again.
        if (code) await this.db.releaseDiscountUse(code).catch(() => undefined);
        await this.db.unreview(paymentId);
        throw error;
      }
    }
    await this.db.audit({
      actorId: adminId,
      action: `payment.${decision === "approve" ? "approved" : "rejected"}`,
      targetType: "payment",
      targetId: paymentId,
      data: { userId: payment.userId, product: payment.product, amountMinor: payment.amountMinor, discountCode: payment.discountCode, discountMinor: payment.discountMinor, note },
    });
    if (decision === "approve" && this.onApproved) {
      await this.onApproved(payment, adminId).catch((error: unknown) => reportError("after-approval hook failed", error, { paymentId }));
    }
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
