import { describe, expect, it } from "vitest";
import { makeUser, testDb } from "@/test/db";
import { Billing, isAdmin } from "./service";
import { DbBillingStore, MemoryBillingStore } from "./store";

describe("credits", () => {
  it("grants the monthly allowance once and meters edits", async () => {
    let now = new Date("2026-11-14T10:00:00Z");
    const store = new MemoryBillingStore();
    const b = new Billing(store, () => now);
    expect(await b.creditsLeft("u")).toBe(10);
    expect(await b.creditsLeft("u")).toBe(10); // idempotent
    expect(await b.consumeEdit("u", "m1")).toBe(true);
    expect(await b.consumeEdit("u", "m1")).toBe(false); // same request can't be charged twice
    await b.refundEdit("u", "m1");
    await b.refundEdit("u", "m1");
    expect(await b.creditsLeft("u")).toBe(10);
    for (let i = 0; i < 10; i++) await b.consumeEdit("u", `x${i}`);
    expect(await b.consumeEdit("u", "over")).toBe(false);
    now = new Date("2026-12-01T00:00:00Z");
    expect(await b.creditsLeft("u")).toBe(10);
  });

  it("Free doesn't roll over: unused changes top up to one month's allowance", async () => {
    let now = new Date("2026-11-01T00:00:00Z");
    const b = new Billing(new MemoryBillingStore(), () => now);
    await b.creditsLeft("u");
    await b.consumeEdit("u", "a");
    now = new Date("2026-12-02T00:00:00Z");
    expect(await b.creditsLeft("u")).toBe(10);
    expect(await b.creditsLeft("u")).toBe(10);
  });

  it("paid plans roll unused edits over up to two months", async () => {
    let now = new Date("2026-11-01T00:00:00Z");
    const store = new MemoryBillingStore();
    await store.setSubscription({ userId: "u", plan: "starter", period: "year", currentPeriodEnd: new Date("2027-11-01T00:00:00Z") });
    const b = new Billing(store, () => now);
    expect(await b.creditsLeft("u")).toBe(50);
    now = new Date("2026-12-02T00:00:00Z");
    expect(await b.creditsLeft("u")).toBe(100);
    expect(await b.creditsLeft("u")).toBe(100); // idempotent
    now = new Date("2027-01-02T00:00:00Z");
    expect(await b.creditsLeft("u")).toBe(100);
  });

  it("bought changes don't eat into the monthly allowance or the rollover cap", async () => {
    let now = new Date("2026-11-01T00:00:00Z");
    const store = new MemoryBillingStore();
    const b = new Billing(store, () => now);
    expect(await b.creditsLeft("u")).toBe(10);
    await store.addCredits("u", 30, "topup", "p1");
    expect(await b.creditsLeft("u")).toBe(40);
    now = new Date("2026-12-02T00:00:00Z");
    // Free: the 10 unused monthly changes reset to 10, the 30 bought ones stay.
    expect(await b.creditsLeft("u")).toBe(40);
    for (let i = 0; i < 35; i++) await b.consumeEdit("u", `s${i}`);
    now = new Date("2027-01-02T00:00:00Z");
    expect(await b.creditsLeft("u")).toBe(15);
  });

  it("caps free first builds per day", async () => {
    const b = new Billing(new MemoryBillingStore(), () => new Date("2026-11-14T10:00:00Z"));
    const got = [];
    for (let i = 0; i < 5; i++) got.push(await b.freeFirstBuild("u", `r${i}`));
    expect(got).toEqual([true, true, true, false, false]);
    expect(await b.creditsLeft("u")).toBe(10);
  });

  it("plan limits come from PLAN_FEATURES, photo storage included", async () => {
    const store = new MemoryBillingStore();
    const b = new Billing(store, () => new Date("2026-11-14T10:00:00Z"));
    expect((await b.entitlements("u")).storageBytes).toBe(50 * 1024 * 1024);
    await store.setSubscription({ userId: "u", plan: "business", period: "month", currentPeriodEnd: new Date("2026-12-14T10:00:00Z") });
    expect(await b.entitlements("u")).toEqual({ plan: "business", customDomain: true, maxSites: 3, badge: false, telegramNotify: true, telegramEdits: true, answersPerMonth: 10_000, storageBytes: 2048 * 1024 * 1024 });
  });
});

describe("atomic credits (Postgres)", () => {
  it("never overspends with parallel edits and caps daily refunds", async () => {
    const db = await testDb();
    await makeUser(db, "u");
    const b = new Billing(new DbBillingStore(db), () => new Date("2026-11-14T10:00:00Z"));
    expect(await b.creditsLeft("u")).toBe(10);
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => b.consumeEdit("u", `m${i}`)));
    expect(results.filter(Boolean)).toHaveLength(10);
    expect(await b.creditsLeft("u")).toBe(0);
    const refunds = [];
    for (let i = 0; i < 7; i++) refunds.push(await b.refundEdit("u", `m${i}`));
    expect(refunds.filter(Boolean)).toHaveLength(5);
    expect(await b.creditsLeft("u")).toBe(5);
  }, 30_000);
});

