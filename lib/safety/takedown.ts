import { reportError } from "@/lib/observability/report";
import { getMessages } from "@/lib/i18n";
import type { PublishProvider } from "@/lib/providers/publish/types";
import { publishedSiteHeaders } from "@/lib/publish/scan";
import { publisherFor } from "@/lib/publish/hosts";
import type { SiteAdminStore } from "@/lib/sites/types";
import type { ReportStore } from "./reports";

export interface ModerationDeps {
  sites: SiteAdminStore;
  reports: ReportStore;
  publisher: PublishProvider | null;
  /** The previous host (sites not moved yet still live there). */
  legacy?: PublishProvider | null;
  audit: (entry: { actorId: string; action: string; targetType: string; targetId: string; data?: Record<string, unknown> }) => Promise<void>;
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://gojoline.com").replace(/\/$/, "");

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** The page a taken-down site shows instead of its content (both languages, no scripts). */
export function takenDownPage(): string {
  const en = getMessages("en").safety;
  const am = getMessages("am").safety;
  const e = escapeHtml;
  // Brand colours (ink on paper); no scripts; both languages, each with a way back to Gojoline.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${e(en.downTitle)}</title>
<style>body{font-family:system-ui,"Noto Sans Ethiopic",sans-serif;max-width:36rem;margin:0 auto;padding:3rem 1rem;color:#121212;background:#FBF9F6;line-height:1.6}h1,h2{font-size:1.5rem;margin:0 0 .5rem}section{margin-bottom:2.5rem}a{color:#C2370F;display:inline-block;min-height:44px;line-height:44px}</style></head>
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
  await deps.audit({ actorId: adminId, action: "site.taken_down", targetType: "site", targetId: siteId, data: { slug: site.slug, reason } });
  // Reports close only once the live page is replaced, so a failed attempt stays in the queue to retry.
  const done = async () => {
    await deps.sites.markTakedownDeployed(siteId);
    await deps.reports.closeForSite(siteId, "actioned", adminId);
    return "ok" as const;
  };
  if (!deps.publisher || !site.providerProjectId) return done();
  const host = publisherFor(site, deps.publisher, deps.legacy);
  try {
    const page = Buffer.from(takenDownPage());
    await host.publish({
      slug: site.slug,
      files: [
        { path: "index.html", data: page },
        { path: "404.html", data: page },
      ],
      headers: publishedSiteHeaders(),
      providerProjectId: site.providerProjectId,
    });
    await host.restrictOldDeployments?.(site.providerProjectId).catch((e: unknown) => reportError("takedown protect failed", e, { siteId }));
    return done();
  } catch (error) {
    reportError("takedown deploy failed", error, { siteId });
    return "deploy_failed";
  }
}

export async function restoreSite(deps: ModerationDeps, adminId: string, siteId: string): Promise<ModerationResult> {
  if (!(await deps.sites.restore(siteId))) return "not_found";
  await deps.audit({ actorId: adminId, action: "site.restored", targetType: "site", targetId: siteId });
  return "ok";
}

export async function dismissReports(deps: ModerationDeps, adminId: string, siteId: string): Promise<number> {
  const n = await deps.reports.closeForSite(siteId, "dismissed", adminId);
  if (n) await deps.audit({ actorId: adminId, action: "reports.dismissed", targetType: "site", targetId: siteId, data: { count: n } });
  return n;
}
