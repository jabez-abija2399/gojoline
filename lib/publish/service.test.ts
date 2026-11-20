import { beforeEach, describe, expect, it } from "vitest";
import { MemoryCloudStore } from "@/lib/cloud/memory-store";
import { MemoryLock } from "@/lib/lock";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { MemorySandboxProvider } from "@/lib/providers/sandbox/memory";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { presetSiteJson } from "@/lib/template/presets";
import { hasExampleDetails, publishInfo, publishSite, type PublishDeps } from "./service";

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

async function projectWithVersion(owner = "alice", files: Record<string, string> = { "src/site.ts": siteTs }) {
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

  it("moves a site to a new host on its next publish; the old address forwards", async () => {
    const p = await projectWithVersion();
    await publishSite(deps, alice, p.id, "selam-coffee");
    const old = publisher;
    const next = Object.assign(new MemoryPublishProvider(), { name: "cloudflare", urlFor: (s: string) => `https://${s}.afridea.et` });
    deps.publisher = next;
    deps.legacy = old;
    const r = await publishSite(deps, alice, p.id, "selam-coffee");
    expect(r).toMatchObject({ ok: true, site: { provider: "cloudflare", url: "https://selam-coffee.afridea.et" } });
    expect(next.published.has("selam-coffee")).toBe(true);
    const forward = old.published.get("selam-coffee")!.map((f) => f.data.toString());
    expect(old.redirects.get("selam-coffee")).toBe("https://selam-coffee.afridea.et");
    expect(forward[0]).toContain('http-equiv="refresh" content="0;url=https://selam-coffee.afridea.et"');
    expect(forward[0]).toContain('<html lang="en">');
    expect(forward[0]).toContain('<section lang="am"><h2>ይህ ድረ-ገጽ ተዛውሯል</h2>');
    expect(forward[0]).not.toMatch(/<script/i);
    // Once moved, publishing no longer touches the old host.
    old.published.clear();
    expect((await publishSite(deps, alice, p.id, "selam-coffee")).ok).toBe(true);
    expect(old.published.size).toBe(0);
  });

  it("a takedown during the move puts the notice on both hosts", async () => {
    const p = await projectWithVersion();
    await publishSite(deps, alice, p.id, "selam-coffee");
    const old = publisher;
    const next = Object.assign(new MemoryPublishProvider(), { name: "cloudflare" });
    const realPublish = next.publish.bind(next);
    let first = true;
    next.publish = async (input) => {
      const r = await realPublish(input);
      if (first) {
        first = false;
        // An admin acts while the new host is being written.
        const site = await deps.sites.getByProject("alice", p.id);
        await (deps.sites as MemorySiteStore).takeDown(site!.id, "scam");
      }
      return r;
    };
    deps.publisher = next;
    deps.legacy = old;
    expect(await publishSite(deps, alice, p.id, "selam-coffee")).toEqual({ ok: false, error: "taken_down" });
    expect(next.published.get("selam-coffee")![0]!.data.toString()).toContain("This site is not available");
    expect(old.published.get("selam-coffee")![0]!.data.toString()).toContain("This site is not available");
  });

  it("keeps the old host on record until its forward works; takedowns reach it meanwhile", async () => {
    const p = await projectWithVersion();
    await publishSite(deps, alice, p.id, "selam-coffee");
    const old = publisher;
    const oldId = (await deps.sites.getByProject("alice", p.id))!.providerProjectId;
    const next = Object.assign(new MemoryPublishProvider(), { name: "cloudflare" });
    const realOld = old.publish.bind(old);
    old.publish = async () => {
      throw new Error("vercel down");
    };
    deps.publisher = next;
    deps.legacy = old;
    expect((await publishSite(deps, alice, p.id, "selam-coffee")).ok).toBe(true);
    expect((await deps.sites.getByProject("alice", p.id))!.legacyProjectId).toBe(oldId);
    // The next publish retries the forward, then forgets the old host.
    old.publish = realOld;
    expect((await publishSite(deps, alice, p.id, "selam-coffee")).ok).toBe(true);
    expect(old.redirects.get("selam-coffee")).toBe("https://selam-coffee.sites.example");
    expect((await deps.sites.getByProject("alice", p.id))!.legacyProjectId).toBeNull();
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

  it("keeps to the plan's number of live sites", async () => {
    const a = await projectWithVersion();
    const b = await projectWithVersion();
    deps.entitlements = async () => ({ plan: "free", customDomain: false, maxSites: 1, badge: true, telegramNotify: false, telegramEdits: false, answersPerMonth: 100, storageBytes: 50 * 1024 * 1024, siteDownload: false });
    expect((await publishSite(deps, alice, a.id, "site-one")).ok).toBe(true);
    expect(await publishSite(deps, alice, b.id, "site-two")).toEqual({ ok: false, error: "plan_limit" });
    // Republishing the existing site is always fine.
    expect((await publishSite(deps, alice, a.id, "site-one")).ok).toBe(true);
  });

  it("Free sites carry the badge linking to Gojoline's own address; paid plans don't", async () => {
    const free = { plan: "free" as const, customDomain: false, maxSites: 3, badge: true, telegramNotify: false, telegramEdits: false, answersPerMonth: 100, storageBytes: 1, siteDownload: false };
    deps.appUrl = "https://gojoline.afridea.et";
    deps.entitlements = async () => free;
    const p = await projectWithVersion();
    expect((await publishSite(deps, alice, p.id, "selam-coffee")).ok).toBe(true);
    const html = publisher.published.get("selam-coffee")![0]!.data.toString();
    expect(html).toContain('<a href="https://gojoline.afridea.et/en?ref=site_selam-coffee&amp;utm_source=gojoline_badge&amp;utm_medium=referral&amp;utm_campaign=made_with" lang="en">');
    expect(html.indexOf("<gojoline-badge")).toBeGreaterThan(html.indexOf("<footer>"));
    expect(html).not.toContain("https://gojoline.com");
    deps.entitlements = async () => ({ ...free, plan: "starter", badge: false });
    expect((await publishSite(deps, alice, p.id, "selam-coffee")).ok).toBe(true);
    expect(publisher.published.get("selam-coffee")![0]!.data.toString()).not.toContain("gojoline-badge");
  });

  it("a Free site's styles may not name the badge", async () => {
    const p = await projectWithVersion("alice", { "src/site.ts": siteTs, "src/styles.css": "gojoline-badge{display:none}" });
    expect(await publishSite(deps, alice, p.id, "selam-coffee")).toMatchObject({ ok: false, error: "blocked", issues: [{ rule: "badge-hidden" }] });
    expect(publisher.published.size).toBe(0);
    // A paid plan has no badge to protect.
    deps.entitlements = async () => ({ plan: "starter", customDomain: true, maxSites: 1, badge: false, telegramNotify: true, telegramEdits: false, answersPerMonth: 100, storageBytes: 1, siteDownload: false });
    expect((await publishSite(deps, alice, p.id, "selam-coffee")).ok).toBe(true);
  });

  describe("forms", () => {
    const formSite = (form: Record<string, unknown>) =>
      JSON.stringify({ business: { phone: "+251 911 234 567" }, pages: [{ path: "/", sections: [form] }] });
    const booking = {
      type: "form",
      id: "booking",
      kind: "booking",
      eyebrow: { en: "Book a table" },
      heading: { en: "Reserve" },
      fields: [{ name: "name", label: { en: "Name" }, type: "text", required: true }],
      submitLabel: { en: "Send" },
      successMessage: { en: "Thanks" },
    };

    it("registers a form with a label above it (eyebrow) at publish", async () => {
      const sites = deps.sites as MemorySiteStore;
      const cloud = new MemoryCloudStore(sites);
      deps.cloud = cloud;
      const p = await projectWithVersion("alice", { "src/site.ts": siteTs, "src/site.json": formSite(booking) });
      const r = await publishSite(deps, alice, p.id, "selam-coffee");
      expect(r.ok).toBe(true);
      expect((await cloud.getForm(r.ok ? r.site.id : "", "booking"))?.eyebrow).toEqual({ en: "Book a table" });
    });

    it("stops before deploying when a form can't be registered (never a live site with a broken form)", async () => {
      deps.cloud = new MemoryCloudStore(deps.sites as MemorySiteStore);
      const p = await projectWithVersion("alice", { "src/site.ts": siteTs, "src/site.json": formSite({ ...booking, fields: [] }) });
      expect(await publishSite(deps, alice, p.id, "selam-coffee")).toEqual({ ok: false, error: "form_invalid" });
      expect(publisher.published.size).toBe(0);
    });
  });

  it("won't publish template placeholders", async () => {
    const p = await projectWithVersion("alice", { "src/site.json": JSON.stringify({ name: { en: "A" }, business: { phone: "+251 911 000 000" } }) });
    expect(await publishSite(deps, alice, p.id, "example-site")).toEqual({ ok: false, error: "unfinished" });
    expect(hasExampleDetails(JSON.stringify({ x: "Account: [account number]", n: [1, 2] }))).toBe(true);
    expect(hasExampleDetails(JSON.stringify({ x: "Call +251 911 234 567", n: [1, 2], o: ["a"] }))).toBe(false);
    // The starters' example Telegram names: anyone could register them and receive the site's customers.
    expect(hasExampleDetails(JSON.stringify({ business: { phone: "+251 911 234 567", telegram: "yourbusiness" } }))).toBe(true);
    expect(hasExampleDetails(JSON.stringify({ business: { telegram: "@BoleBunaHouse" } }))).toBe(true);
    expect(hasExampleDetails(JSON.stringify({ a: { href: "https://t.me/yourchurch" } }))).toBe(true);
    expect(hasExampleDetails(JSON.stringify({ business: { telegram: "selamcoffee" } }))).toBe(false);
    expect(hasExampleDetails(JSON.stringify({ a: { label: { en: "Call 0911 000 000" } } }))).toBe(true);
  });
  it("blocks a template's reviews and people, and named people on sample photos", () => {
    const site = (sections: unknown[]) => JSON.stringify({ business: { phone: "+251 911 234 567" }, pages: [{ path: "/", sections }] });
    const clinic = JSON.parse(presetSiteJson("clinic")) as { pages: { sections: { type: string; layout?: string; items?: { quote?: { en: string }; title?: { en: string } }[] }[] }[] };
    const all = clinic.pages.flatMap((p) => p.sections);
    const review = all.find((s) => s.type === "testimonials")!.items![0]!.quote!;
    const doctor = all.find((s) => s.type === "cards" && s.layout === "people")!.items![0]!.title!;
    expect(hasExampleDetails(site([{ type: "testimonials", items: [{ quote: review, name: "Someone" }] }]))).toBe(true);
    expect(hasExampleDetails(site([{ type: "cards", layout: "people", items: [{ title: doctor }] }]))).toBe(true);
    expect(hasExampleDetails(site([{ type: "cards", layout: "people", items: [{ title: { en: "Dr. Real Name" }, image: { src: "/stock/clinic-card-doctor-portrait.webp" } }] }]))).toBe(true);
    expect(hasExampleDetails(site([{ type: "quote", quote: { en: "Our own words" }, name: { en: "The owner" }, image: { src: "/stock/ngo-card-woman-farmer.webp" } }]))).toBe(true);
    const ngo = JSON.parse(presetSiteJson("ngo")) as { pages: { sections: { type: string; goal?: unknown }[] }[] };
    const give = ngo.pages.flatMap((p) => p.sections).find((s) => s.type === "give" && s.goal);
    if (give) {
      expect(hasExampleDetails(site([give]))).toBe(true);
      expect(hasExampleDetails(site([{ ...give, goal: { raised: { amountMinor: 1, currency: "ETB" }, target: { amountMinor: 2, currency: "ETB" } } }]))).toBe(false);
    }
    expect(hasExampleDetails(site([{ type: "cards", layout: "people", items: [{ title: { en: "Dr. Real Name" }, image: { src: "/images/me.webp" } }] }, { type: "testimonials", items: [{ quote: { en: "A real review" }, name: "A." }] }, { type: "cards", layout: "grid", items: [{ title: { en: "Room" }, image: { src: "/stock/hotel-card-standard-room.webp" } }] }]))).toBe(false);
  });

  it("refuses while another change is running", async () => {
    const p = await projectWithVersion();
    await deps.lock.acquire(`project:${p.id}`, 60_000);
    expect(await publishSite(deps, alice, p.id, "selam-coffee")).toEqual({ ok: false, error: "busy" });
  });
});