describe("payments", () => {
  it("approving a plan extends it once; rejecting changes nothing; all audited (Postgres)", async () => {
    const db = await testDb();
    await makeUser(db, "owner");
    const store = new DbBillingStore(db);
    const now = new Date("2026-11-14T10:00:00Z");
    const b = new Billing(store, () => now);
    const p = await b.submitPayment("owner", { product: "starter_month", method: "telebirr", reference: "TB123", receipt: Buffer.from("img") });
    expect(p).toMatchObject({ amountMinor: 49_900, currency: "ETB", status: "pending", hasReceipt: true });
    // The same transaction can't be sent again, even written differently or under another method.
    expect(await b.submitPayment("owner", { product: "starter_month", method: "other", reference: "tb-12 3", receipt: null })).toBeNull();

    expect(await b.review("admin", p!.id, "approve", null)).toBe("ok");
    expect(await b.review("admin", p!.id, "approve", null)).toBe("already_reviewed");
    expect((await b.plan("owner")).plan).toBe("starter");
    expect((await b.plan("owner")).until?.toISOString()).toBe("2026-12-14T10:00:00.000Z");
    expect((await b.entitlements("owner")).customDomain).toBe(true);
    // Starter's allowance once this month, not twice.
    expect(await b.creditsLeft("owner")).toBe(50);
    expect((await store.paymentsFor("owner"))[0]?.reviewedBy).toBeNull();
    expect((await store.pendingForAdmin()).length).toBe(0);

    const top = await b.submitPayment("owner", { product: "topup", method: "cbe", reference: "FT999", receipt: null });
    const before = await b.creditsLeft("owner");
    await b.review("admin", top!.id, "approve", "ok");
    expect(await b.creditsLeft("owner")).toBe(before + 30);

    const bad = await b.submitPayment("owner", { product: "business_year", method: "cbe", reference: "FAKE", receipt: null });
    await b.review("admin", bad!.id, "reject", "No such transfer");
    expect((await b.plan("owner")).plan).toBe("starter");
    expect((await store.auditFor("payment", bad!.id)).map((a) => a.action)).toEqual(["payment.submitted", "payment.rejected"]);
  }, 30_000);
});

describe("admin actions", () => {
  it("gives extra changes with a unique ref each time, audited", async () => {
    const store = new MemoryBillingStore();
    const b = new Billing(store, () => new Date("2026-11-14T10:00:00Z"));
    expect(await b.creditsLeft("u")).toBe(10);
    await b.adminGrantCredits("admin", "u", 25, "Sorry for the outage");
    await b.adminGrantCredits("admin", "u", 25, "Sorry for the outage");
    expect(await b.creditsLeft("u")).toBe(60);
    const log = await store.auditFor("user", "u");
    expect(log.map((l) => l.action)).toEqual(["credits.granted", "credits.granted"]);
    expect(log[0]?.data).toMatchObject({ n: 25, reason: "Sorry for the outage" });
    expect(log[0]?.data?.ref).not.toBe(log[1]?.data?.ref);
  });

  it("sets, extends and ends a plan without deleting anything, audited (Postgres)", async () => {
    const db = await testDb();
    await makeUser(db, "u");
    const store = new DbBillingStore(db);
    let now = new Date("2026-11-14T10:00:00Z");
    const b = new Billing(store, () => now);
    await b.adminSetPlan("admin", "u", "business", "month", "Launch partner");
    expect(await b.plan("u")).toEqual({ plan: "business", until: new Date("2026-12-14T10:00:00Z") });
    expect(await b.creditsLeft("u")).toBe(150);
    await b.adminSetPlan("admin", "u", "business", "year", "Paid in cash");
    expect((await b.plan("u")).until?.toISOString()).toBe("2027-12-14T10:00:00.000Z");
    now = new Date("2026-11-20T10:00:00Z");
    await b.adminSetPlan("admin", "u", "free", "month", "Refunded");
    expect((await b.plan("u")).plan).toBe("free");
    expect(await store.subscription("u")).not.toBeNull();
    const log = await store.auditFor("user", "u");
    expect(log.map((l) => l.action)).toEqual(["plan.set", "plan.set", "plan.set"]);
    expect(log[2]?.data).toMatchObject({ reason: "Refunded", before: { plan: "business" }, after: { plan: "free", until: null } });
  }, 30_000);
});

describe("isAdmin", () => {
  const env = { ADMIN_EMAILS: "founder@gojoline.com", ADMIN_PHONES: "+251911000000" } as unknown as NodeJS.ProcessEnv;
  it("needs a verified listed email or phone", () => {
    const u = (email: string | null, phone: string | null, emailVerified: boolean, phoneVerified: boolean) => ({ email, phone, emailVerified, phoneVerified });
    expect(isAdmin(u("Founder@gojoline.com", null, true, false), env)).toBe(true);
    expect(isAdmin(u(null, "+251911000000", false, true), env)).toBe(true);
    expect(isAdmin(u("founder@gojoline.com", null, false, false), env)).toBe(false);
    // A verified phone doesn't make an unverified listed email count.
    expect(isAdmin(u("founder@gojoline.com", "+251900000001", false, true), env)).toBe(false);
    expect(isAdmin(u("x@y.z", null, true, false), env)).toBe(false);
    expect(isAdmin(null, env)).toBe(false);
  });
});
