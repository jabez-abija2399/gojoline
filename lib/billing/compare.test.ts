import { describe, expect, it } from "vitest";
import { planComparison, planHighlights } from "./compare";
import { monthsFree, PLAN_FEATURES, PRODUCTS, storageLabel, yearlySaving } from "./plans";

describe("plan comparison", () => {
  it("is generated from PLAN_FEATURES", () => {
    const rows = Object.fromEntries(planComparison().map((r) => [r.row, r.cells]));
    expect(rows.sites).toEqual({ free: { kind: "number", n: 1 }, starter: { kind: "number", n: 1 }, business: { kind: "upTo", n: 3 } });
    expect(rows.changes?.free).toEqual({ kind: "number", n: 10 });
    expect(rows.rollover).toEqual({ free: { kind: "no" }, starter: { kind: "months", n: 2 }, business: { kind: "months", n: 2 } });
    expect(rows.noBadge?.free).toEqual({ kind: "no" });
    expect(rows.telegramEdits?.starter).toEqual({ kind: "no" });
    expect(rows.storage?.business).toEqual({ kind: "size", text: "2 GB" });
    // A change in one place shows everywhere.
    const changed = planComparison({ ...PLAN_FEATURES, free: { ...PLAN_FEATURES.free, monthlyEdits: 12 } });
    expect(changed.find((r) => r.row === "changes")?.cells.free).toEqual({ kind: "number", n: 12 });
  });

  it("lists each plan's highlights", () => {
    expect(planHighlights("free").map((h) => h.key)).toEqual(["sitesOne", "freeAddress", "changes", "badge", "answers", "storage", "supportChannel"]);
    expect(planHighlights("business")[0]).toEqual({ key: "sitesMany", n: 3 });
  });
});

describe("yearly prices", () => {
  it("give two months free by default", () => {
    expect(yearlySaving(PRODUCTS.starter_month.amountMinor, PRODUCTS.starter_year.amountMinor)).toBe(99_800);
    expect(monthsFree(PRODUCTS.starter_month.amountMinor, PRODUCTS.starter_year.amountMinor)).toBe(2);
    expect(monthsFree(PRODUCTS.business_month.amountMinor, PRODUCTS.business_year.amountMinor)).toBe(2);
    expect(yearlySaving(100, 5000)).toBe(0);
    expect(monthsFree(0, 0)).toBe(0);
  });
  it("labels storage", () => {
    expect([storageLabel(50 * 1024 * 1024), storageLabel(2048 * 1024 * 1024)]).toEqual(["50 MB", "2 GB"]);
  });
});

describe("plan copy", () => {
  it("names the top-up with TOPUP_CREDITS in both languages", async () => {
    const { en } = await import("@/lib/i18n/messages/en");
    const { am } = await import("@/lib/i18n/messages/am");
    const { productName, TOPUP_CREDITS } = await import("./plans");
    expect(productName(en.billing.productNames, "topup")).toBe(`${TOPUP_CREDITS} extra changes`);
    expect(productName(am.billing.productNames, "topup")).toBe(`${TOPUP_CREDITS} ተጨማሪ ለውጦች`);
    expect(productName(en.billing.productNames, "starter_year")).toBe("Starter, 1 year");
  });

  it("parses Birr prices without floats", async () => {
    const { birrToMinor } = await import("./plans");
    expect(["499", "4,990", "499.5", "499.50", "abc", "1.234", ""].map(birrToMinor)).toEqual([49_900, 499_000, 49_950, 49_950, null, null, null]);
  });
});
