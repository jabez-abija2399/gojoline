import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryCloudStore } from "@/lib/cloud/memory-store";
import { MemoryLock } from "@/lib/lock";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { ServerPublishProvider } from "@/lib/providers/publish/server";
import { MemorySandboxProvider } from "@/lib/providers/sandbox/memory";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import type { Site } from "@/lib/sites/types";
import { planRepublish, runRepublish } from "./republish";
import { publishSite, type PublishDeps } from "./service";

const site = (over: Partial<Site>): Site => ({
  id: over.slug ?? "s",
  projectId: "p",
  ownerId: "o",
  slug: "s",
  provider: "vercel",
  providerProjectId: "prj_1",
  url: "https://gojo-s.vercel.app",
  status: "published",
  publishedVersion: 3,
  lastDeploymentId: "dpl_1",
  customDomain: null,
  siteKey: null,
  publishedAt: new Date(),
  takenDownReason: null,
  ...over,
});

describe("planRepublish (dry run)", () => {
  it("moves live sites on other hosts and skips the rest", () => {
    const plan = planRepublish(
      [
        site({ slug: "on-vercel" }),
        site({ slug: "resting-site", offlineAt: new Date() }),
        site({ slug: "already-here", provider: "server", providerProjectId: "srv:already-here" }),
        site({ slug: "reserved-only", status: "pending", providerProjectId: null, publishedVersion: null }),
        site({ slug: "pending-moved", status: "pending" }),
        site({ slug: "taken-down", status: "taken_down" }),
        site({ slug: "taken-done", status: "taken_down" }),
      ],
      "server",
      "move",
      new Set(["taken-done"]),
    );
    const by = Object.fromEntries(plan.map((i) => [i.slug, i]));
    expect(by["on-vercel"]).toMatchObject({ action: "republish", from: "vercel", url: "https://gojo-s.vercel.app" });
    expect(by["resting-site"]).toMatchObject({ action: "republish", offline: true, note: "version 3, stays offline" });
    expect(by["already-here"]!.action).toBe("skip");
    expect(by["reserved-only"]!.action).toBe("skip");
    expect(by["pending-moved"]!.action).toBe("skip");
    expect(by["taken-down"]!.action).toBe("notice");
    expect(by["taken-done"]!.action).toBe("skip");
    expect(plan.map((i) => i.slug)).toEqual([...plan.map((i) => i.slug)].sort());
  });

  it("forwards old addresses only for sites that moved", () => {
    const plan = planRepublish([site({ slug: "moved", provider: "server", legacyProjectId: "prj_1" }), site({ slug: "done", provider: "server" }), site({ slug: "not-moved" })], "server", "forward");
    expect(plan.map((i) => [i.slug, i.action])).toEqual([["done", "skip"], ["moved", "forward"], ["not-moved", "skip"]]);
  });

  it("never moves a reserved address (and says why)", () => {
    expect(planRepublish([site({ slug: "webmail" })], "server", "move")[0]).toMatchObject({ action: "skip", note: "reserved address: the owner picks a new one" });
  });
});

describe("runRepublish", () => {
  let dir: string;
  let deps: PublishDeps;
  let vercel: MemoryPublishProvider;
  let server: ServerPublishProvider;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "republish-"));
    vercel = Object.assign(new MemoryPublishProvider(), { name: "vercel", urlFor: (s: string) => `https://gojo-${s}.vercel.app` });
    server = new ServerPublishProvider({ sitesDir: dir, baseDomain: "afridea.et" });
    const sites = new MemorySiteStore();
    deps = { store: new MemoryProjectStore(), sites, cloud: new MemoryCloudStore(sites), sandboxes: new MemorySandboxProvider({ "src/site.ts": "x" }), publisher: vercel, lock: new MemoryLock(), appUrl: "https://gojoline.afridea.et" };
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  async function liveOnVercel(slug: string, owner = "alice") {
    const p = await deps.store.createProject(owner, { name: slug, locale: "en" });
    await deps.store.addVersion(owner, { projectId: p.id, summary: "v1", files: { "src/site.json": '{"name": {"en": "Live Cafe"}}' } });
    expect((await publishSite(deps, { id: owner, verified: true }, p.id, slug)).ok).toBe(true);
    // A newer draft the owner hasn't published must not go live.
    await deps.store.addVersion(owner, { projectId: p.id, summary: "v2", files: { "src/site.json": '{"name": {"en": "Draft Cafe"}}' } });
    return p;
  }

  it("republishes the live version to the server, updates the address and keeps it resting", async () => {
    const p = await liveOnVercel("bole-cafe");
    const p2 = await liveOnVercel("resting-cafe", "bob");
    await deps.sites.setOffline("bob", p2.id, true);
    deps.publisher = server;
    deps.legacy = vercel;
    for (const [owner, id] of [["alice", p.id], ["bob", p2.id]] as const) {
      const s = (await deps.sites.getByProject(owner, id))!;
      const [item] = planRepublish([s], "server", "move");
      const r = await runRepublish(deps, s, item!);
      expect(r).toMatchObject({ ok: true, url: `https://${s.slug}.afridea.et` });
    }
    const moved = (await deps.sites.getByProject("alice", p.id))!;
    expect(moved).toMatchObject({ provider: "server", providerProjectId: "srv:bole-cafe", url: "https://bole-cafe.afridea.et", legacyProjectId: "prj_bole-cafe", publishedVersion: 1, status: "published" });
    const html = await readFile(join(dir, "bole-cafe", "current", "index.html"), "utf8");
    expect(html).toContain("Live Cafe");
    expect(html).not.toContain("Draft Cafe");
    expect(await stat(join(dir, "resting-cafe", "resting.html")).then(() => true)).toBe(true);
    // Run again: nothing left to do.
    expect(planRepublish([moved], "server", "move")[0]!.action).toBe("skip");
  });

  it("puts only the notice up for a taken-down site", async () => {
    const p = await liveOnVercel("bad-site");
    const s0 = (await deps.sites.getByProject("alice", p.id))!;
    await (deps.sites as MemorySiteStore).takeDown(s0.id, "fraud");
    deps.publisher = server;
    deps.legacy = vercel;
    const s = (await deps.sites.getByProject("alice", p.id))!;
    const [item] = planRepublish([s], "server", "move");
    expect(item!.action).toBe("notice");
    expect(await runRepublish(deps, s, item!)).toMatchObject({ ok: true });
    expect(await readFile(join(dir, "bad-site", "current", "index.html"), "utf8")).not.toContain("Live Cafe");
    expect(await stat(join(dir, "bad-site", "takedown.flag")).then(() => true)).toBe(true);
    expect((await deps.sites.getByProject("alice", p.id))!.provider).toBe("vercel");
  });
});
