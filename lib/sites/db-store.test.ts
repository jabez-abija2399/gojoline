import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { projects } from "@/lib/db/schema";
import { DbProjectStore } from "@/lib/projects/db-store";
import { makeUser, testDb } from "@/test/db";
import { DbSiteStore } from "./db-store";

describe("DbSiteStore", () => {
  it("reserves an address once, publishes, and keeps the site when deletion is attempted", async () => {
    const db = await testDb();
    await makeUser(db, "alice");
    await makeUser(db, "bob");
    const store = new DbProjectStore(db);
    const sites = new DbSiteStore(db);
    const a = await store.createProject("alice", { name: "A", locale: "en" });
    const b = await store.createProject("bob", { name: "B", locale: "en" });

    expect(await sites.reserve("alice", a.id, "selam", "vercel")).toBe(true);
    expect(await sites.reserve("bob", b.id, "selam", "vercel")).toBe(false);
    expect(await sites.slugTaken("selam", b.id)).toBe(true);
    expect((await sites.getByProject("alice", a.id))?.status).toBe("pending");
    expect(await sites.getByProject("bob", a.id)).toBeNull();

    const saved = await sites.savePublished("alice", {
      projectId: a.id, slug: "selam", provider: "vercel", providerProjectId: "prj_1", url: "https://gojo-selam.vercel.app",
      publishedVersion: 1, lastDeploymentId: "dpl_1", publishedAt: new Date(),
    });
    expect(saved.status).toBe("published");
    // The list of sites is the owner's own.
    expect((await sites.listByOwner("alice", [a.id])).map((s) => s.slug)).toEqual(["selam"]);
    expect(await sites.listByOwner("bob", [a.id, b.id])).toEqual([]);
    expect(await sites.listByOwner("alice", [])).toEqual([]);
    await expect(sites.savePublished("bob", { ...saved, projectId: a.id })).rejects.toThrow();

    // A project with a live site can't simply disappear.
    await expect(db.delete(projects).where(eq(projects.id, a.id))).rejects.toThrow();
  }, 30_000);
});
