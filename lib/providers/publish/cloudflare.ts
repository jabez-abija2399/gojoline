import "server-only";
import { randomBytes } from "node:crypto";
import type { DnsRecord } from "@/lib/sites/domain";
import type { StorageProvider } from "@/lib/providers/storage/types";
import type { DomainStatus, PublishFile, PublishProvider, PublishResult } from "./types";

const API = "https://api.cloudflare.com/client/v4";
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
/** Second-level labels under which registrations sit one level deeper (example.com.et). */
const SECOND_LEVEL = new Set(["com", "co", "org", "net", "gov", "edu", "ac", "info", "biz"]);

export interface CloudflarePublishConfig {
  storage: StorageProvider;
  /** Sites live at https://<slug>.<baseDomain> (a zone on this Cloudflare account). */
  baseDomain: string;
  /** API token for connecting customers' own domains (Cloudflare for SaaS custom hostnames). */
  apiToken?: string;
  /** Zone ID of baseDomain; looked up by name when missing. */
  zoneId?: string;
  fetchImpl?: typeof fetch;
}

interface CustomHostname {
  id: string;
  hostname: string;
  status?: string;
  ssl?: { status?: string };
  ownership_verification?: { type?: string; name?: string; value?: string };
}

/** The registrable part of a hostname (good enough without the Public Suffix List). */
export function apexOf(domain: string): string {
  const parts = domain.split(".");
  const n = parts[parts.length - 1]!.length === 2 && parts.length >= 3 && SECOND_LEVEL.has(parts[parts.length - 2]!) ? 3 : 2;
  return parts.slice(-n).join(".");
}

const providerId = (slug: string) => `cf:${slug}`;
const slugOf = (providerProjectId: string) => {
  const slug = providerProjectId.startsWith("cf:") ? providerProjectId.slice(3) : "";
  if (!SLUG.test(slug)) throw new Error("Hosting project is missing");
  return slug;
};

/**
 * Static sites in R2, served by the `gojoline-sites` Worker (workers/sites/worker.ts) on
 * `*.<baseDomain>` and on connected domains. Layout: see the worker.
 */
export class CloudflarePublishProvider implements PublishProvider {
  readonly name = "cloudflare";
  private storage: StorageProvider;
  private base: string;
  private fetch: typeof fetch;
  private zone: string | undefined;

  constructor(private config: CloudflarePublishConfig) {
    this.storage = config.storage;
    this.base = config.baseDomain.toLowerCase().replace(/^\.+|\.+$/g, "");
    this.fetch = config.fetchImpl ?? fetch;
    this.zone = config.zoneId;
  }

  /** Where connected domains point (a proxied name in our zone; see scripts/cloudflare-setup.mjs). */
  get domainTarget() {
    return `domains.${this.base}`;
  }

  urlFor(slug: string) {
    return `https://${slug}.${this.base}`;
  }

  private hostKey(host: string) {
    return `hosts/${host}.json`;
  }

  private async hostSite(host: string): Promise<string | null> {
    const raw = await this.storage.get(this.hostKey(host));
    if (!raw) return null;
    try {
      return (JSON.parse(raw.toString()) as { site?: string }).site ?? null;
    } catch {
      return null;
    }
  }

  private async current(slug: string): Promise<string | null> {
    const raw = await this.storage.get(`sites/${slug}/current.json`);
    if (!raw) return null;
    try {
      return (JSON.parse(raw.toString()) as { deployment?: string }).deployment ?? null;
    } catch {
      return null;
    }
  }

