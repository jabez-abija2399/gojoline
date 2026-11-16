import { describe, expect, it } from "vitest";
import { creditBalances, projects, sites, subscriptions } from "@/lib/db/schema";
import { makeUser, testDb } from "@/test/db";
import { DbAdminStats } from "./stats";

describe("admin users list", () => {
  it("refers to the outer users.id fully qualified in every subquery", async () => {
    const db = await testDb();
    const { sql } = new DbAdminStats(db).usersQuery("", 10).toSQL();
    // A bare "id" inside `select ... from sites where owner_id = "id"` would mean sites.id (uuid).
    expect(sql).not.toMatch(/= "id"/);
    expect(sql.match(/"users"\."id"/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("runs on Postgres with plans, sites and credits (Postgres)", async () => {
    const db = await testDb();
    await makeUser(db, "paid");
    await makeUser(db, "free");
    await db.insert(subscriptions).values({ userId: "paid", plan: "starter", period: "month", currentPeriodEnd: new Date(Date.now() + 86_400_000) });
    const [p] = await db.insert(projects).values({ ownerId: "paid", locale: "en" }).returning({ id: projects.id });
    await db.insert(sites).values({ projectId: p!.id, ownerId: "paid", slug: "paid-site", provider: "memory", status: "published" });
    await db.insert(creditBalances).values({ userId: "paid", balance: 42 });
    const rows = await new DbAdminStats(db).users("", 10);
    const paid = rows.find((r) => r.id === "paid");
    expect(paid).toMatchObject({ plan: "starter", sites: 1, credits: 42 });
    expect(rows.find((r) => r.id === "free")).toMatchObject({ plan: "free", sites: 0, credits: 0 });
  }, 30_000);
});
