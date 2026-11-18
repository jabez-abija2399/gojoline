import type { Billing } from "@/lib/billing/service";
import type { Payment } from "@/lib/billing/store";
import { referralCodeOf, type Attribution } from "./attribution";
import { monthStart, REFERRAL_MONTHLY_CAP, selfReferral, type Person } from "./referral-rules";
import type { ReferralStore } from "./referral-store";

/**
 * Invite a business (2026-11-18). A new account that arrived through /?ref=u_<code> is linked to
 * its inviter at sign-up (or blocked when it looks like the inviter themselves). When an admin
 * approves the invited owner's first real payment, both get one month of Starter's AI changes:
 * once per invited owner, at most REFERRAL_MONTHLY_CAP rewards per inviter a month, audited.
 */
export class Referrals {
  constructor(
    readonly store: ReferralStore,
    private billing: Billing,
    private now: () => Date = () => new Date(),
  ) {}

  async onSignup(user: Person, a: Attribution | null): Promise<void> {
    const code = referralCodeOf(a);
    if (!code) return;
    const referrerId = await this.store.ownerOfCode(code);
    if (!referrerId) return;
    const referrer = await this.store.person(referrerId);
    if (!referrer) return;
    const blocked = selfReferral(referrer, user);
    const linked = await this.store.link({ referredId: user.id, referrerId, code, status: blocked ? "blocked" : "pending", blockReason: blocked });
    if (!linked) return;
    await this.billing.store().audit({ actorId: user.id, action: blocked ? "referral.blocked" : "referral.linked", targetType: "user", targetId: user.id, data: { referrerId, ...(blocked ? { reason: blocked } : {}) } });
  }

  /** After an admin approved a payment: rewards the invite on the invited owner's first real payment. */
  async onPaymentApproved(payment: Pick<Payment, "id" | "userId" | "amountMinor">, adminId: string): Promise<void> {
    if (payment.amountMinor <= 0) return;
    const r = await this.store.get(payment.userId);
    if (!r || r.status !== "pending") return;
    const credits = (await this.billing.credits()).monthly.starter;
    const now = this.now();
    const claimed = await this.store.claim(payment.userId, payment.id, credits, REFERRAL_MONTHLY_CAP, monthStart(now), now);
    if (!claimed) return;
    // Idempotent per (owner, reason, ref): a retry never pays twice.
    const ref = `referral:${payment.userId}`;
    const db = this.billing.store();
    await db.addCredits(payment.userId, claimed.referredCredits, "referral", ref);
    if (claimed.referrerCredits > 0) await db.addCredits(claimed.referrerId, claimed.referrerCredits, "referral", ref);
    await db.audit({
      actorId: adminId,
      action: "referral.rewarded",
      targetType: "user",
      targetId: payment.userId,
      data: { referrerId: claimed.referrerId, paymentId: payment.id, referrerCredits: claimed.referrerCredits, referredCredits: claimed.referredCredits, capped: claimed.referrerCredits === 0 },
    });
  }
}
