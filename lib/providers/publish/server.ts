import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, readlink, rename, rm, stat, statfs, symlink, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { getMessages } from "@/lib/i18n";
import { NOTICE_STYLE, escapeHtml } from "@/lib/publish/notice";
import { MAX_FILE_BYTES, MAX_TOTAL_BYTES } from "@/lib/publish/scan";
import type { DomainStatus, PublishInput, PublishProvider, PublishResult } from "./types";

const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const DEPLOYMENT = /^[a-z0-9]{8,40}$/;
/** Room for what is added after the publish checks (the badge). */
const BADGE_ALLOWANCE = 512_000;

export interface ServerPublishConfig {
  /** The sites volume (Caddy serves it read-only), e.g. /srv/sites. */
  sitesDir: string;
  /** Sites live at https://<slug>.<baseDomain>. */
  baseDomain: string;
  /** Publishing stops while the volume has less free space than this (default 2 GB)… */
  minFreeBytes?: number;
  /** …or less than this share of it free (default 10%). */
  minFreeRatio?: number;
  /** Test hook: free and total bytes of the volume. */
  diskSpace?: (dir: string) => Promise<{ free: number; total: number }>;
}

const volumeSpace = async (dir: string) => {
  const s = await statfs(dir);
  return { free: s.bavail * s.bsize, total: s.blocks * s.bsize };
};

interface State {
  deployment: string;
  takedown?: boolean;
}

const providerId = (slug: string) => `srv:${slug}`;
const slugOf = (providerProjectId: string) => {
  const slug = providerProjectId.startsWith("srv:") ? providerProjectId.slice(4) : "";
  if (!SLUG.test(slug)) throw new Error("Hosting project is missing");
  return slug;
};

/** A plain relative path inside the site (the scanner already refuses anything else). */
export function safeRelative(path: string): boolean {
  return Boolean(path) && path.length <= 300 && !path.startsWith("/") && !path.includes("\\") && !path.includes("\0") && !path.split("/").some((p) => p === "" || p === "." || p === "..");
}

