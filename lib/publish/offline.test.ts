import { beforeEach, describe, expect, it } from "vitest";
import { MemoryAssetStore } from "@/lib/cloud/assets";
import { MemoryLock } from "@/lib/lock";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { MemorySandboxProvider } from "@/lib/providers/sandbox/memory";
import { MemorySiteSettingsStore } from "@/lib/site-info/store";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { setSiteOffline } from "./offline";
import { SITE_RUNTIME, publishSite, type PublishDeps } from "./service";

const siteTs = `export const site = { name: { en: "Selam Coffee" } }`;
let deps: PublishDeps;
let publisher: MemoryPublishProvider;
let sites: MemorySiteStore;
let built: Record<string, string>[];
const alice = { id: "alice", verified: true };

beforeEach(() => {
  publisher = new MemoryPublishProvider();
  sites = new MemorySiteStore();
  built = [];
  const inner = new MemorySandboxProvider({ "src/site.ts": siteTs });
  deps = {
    store: new MemoryProjectStore(),
    sites,
    sandboxes: {
      ...inner,
      open: async (id, files) => {
        const sb = await inner.open(id, files);
        const build = sb.buildForPublish.bind(sb);
        sb.buildForPublish = async (env) => {
          built.push(env);
          return build(env);
        };
        return sb;
      },
    } as MemorySandboxProvider,
    publisher,
    lock: new MemoryLock(),
    appUrl: "https://gojoline.com",
    settings: new MemorySiteSettingsStore(),
    assets: new MemoryAssetStore(),
  };
});

async function published() {
  const p = await deps.store.createProject("alice", { name: "Selam Coffee", locale: "en" });
  await deps.store.addVersion("alice", { projectId: p.id, summary: "v1", files: { "src/site.ts": siteTs } });
  const r = await publishSite(deps, alice, p.id, "selam-coffee");
  if (!r.ok) throw new Error(r.error);
  return p.id;
}

describe("setSiteOffline", () => {
  it("rests a live site through the host and brings it back", async () => {
    const id = await published();
    const off = await setSiteOffline(deps, "alice", id, true);
    expect(off).toMatchObject({ ok: true, site: { offlineAt: expect.any(Date), status: "published" } });
    expect(publisher.resting.has("prj_selam-coffee")).toBe(true);
    const on = await setSiteOffline(deps, "alice", id, false);
    expect(on).toMatchObject({ ok: true, site: { offlineAt: null } });
    expect(publisher.resting.has("prj_selam-coffee")).toBe(false);
  });

  it("stays resting after a publish while offline", async () => {
    const id = await published();
    await setSiteOffline(deps, "alice", id, true);
    expect((await publishSite(deps, alice, id, "selam-coffee")).ok).toBe(true);
    expect(publisher.resting.has("prj_selam-coffee")).toBe(true);
  });

  it("only works for the owner, on a live site, never on one an admin took down", async () => {
    const id = await published();
    expect(await setSiteOffline(deps, "mallory", id, true)).toEqual({ ok: false, error: "not_found" });
    const site = (await sites.getByProject("alice", id))!;
    await sites.takeDown(site.id, "spam");
    expect(await setSiteOffline(deps, "alice", id, false)).toEqual({ ok: false, error: "taken_down" });
    expect(await setSiteOffline(deps, "alice", id, true)).toEqual({ ok: false, error: "taken_down" });
    const draft = await deps.store.createProject("alice", { name: "Draft", locale: "en" });
    expect(await setSiteOffline(deps, "alice", draft.id, true)).toEqual({ ok: false, error: "not_found" });
  });

  it("still saves the switch when the host can't be told (the live site checks the flag itself)", async () => {
    const id = await published();
    publisher.setResting = async () => {
      throw new Error("R2 down");
    };
    expect(await setSiteOffline(deps, "alice", id, true)).toMatchObject({ ok: true });
    expect((await sites.getByProject("alice", id))?.offlineAt).toBeInstanceOf(Date);
  });
});

describe("publish extras", () => {
  it("records the runtime version and passes the Google and share preview to the build", async () => {
    const p = await deps.store.createProject("alice", { name: "Selam Coffee", locale: "en" });
    await deps.store.addVersion("alice", { projectId: p.id, summary: "v1", files: { "src/site.ts": siteTs } });
    await deps.assets!.add("alice", p.id, { name: "front.webp", mime: "image/webp", width: 10, height: 10, data: Buffer.from("x") });
    await deps.settings!.saveSeo("alice", p.id, { title: { en: "Selam Coffee, Bole" }, image: "front.webp" });
    const r = await publishSite(deps, alice, p.id, "selam-coffee");
    expect(r.ok && r.site.runtimeVersion).toBe(SITE_RUNTIME);
    expect(JSON.parse(built[0]!.VITE_SEO!)).toEqual({ title: { en: "Selam Coffee, Bole" }, image: "/images/front.webp" });
  });
});