  async publish(input: { slug: string; files: PublishFile[]; headers: { key: string; value: string }[]; providerProjectId?: string | null }): Promise<PublishResult> {
    const { slug } = input;
    if (!SLUG.test(slug)) throw new Error("Invalid slug");
    const saved = input.providerProjectId ?? null;
    if (saved?.startsWith("cf:") && slugOf(saved) !== slug) throw new Error("Hosting project is missing");
    const host = `${slug}.${this.base}`;
    const owner = await this.hostSite(host);
    if (owner && owner !== slug) throw new Error("slug_taken");
    // A brand-new site never takes over files someone else left under the same name. (A site
    // moving here from the Vercel fallback has a saved, non-Cloudflare ID and may.)
    if (!saved && (await this.current(slug))) throw new Error("slug_taken");

    const deployment = `${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
    const root = `sites/${slug}/d/${deployment}/`;
    // Defence in depth: only plain relative paths (the scanner already refuses anything else).
    const files = input.files.filter((f) => f.path && !f.path.startsWith("/") && !f.path.split("/").some((p) => p === ".." || p === "." || p === "") && !f.path.includes("\\"));
    let next = 0;
    const worker = async () => {
      while (next < files.length) {
        const f = files[next++]!;
        await this.storage.put(root + f.path, f.data, { contentType: contentTypeOf(f.path) });
      }
    };
    await Promise.all(Array.from({ length: Math.min(8, files.length) }, worker));

    // Switching the pointer makes the new version live everywhere at once.
    await this.storage.put(`sites/${slug}/current.json`, JSON.stringify({ deployment, headers: input.headers }), { contentType: "application/json", cacheControl: "no-store" });
    if (!owner) await this.storage.put(this.hostKey(host), JSON.stringify({ site: slug }), { contentType: "application/json" });
    // Keep the previous version a little longer (requests already in flight), drop the rest.
    await this.prune(slug, deployment, 1).catch((e: unknown) => console.warn("prune failed", slug, e));
    return { url: this.urlFor(slug), deploymentId: deployment, providerProjectId: providerId(slug) };
  }

  /** Deletes deployments other than `keep` and the `previous` newest ones before it. */
  private async prune(slug: string, keep: string, previous: number) {
    const { prefixes } = await this.storage.list(`sites/${slug}/d/`, { delimiter: "/" });
    const ids = prefixes.map((p) => p.slice(`sites/${slug}/d/`.length, -1)).filter((id) => id !== keep).sort().reverse();
    for (const id of ids.slice(previous)) {
      const { keys } = await this.storage.list(`sites/${slug}/d/${id}/`);
      for (const k of keys) await this.storage.delete(k);
    }
  }

  async restrictOldDeployments(providerProjectId: string): Promise<void> {
    const slug = slugOf(providerProjectId);
    const keep = await this.current(slug);
    if (keep) await this.prune(slug, keep, 0);
  }

  // ---- Connected domains (Cloudflare for SaaS custom hostnames) ----

  private async api<T>(method: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number; result: T; codes: number[] }> {
    if (!this.config.apiToken) throw new Error("domains_unavailable");
    const res = await this.fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.config.apiToken}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; result?: T; errors?: { code: number }[] };
    return { ok: res.ok && data.success !== false, status: res.status, result: data.result as T, codes: (data.errors ?? []).map((e) => e.code) };
  }

  private async zoneId(): Promise<string> {
    if (this.zone) return this.zone;
    const r = await this.api<{ id: string }[]>("GET", `/zones?name=${encodeURIComponent(this.base)}`);
    const id = r.ok ? r.result?.[0]?.id : undefined;
    if (!id) throw new Error(`zone_missing:${r.status}`);
    this.zone = id;
    return id;
  }

  private async findHostname(domain: string): Promise<CustomHostname | null> {
    const z = await this.zoneId();
    const r = await this.api<CustomHostname[]>("GET", `/zones/${z}/custom_hostnames?hostname=${encodeURIComponent(domain)}`);
    if (!r.ok) throw new Error(`domain_failed:${r.status}`);
    return r.result?.find((h) => h.hostname === domain) ?? null;
  }

  private status(domain: string, h: CustomHostname): DomainStatus {
    const apex = apexOf(domain);
    const records: DnsRecord[] = [{ type: "CNAME", name: domain === apex ? "@" : domain.slice(0, -(apex.length + 1)), value: this.domainTarget }];
    const own = h.ownership_verification;
    if (own?.type === "txt" && own.name && own.value) records.push({ type: "TXT", name: own.name.endsWith(`.${apex}`) ? own.name.slice(0, -(apex.length + 1)) : own.name, value: own.value });
    return { status: h.status === "active" && h.ssl?.status === "active" ? "active" : "pending", records };
  }

  private ours(domain: string) {
    return domain === this.base || domain.endsWith(`.${this.base}`);
  }

  async addDomain(providerProjectId: string, domain: string): Promise<DomainStatus> {
    const slug = slugOf(providerProjectId);
    if (this.ours(domain)) throw new Error("domain_in_use");
    const owner = await this.hostSite(domain);
    if (owner && owner !== slug) throw new Error("domain_in_use");
    const z = await this.zoneId();
    const created = await this.api<CustomHostname>("POST", `/zones/${z}/custom_hostnames`, { hostname: domain, ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } } });
    let h: CustomHostname | null = created.ok ? created.result : null;
    if (!h) {
      // 1406: already registered in our zone, by an earlier attempt. The database claim (taken
      // atomically before this call) says the domain is this site's; another site's mapping was
      // refused above.
      if (!created.codes.includes(1406)) throw new Error(`domain_failed:${created.codes[0] ?? created.status}`);
      h = await this.findHostname(domain);
      if (!h) throw new Error("domain_failed:missing");
    }
    await this.storage.put(this.hostKey(domain), JSON.stringify({ site: slug }), { contentType: "application/json" });
    return this.status(domain, h);
  }

  async checkDomain(providerProjectId: string, domain: string): Promise<DomainStatus> {
    const slug = slugOf(providerProjectId);
    const h = await this.findHostname(domain);
    if (!h || (await this.hostSite(domain)) !== slug) throw new Error("domain_missing");
    return this.status(domain, h);
  }

  async removeDomain(providerProjectId: string, domain: string): Promise<void> {
    const slug = slugOf(providerProjectId);
    const owner = await this.hostSite(domain);
    if (owner && owner !== slug) return;
    const h = await this.findHostname(domain);
    if (h) {
      const z = await this.zoneId();
      const r = await this.api("DELETE", `/zones/${z}/custom_hostnames/${encodeURIComponent(h.id)}`);
      if (!r.ok && r.status !== 404) throw new Error(`domain_remove_failed:${r.status}`);
    }
    if (owner === slug) await this.storage.delete(this.hostKey(domain));
  }
}

const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", json: "application/json",
  svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", avif: "image/avif", ico: "image/x-icon",
  woff2: "font/woff2", woff: "font/woff", txt: "text/plain; charset=utf-8", xml: "application/xml", webmanifest: "application/manifest+json",
};
const contentTypeOf = (path: string) => TYPES[/\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase() ?? ""] ?? "application/octet-stream";
