import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/lib/db/client";
import { makeUser, testDb } from "@/test/db";
import { eq } from "drizzle-orm";
import { sites as sitesTable } from "@/lib/db/schema";
import { DbProjectStore } from "@/lib/projects/db-store";
import { DbSiteStore } from "@/lib/sites/db-store";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import sharp from "sharp";
import { DbShowcaseStore, makeThumb, MemoryShowcaseStore, publishedCardSource, type ShowcaseStore } from "./showcase";
import type { ProjectStore } from "@/lib/projects/types";
import type { SiteAdminStore, SiteStore } from "@/lib/sites/types";

describe("published card", () => {
  const site = (src: string, name: unknown = { en: "Selam Coffee", am: "ሰላም ቡና" }) => JSON.stringify({ name, pages: [{ path: "/", sections: [{ type: "about" }, { type: "hero", image: { src } }] }] });
  it("takes the published name in the site's language and the home hero photo, if it's a site photo", () => {
    expect(publishedCardSource(site("/images/front-door.webp"), "am")).toEqual({ name: "ሰላም ቡና", hero: "/images/front-door.webp" });
    expect(publishedCardSource(site("/stock/cafe-hero.webp"), "en")).toEqual({ name: "Selam Coffee", hero: "/stock/cafe-hero.webp" });
    expect(publishedCardSource(site("https://evil.example/x.webp"), "en")?.hero).toBeNull();
    expect(publishedCardSource(site("/images/../secret.webp"), "en")?.hero).toBeNull();
    expect(publishedCardSource(site("/stock/x.webp", ""), "en")).toBeNull();
    expect(publishedCardSource("not json", "en")).toBeNull();
  });
  it("makes a ~640 px WebP thumbnail from the built photo, keyed by its hash", async () => {
    const photo = await sharp({ create: { width: 1600, height: 1000, channels: 3, background: "#884422" } }).webp().toBuffer();
    const t = await makeThumb([{ path: "images/front.webp", data: photo }], "/images/front.webp");
    expect(t).toMatchObject({ width: 640, height: 400, key: expect.stringMatching(/^[0-9a-f]{32}$/) });
    expect((await sharp(t!.data).metadata()).format).toBe("webp");
    expect(await makeThumb([], "/images/front.webp")).toBeNull();
    expect(await makeThumb([{ path: "images/front.webp", data: photo }], null)).toBeNull();
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
  // Not listed until a publish saved its card (the name and photo that passed the checks).
  expect(await store.list(10)).toEqual([]);
  const data = Buffer.from("thumb");
  await store.savePublished("alice", live.id, { name: "Selam Coffee (published)", thumb: { data, width: 640, height: 400, key: "a".repeat(32) } });
  await store.savePublished("alice", draft.id, { name: "Draft", thumb: null });
  const list = await store.list(10);
  // The draft isn't live: not listed. The name is the published one, never the project's.
  expect(list).toEqual([expect.objectContaining({ siteId: site.id, name: "Selam Coffee (published)", url: "https://selam.sites.example", templateId: "cafe", thumb: { key: "a".repeat(32), width: 640, height: 400 } })]);
  expect(typeof list[0]!.publishedAt).toBe("string");
  expect(Buffer.from((await store.thumb("a".repeat(32)))!)).toEqual(data);
  expect(await store.thumb("b".repeat(32))).toBeNull();

  // An admin hides it; it stays in the admin list.
  expect(await store.setHidden(site.id, true)).toBe(true);
  expect(await store.list(10)).toEqual([]);
  expect(await store.thumb("a".repeat(32))).toBeNull();
  expect((await store.adminList(10)).map((e) => [e.name, e.hidden])).toEqual([["Selam Coffee (published)", true]]);
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

  it("posts only sites opted in under the wording that includes posts; an older showcase-only yes is not enough", async () => {
    const store = new DbShowcaseStore(db);
    const sites = new DbSiteStore(db);
    const projects = new DbProjectStore(db);
    const p = await projects.createProject("alice", { name: "Selam", locale: "en" });
    await sites.reserve("alice", p.id, "selam", "memory");
    await sites.savePublished("alice", { projectId: p.id, slug: "selam", provider: "memory", providerProjectId: "prj", url: "https://selam.sites.example", publishedVersion: 1, lastDeploymentId: "d", publishedAt: new Date() });
    await store.savePublished("alice", p.id, { name: "Selam", thumb: null });
    // An opt-in from before the posts wording: showcase yes, posts no.
    await db.update(sitesTable).set({ showcase: true, postsConsentAt: null }).where(eq(sitesTable.projectId, p.id));
    expect(await store.list(10)).toHaveLength(1);
    expect(await store.postable(10)).toEqual([]);
    // Opting in now agrees to both; opting out ends both.
    await store.setOptIn("alice", p.id, true);
    expect(await store.postable(10)).toHaveLength(1);
    await store.setOptIn("alice", p.id, false);
    expect(await store.postable(10)).toEqual([]);
    expect(await store.list(10)).toEqual([]);
  });
});

describe("MemoryShowcaseStore", () => {
  it("follows the same rules", async () => {
    const sites = new MemorySiteStore();
    const projects = new MemoryProjectStore();
    await scenario(new MemoryShowcaseStore(sites, projects), sites, projects);
  });
});
