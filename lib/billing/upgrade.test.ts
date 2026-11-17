import { describe, expect, it } from "vitest";
import { PLAN_FEATURES, PRODUCTS, type Product } from "./plans";
import { shouldOpenUpgrade, upgradeChoices, upgradeHref, upgradeMonth } from "./upgrade";
import type { LaunchOffer } from "./discounts";

const now = new Date("2026-11-20T10:00:00Z");
const prices = Object.fromEntries(Object.entries(PRODUCTS).map(([k, v]) => [k, v.amountMinor])) as Record<Product, number>;
const base = { prices, offer: null, now, features: PLAN_FEATURES, topupCredits: 30 };
const offer: LaunchOffer = { active: true, percent: 20, products: ["business_month", "topup"], until: "2030-12-31" };

describe("upgradeChoices", () => {
  it("offers Starter then Business to a Free owner, with the changes each brings", () => {
    const c = upgradeChoices("free", base);
    expect(c.map((x) => x.product)).toEqual(["starter_month", "business_month"]);
    expect(c[0]).toMatchObject({ plan: "starter", changes: 50, priceMinor: 49_900, wasMinor: null });
    expect(c[1]).toMatchObject({ plan: "business", changes: 150, priceMinor: 129_900 });
  });

  it("offers a top-up first to paid owners, and Business only to Starter owners", () => {
    expect(upgradeChoices("starter", base).map((x) => x.product)).toEqual(["topup", "business_month"]);
    expect(upgradeChoices("business", base).map((x) => x.product)).toEqual(["topup"]);
    expect(upgradeChoices("starter", { ...base, topupCredits: 40 })[0]).toMatchObject({ plan: null, changes: 40, priceMinor: 24_900 });
  });

  it("uses admin prices, admin monthly changes and the launch offer", () => {
    const features = { ...PLAN_FEATURES, starter: { ...PLAN_FEATURES.starter, monthlyEdits: 60 } };
    const c = upgradeChoices("free", { ...base, features, offer, prices: { ...prices, starter_month: 55_000 } });
    expect(c[0]).toMatchObject({ changes: 60, priceMinor: 55_000, wasMinor: null });
    // 1,299 less 20% = 1,039.20, rounded down to whole Birr.
    expect(c[1]).toMatchObject({ priceMinor: 103_900, wasMinor: 129_900 });
    expect(upgradeChoices("starter", { ...base, offer })[0]).toMatchObject({ priceMinor: 19_900, wasMinor: 24_900 });
  });

  it("ignores an offer that ended or is switched off", () => {
    expect(upgradeChoices("free", { ...base, offer: { ...offer, until: "2026-11-19" } })[1]!.wasMinor).toBeNull();
    expect(upgradeChoices("free", { ...base, offer: { ...offer, active: false } })[1]!.wasMinor).toBeNull();
  });
});

describe("upgradeHref and upgradeMonth", () => {
  it("goes to the payment form with the product chosen", () => {
    expect(upgradeHref("am", "topup")).toBe("/am/billing?product=topup#pay-title");
  });
  it("counts months in Addis Ababa time", () => {
    expect(upgradeMonth(new Date("2026-11-30T20:59:00Z"))).toBe("2026-11");
    expect(upgradeMonth(new Date("2026-11-30T21:00:00Z"))).toBe("2026-12");
  });
});

describe("shouldOpenUpgrade", () => {
  const s = { before: 1, after: 0, hasSite: true, dismissedMonth: null, month: "2026-11" };
  it("opens when a request is refused at 0, but not when some changes are left", () => {
    expect(shouldOpenUpgrade("refused", s)).toBe(true);
    expect(shouldOpenUpgrade("refused", { ...s, after: 3 })).toBe(false);
    expect(shouldOpenUpgrade("refused", { ...s, after: null })).toBe(false);
  });
  it("opens on sending at 0, except for a new site's free first build", () => {
    expect(shouldOpenUpgrade("send", { ...s, before: 0 })).toBe(true);
    expect(shouldOpenUpgrade("send", { ...s, before: 0, hasSite: false })).toBe(false);
  });
  it("opens once a month when a run uses the last change", () => {
    expect(shouldOpenUpgrade("after_run", s)).toBe(true);
    expect(shouldOpenUpgrade("after_run", { ...s, dismissedMonth: "2026-11" })).toBe(false);
    expect(shouldOpenUpgrade("after_run", { ...s, dismissedMonth: "2026-10" })).toBe(true);
    // Already at 0 before the run (a free first build): nothing new to say.
    expect(shouldOpenUpgrade("after_run", { ...s, before: 0 })).toBe(false);
    expect(shouldOpenUpgrade("after_run", { ...s, after: 2 })).toBe(false);
  });
});
