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
import { DbSignupSourceStore, MemorySignupSourceStore } from "./sources";
import type { Product } from "@/lib/billing/plans";

const STARTER_MONTHLY = 100;

async function pay(billing: Billing, userId: string, ref: string, approve = true, product: Product = "starter_month") {
  const r = await billing.submitPayment(userId, { product, method: "telebirr", reference: ref, receipt: null });
  if (!r.ok) throw new Error(r.error);
  if (approve) expect(await billing.review("admin", r.payment.id, "approve", null)).toBe("ok");
  return r.payment;
}

describe("Referrals (PGlite)", () => {
  let db: Database;
  let billing: Billing;
  let store: ReferralStore;
  let referrals: Referrals;
  let sources: DbSignupSourceStore;
  const person = (id: string, email: string | null, phone: string | null = null) => ({ id, email, phone });

  beforeEach(async () => {
    db = await testDb();
    billing = new Billing(new DbBillingStore(db));
    await billing.saveCreditSettings("admin", { ...(await billing.credits()), monthly: { ...(await billing.credits()).monthly, starter: STARTER_MONTHLY } });
    store = new DbReferralStore(db);
    sources = new DbSignupSourceStore(db);
    referrals = new Referrals(store, billing, sources);
    billing.onApproved = (p, a) => referrals.onPaymentApproved(p, a);
    await makeUser(db, "inviter");
  });

  async function invite(id: string, email: string, code?: string, hashes: { ipHash: string | null; deviceHash: string | null } | null = null) {
    await makeUser(db, id);
    await db.update(user).set({ email }).where(eq(user.id, id));
    const a = { r: `u_${code ?? (await store.codeFor("inviter"))}`, t: 0 };
    if (hashes) await sources.record(id, a, hashes);
    await referrals.onSignup(person(id, email), a, hashes);
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

  it("only real plan payments count: never a top-up or a zero amount", async () => {
    await invite("free", "free@example.org");
    await referrals.onPaymentApproved({ id: "00000000-0000-0000-0000-000000000000", userId: "free", amountMinor: 0, product: "starter_month" }, "admin");
    await pay(billing, "free", "TOPUP1", true, "topup");
    expect((await store.get("free"))?.status).toBe("pending");
    expect(await billing.boughtLeft("inviter")).toBe(0);
    await pay(billing, "free", "BIZ1", true, "business_year");
    expect((await store.get("free"))?.status).toBe("rewarded");
  });

  it("blocks an invite from the same device; the same network alone is shown to the admin", async () => {
    await sources.record("inviter", null, { ipHash: "net1", deviceHash: "dev1" });
    await invite("twin", "twin@example.org", undefined, { ipHash: "net1", deviceHash: "dev1" });
    expect(await store.get("twin")).toMatchObject({ status: "blocked", blockReason: "same_device" });
    await invite("cafe", "cafe@example.net", undefined, { ipHash: "net1", deviceHash: "dev2" });
    expect((await store.get("cafe"))?.status).toBe("pending");
    const notes = await referrals.notes(["cafe", "twin", "nobody"]);
    expect(notes.get("cafe")).toMatchObject({ referrerId: "inviter", contact: "inviter@example.com", sameNetwork: true, status: "pending" });
    expect(notes.get("twin")).toMatchObject({ status: "blocked", blockReason: "same_device" });
    expect(notes.has("nobody")).toBe(false);
  });

  it("parallel approvals can't pass the monthly cap, and each reward is one transaction", async () => {
    const n = REFERRAL_MONTHLY_CAP + 3;
    for (let i = 0; i < n; i++) await invite(`p${i}`, `p${i}@example${i}.org`);
    const now = new Date();
    const results = await Promise.all(Array.from({ length: n }, (_, i) => store.claim(`p${i}`, "00000000-0000-0000-0000-00000000000" + (i % 10), 10, REFERRAL_MONTHLY_CAP, now.toISOString().slice(0, 7), now)));
    expect(results.filter((r) => r && r.referrerCredits > 0)).toHaveLength(REFERRAL_MONTHLY_CAP);
    expect(results.every((r) => r?.referredCredits === 10)).toBe(true);
    // Balances moved with the ledger, in the same statements.
    expect(await new DbBillingStore(db).balance("inviter")).toBe(REFERRAL_MONTHLY_CAP * 10);
    expect(await new DbBillingStore(db).balance("p0")).toBe(10);
    // Claimed once: a second claim does nothing.
    expect(await store.claim("p0", "00000000-0000-0000-0000-000000000000", 10, REFERRAL_MONTHLY_CAP, now.toISOString().slice(0, 7), now)).toBeNull();
    expect(await new DbBillingStore(db).balance("p0")).toBe(10);
  });
});

describe("MemoryReferralStore", () => {
  it("follows the same rules", async () => {
    const people: Record<string, { id: string; name: string; email: string }> = { a: { id: "a", name: "A", email: "a@one.org" }, b: { id: "b", name: "B", email: "b@two.org" } };
    const billing = new Billing(new MemoryBillingStore());
    const store = new MemoryReferralStore((id) => people[id] ?? null, (u, n, ref) => billing.store().addCredits(u, n, "referral", ref));
    const r = new Referrals(store, billing, new MemorySignupSourceStore());
    billing.onApproved = (p, admin) => r.onPaymentApproved(p, admin);
    await r.onSignup({ id: "b", email: "b@two.org", phone: null }, { r: `u_${await store.codeFor("a")}`, t: 0 });
    await pay(billing, "b", "M1");
    const credits = (await billing.credits()).monthly.starter;
    expect(await billing.boughtLeft("a")).toBe(credits);
    expect((await store.recent(5))[0]).toMatchObject({ referrer: { name: "A" }, referred: { name: "B" }, status: "rewarded" });
  });
});
