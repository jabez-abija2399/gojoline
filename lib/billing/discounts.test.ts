import { describe, expect, it } from "vitest";
import { makeUser, testDb } from "@/test/db";
import { codeProblem, discounted, discountInputSchema, launchOfferSchema, offerApplies, offerEndsAt, offerUntilLabel, quote, type DiscountCode, type LaunchOffer } from "./discounts";
import { offerBadgeText, offerName, offerProductsText } from "./offer-text";
import { getMessages } from "@/lib/i18n";
import { Billing } from "./service";
import { DbSettingsStore, MemorySettingsStore, type SettingsStore } from "./settings";
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
  perCustomerOnce: false,
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
    expect(offerEndsAt(offer)!.toISOString()).toBe("2026-12-31T20:59:59.999Z");
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
    const base = { code: " launch20 ", kind: "percent", percentOff: 20, amountOffMinor: null, products: ["topup"], maxUses: null, expiresAt: null, firstPaymentOnly: false, perCustomerOnce: true };
    expect(discountInputSchema.parse(base).code).toBe("LAUNCH20");
    for (const bad of [{ code: "AB" }, { code: "ABCDE" }, { code: "BAD-CODE" }, { percentOff: 95 }, { percentOff: 0 }, { kind: "amount" }, { kind: "amount", percentOff: null, amountOffMinor: 1_050 }, { products: [] }, { products: ["topup", "topup"] }, { maxUses: 0 }]) {
      expect(discountInputSchema.safeParse({ ...base, ...bad }).success, JSON.stringify(bad)).toBe(false);
    }
    expect(discountInputSchema.safeParse({ ...base, kind: "amount", percentOff: null, amountOffMinor: 5_000 }).success).toBe(true);
  });
});

