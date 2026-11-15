import { describe, expect, it } from "vitest";
import { makeUser, testDb } from "@/test/db";
import { Billing, isAdmin } from "./service";
import { DbBillingStore, MemoryBillingStore } from "./store";

describe("credits", () => {
  it("grants the monthly allowance once and meters edits", async () => {
    let now = new Date("2026-11-14T10:00:00Z");
    const store = new MemoryBillingStore();
    const b = new Billing(store, () => now);
    expect(await b.creditsLeft("u")).toBe(15);
    expect(await b.creditsLeft("u")).toBe(15); // idempotent
    expect(await b.consumeEdit("u", "m1")).toBe(true);
    expect(await b.consumeEdit("u", "m1")).toBe(false); // same request can't be charged twice
    await b.refundEdit("u", "m1");
    await b.refundEdit("u", "m1");
    expect(await b.creditsLeft("u")).toBe(15);
    for (let i = 0; i < 15; i++) await b.consumeEdit("u", `x${i}`);
    expect(await b.consumeEdit("u", "over")).toBe(false);
    now = new Date("2026-12-01T00:00:00Z");
    expect(await b.creditsLeft("u")).toBe(15);
  });

  it("rolls unused edits over up to two months", async () => {
    let now = new Date("2026-11-01T00:00:00Z");
    const b = new Billing(new MemoryBillingStore(), () => now);
    await b.creditsLeft("u");
    now = new Date("2026-12-02T00:00:00Z");
    expect(await b.creditsLeft("u")).toBe(30);
    now = new Date("2027-01-02T00:00:00Z");
    expect(await b.creditsLeft("u")).toBe(30);
  });
});

describe("atomic credits (Postgres)", () => {
  it("never overspends with parallel edits and caps daily refunds", async () => {
    const db = await testDb();
    await makeUser(db, "u");
    const b = new Billing(new DbBillingStore(db), () => new Date("2026-11-14T10:00:00Z"));
    expect(await b.creditsLeft("u")).toBe(15);
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => b.consumeEdit("u", `m${i}`)));
    expect(results.filter(Boolean)).toHaveLength(15);
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
    expect(p).toMatchObject({ amountMinor: 39_900, currency: "ETB", status: "pending", hasReceipt: true });
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
    expect(await b.creditsLeft("owner")).toBe(before + 50);

    const bad = await b.submitPayment("owner", { product: "business_year", method: "cbe", reference: "FAKE", receipt: null });
    await b.review("admin", bad!.id, "reject", "No such transfer");
    expect((await b.plan("owner")).plan).toBe("starter");
    expect((await store.auditFor("payment", bad!.id)).map((a) => a.action)).toEqual(["payment.submitted", "payment.rejected"]);
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
