import { beforeEach, describe, expect, it } from "vitest";
import { inflateRawSync } from "node:zlib";
import { entitlementsOf } from "@/lib/billing/plans";
import { MemoryLock } from "@/lib/lock";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { MemorySandboxProvider } from "@/lib/providers/sandbox/memory";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { downloadSite } from "./download";
import { publishSite, type PublishDeps } from "./service";

const siteJson = (name: string) => JSON.stringify({ name: { en: name } }, null, 1);
let deps: PublishDeps;
const alice = { id: "alice", verified: true };
let plan: "free" | "starter" | "business";

/** The files in a ZIP made by createZip (local headers walked in order). */
function unzip(zip: Buffer): Map<string, string> {
  const out = new Map<string, string>();
  let at = 0;
  while (zip.readUInt32LE(at) === 0x04034b50) {
    const method = zip.readUInt16LE(at + 8);
    const size = zip.readUInt32LE(at + 18);
    const nameLen = zip.readUInt16LE(at + 26);
    const name = zip.subarray(at + 30, at + 30 + nameLen).toString("utf8");
    const body = zip.subarray(at + 30 + nameLen, at + 30 + nameLen + size);
    out.set(name, (method === 8 ? inflateRawSync(body) : body).toString("utf8"));
    at += 30 + nameLen + size;
  }
  return out;
}

beforeEach(() => {
  plan = "business";
  deps = {
    store: new MemoryProjectStore(),
    sites: new MemorySiteStore(),
    sandboxes: new MemorySandboxProvider({}),
    publisher: new MemoryPublishProvider(),
    lock: new MemoryLock(),
    appUrl: "https://gojoline.com",
    entitlements: async () => entitlementsOf(plan),
  };
});

async function published() {
  const p = await deps.store.createProject("alice", { name: "Selam Coffee", locale: "en" });
  await deps.store.addVersion("alice", { projectId: p.id, summary: "v1", files: { "src/site.json": siteJson("Selam Coffee") } });
  expect((await publishSite(deps, alice, p.id, "selam-coffee")).ok).toBe(true);
  return p;
}

describe("downloadSite", () => {
  it("gives a Business owner the live version as a ZIP with a README, never a newer draft", async () => {
    const p = await published();
    await deps.store.addVersion("alice", { projectId: p.id, summary: "draft", files: { "src/site.json": siteJson("Unpublished Draft") } });
    const r = await downloadSite(deps, "alice", p.id);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.filename).toBe("selam-coffee-website.zip");
    const files = unzip(r.zip);
    expect(files.get("README.txt")).toContain("public_html");
    const page = files.get("index.html")!;
    expect(page).toContain("Selam Coffee");
    expect(page).not.toContain("Unpublished Draft");
    // Built output only: the source files are not in it.
    expect([...files.keys()].some((k) => k.startsWith("src/"))).toBe(false);
  });

  it("is for the Business plan only", async () => {
    const p = await published();
    for (const other of ["free", "starter"] as const) {
      plan = other;
      expect(await downloadSite(deps, "alice", p.id)).toEqual({ ok: false, error: "plan_required" });
    }
  });

  it("needs a published site, and never another owner's", async () => {
    const p = await deps.store.createProject("alice", { name: "Draft", locale: "en" });
    await deps.store.addVersion("alice", { projectId: p.id, summary: "v1", files: { "src/site.json": siteJson("Draft") } });
    expect(await downloadSite(deps, "alice", p.id)).toEqual({ ok: false, error: "not_published" });
    const live = await published();
    expect(await downloadSite(deps, "mallory", live.id)).toEqual({ ok: false, error: "not_found" });
  });

  it("refuses a taken-down site and a site being built", async () => {
    const p = await published();
    const site = (await deps.sites.getByProject("alice", p.id))!;
    const token = await deps.lock.acquire(`project:${p.id}`, 60_000);
    expect(await downloadSite(deps, "alice", p.id)).toEqual({ ok: false, error: "busy" });
    await deps.lock.release(`project:${p.id}`, token!);
    await (deps.sites as MemorySiteStore).takeDown(site.id, "scam");
    expect(await downloadSite(deps, "alice", p.id)).toEqual({ ok: false, error: "taken_down" });
  });

  it("refuses a site taken down while it built, and content the publish checks would stop", async () => {
    const p = await published();
    const site = (await deps.sites.getByProject("alice", p.id))!;
    deps.guards = [{ check: async () => ({ ok: false, reasons: ["phishing"] }) }];
    expect(await downloadSite(deps, "alice", p.id)).toEqual({ ok: false, error: "blocked" });
    deps.guards = [{ check: async () => { await (deps.sites as MemorySiteStore).takeDown(site.id, "scam"); return { ok: true }; } }];
    expect(await downloadSite(deps, "alice", p.id)).toEqual({ ok: false, error: "taken_down" });
  });
});
