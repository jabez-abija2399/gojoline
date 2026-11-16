import { describe, expect, it } from "vitest";
import { makeUser, testDb } from "@/test/db";
import { codeProblem, discounted, discountInputSchema, offerApplies, offerEndsAt, quote, type DiscountCode, type LaunchOffer } from "./discounts";
import { Billing } from "./service";
import { MemorySettingsStore } from "./settings";
import { DbBillingStore, MemoryBillingStore, type BillingStore } from "./store";

const now = new Date("2026-11-20T10:00:00Z");
const code = (over: Partial<DiscountCode> = {}): DiscountCode => ({
  id: "c1",
  code: "LAUNCH20",
  percentOff: 20,
  amountOffMinor: null,
  products: ["starter_month", "topup"],
  maxUses: null,
  uses: 0,
  expiresAt: null,
  firstPaymentOnly: false,
  active: true,
  createdAt: now,
  ...over,
});
const offer: LaunchOffer = { active: true, percent: 10, products: ["starter_month", "business_month"], until: "2026-12-31" };

describe("discount maths", () => {
  it("rounds the price down to whole Birr and never below 1 Birr", () => {
    // 499 Birr less 20% = 399.20 → 399.
    expect(discounted(49_900, 9_980)).toEqual({ finalMinor: 39_900, discountMinor: 10_000 });
    expect(discounted(49_950, 0)).toEqual({ finalMinor: 49_950, discountMinor: 0 });
    expect(discounted(24_900, 1_000_000)).toEqual({ finalMinor: 100, discountMinor: 24_800 });
    expect(quote("starter_month", 49_900, { offer: null, code: code(), now })).toMatchObject({ finalMinor: 39_900, discountMinor: 10_000, source: "code", code: "LAUNCH20" });
    expect(quote("topup", 24_900, { offer: null, code: code({ percentOff: null, amountOffMinor: 5_000 }), now })).toMatchObject({ finalMinor: 19_900, discountMinor: 5_000 });
  });

  it("never stacks the launch offer and a code: the better one applies", () => {
    expect(quote("starter_month", 49_900, { offer, code: code(), now })).toMatchObject({ source: "code", finalMinor: 39_900 });
    expect(quote("starter_month", 49_900, { offer: { ...offer, percent: 30 }, code: code(), now })).toMatchObject({ source: "offer", finalMinor: 34_900, code: null });
    // The offer only for its products, and only until the end of its last day (Addis Ababa time).
    expect(quote("starter_year", 499_000, { offer, code: null, now }).source).toBeNull();
    expect(offerEndsAt(offer).toISOString()).toBe("2026-12-31T20:59:59.999Z");
    expect(offerApplies(offer, "starter_month", new Date("2026-12-31T20:59:00Z"))).toBe(true);
    expect(offerApplies(offer, "starter_month", new Date("2026-12-31T21:00:00Z"))).toBe(false);
    expect(offerApplies({ ...offer, active: false }, "starter_month", now)).toBe(false);
  });

  it("says why a code can't be used", () => {
    expect(codeProblem(null, "topup", now, false)).toBe("not_found");
    expect(codeProblem(code({ active: false }), "topup", now, false)).toBe("inactive");
    expect(codeProblem(code({ expiresAt: new Date("2026-11-19T00:00:00Z") }), "topup", now, false)).toBe("expired");
    expect(codeProblem(code(), "business_year", now, false)).toBe("product");
    expect(codeProblem(code({ maxUses: 2, uses: 2 }), "topup", now, false)).toBe("used_up");
    expect(codeProblem(code({ firstPaymentOnly: true }), "topup", now, true)).toBe("first_only");
    expect(codeProblem(code({ firstPaymentOnly: true }), "topup", now, false)).toBeNull();
  });

  it("validates admin input", () => {
    const base = { code: " launch20 ", kind: "percent", percentOff: 20, amountOffMinor: null, products: ["topup"], maxUses: null, expiresAt: null, firstPaymentOnly: false };
    expect(discountInputSchema.parse(base).code).toBe("LAUNCH20");
    for (const bad of [{ code: "AB" }, { code: "BAD-CODE" }, { percentOff: 95 }, { percentOff: 0 }, { kind: "amount" }, { kind: "amount", percentOff: null, amountOffMinor: 1_050 }, { products: [] }, { products: ["topup", "topup"] }, { maxUses: 0 }]) {
      expect(discountInputSchema.safeParse({ ...base, ...bad }).success, JSON.stringify(bad)).toBe(false);
    }
    expect(discountInputSchema.safeParse({ ...base, kind: "amount", percentOff: null, amountOffMinor: 5_000 }).success).toBe(true);
  });
});