async function codesFlow(store: BillingStore, users: [string, string]) {
  const settings = new MemorySettingsStore();
  const b = new Billing(store, () => now, settings);
  const [alice, bob] = users;
  const input = { code: "FIRST50", kind: "percent" as const, percentOff: 50, amountOffMinor: null, products: ["starter_month" as const], maxUses: 1, expiresAt: null, firstPaymentOnly: true, perCustomerOnce: true };
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
    const made = await b.createDiscount("admin", { code: "WELCOME", kind: "amount", percentOff: null, amountOffMinor: 10_000, products: ["topup", "starter_month"], maxUses: null, expiresAt: null, firstPaymentOnly: true, perCustomerOnce: true });
    const first = await b.submitPayment("carol", { product: "topup", method: "cbe", reference: "FT100001", receipt: null });
    if (!first.ok) throw new Error("submit failed");
    await b.review("admin", first.payment.id, "approve", null);
    expect(await b.quote("carol", "starter_month", "welcome")).toEqual({ ok: false, error: "first_only" });
    await b.setDiscountActive("admin", made!.id, false);
    // Switched-off codes read like unknown ones to customers (no guessing which codes exist).
    expect(await b.quote("carol", "starter_month", "welcome")).toEqual({ ok: false, error: "not_found" });
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

describe("code rules at approval", () => {
  async function setup() {
    const db = await testDb();
    await makeUser(db, "dan");
    await makeUser(db, "eve");
    const store = new DbBillingStore(db);
    let clock = now;
    const b = new Billing(store, () => clock, new MemorySettingsStore());
    const make = (over: Partial<Parameters<Billing["createDiscount"]>[1]> = {}) =>
      b.createDiscount("admin", { code: "SAVE10X", kind: "percent", percentOff: 10, amountOffMinor: null, products: ["topup"], maxUses: null, expiresAt: null, firstPaymentOnly: false, perCustomerOnce: true, ...over });
    const pay = async (user: string, ref: string, code = "SAVE10X") => {
      const r = await b.submitPayment(user, { product: "topup", method: "cbe", reference: ref, receipt: null, code });
      if (!r.ok) throw new Error(r.error);
      return r.payment;
    };
    return { b, store, make, pay, setClock: (d: Date) => (clock = d) };
  }

  it("a code switched off after sending keeps the payment pending, uses nothing", async () => {
    const { b, store, make, pay } = await setup();
    const code = await make();
    const p = await pay("dan", "OFF00001");
    await b.setDiscountActive("admin", code!.id, false);
    expect(await b.review("admin", p.id, "approve", null)).toBe("discount_unavailable");
    expect((await store.payment(p.id))?.status).toBe("pending");
    expect((await store.discountByCode("SAVE10X"))?.uses).toBe(0);
  }, 30_000);

  it("a code that ended before the payment was sent isn't counted; one that ends after still is", async () => {
    const { b, make, pay, setClock } = await setup();
    await make({ expiresAt: new Date("2026-11-21T00:00:00Z") });
    const p = await pay("dan", "END00001");
    setClock(new Date("2026-11-25T00:00:00Z"));
    expect(await b.review("admin", p.id, "approve", null)).toBe("ok");
    expect(await b.quote("eve", "topup", "SAVE10X")).toEqual({ ok: false, error: "not_found" });
  }, 30_000);

  it("once per customer: checked when quoting and again atomically when approving", async () => {
    const { b, store, make, pay } = await setup();
    await make();
    const first = await pay("dan", "ONE00001");
    const second = await pay("dan", "ONE00002");
    expect(await b.review("admin", first.id, "approve", null)).toBe("ok");
    expect(await b.review("admin", second.id, "approve", null)).toBe("discount_unavailable");
    expect(await b.quote("dan", "topup", "save10x")).toEqual({ ok: false, error: "already_used" });
    // Another customer can still use it; a code made for repeat use works again.
    expect((await b.quote("eve", "topup", "SAVE10X")).ok).toBe(true);
    await make({ code: "AGAIN10", perCustomerOnce: false });
    expect(await b.review("admin", (await pay("dan", "AGN00001", "AGAIN10")).id, "approve", null)).toBe("ok");
    expect(await b.review("admin", (await pay("dan", "AGN00002", "AGAIN10")).id, "approve", null)).toBe("ok");
    expect((await store.discountByCode("AGAIN10"))?.uses).toBe(2);
  }, 30_000);

  it("switches the offer on and off in one step, keeping its terms; nothing to switch before one is saved", async () => {
    const settings = new MemorySettingsStore();
    const store = new MemoryBillingStore();
    const b = new Billing(store, () => now, settings);
    expect(await b.setLaunchOfferActive("admin", true)).toBe("none");
    const open: LaunchOffer = { active: false, percent: 20, products: ["business_month"], name: { en: "Holiday offer", am: "የበዓል ቅናሽ" } };
    await b.saveLaunchOffer("admin", open);
    expect(await b.quote("u", "business_month", "")).toMatchObject({ ok: true, quote: { source: null } });
    expect(await b.setLaunchOfferActive("admin", true)).toBe("ok");
    expect(await b.launchOffer()).toEqual({ ...open, active: true });
    expect(await b.quote("u", "business_month", "")).toMatchObject({ ok: true, quote: { source: "offer", finalMinor: 103_900 } });
    await b.setLaunchOfferActive("admin", false);
    expect((await b.launchOffer())?.active).toBe(false);
    const audit = await store.auditFor("settings", "offer");
    expect(audit.map((a) => a.action).filter((a) => a === "settings.offer_switch")).toHaveLength(2);
  });
});

describe("launch offer without a last day, and its name", () => {
  const open: LaunchOffer = { active: true, percent: 20, products: ["starter_month", "starter_year", "business_month", "business_year", "topup"] };
  const en = getMessages("en").billing;
  const am = getMessages("am").billing;

  it("runs until switched off when it has no last day", () => {
    expect(offerEndsAt(open)).toBeNull();
    expect(offerUntilLabel(open, "en")).toBeNull();
    expect(offerApplies(open, "topup", new Date("2040-01-01T00:00:00Z"))).toBe(true);
    expect(offerApplies({ ...open, active: false }, "topup", now)).toBe(false);
    // Still never stacks with a code: the better one wins.
    expect(quote("starter_month", 49_900, { offer: open, code: code({ percentOff: 30 }), now })).toMatchObject({ source: "code" });
  });

  it("accepts older saved offers with a last day, and checks the name and percent", () => {
    expect(launchOfferSchema.safeParse({ active: true, percent: 10, products: ["topup"], until: "2026-12-31" }).success).toBe(true);
    expect(launchOfferSchema.safeParse({ active: true, percent: 10, products: ["topup"] }).success).toBe(true);
    expect(launchOfferSchema.safeParse({ active: true, percent: 91, products: ["topup"] }).success).toBe(false);
    expect(launchOfferSchema.safeParse({ active: true, percent: 0, products: ["topup"] }).success).toBe(false);
    expect(launchOfferSchema.safeParse({ active: true, percent: 10, products: [] }).success).toBe(false);
    expect(launchOfferSchema.safeParse({ active: true, percent: 10, products: ["topup"], until: "31/12/2026" }).success).toBe(false);
    // A name needs both languages, one short line, no markup.
    expect(launchOfferSchema.safeParse({ ...open, name: { en: "Holiday offer", am: "የበዓል ቅናሽ" } }).success).toBe(true);
    expect(launchOfferSchema.safeParse({ ...open, name: { en: "Holiday offer" } }).success).toBe(false);
    expect(launchOfferSchema.safeParse({ ...open, name: { en: "<b>x</b>", am: "x" } }).success).toBe(false);
    expect(launchOfferSchema.safeParse({ ...open, name: { en: "x".repeat(41), am: "x" } }).success).toBe(false);
  });

  it("says no date without a last day, and uses the offer's own name when it has one", () => {
    expect(offerBadgeText(open, "en", en)).toBe("Launch offer: 20% off");
    expect(offerBadgeText({ ...open, until: "2026-12-31" }, "en", en)).toBe("Launch offer: 20% off until 31 Dec");
    expect(offerBadgeText(open, "am", am)).toBe("የመክፈቻ ቅናሽ፦ የ20% ቅናሽ");
    const named = { ...open, name: { en: "Holiday offer", am: "የበዓል ቅናሽ" } };
    expect(offerBadgeText(named, "en", en)).toBe("Holiday offer: 20% off");
    expect(offerBadgeText(named, "am", am)).toBe("የበዓል ቅናሽ፦ የ20% ቅናሽ");
    expect(offerName(open, "en", en.offerName)).toBe("Launch offer");
  });

  it("names the products short: whole plans by plan name", () => {
    expect(offerProductsText(["starter_month", "starter_year", "business_month", "business_year"], "en", en, 30)).toBe("Starter and Business");
    expect(offerProductsText(["starter_month", "business_month", "business_year", "topup"], "en", en, 30)).toBe("Starter, 1 month, Business, and 30 extra changes");
  });
});

describe("saving the offer's terms never touches its on/off state", () => {
  const check = async (settings: SettingsStore) => {
    const b = new Billing(new MemoryBillingStore(), () => now, settings);
    // A new offer starts off.
    await b.saveLaunchOfferTerms("admin", { percent: 15, products: ["topup"], until: "2026-12-31", name: { en: "Holiday offer", am: "የበዓል ቅናሽ" } });
    expect(await b.launchOffer()).toEqual({ active: false, percent: 15, products: ["topup"], until: "2026-12-31", name: { en: "Holiday offer", am: "የበዓል ቅናሽ" } });
    // Switched on meanwhile (e.g. in another tab): a later save of the terms keeps it on, and
    // an empty last day and name are removed.
    expect(await b.setLaunchOfferActive("admin", true)).toBe("ok");
    await b.saveLaunchOfferTerms("admin", { percent: 25, products: ["business_month"] });
    expect(await b.launchOffer()).toEqual({ active: true, percent: 25, products: ["business_month"] });
  };
  it("in memory", () => check(new MemorySettingsStore()));
  it("in Postgres, in one statement", async () => {
    const db = await testDb();
    const settings = new DbSettingsStore(db);
    expect(await settings.merge("offer", { active: true }, [], "admin", null)).toBeNull();
    await check(settings);
  }, 30_000);
});
