import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/lib/db/client";
import { makeUser, testDb } from "@/test/db";
import { DbProjectStore } from "@/lib/projects/db-store";
import { DbSiteStore } from "@/lib/sites/db-store";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { DbShowcaseStore, heroImageOf, MemoryShowcaseStore, type ShowcaseStore } from "./showcase";
import type { ProjectStore } from "@/lib/projects/types";
import type { SiteAdminStore, SiteStore } from "@/lib/sites/types";

describe("heroImageOf", () => {
  it("takes the home page's hero photo when it is a site or library photo", () => {
    const site = (src: string) => JSON.stringify({ pages: [{ path: "/", sections: [{ type: "about" }, { type: "hero", image: { src } }] }] });
    expect(heroImageOf(site("/images/front-door.webp"))).toBe("/images/front-door.webp");
    expect(heroImageOf(site("/stock/cafe-hero.webp"))).toBe("/stock/cafe-hero.webp");
    expect(heroImageOf(site("https://evil.example/x.webp"))).toBeNull();
    expect(heroImageOf(site("/images/../secret.webp"))).toBeNull();
    expect(heroImageOf("not json")).toBeNull();
    expect(heroImageOf(undefined)).toBeNull();
  });
});

async function scenario(store: ShowcaseStore, sites: SiteStore & SiteAdminStore, projects: ProjectStore) {
  const live = await projects.createProject("alice", { name: "Selam Coffee", locale: "en", templateId: "cafe" });
  const draft = await projects.createProject("alice", { name: "Draft", locale: "en" });
  const other = await projects.createProject("bob", { name: "Bob Shop", locale: "en", templateId: "shop" });
  for (const [owner, p, slug] of [["alice", live, "selam"], ["alice", draft, "draft"], ["bob", other, "bob-shop"]] as const) {
    await sites.reserve(owner, p.id, slug, "memory");
  }
  const publish = (owner: string, projectId: string, slug: string) =>
    sites.savePublished(owner, { projectId, slug, provider: "memory", providerProjectId: `prj_${slug}`, url: `https://${slug}.sites.example`, publishedVersion: 1, lastDeploymentId: "d", publishedAt: new Date() });
  const site = await publish("alice", live.id, "selam");
  await publish("bob", other.id, "bob-shop");

  // Off by default; an owner can only switch their own site.
  expect(await store.optedIn("alice", live.id)).toBe(false);
  expect(await store.list(10)).toEqual([]);
  expect(await store.setOptIn("bob", live.id, true)).toBe(false);
  expect(await store.setOptIn("alice", live.id, true)).toBe(true);
  expect(await store.setOptIn("alice", draft.id, true)).toBe(true);
  await store.saveImage("alice", live.id, "/stock/cafe-hero.webp");
  const list = await store.list(10);
  // The draft isn't live: not listed.
  expect(list).toEqual([expect.objectContaining({ siteId: site.id, name: "Selam Coffee", url: "https://selam.sites.example", templateId: "cafe", image: "/stock/cafe-hero.webp" })]);
  expect((await store.entry(site.id))?.ownerId).toBe("alice");

  // An admin hides it; it stays in the admin list.
  expect(await store.setHidden(site.id, true)).toBe(true);
  expect(await store.list(10)).toEqual([]);
  expect(await store.entry(site.id)).toBeNull();
  expect((await store.adminList(10)).map((e) => [e.name, e.hidden])).toEqual([["Selam Coffee", true]]);
  await store.setHidden(site.id, false);

  // Resting or taken down: not listed.
  await sites.setOffline("alice", live.id, true);
  expect(await store.list(10)).toEqual([]);
  await sites.setOffline("alice", live.id, false);
  expect(await store.list(10)).toHaveLength(1);
  await sites.takeDown(site.id, "scam");
  expect(await store.list(10)).toEqual([]);
}

describe("DbShowcaseStore (PGlite)", () => {
  let db: Database;
  beforeEach(async () => {
    db = await testDb();
    await makeUser(db, "alice");
    await makeUser(db, "bob");
  });
  it("lists only opted-in, live, unhidden sites", async () => {
    await scenario(new DbShowcaseStore(db), new DbSiteStore(db), new DbProjectStore(db));
  });
});

describe("MemoryShowcaseStore", () => {
  it("follows the same rules", async () => {
    const sites = new MemorySiteStore();
    const projects = new MemoryProjectStore();
    await scenario(new MemoryShowcaseStore(sites, projects), sites, projects);
  });
});
