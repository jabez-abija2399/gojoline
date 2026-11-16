import "server-only";
import { cache } from "react";
import { PLAN_FEATURES } from "@/lib/billing/plans";
import { liveAddress, ownerAllowance, ownerSites } from "@/lib/app/shell-data";
import { SITE_RUNTIME } from "@/lib/publish/service";
import { services } from "@/lib/server/services";
import { visitStats, type VisitStats } from "@/lib/visits/stats";
import { answerStats, messagePreview, setupSteps } from "./stats";

const DAY = 86_400_000;
const none = { total: 0, waiting: 0 };

export type SiteState = "live" | "resting" | "draft" | "taken_down";

/**
 * What every tab's header needs: the site's state and the exact message counts (the tab badge
 * counts New). Cached per request, so Home reuses it. Every read is scoped to this owner.
 */
export const loadHeader = cache(async (ownerId: string, projectId: string) => {
  const svc = services();
  const [sites, counts] = await Promise.all([ownerSites(ownerId).catch(() => []), svc.cloud?.countSubmissions(ownerId, projectId).catch(() => none) ?? none]);
  const entry = sites.find((s) => s.project.id === projectId);
  // The sidebar's list already holds the site; only an older project (past its 100) is looked up.
  const site = entry ? entry.site : ((await svc.publish?.sites.getByProject(ownerId, projectId).catch(() => null)) ?? null);
  const address = liveAddress(site ? { status: site.status, slug: site.slug, url: site.url, customDomain: site.customDomain, customDomainVerifiedAt: site.customDomainVerifiedAt } : null);
  const status: SiteState = site?.status === "taken_down" ? "taken_down" : !address ? "draft" : site?.offlineAt ? "resting" : "live";
  return {
    project: entry?.project ?? null,
    site,
    counts,
    address,
    status,
    /** Published before the live site read business info and counted visits: one more publish brings them. */
    outdated: Boolean(address && (site?.runtimeVersion ?? 0) < SITE_RUNTIME),
  };
});

const noVisits = (): VisitStats => ({ perDay: Array.from({ length: 14 }, (_, i) => ({ day: new Date(Date.now() - (13 - i) * DAY + 3 * 3_600_000).toISOString().slice(0, 10), value: 0 })), thisWeek: 0, lastWeek: 0, sources: {}, devices: {}, any: false });

/** Everything Home shows, read at once. A failed read shows as empty, never as a broken page. */
export async function loadHome(ownerId: string, projectId: string, locale: "en" | "am") {
  const svc = services();
  const builder = svc.builder!;
  const [header, versions, perDay, recent, photos, telegram, allowance, settings, visits] = await Promise.all([
    loadHeader(ownerId, projectId),
    builder.store.versionStats(ownerId, projectId).catch(() => ({ count: 0, lastAt: null })),
    svc.cloud?.answersPerDay(ownerId, projectId, new Date(Date.now() - 15 * DAY)).catch(() => []) ?? [],
    svc.cloud?.listSubmissions(ownerId, projectId, 4).catch(() => []) ?? [],
    builder.assets?.list(ownerId, projectId).catch(() => []) ?? [],
    svc.telegram?.store.byUser(ownerId).catch(() => null) ?? null,
    ownerAllowance(ownerId),
    svc.siteSettings.get(ownerId, projectId).catch(() => ({ business: null, seo: null })),
    visitStats({ ...svc.visits, owns: async (o, p) => Boolean(await builder.store.getProject(o, p)) }, ownerId, projectId).catch(() => noVisits()),
  ]);
  const { site, address } = header;
  const messages = answerStats(perDay, header.counts);

  // The heading of each form the latest messages came from ("Booking", "Order"), in one read.
  const siteId = recent[0]?.siteId;
  const defs = siteId ? await (svc.cloud?.getForms(siteId, [...new Set(recent.map((a) => a.formKey))]).catch(() => []) ?? []) : [];
  const headings = new Map(defs.map((d) => [d.id, d.heading[locale] ?? d.heading.en ?? d.heading.am ?? d.id]));
  const b = settings.business;

  return {
    status: header.status,
    outdated: header.outdated,
    address,
    messages,
    visits,
    recent: recent.map((a) => ({ id: a.id, heading: headings.get(a.formKey) ?? a.formKey, preview: messagePreview(a.data), createdAt: a.createdAt, status: a.status })),
    steps: setupSteps({
      hasVersion: versions.count > 0,
      live: !!address,
      info: Boolean(b && (b.phone || b.whatsapp || b.telegram || Object.keys(b.hours ?? {}).length)),
      photos: photos.length,
      telegram: !!telegram,
      ownDomain: !!(site?.customDomain && site.customDomainVerifiedAt),
    }),
    canOwnDomain: PLAN_FEATURES[allowance?.plan ?? "free"].customDomain,
  };
}

export type Home = Awaited<ReturnType<typeof loadHome>>;
