import { describe, expect, it } from "vitest";
import { aiUsage, creditBalances, payments, projects, sites, subscriptions } from "@/lib/db/schema";
import { makeUser, testDb } from "@/test/db";
import { DbAdminStats, monthlyRevenueMinor } from "./stats";

describe("admin users list", () => {
  it("refers to the outer users.id fully qualified in every subquery", async () => {
    const db = await testDb();
    const { sql } = new DbAdminStats(db).usersQuery("", 10).toSQL();
    // A bare "id" inside `select ... from sites where owner_id = "id"` would mean sites.id (uuid).
    expect(sql).not.toMatch(/= "id"/);
    expect(sql.match(/"users"\."id"/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    const filtered = new DbAdminStats(db).usersQuery("", 10, "starter").toSQL().sql;
    expect(filtered).not.toMatch(/= "id"/);
  }, 30_000);

  it("runs on Postgres with plans, sites and credits (Postgres)", async () => {
    const db = await testDb();
    await makeUser(db, "paid");
    await makeUser(db, "free");
    await db.insert(subscriptions).values({ userId: "paid", plan: "starter", period: "month", currentPeriodEnd: new Date(Date.now() + 86_400_000) });
    const [p] = await db.insert(projects).values({ ownerId: "paid", locale: "en" }).returning({ id: projects.id });
    await db.insert(sites).values({ projectId: p!.id, ownerId: "paid", slug: "paid-site", provider: "memory", status: "published" });
    await db.insert(creditBalances).values({ userId: "paid", balance: 42 });
    await db.insert(aiUsage).values({ userId: "paid", purpose: "agent", model: "m", inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, costNanoUsd: 1_500_000_000, durationMs: 1, ok: true });
    await db.insert(payments).values({ userId: "paid", product: "starter_month", amountMinor: 49_900, currency: "ETB", method: "telebirr", reference: "TB1", status: "approved" });
    const stats = new DbAdminStats(db);
    const rows = await stats.users("", 10);
    const paid = rows.find((r) => r.id === "paid");
    expect(paid).toMatchObject({ plan: "starter", sites: 1, credits: 42, aiCost30Nano: 1_500_000_000 });
    expect(paid?.until).toBeInstanceOf(Date);
    expect(rows.find((r) => r.id === "free")).toMatchObject({ plan: "free", until: null, sites: 0, credits: 0, aiCost30Nano: 0 });

    expect((await stats.users("", 10, "starter")).map((r) => r.id)).toEqual(["paid"]);
    expect((await stats.users("", 10, "free")).map((r) => r.id)).toEqual(["free"]);
    expect(await stats.users("", 10, "business")).toEqual([]);

    const o = await stats.overview();
    expect(o.plans).toEqual({ free: 1, starter: 1, business: 0 });
    expect(o.activeSubs).toEqual([{ plan: "starter", period: "month", n: 1 }]);

    const detail = await stats.user("paid");
    expect(detail?.projects).toEqual([{ id: p!.id, name: "", site: { slug: "paid-site", url: null, status: "published" } }]);
    expect(detail?.payments.map((x) => x.product)).toEqual(["starter_month"]);
    expect(await stats.user("nobody")).toBeNull();
  }, 30_000);
});

describe("estimated monthly revenue", () => {
  it("counts yearly plans as a twelfth, in whole santim", () => {
    const prices = { starter_month: 49_900, starter_year: 499_000, business_month: 129_900, business_year: 1_299_000 };
    expect(monthlyRevenueMinor([{ plan: "starter", period: "month", n: 2 }, { plan: "business", period: "year", n: 1 }], prices)).toBe(2 * 49_900 + 108_250);
    expect(monthlyRevenueMinor([], prices)).toBe(0);
  });
});
