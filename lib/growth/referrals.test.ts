import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/lib/db/client";
import { Billing } from "@/lib/billing/service";
import { DbBillingStore, MemoryBillingStore } from "@/lib/billing/store";
import { makeUser, testDb } from "@/test/db";
import { DbReferralStore, MemoryReferralStore, type ReferralStore } from "./referral-store";
import { Referrals } from "./referrals";
import { REFERRAL_MONTHLY_CAP } from "./referral-rules";
import { auditLog, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const STARTER_MONTHLY = 100;

async function pay(billing: Billing, userId: string, ref: string, approve = true) {
  const r = await billing.submitPayment(userId, { product: "starter_month", method: "telebirr", reference: ref, receipt: null });
  if (!r.ok) throw new Error(r.error);
  if (approve) expect(await billing.review("admin", r.payment.id, "approve", null)).toBe("ok");
  return r.payment;
}

describe("Referrals (PGlite)", () => {
  let db: Database;
  let billing: Billing;
  let store: ReferralStore;
  let referrals: Referrals;
  const person = (id: string, email: string | null, phone: string | null = null) => ({ id, email, phone });

  beforeEach(async () => {
    db = await testDb();
    billing = new Billing(new DbBillingStore(db));
    await billing.saveCreditSettings("admin", { ...(await billing.credits()), monthly: { ...(await billing.credits()).monthly, starter: STARTER_MONTHLY } });
    store = new DbReferralStore(db);
    referrals = new Referrals(store, billing);
    billing.onApproved = (p, a) => referrals.onPaymentApproved(p, a);
    await makeUser(db, "inviter");
  });

  async function invite(id: string, email: string, code?: string) {
    await makeUser(db, id);
    await db.update(user).set({ email }).where(eq(user.id, id));
    await referrals.onSignup(person(id, email), { r: `u_${code ?? (await store.codeFor("inviter"))}`, t: 0 });
  }

  it("rewards both owners once, after the invited owner's first approved payment", async () => {
    const code = await store.codeFor("inviter");
    expect(await store.codeFor("inviter")).toBe(code);
    expect(await store.ownerOfCode(code)).toBe("inviter");
    await invite("sara", "sara@example.org", code);
    expect((await store.get("sara"))?.status).toBe("pending");

    // A rejected or pending payment gives nothing.
    const rejected = await pay(billing, "sara", "REJ1", false);
    await billing.review("admin", rejected.id, "reject", null);
    expect(await billing.boughtLeft("inviter")).toBe(0);

    const before = { inviter: await billing.creditsLeft("inviter"), sara: await billing.creditsLeft("sara") };
    const p = await pay(billing, "sara", "PAY1");
    expect(await billing.creditsLeft("inviter")).toBe(before.inviter + STARTER_MONTHLY);
    expect((await store.get("sara"))).toMatchObject({ status: "rewarded", paymentId: p.id, referrerCredits: STARTER_MONTHLY, referredCredits: STARTER_MONTHLY });
    // Sara's plan grant plus the invite's thank-you.
    expect(await billing.boughtLeft("sara")).toBe(STARTER_MONTHLY);
    expect(before.sara).toBeGreaterThanOrEqual(0);

    // A second payment rewards nothing more.
    await pay(billing, "sara", "PAY2");
    expect(await billing.boughtLeft("inviter")).toBe(STARTER_MONTHLY);
    expect(await store.summary("inviter")).toEqual({ invited: 1, rewarded: 1, credits: STARTER_MONTHLY });

    const actions = (await db.select({ action: auditLog.action }).from(auditLog)).map((a) => a.action);
    expect(actions.filter((a) => a === "referral.rewarded")).toHaveLength(1);
    expect(actions).toContain("referral.linked");
    const list = await store.recent(10);
    expect(list[0]).toMatchObject({ referredId: "sara", referrer: { contact: "inviter@example.com" }, referred: { contact: "sara@example.org" } });
  });

  it("blocks self-referrals and never rewards them; one inviter per owner", async () => {
    await db.update(user).set({ email: "owner@selamcoffee.et" }).where(eq(user.id, "inviter"));
    await invite("cashier", "cashier@selamcoffee.et");
    expect(await store.get("cashier")).toMatchObject({ status: "blocked", blockReason: "same_domain" });
    await pay(billing, "cashier", "SELF1");
    expect(await billing.boughtLeft("inviter")).toBe(0);
    expect(await billing.boughtLeft("cashier")).toBe(0);
    // The inviter's own link on their own account.
    await referrals.onSignup(person("inviter", "owner@selamcoffee.et"), { r: `u_${await store.codeFor("inviter")}`, t: 0 });
    expect(await store.get("inviter")).toMatchObject({ status: "blocked", blockReason: "same_user" });
    // Unknown codes and other refs link nothing.
    await makeUser(db, "x");
    await referrals.onSignup(person("x", "x@example.net"), { r: "u_zzzzzzzz", t: 0 });
    await referrals.onSignup(person("x", "x@example.net"), { r: "site_bole", t: 0 });
    expect(await store.get("x")).toBeNull();
  });

  it(`caps the inviter at ${REFERRAL_MONTHLY_CAP} rewards a month; the invited owner is still thanked`, async () => {
    for (let i = 0; i <= REFERRAL_MONTHLY_CAP; i++) {
      await invite(`friend${i}`, `friend${i}@example${i}.org`);
      await pay(billing, `friend${i}`, `CAP${i}`);
    }
    expect(await billing.boughtLeft("inviter")).toBe(REFERRAL_MONTHLY_CAP * STARTER_MONTHLY);
    expect(await store.get(`friend${REFERRAL_MONTHLY_CAP}`)).toMatchObject({ status: "rewarded", referrerCredits: 0, referredCredits: STARTER_MONTHLY });
    expect(await billing.boughtLeft(`friend${REFERRAL_MONTHLY_CAP}`)).toBe(STARTER_MONTHLY);
  });

  it("only real payments count", async () => {
    await invite("free", "free@example.org");
    await referrals.onPaymentApproved({ id: "00000000-0000-0000-0000-000000000000", userId: "free", amountMinor: 0 }, "admin");
    expect((await store.get("free"))?.status).toBe("pending");
  });
});

describe("MemoryReferralStore", () => {
  it("follows the same rules", async () => {
    const people: Record<string, { id: string; name: string; email: string }> = { a: { id: "a", name: "A", email: "a@one.org" }, b: { id: "b", name: "B", email: "b@two.org" } };
    const store = new MemoryReferralStore((id) => people[id] ?? null);
    const billing = new Billing(new MemoryBillingStore());
    const r = new Referrals(store, billing);
    billing.onApproved = (p, admin) => r.onPaymentApproved(p, admin);
    await r.onSignup({ id: "b", email: "b@two.org", phone: null }, { r: `u_${await store.codeFor("a")}`, t: 0 });
    await pay(billing, "b", "M1");
    const credits = (await billing.credits()).monthly.starter;
    expect(await billing.boughtLeft("a")).toBe(credits);
    expect((await store.recent(5))[0]).toMatchObject({ referrer: { name: "A" }, referred: { name: "B" }, status: "rewarded" });
  });
});
