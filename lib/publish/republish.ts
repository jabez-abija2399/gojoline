import "server-only";
import { takenDownPage } from "@/lib/safety/takedown";
import type { Site } from "@/lib/sites/types";
import { publishedSiteHeaders } from "./scan";
import { forwardOldAddress, republishLive, type PublishDeps } from "./service";

/**
 * Moving every site to the current host (scripts/republish-all.mts, through
 * /api/cron/republish). `move`: live sites still on another host are published again from their
 * live version. `forward`: sites that moved get their old address forwarded (once the old host
 * answers again, e.g. Vercel after 2026-12-19).
 */
export type RepublishMode = "move" | "forward";

export type RepublishAction = "republish" | "notice" | "forward" | "skip";

export interface RepublishItem {
  siteId: string;
  slug: string;
  from: string;
  url: string | null;
  action: RepublishAction;
  /** Why a site is skipped, or what will happen. */
  note: string;
  offline: boolean;
}

/** What a run would do for each site (the dry run). Pure: decided from the site rows alone. */
export function planRepublish(sites: Site[], host: string, mode: RepublishMode, liveOnHost: Set<string> = new Set()): RepublishItem[] {
  return sites
    .map((s): RepublishItem => {
      const base = { siteId: s.id, slug: s.slug, from: s.provider, url: s.url, offline: Boolean(s.offlineAt) };
      if (mode === "forward") {
        if (s.provider === host && s.legacyProjectId) return { ...base, action: "forward", note: "old address forwards here" };
        return { ...base, action: "skip", note: s.provider === host ? "nothing left on the old host" : "not moved yet" };
      }
      if (s.provider === host) return { ...base, action: "skip", note: "already here" };
      if (!s.providerProjectId) return { ...base, action: "skip", note: "never published" };
      // Taken down: the content never comes back; the new address shows the notice too.
      if (s.status === "taken_down") return liveOnHost.has(s.slug) ? { ...base, action: "skip", note: "taken down, notice already here" } : { ...base, action: "notice", note: "taken down: notice only" };
      if (s.status !== "published") return { ...base, action: "skip", note: s.status };
      if (s.publishedVersion == null) return { ...base, action: "skip", note: "no published version" };
      return { ...base, action: "republish", note: `version ${s.publishedVersion}${s.offlineAt ? ", stays offline" : ""}` };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export type RepublishResult = { ok: true; url: string | null; note: string } | { ok: false; error: string; reasons?: string[] };

/** Runs one planned item. Safe to repeat: a site already moved is skipped by the plan. */
export async function runRepublish(deps: PublishDeps, site: Site, item: RepublishItem): Promise<RepublishResult> {
  if (item.action === "republish") {
    const r = await republishLive(deps, site.ownerId, site.projectId);
    if (!r.ok) return { ok: false, error: r.error, reasons: r.reasons ?? r.issues?.map((i) => `${i.rule} ${i.file}`) };
    return { ok: true, url: r.site.url, note: r.site.offlineAt ? "published, resting" : "published" };
  }
  if (item.action === "notice") {
    const page = Buffer.from(takenDownPage());
    await deps.publisher.publish({
      slug: site.slug,
      files: [{ path: "index.html", data: page }, { path: "404.html", data: page }],
      headers: publishedSiteHeaders(),
      // The old host's ID: lets the new host take the address for this site's notice.
      providerProjectId: site.providerProjectId,
      takedown: true,
    });
    return { ok: true, url: null, note: "notice up" };
  }
  if (item.action === "forward") {
    if (!deps.legacy) return { ok: false, error: "no_old_host" };
    const done = await forwardOldAddress(deps, site.ownerId, { projectId: site.projectId, slug: site.slug, legacyProjectId: site.legacyProjectId!, url: site.url ?? deps.publisher.urlFor(site.slug) });
    return done ? { ok: true, url: site.url, note: "old address forwards" } : { ok: false, error: "forward_failed" };
  }
  return { ok: true, url: site.url, note: item.note };
}
