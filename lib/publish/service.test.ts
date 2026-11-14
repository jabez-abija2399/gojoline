import { beforeEach, describe, expect, it } from "vitest";
import { MemoryLock } from "@/lib/lock";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { MemorySandboxProvider } from "@/lib/providers/sandbox/memory";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { publishInfo, publishSite, type PublishDeps } from "./service";

const siteTs = `export const site = { name: { en: "Selam Coffee" } }`;
let deps: PublishDeps;
let publisher: MemoryPublishProvider;
const alice = { id: "alice", verified: true };

beforeEach(() => {
  publisher = new MemoryPublishProvider();
  deps = {
    store: new MemoryProjectStore(),
    sites: new MemorySiteStore(),
    sandboxes: new MemorySandboxProvider({ "src/site.ts": siteTs }),
    publisher,
    lock: new MemoryLock(),
    appUrl: "https://gojoline.com",
  };
});

async function projectWithVersion(owner = "alice", files = { "src/site.ts": siteTs }) {
  const p = await deps.store.createProject(owner, { name: "Selam Coffee", locale: "en" });
  await deps.store.addVersion(owner, { projectId: p.id, summary: "v1", files });
  return p;
}

describe("publishSite", () => {
  it("publishes the latest version with a report link and keeps the address", async () => {
    const p = await projectWithVersion();
    expect((await publishInfo(deps, alice, p.id))?.slug).toBe("selam-coffee");
    const r = await publishSite(deps, alice, p.id, "selam-coffee");
    expect(r).toMatchObject({ ok: true, site: { slug: "selam-coffee", url: "https://selam-coffee.sites.example", publishedVersion: 1 } });
    expect(publisher.published.get("selam-coffee")![0]!.data.toString()).toContain("https://gojoline.com/en/report?site=selam-coffee");
    // A second publish ignores a new slug: the address stays.
    const again = await publishSite(deps, alice, p.id, "other-name");
    expect(again.ok && again.site.slug).toBe("selam-coffee");
  });

  it("requires a verified account", async () => {
    const p = await projectWithVersion();
    expect(await publishSite(deps, { id: "alice", verified: false }, p.id, "selam-coffee")).toEqual({ ok: false, error: "unverified" });
  });

  it("rejects bad, reserved and taken addresses", async () => {
    const p = await projectWithVersion();
    expect((await publishSite(deps, alice, p.id, "A B")).ok).toBe(false);
    expect(await publishSite(deps, alice, p.id, "telebirr")).toEqual({ ok: false, error: "slug_reserved" });
    const other = await projectWithVersion("bob");
    await publishSite(deps, { id: "bob", verified: true }, other.id, "taken-name");
    expect(await publishSite(deps, alice, p.id, "taken-name")).toEqual({ ok: false, error: "slug_taken" });
  });

  it("does not publish other owners' projects or empty projects", async () => {
    const p = await projectWithVersion();
    expect(await publishSite(deps, { id: "mallory", verified: true }, p.id, "mine")).toEqual({ ok: false, error: "not_found" });
    const empty = await deps.store.createProject("alice", { name: "", locale: "en" });
    expect(await publishSite(deps, alice, empty.id, "empty-site")).toEqual({ ok: false, error: "no_version" });
  });

  it("blocks sites that fail the safety scan or a guard", async () => {
    const p = await projectWithVersion();
    deps.guards = [{ check: async () => ({ ok: false, reasons: ["impersonation"] }) }];
    expect(await publishSite(deps, alice, p.id, "selam-coffee")).toMatchObject({ ok: false, error: "blocked", reasons: ["impersonation"] });
    expect(publisher.published.size).toBe(0);
  });

  it("refuses while another change is running", async () => {
    const p = await projectWithVersion();
    await deps.lock.acquire(`project:${p.id}`, 60_000);
    expect(await publishSite(deps, alice, p.id, "selam-coffee")).toEqual({ ok: false, error: "busy" });
  });
});
