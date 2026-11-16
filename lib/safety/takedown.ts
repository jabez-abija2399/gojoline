import { reportError } from "@/lib/observability/report";
import { getMessages } from "@/lib/i18n";
import type { PublishProvider } from "@/lib/providers/publish/types";
import { publishedSiteHeaders } from "@/lib/publish/scan";
import { noticeTargets } from "@/lib/publish/hosts";
import { NOTICE_STYLE, escapeHtml } from "@/lib/publish/notice";
import type { SiteAdminStore } from "@/lib/sites/types";
import type { Lock } from "@/lib/lock";
import type { ReportStore } from "./reports";

export interface ModerationDeps {
  sites: SiteAdminStore;
  reports: ReportStore;
  publisher: PublishProvider | null;
  /** The previous host (sites not moved yet still live there). */
  legacy?: PublishProvider | null;
  audit: (entry: { actorId: string; action: string; targetType: string; targetId: string; data?: Record<string, unknown> }) => Promise<void>;
  /** The project lock publishing and the owner's offline switch hold, so they can't interleave with a takedown. */
  lock?: Lock;
  /** Drops cached copies of the site (the public Data API's one-minute cache). */
  invalidate?: (projectId: string) => void;
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://gojoline.afridea.et").replace(/\/$/, "");


/** The page a taken-down site shows instead of its content (both languages, no scripts). */
export function takenDownPage(): string {
  const en = getMessages("en").safety;
  const am = getMessages("am").safety;
  const e = escapeHtml;
  // Brand colours (ink on paper); no scripts; both languages, each with a way back to Gojoline.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${e(en.downTitle)}</title>
<style>${NOTICE_STYLE}</style></head>
<body><main><section><h1>${e(en.downTitle)}</h1><p>${e(en.downBody)}</p><p>${e(en.downOwner)}</p><a href="${e(APP_URL)}/en/sign-in">${e(en.downLink)}</a></section>
<section lang="am"><h2>${e(am.downTitle)}</h2><p>${e(am.downBody)}</p><p>${e(am.downOwner)}</p><a href="${e(APP_URL)}/am/sign-in">${e(am.downLink)}</a></section></main></body></html>`;
}

export type ModerationResult = "ok" | "not_found" | "deploy_failed";

/**
 * Takes a site down: the database first (its forms stop at once), then the live content is
 * replaced with a notice. Safe to repeat if replacing the content failed.
 */
export async function takeDownSite(deps: ModerationDeps, adminId: string, siteId: string, reason: string): Promise<ModerationResult> {
  const site = await deps.sites.byId(siteId);
  if (!site || !(await deps.sites.takeDown(siteId, reason))) return "not_found";
  deps.invalidate?.(site.projectId);
  await deps.audit({ actorId: adminId, action: "site.taken_down", targetType: "site", targetId: siteId, data: { slug: site.slug, reason } });
  // The flag is set (forms stop now); the host change waits briefly for an owner's offline switch
  // in progress. A publish holding the lock for long notices the flag and puts the notice up itself.
  const token = deps.lock ? await acquireSoon(deps.lock, `project:${site.projectId}`) : null;
  try {
    return await deployNotice(deps, adminId, siteId, site);
  } finally {
    if (token && deps.lock) await deps.lock.release(`project:${site.projectId}`, token);
  }
}

async function acquireSoon(lock: Lock, key: string, tries = 20): Promise<string | null> {
  for (let i = 0; i < tries; i++) {
    const t = await lock.acquire(key, 60_000);
    if (t) return t;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

async function deployNotice(deps: ModerationDeps, adminId: string, siteId: string, site: NonNullable<Awaited<ReturnType<ModerationDeps["sites"]["byId"]>>>): Promise<ModerationResult> {
  // Reports close only once the live page is replaced, so a failed attempt stays in the queue to retry.
  const done = async () => {
    await deps.sites.markTakedownDeployed(siteId);
    await deps.reports.closeForSite(siteId, "actioned", adminId);
    return "ok" as const;
  };
  // Read again after the flag is set: a publish that finished in between (a move to a new host)
  // must be seen, or the notice would miss where the content now is.
  const now = (await deps.sites.byId(siteId)) ?? site;
  if (!deps.publisher || (!now.providerProjectId && !now.legacyProjectId)) return done();
  let targets;
  try {
    targets = noticeTargets(now, deps.publisher, deps.legacy);
  } catch (error) {
    reportError("takedown deploy failed", error, { siteId });
    return "deploy_failed";
  }
  // Every host the content could be on (the old one too while a move isn't confirmed); one
  // host failing doesn't stop the others.
  const page = Buffer.from(takenDownPage());
  let failed = false;
  for (const t of targets) {
    try {
      const r = await t.host.publish({
        slug: now.slug,
        files: [
          { path: "index.html", data: page },
          { path: "404.html", data: page },
        ],
        headers: publishedSiteHeaders(),
        providerProjectId: t.projectId,
        takedown: true,
      });
      await t.host.restrictOldDeployments?.(r.providerProjectId).catch((e: unknown) => reportError("takedown protect failed", e, { siteId }));
    } catch (error) {
      failed = true;
      reportError("takedown deploy failed", error, { siteId, host: t.host.name });
    }
  }
  return failed ? "deploy_failed" : done();
}

export async function restoreSite(deps: ModerationDeps, adminId: string, siteId: string): Promise<ModerationResult> {
  if (!(await deps.sites.restore(siteId))) return "not_found";
  const s = await deps.sites.byId(siteId);
  if (s) deps.invalidate?.(s.projectId);
  await deps.audit({ actorId: adminId, action: "site.restored", targetType: "site", targetId: siteId });
  return "ok";
}

export async function dismissReports(deps: ModerationDeps, adminId: string, siteId: string): Promise<number> {
  const n = await deps.reports.closeForSite(siteId, "dismissed", adminId);
  if (n) await deps.audit({ actorId: adminId, action: "reports.dismissed", targetType: "site", targetId: siteId, data: { count: n } });
  return n;
}