/** What a resting site's pages show (both languages, no scripts); served with 503 by Caddy. */
export function restingPage(): string {
  const en = getMessages("en").safety;
  const am = getMessages("am").safety;
  const e = escapeHtml;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(en.restingTitle)}</title><style>${NOTICE_STYLE}</style></head><body><main><section><h1>${e(en.restingTitle)}</h1><p>${e(en.restingBody)}</p></section><section lang="am"><h2>${e(am.restingTitle)}</h2><p>${e(am.restingBody)}</p></section></main></body></html>`;
}

/**
 * Static sites on our own server (deploy/server): files on a Docker volume that Caddy serves at
 * https://<slug>.<baseDomain> (deploy/server/Caddyfile). Layout, per site:
 *   sites/<slug>/<deployment>/…     the built files of one deployment (last 2 kept)
 *   sites/<slug>/current            symlink to the live deployment (switched atomically)
 *   sites/<slug>/state.json         {"deployment", "takedown"?}
 *   sites/<slug>/resting.html       present while the owner has the site offline (Caddy: 503)
 *   sites/<slug>/takedown.flag      present while an admin's notice is live (wins over resting)
 */
export class ServerPublishProvider implements PublishProvider {
  readonly name = "server";
  private root: string;
  private base: string;

  constructor(private config: ServerPublishConfig) {
    this.root = resolve(config.sitesDir);
    this.base = config.baseDomain.toLowerCase().replace(/^\.+|\.+$/g, "");
  }

  urlFor(slug: string) {
    return `https://${slug}.${this.base}`;
  }

  /** The site's folder; the slug is checked first, so the path never leaves the volume. */
  private dir(slug: string) {
    if (!SLUG.test(slug)) throw new Error("Invalid slug");
    const dir = join(this.root, slug);
    if (!dir.startsWith(this.root + sep)) throw new Error("Invalid slug");
    return dir;
  }

  private async state(slug: string): Promise<State | null> {
    try {
      const s = JSON.parse(await readFile(join(this.dir(slug), "state.json"), "utf8")) as State;
      return s && typeof s.deployment === "string" && DEPLOYMENT.test(s.deployment) ? s : null;
    } catch {
      return null;
    }
  }

  /** True while the site has a live deployment (Caddy's certificate check uses the same test). */
  async isLive(slug: string): Promise<boolean> {
    if (!SLUG.test(slug)) return false;
    return stat(join(this.dir(slug), "current", "index.html")).then(() => true, () => false);
  }

  async publish(input: PublishInput): Promise<PublishResult> {
    const { slug } = input;
    const dir = this.dir(slug);
    const saved = input.providerProjectId ?? null;
    if (saved?.startsWith("srv:") && slugOf(saved) !== slug) throw new Error("Hosting project is missing");
    // A brand-new site never takes over files left under the same name. (A site moving here from
    // another host has a saved, non-server ID and may: a takedown notice put up before the move.)
    if (!saved && (await this.state(slug))) throw new Error("slug_taken");

    const files = input.files.filter((f) => safeRelative(f.path));
    // Disk limits per site: the publish checks' caps (plus the badge added after them).
    let total = 0;
    for (const f of files) {
      if (f.data.length > MAX_FILE_BYTES) throw new Error("site_too_large");
      total += f.data.length;
    }
    if (total > MAX_TOTAL_BYTES + BADGE_ALLOWANCE) throw new Error("site_too_large");
    // A full disk would break every site and the app with it: stop publishing well before.
    // (A takedown notice is tiny and always goes through.)
    if (!input.takedown) {
      const { free, total: size } = await (this.config.diskSpace ?? volumeSpace)(this.root);
      if (free - total < (this.config.minFreeBytes ?? 2e9) || free - total < size * (this.config.minFreeRatio ?? 0.1)) {
        console.error(`sites disk almost full: ${Math.round(free / 1e6)} MB free of ${Math.round(size / 1e6)} MB`);
        throw new Error("disk_full");
      }
    }

    const deployment = `${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
    // Written under a temporary name, then renamed: a half-written deployment is never served.
    const tmp = join(dir, `.tmp-${deployment}`);
    await mkdir(tmp, { recursive: true });
    try {
      for (const f of files) {
        const target = resolve(tmp, f.path);
        if (!target.startsWith(tmp + sep)) continue;
        await mkdir(resolve(target, ".."), { recursive: true });
        await writeFile(target, f.data, { mode: 0o644 });
      }
      await rename(tmp, join(dir, deployment));
    } catch (e) {
      await rm(tmp, { recursive: true, force: true });
      throw e;
    }

    if (input.takedown) {
      // The notice wins: mark it before it goes live, and drop any resting page.
      await this.writeAtomic(join(dir, "takedown.flag"), "1");
      await rm(join(dir, "resting.html"), { force: true });
    }
    await this.writeAtomic(join(dir, "state.json"), JSON.stringify({ deployment, ...(input.takedown ? { takedown: true } : {}) }));
    await this.point(dir, deployment);
    if (!input.takedown) await rm(join(dir, "takedown.flag"), { force: true });
    // Keep the previous version (requests already in flight, a quick look back), drop the rest.
    await this.prune(slug, deployment, 1).catch((e: unknown) => console.warn("prune failed", slug, e));
    return { url: this.urlFor(slug), deploymentId: deployment, providerProjectId: providerId(slug) };
  }

  /** Switches `current` to the deployment in one step (a symlink renamed over the old one). */
  private async point(dir: string, deployment: string) {
    const tmp = join(dir, `.current-${randomBytes(4).toString("hex")}`);
    await symlink(deployment, tmp);
    await rename(tmp, join(dir, "current"));
  }

  private async writeAtomic(path: string, data: string) {
    const tmp = `${path}.${randomBytes(4).toString("hex")}.tmp`;
    await writeFile(tmp, data, { mode: 0o644 });
    await rename(tmp, path);
  }

  /** Deletes deployments other than `keep` and the `previous` newest ones before it. */
  private async prune(slug: string, keep: string, previous: number) {
    const dir = this.dir(slug);
    const entries = await readdir(dir, { withFileTypes: true });
    const live = await readlink(join(dir, "current")).catch(() => null);
    const ids = entries.filter((e) => e.isDirectory() && DEPLOYMENT.test(e.name) && e.name !== keep && e.name !== live).map((e) => e.name).sort().reverse();
    // Leftovers of a publish that failed half-way.
    const stale = entries.filter((e) => e.name.startsWith(".tmp-") || e.name.startsWith(".current-")).map((e) => e.name);
    await Promise.all([...ids.slice(previous), ...stale].map((id) => rm(join(dir, id), { recursive: true, force: true })));
  }

  async setResting(providerProjectId: string, resting: boolean, expectDeployment?: string | null): Promise<void> {
    const slug = slugOf(providerProjectId);
    const dir = this.dir(slug);
    const state = await this.state(slug);
    if (!state) throw new Error("Hosting project is missing");
    // A takedown notice is never switched, and a pointer that moved on isn't overwritten.
    if (state.takedown) throw new Error("taken_down");
    if (expectDeployment && state.deployment !== expectDeployment) throw new Error("pointer_changed");
    if (resting) await this.writeAtomic(join(dir, "resting.html"), restingPage());
    else await rm(join(dir, "resting.html"), { force: true });
  }

  async restrictOldDeployments(providerProjectId: string): Promise<void> {
    const slug = slugOf(providerProjectId);
    const state = await this.state(slug);
    if (state) await this.prune(slug, state.deployment, 0);
  }

  /** Removes a site from the server entirely (its address then shows "no site here"). */
  async remove(slug: string): Promise<void> {
    await rm(this.dir(slug), { recursive: true, force: true });
  }

  // Customers' own domains aren't served from our server yet (docs/ROADMAP.md).
  async addDomain(): Promise<DomainStatus> {
    throw new Error("domains_unavailable");
  }
  async checkDomain(): Promise<DomainStatus> {
    throw new Error("domains_unavailable");
  }
  async removeDomain(): Promise<void> {
    // Nothing is ever connected here, so there is nothing to release.
  }
}
