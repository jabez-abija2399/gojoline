import { mkdtemp, readFile, readdir, readlink, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ServerPublishProvider, safeRelative } from "./server";

let dir: string;
let host: ServerPublishProvider;
const page = (s: string) => ({ path: "index.html", data: Buffer.from(s) });
const exists = (p: string) => stat(p).then(() => true, () => false);

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "sites-"));
  host = new ServerPublishProvider({ sitesDir: dir, baseDomain: "afridea.et" });
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("ServerPublishProvider", () => {
  it("writes a deployment and points current at it", async () => {
    const r = await host.publish({ slug: "bole-cafe", files: [page("v1"), { path: "assets/a.js", data: Buffer.from("js") }], headers: [] });
    expect(r).toMatchObject({ url: "https://bole-cafe.afridea.et", providerProjectId: "srv:bole-cafe" });
    expect(await readlink(join(dir, "bole-cafe", "current"))).toBe(r.deploymentId);
    expect(await readFile(join(dir, "bole-cafe", "current", "assets", "a.js"), "utf8")).toBe("js");
    expect(await host.isLive("bole-cafe")).toBe(true);
    expect(await host.isLive("other-site")).toBe(false);
  });

  it("switches the pointer on the next publish and keeps only the last two deployments", async () => {
    const ids: string[] = [];
    for (let i = 1; i <= 4; i++) {
      ids.push((await host.publish({ slug: "bole-cafe", files: [page(`v${i}`)], headers: [], providerProjectId: i > 1 ? "srv:bole-cafe" : null })).deploymentId);
      await new Promise((r) => setTimeout(r, 2));
    }
    expect(await readFile(join(dir, "bole-cafe", "current", "index.html"), "utf8")).toBe("v4");
    const left = (await readdir(join(dir, "bole-cafe"))).filter((n) => /^[a-z0-9]{8,}$/.test(n)).sort();
    expect(left).toEqual([ids[2], ids[3]].sort());
    await host.restrictOldDeployments("srv:bole-cafe");
    expect((await readdir(join(dir, "bole-cafe"))).filter((n) => /^[a-z0-9]{8,}$/.test(n))).toEqual([ids[3]]);
  });

  it("refuses a brand-new site over someone else's files, and a mismatched saved ID", async () => {
    await host.publish({ slug: "bole-cafe", files: [page("a")], headers: [] });
    await expect(host.publish({ slug: "bole-cafe", files: [page("b")], headers: [] })).rejects.toThrow("slug_taken");
    await expect(host.publish({ slug: "bole-cafe", files: [page("b")], headers: [], providerProjectId: "srv:other-site" })).rejects.toThrow("Hosting project is missing");
    // A site moving from another host (saved Vercel ID) may take over its own address.
    await expect(host.publish({ slug: "bole-cafe", files: [page("c")], headers: [], providerProjectId: "prj_abc" })).resolves.toBeTruthy();
  });

  it("never writes outside the volume", async () => {
    for (const slug of ["../etc", "a/b", "..", "UPPER", ""]) await expect(host.publish({ slug, files: [page("x")], headers: [] })).rejects.toThrow();
    const r = await host.publish({ slug: "safe-site", files: [page("ok"), { path: "../../evil.html", data: Buffer.from("x") }, { path: "/abs.html", data: Buffer.from("x") }, { path: "a\\b", data: Buffer.from("x") }], headers: [] });
    expect(await readdir(join(dir, "safe-site", r.deploymentId))).toEqual(["index.html"]);
    expect(await exists(join(dir, "..", "evil.html"))).toBe(false);
    expect(safeRelative("assets/x.js")).toBe(true);
    expect(safeRelative("assets/../x.js")).toBe(false);
    await expect(host.setResting("srv:../x", true)).rejects.toThrow();
  });

  it("refuses sites over the publish size caps", async () => {
    await expect(host.publish({ slug: "big-site", files: [{ path: "index.html", data: Buffer.alloc(2_000_001) }], headers: [] })).rejects.toThrow("site_too_large");
    const many = Array.from({ length: 9 }, (_, i) => ({ path: `p${i}.bin`, data: Buffer.alloc(1_900_000) }));
    await expect(host.publish({ slug: "big-site", files: many, headers: [] })).rejects.toThrow("site_too_large");
    expect(await exists(join(dir, "big-site", "current"))).toBe(false);
  });

  it("rests and wakes the site, and a new publish keeps it resting", async () => {
    const r = await host.publish({ slug: "bole-cafe", files: [page("v1")], headers: [] });
    await host.setResting(r.providerProjectId, true, r.deploymentId);
    const resting = await readFile(join(dir, "bole-cafe", "resting.html"), "utf8");
    expect(resting).toContain("This site is resting");
    expect(resting).toContain('lang="am"');
    await expect(host.setResting(r.providerProjectId, false, "stale0000")).rejects.toThrow("pointer_changed");
    await host.publish({ slug: "bole-cafe", files: [page("v2")], headers: [], providerProjectId: r.providerProjectId });
    expect(await exists(join(dir, "bole-cafe", "resting.html"))).toBe(true);
    await host.setResting(r.providerProjectId, false);
    expect(await exists(join(dir, "bole-cafe", "resting.html"))).toBe(false);
  });

  it("takedown wins over resting and can't be switched by the owner", async () => {
    const r = await host.publish({ slug: "bole-cafe", files: [page("content")], headers: [] });
    await host.setResting(r.providerProjectId, true);
    await host.publish({ slug: "bole-cafe", files: [page("notice"), { path: "404.html", data: Buffer.from("notice") }], headers: [], providerProjectId: r.providerProjectId, takedown: true });
    expect(await readFile(join(dir, "bole-cafe", "current", "index.html"), "utf8")).toBe("notice");
    expect(await exists(join(dir, "bole-cafe", "takedown.flag"))).toBe(true);
    expect(await exists(join(dir, "bole-cafe", "resting.html"))).toBe(false);
    await expect(host.setResting(r.providerProjectId, true)).rejects.toThrow("taken_down");
    await expect(host.setResting(r.providerProjectId, false)).rejects.toThrow("taken_down");
    await host.restrictOldDeployments(r.providerProjectId);
    expect((await readdir(join(dir, "bole-cafe"))).filter((n) => /^[a-z0-9]{8,}$/.test(n))).toHaveLength(1);
    // Restored and published again: the notice goes.
    await host.publish({ slug: "bole-cafe", files: [page("back")], headers: [], providerProjectId: r.providerProjectId });
    expect(await exists(join(dir, "bole-cafe", "takedown.flag"))).toBe(false);
  });

  it("removes a site, and says custom domains aren't served here yet", async () => {
    await host.publish({ slug: "bole-cafe", files: [page("v1")], headers: [] });
    await host.remove("bole-cafe");
    expect(await exists(join(dir, "bole-cafe"))).toBe(false);
    await expect(host.addDomain()).rejects.toThrow("domains_unavailable");
    await expect(host.removeDomain()).resolves.toBeUndefined();
  });
});
