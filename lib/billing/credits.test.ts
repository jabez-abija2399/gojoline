import { describe, expect, it } from "vitest";
import { makeUser, testDb } from "@/test/db";
import { costCapNano, creditSettingsSchema, defaultCreditSettings, mergeCreditSettings, nextMonthlyGrant, planFeaturesWith, usdToCents } from "./credits";
import { planComparison, planHighlights } from "./compare";
import { Billing, REFUND_CREDITS_PER_DAY } from "./service";
import { loadCreditSettings, MemorySettingsStore } from "./settings";
import { DbBillingStore, MemoryBillingStore, type BillingStore } from "./store";

describe("credit settings", () => {
  it("defaults to PLAN_FEATURES and the constants", () => {
    expect(defaultCreditSettings()).toEqual({
      monthly: { free: 10, starter: 50, business: 150 },
      rollover: { free: 1, starter: 2, business: 2 },
      topupCredits: 30,
      sizeCredits: { small: 1, medium: 2, large: 4 },
      capCentsPerCredit: 15,
    });
  });

  it("merges saved values over the defaults and drops invalid ones as a whole", async () => {
    expect(mergeCreditSettings({ monthly: { business: 200 } }).monthly).toEqual({ free: 10, starter: 50, business: 200 });
    // Sizes out of order, too big, negative or not whole numbers: back to the defaults.
    for (const bad of [{ sizeCredits: { small: 3, medium: 2, large: 4 } }, { monthly: { free: 5000 } }, { topupCredits: -1 }, { capCentsPerCredit: 1.5 }, { rollover: { free: 0 } }, { extra: 1 }]) {
      expect(mergeCreditSettings(bad)).toEqual(defaultCreditSettings());
    }
    const store = new MemorySettingsStore();
    await store.set("credits", { sizeCredits: { large: 5 } });
    expect((await loadCreditSettings(store)).sizeCredits).toEqual({ small: 1, medium: 2, large: 5 });
  });

  it("validates bounds", () => {
    const ok = defaultCreditSettings();
    expect(creditSettingsSchema.safeParse(ok).success).toBe(true);
    expect(creditSettingsSchema.safeParse({ ...ok, sizeCredits: { small: 1, medium: 1, large: 1 } }).success).toBe(true);
    expect(creditSettingsSchema.safeParse({ ...ok, capCentsPerCredit: 0 }).success).toBe(false);
    expect(creditSettingsSchema.safeParse({ ...ok, rollover: { ...ok.rollover, starter: 13 } }).success).toBe(false);
  });

  it("feeds the comparison table and plan cards", () => {
    const f = planFeaturesWith(mergeCreditSettings({ monthly: { starter: 80 }, rollover: { starter: 3 } }));
    expect(planComparison(f).find((r) => r.row === "changes")?.cells.starter).toEqual({ kind: "number", n: 80 });
    expect(planComparison(f).find((r) => r.row === "rollover")?.cells.starter).toEqual({ kind: "months", n: 3 });
    expect(planHighlights("starter", f)).toContainEqual({ key: "changesRollover", n: 80 });
  });

  it("parses dollar caps and dates", () => {
    expect(usdToCents("0.15")).toBe(15);
    expect(usdToCents("$1")).toBe(100);
    expect(usdToCents("0.1")).toBe(10);
    expect(usdToCents("abc")).toBeNull();
    expect(usdToCents("0.155")).toBeNull();
    expect(costCapNano(defaultCreditSettings(), 2)).toBe(300_000_000);
    expect(nextMonthlyGrant(new Date("2026-12-31T23:00:00Z")).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("billing with admin credit settings", () => {
  it("grants the saved monthly changes from the next month, keeps what owners have, and audits", async () => {
    let now = new Date("2026-11-14T10:00:00Z");
    const settings = new MemorySettingsStore();
    const store = new MemoryBillingStore();
    const b = new Billing(store, () => now, settings);
    expect(await b.creditsLeft("u")).toBe(10);
    await b.saveCreditSettings("admin", { ...defaultCreditSettings(), monthly: { free: 4, starter: 50, business: 150 }, topupCredits: 40 });
    // Already granted this month: nothing taken away.
    expect(await b.creditsLeft("u")).toBe(10);
    expect((await b.allowance("u")).monthly).toBe(4);
    now = new Date("2026-12-02T10:00:00Z");
    // Free tops up to the allowance only: 10 left stays 10 (never cut).
    expect(await b.creditsLeft("u")).toBe(10);
    expect((await store.auditFor("settings", "credits"))[0]).toMatchObject({ action: "settings.credits", actorId: "admin" });

    const top = await b.submitPayment("u", { product: "topup", method: "cbe", reference: "FT555555", receipt: null });
    expect(top.ok).toBe(true);
    if (top.ok) await b.review("admin", top.payment.id, "approve", null);
    expect(await b.creditsLeft("u")).toBe(50);
    expect(await b.boughtLeft("u")).toBe(40);
  });

  it("bigger monthly allowances apply at the next month's grant", async () => {
    let now = new Date("2026-11-14T10:00:00Z");
    const settings = new MemorySettingsStore();
    const b = new Billing(new MemoryBillingStore(), () => now, settings);
    await b.consumeEdit("u", "a", 10);
    await b.saveCreditSettings("admin", { ...defaultCreditSettings(), monthly: { free: 25, starter: 50, business: 150 } });
    expect(await b.creditsLeft("u")).toBe(0);
    now = new Date("2026-12-01T00:00:01Z");
    expect(await b.creditsLeft("u")).toBe(25);
    expect((await b.allowance("u")).nextGrant.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

async function multiCredit(store: BillingStore, b: Billing) {
  expect(await b.creditsLeft("u")).toBe(10);
  // Takes n at once, with what it was for, and never twice for the same request.
  expect(await b.consumeEdit("u", "r1", 4, { size: "large", note: "Redesign" })).toBe(true);
  expect(await b.consumeEdit("u", "r1", 4)).toBe(false);
  expect(await store.balance("u")).toBe(6);
  // Never more than the owner has.
  expect(await b.consumeEdit("u", "r2", 7)).toBe(false);
  expect(await store.balance("u")).toBe(6);
  expect(await store.debit("u", "r3", 0)).toBe(false);
  // The same n back once, with the size in the history.
  expect(await b.refundEdit("u", "r1", 4, { size: "large" })).toBe(true);
  expect(await b.refundEdit("u", "r1", 4)).toBe(false);
  expect(await store.balance("u")).toBe(10);
  const rows = await store.ledger("u", 10, 0);
  expect(rows.map((r) => [r.reason, r.delta, r.size])).toEqual([
    ["refund", 4, "large"],
    ["ai_edit", -4, "large"],
    ["monthly_grant", 10, null],
  ]);
  expect(rows[1]?.note).toBe("Redesign");
  expect(await store.ledger("u", 2, 2)).toHaveLength(1);
}

describe("multi-change debits", () => {
  it("memory store", async () => {
    const store = new MemoryBillingStore();
    await multiCredit(store, new Billing(store, () => new Date("2026-11-14T10:00:00Z")));
  });

  it("Postgres, including parallel requests", async () => {
    const db = await testDb();
    await makeUser(db, "u");
    const store = new DbBillingStore(db);
    const b = new Billing(store, () => new Date("2026-11-14T10:00:00Z"));
    await multiCredit(store, b);
    // 10 left: eight parallel 3-change requests, only three fit.
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => b.consumeEdit("u", `p${i}`, 3)));
    expect(results.filter(Boolean)).toHaveLength(3);
    expect(await store.balance("u")).toBe(1);
    // The same request sent twice at once is charged once.
    await store.addCredits("u", 10, "admin", "gift");
    const same = await Promise.all([b.consumeEdit("u", "dup", 2), b.consumeEdit("u", "dup", 2)]);
    expect(same.filter(Boolean)).toHaveLength(1);
    expect(await store.balance("u")).toBe(9);
  }, 30_000);

  it("Postgres: parallel refunds never pass the daily cap", async () => {
    const db = await testDb();
    await makeUser(db, "u");
    const store = new DbBillingStore(db);
    const b = new Billing(store, () => new Date("2026-11-14T10:00:00Z"));
    await store.addCredits("u", 40, "admin", "gift");
    for (let i = 0; i < 6; i++) await b.consumeEdit("u", `x${i}`, 4);
    const before = await store.balance("u");
    const given = await Promise.all(Array.from({ length: 6 }, (_, i) => b.refundEdit("u", `x${i}`, 4)));
    expect(given.filter(Boolean)).toHaveLength(3);
    expect((await store.balance("u")) - before).toBe(REFUND_CREDITS_PER_DAY);
    expect(await store.sumSince("u", ["refund"], new Date(0))).toBe(REFUND_CREDITS_PER_DAY);
    // A new day starts a new cap.
    const tomorrow = new Billing(store, () => new Date("2026-11-15T10:00:00Z"));
    await tomorrow.consumeEdit("u", "y", 4);
    expect(await tomorrow.refundEdit("u", "y", 4)).toBe(true);
  }, 30_000);

  it("refunds at most REFUND_CREDITS_PER_DAY changes a day", async () => {
    const store = new MemoryBillingStore();
    const b = new Billing(store, () => new Date("2026-11-14T10:00:00Z"));
    await store.addCredits("u", 40, "admin", "gift");
    for (let i = 0; i < 4; i++) await b.consumeEdit("u", `x${i}`, 4);
    const given = [];
    for (let i = 0; i < 4; i++) given.push(await b.refundEdit("u", `x${i}`, 4));
    expect(given).toEqual([true, true, true, false]);
    expect(await store.sumSince("u", ["refund"], new Date("2026-11-14T00:00:00Z"))).toBe(REFUND_CREDITS_PER_DAY);
  });
});
