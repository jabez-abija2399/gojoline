import { getMessages } from "@/lib/i18n";
import type { PublishProvider } from "@/lib/providers/publish/types";
import { publishedSiteHeaders } from "@/lib/publish/scan";
import type { SiteAdminStore } from "@/lib/sites/types";
import type { ReportStore } from "./reports";

export interface ModerationDeps {
  sites: SiteAdminStore;
  reports: ReportStore;
  publisher: PublishProvider | null;
  audit: (entry: { actorId: string; action: string; targetType: string; targetId: string; data?: Record<string, unknown> }) => Promise<void>;
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** The page a taken-down site shows instead of its content (both languages, no scripts). */
export function takenDownPage(): string {
  const en = getMessages("en").safety;
  const am = getMessages("am").safety;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escape(en.downTitle)}</title>
<style>body{font-family:system-ui,"Noto Sans Ethiopic",sans-serif;max-width:36rem;margin:0 auto;padding:3rem 1rem;color:#1f2a2e;background:#fbf7f0;line-height:1.6}h1{font-size:1.5rem}</style></head>
<body><main><h1>${escape(en.downTitle)}</h1><p>${escape(en.downBody)}</p><h1 lang="am">${escape(am.downTitle)}</h1><p lang="am">${escape(am.downBody)}</p></main></body></html>`;
}

export type ModerationResult = "ok" | "not_found" | "deploy_failed";

/**
 * Takes a site down: the database first (its forms stop at once), then the live content is
 * replaced with a notice. Safe to repeat if replacing the content failed.
 */
export async function takeDownSite(deps: ModerationDeps, adminId: string, siteId: string, reason: string): Promise<ModerationResult> {
  const site = await deps.sites.byId(siteId);
  if (!site || !(await deps.sites.takeDown(siteId, reason))) return "not_found";
  const closed = await deps.reports.closeForSite(siteId, "actioned", adminId);
  await deps.audit({ actorId: adminId, action: "site.taken_down", targetType: "site", targetId: siteId, data: { slug: site.slug, reason, reports: closed } });
  if (!deps.publisher || !site.providerProjectId) return "ok";
  try {
    const page = Buffer.from(takenDownPage());
    await deps.publisher.publish({
      slug: site.slug,
      files: [
        { path: "index.html", data: page },
        { path: "404.html", data: page },
      ],
      headers: publishedSiteHeaders(),
      providerProjectId: site.providerProjectId,
    });
    await deps.publisher.restrictOldDeployments?.(site.providerProjectId).catch((e: unknown) => console.error("takedown protect failed", e instanceof Error ? e.message : "unknown"));
    return "ok";
  } catch (error) {
    console.error("takedown deploy failed", siteId, error instanceof Error ? error.message : "unknown");
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