async function codesFlow(store: BillingStore, users: [string, string]) {
  const settings = new MemorySettingsStore();
  const b = new Billing(store, () => now, settings);
  const [alice, bob] = users;
  const input = { code: "FIRST50", kind: "percent" as const, percentOff: 50, amountOffMinor: null, products: ["starter_month" as const], maxUses: 1, expiresAt: null, firstPaymentOnly: true };
  expect(await b.createDiscount("admin", input)).toMatchObject({ code: "FIRST50", uses: 0, active: true });
  expect(await b.createDiscount("admin", input)).toBeNull();

  // Case-insensitive; the price is computed on the server and stored with the payment.
  const q = await b.quote(alice, "starter_month", " first50 ");
  expect(q.ok && q.quote).toMatchObject({ originalMinor: 49_900, finalMinor: 24_900, discountMinor: 25_000, source: "code" });
  expect(await b.quote(alice, "topup", "FIRST50")).toEqual({ ok: false, error: "product" });
  expect(await b.quote(alice, "starter_month", "NOPE")).toEqual({ ok: false, error: "not_found" });

  const a = await b.submitPayment(alice, { product: "starter_month", method: "telebirr", reference: "AAA11111", receipt: null, code: "first50" });
  const c = await b.submitPayment(bob, { product: "starter_month", method: "telebirr", reference: "BBB22222", receipt: null, code: "FIRST50" });
  if (!a.ok || !c.ok) throw new Error("submit failed");
  expect(a.payment).toMatchObject({ amountMinor: 24_900, originalAmountMinor: 49_900, discountMinor: 25_000, discountSource: "code", discountCode: "FIRST50" });
  // Not counted on submit.
  expect((await store.discountByCode("FIRST50"))?.uses).toBe(0);

  // Two approvals at once: the single use goes to one of them; the other stays pending.
  const results = await Promise.all([b.review("admin", a.payment.id, "approve", null), b.review("admin", c.payment.id, "approve", null)]);
  expect([...results].sort()).toEqual(["discount_unavailable", "ok"]);
  expect((await store.discountByCode("FIRST50"))?.uses).toBe(1);
  const pending = results[0] === "ok" ? c : a;
  expect((await store.payment(pending.payment.id))?.status).toBe("pending");
  // Rejecting it uses nothing.
  expect(await b.review("admin", pending.payment.id, "reject", "code used up")).toBe("ok");
  expect((await store.discountByCode("FIRST50"))?.uses).toBe(1);
  expect((await store.auditFor("payment", a.payment.id))[0]?.data).toMatchObject({ discountCode: "FIRST50" });
}

describe("discount codes on payments", () => {
  it("memory store", async () => {
    await codesFlow(new MemoryBillingStore(), ["alice", "bob"]);
  });

  it("Postgres: max uses can't be passed by concurrent approvals", async () => {
    const db = await testDb();
    await makeUser(db, "alice");
    await makeUser(db, "bob");
    await codesFlow(new DbBillingStore(db), ["alice", "bob"]);
  }, 30_000);

  it("Postgres: a first-payment code only for customers with no approved payment; switched off codes stay listed", async () => {
    const db = await testDb();
    await makeUser(db, "carol");
    const store = new DbBillingStore(db);
    const b = new Billing(store, () => now, new MemorySettingsStore());
    const made = await b.createDiscount("admin", { code: "WELCOME", kind: "amount", percentOff: null, amountOffMinor: 10_000, products: ["topup", "starter_month"], maxUses: null, expiresAt: null, firstPaymentOnly: true });
    const first = await b.submitPayment("carol", { product: "topup", method: "cbe", reference: "FT100001", receipt: null });
    if (!first.ok) throw new Error("submit failed");
    await b.review("admin", first.payment.id, "approve", null);
    expect(await b.quote("carol", "starter_month", "welcome")).toEqual({ ok: false, error: "first_only" });
    await b.setDiscountActive("admin", made!.id, false);
    expect(await b.quote("carol", "starter_month", "welcome")).toEqual({ ok: false, error: "inactive" });
    expect((await store.discounts()).map((d) => [d.code, d.active])).toEqual([["WELCOME", false]]);
    expect((await store.auditFor("discount", made!.id)).map((x) => x.action)).toEqual(["discount.created", "discount.deactivated"]);
  }, 30_000);

  it("applies the launch offer without a code, and the better of offer and code", async () => {
    const settings = new MemorySettingsStore();
    const store = new MemoryBillingStore();
    const b = new Billing(store, () => now, settings);
    await b.saveLaunchOffer("admin", offer);
    const p = await b.submitPayment("u", { product: "business_month", method: "cbe", reference: "OFFER111", receipt: null });
    // 1,299 less 10% = 1,169.10 → 1,169.
    expect(p.ok && p.payment).toMatchObject({ amountMinor: 116_900, originalAmountMinor: 129_900, discountSource: "offer", discountCode: null });
    expect((await store.auditFor("settings", "offer"))[0]?.action).toBe("settings.offer");
  });
});
