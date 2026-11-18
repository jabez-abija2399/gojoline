import type { Billing } from "@/lib/billing/service";
import type { Payment } from "@/lib/billing/store";
import { PRODUCTS } from "@/lib/billing/plans";
import { referralCodeOf, type Attribution } from "./attribution";
import { deviceMatch, monthKey, REFERRAL_MONTHLY_CAP, selfReferral, type Person } from "./referral-rules";
import type { ReferralStore } from "./referral-store";
import type { SignupHashes, SignupSourceStore } from "./sources";

/** What the admin sees beside a payment from an invited owner. */
export interface InviteNote {
  referrerId: string;
  name: string;
  contact: string;
  status: "pending" | "rewarded" | "blocked";
  blockReason: string | null;
  /** Both accounts were made from the same network (not enough on its own to block). */
  sameNetwork: boolean;
}

/**
 * Invite a business (2026-11-18). A new account that arrived through /?ref=u_<code> is linked to
 * its inviter at sign-up (or blocked when it looks like the inviter themselves). When an admin
 * approves the invited owner's first plan payment (never a top-up), both get one month of
 * Starter's AI changes: once per invited owner, at most REFERRAL_MONTHLY_CAP inviter rewards a
 * month, in one transaction, audited.
 */
export class Referrals {
  constructor(
    readonly store: ReferralStore,
    private billing: Billing,
    private sources: Pick<SignupSourceStore, "hashes">,
    private now: () => Date = () => new Date(),
  ) {}

  async onSignup(user: Person, a: Attribution | null, hashes: SignupHashes | null = null): Promise<void> {
    const code = referralCodeOf(a);
    if (!code) return;
    const referrerId = await this.store.ownerOfCode(code);
    if (!referrerId) return;
    const referrer = await this.store.person(referrerId);
    if (!referrer) return;
    const device = deviceMatch(await this.sources.hashes(referrerId), hashes);
    const blocked = selfReferral(referrer, user) ?? (device === "same_device" ? "same_device" : null);
    const linked = await this.store.link({ referredId: user.id, referrerId, code, status: blocked ? "blocked" : "pending", blockReason: blocked });
    if (!linked) return;
    await this.billing.store().audit({ actorId: user.id, action: blocked ? "referral.blocked" : "referral.linked", targetType: "user", targetId: user.id, data: { referrerId, ...(blocked ? { reason: blocked } : {}), ...(device === "same_network" ? { sameNetwork: true } : {}) } });
  }

  /** After an admin approved a payment: thanks both owners on the invited owner's first plan payment. */
  async onPaymentApproved(payment: Pick<Payment, "id" | "userId" | "amountMinor" | "product">, adminId: string): Promise<void> {
    // Plans only (Starter or Business, monthly or yearly): a cheap top-up can't buy a reward.
    if (payment.amountMinor <= 0 || !PRODUCTS[payment.product]?.plan) return;
    const r = await this.store.get(payment.userId);
    if (!r || r.status !== "pending") return;
    const credits = (await this.billing.credits()).monthly.starter;
    const now = this.now();
    const claimed = await this.store.claim(payment.userId, payment.id, credits, REFERRAL_MONTHLY_CAP, monthKey(now), now);
    if (!claimed) return;
    await this.billing.store().audit({
      actorId: adminId,
      action: "referral.rewarded",
      targetType: "user",
      targetId: payment.userId,
      data: { referrerId: claimed.referrerId, paymentId: payment.id, referrerCredits: claimed.referrerCredits, referredCredits: claimed.referredCredits, capped: claimed.referrerCredits === 0 },
    });
  }

  /** Who invited the owners behind these payments, for the admin's review. */
  async notes(userIds: string[]): Promise<Map<string, InviteNote>> {
    const inviters = await this.store.inviters([...new Set(userIds)]);
    const out = new Map<string, InviteNote>();
    await Promise.all(
      [...inviters].map(async ([userId, i]) => {
        const [a, b] = await Promise.all([this.sources.hashes(i.referrerId), this.sources.hashes(userId)]);
        out.set(userId, { ...i, sameNetwork: deviceMatch(a, b) !== null });
      }),
    );
    return out;
  }
}
