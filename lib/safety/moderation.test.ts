import { describe, expect, it } from "vitest";
import { makeUser, testDb } from "@/test/db";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { DbSiteStore } from "@/lib/sites/db-store";
import { DbReportStore, MemoryReportStore } from "./reports";
import { addressCandidates } from "./address";
import { dismissReports, restoreSite, takeDownSite, takenDownPage } from "./takedown";

describe("addressCandidates", () => {
  const urlFor = (s: string) => `https://gojo-${s}.vercel.app`;
  it("understands slugs, hosts and full URLs", () => {
    expect(addressCandidates("selam-coffee", urlFor)).toEqual(["selam-coffee"]);
    expect(addressCandidates("https://gojo-selam-coffee.vercel.app/menu?x=1", urlFor)).toContain("selam-coffee");
    expect(addressCandidates("www.selamcoffee.com", urlFor)).toEqual(["selamcoffee.com"]);
    expect(addressCandidates("   ", urlFor)).toEqual([]);
  });
});

describe("takedown", () => {
  it("takes a site down, replaces its content, closes reports and audits; restore lets the owner publish again", async () => {
    const sites = new MemorySiteStore();
    await sites.reserve("owner", "p1", "bad-site", "memory");
    const site = await sites.savePublished("owner", { projectId: "p1", slug: "bad-site", provider: "memory", providerProjectId: "prj", url: "https://bad-site.sites.example", publishedVersion: 1, lastDeploymentId: "d", publishedAt: new Date() });
    const reports = new MemoryReportStore(async (id) => ((await sites.byId(id)) ? { slug: "bad-site", url: null, status: "published" } : null));
    await reports.add({ siteId: site.id, reason: "phishing", details: "asks for PIN", contact: null, reporterKey: "k" });
    const publisher = new MemoryPublishProvider();
    const log: string[] = [];
    const deps = { sites, reports, publisher, audit: async (e: { action: string }) => void log.push(e.action) };

    expect(await takeDownSite(deps, "admin", site.id, "phishing")).toBe("ok");
    expect((await sites.byId(site.id))?.status).toBe("taken_down");
    expect(publisher.published.get("bad-site")!.at(-1)!.data.toString()).toContain("This site is not available");
    expect(await reports.openBySite(10)).toEqual([]);
    // The owner can't republish over a takedown.
    await expect(sites.savePublished("owner", { projectId: "p1", slug: "bad-site", provider: "memory", providerProjectId: "prj", url: null, publishedVersion: 2, lastDeploymentId: "e", publishedAt: new Date() })).rejects.toThrow();

    expect(await restoreSite(deps, "admin", site.id)).toBe("ok");
    expect((await sites.byId(site.id))?.status).toBe("pending");
    expect(log).toEqual(["site.taken_down", "site.restored"]);
    expect(await takeDownSite(deps, "admin", "nope", "x")).toBe("not_found");
  });

  it("the notice page has no scripts and both languages", () => {
    const html = takenDownPage();
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain('lang="am"');
  });

  it("stores and groups reports, and keeps a takedown during a publish (Postgres)", async () => {
    const db = await testDb();
    await makeUser(db, "owner");
    const { DbProjectStore } = await import("@/lib/projects/db-store");
    const project = await new DbProjectStore(db).createProject("owner", { name: "x", locale: "en" });
    const sites = new DbSiteStore(db);
    await sites.reserve("owner", project.id, "shady", "memory");
    const site = (await sites.byAddress("shady"))!;
    const reports = new DbReportStore(db);
    await reports.add({ siteId: site.id, reason: "scam", details: null, contact: "a@b.c", reporterKey: "k1" });
    await reports.add({ siteId: site.id, reason: "phishing", details: "pin", contact: null, reporterKey: "k2" });
    const open = await reports.openBySite(10);
    expect(open[0]).toMatchObject({ slug: "shady", reports: [{}, {}] });
    expect(await dismissReports({ sites, reports, publisher: null, audit: async () => {} }, "admin", site.id)).toBe(2);
    await sites.takeDown(site.id, "scam");
    await expect(sites.savePublished("owner", { projectId: project.id, slug: "shady", provider: "memory", providerProjectId: null, url: null, publishedVersion: 1, lastDeploymentId: null, publishedAt: new Date() })).rejects.toThrow();
  }, 30_000);
});
