import "server-only";
import { cache } from "react";
import { PLAN_FEATURES } from "@/lib/billing/plans";
import { liveAddress, ownerAllowance, ownerSites } from "@/lib/app/shell-data";
import { services } from "@/lib/server/services";
import { answerPreview, answerStats, setupSteps } from "./stats";

const DAY = 86_400_000;
const none = { total: 0, unread: 0 };

/**
 * What every tab's header needs: the site's state (from the sidebar's list, already read for
 * this request) and the exact answer counts. Cached per request, so the overview reuses it.
 */
export const loadHeader = cache(async (ownerId: string, projectId: string) => {
  const svc = services();
  const [sites, counts] = await Promise.all([ownerSites(ownerId).catch(() => []), svc.cloud?.countSubmissions(ownerId, projectId).catch(() => none) ?? none]);
  const entry = sites.find((s) => s.project.id === projectId);
  const site = entry?.site ?? (await svc.publish?.sites.getByProject(ownerId, projectId).catch(() => null)) ?? null;
  const address = liveAddress(site ? { status: site.status, slug: site.slug, url: site.url, customDomain: site.customDomain, customDomainVerifiedAt: site.customDomainVerifiedAt } : null);
  return { project: entry?.project ?? null, site, counts, address, status: site?.status === "taken_down" ? ("taken_down" as const) : address ? ("live" as const) : ("draft" as const) };
});

/** Everything the overview shows, read at once; every read is scoped to this owner. A failed read shows as empty, never as a broken page. */
export async function loadOverview(ownerId: string, projectId: string, locale: "en" | "am") {
  const svc = services();
  const builder = svc.builder!;
  const [header, versions, perDay, recent, photos, telegram, allowance] = await Promise.all([
    loadHeader(ownerId, projectId),
    builder.store.versionStats(ownerId, projectId).catch(() => ({ count: 0, lastAt: null })),
    svc.cloud?.answersPerDay(ownerId, projectId, new Date(Date.now() - 15 * DAY)).catch(() => []) ?? [],
    svc.cloud?.listSubmissions(ownerId, projectId, 4).catch(() => []) ?? [],
    builder.assets?.list(ownerId, projectId).catch(() => []) ?? [],
    svc.telegram?.store.byUser(ownerId).catch(() => null) ?? null,
    ownerAllowance(ownerId),
  ]);
  const { site, address } = header;
  const stats = answerStats(perDay, header.counts);

  // The heading of each form the latest answers came from ("Booking", "Order"), in parallel.
  const keys = [...new Map(recent.map((a) => [a.formKey, a.siteId])).entries()];
  const defs = await Promise.all(keys.map(([key, siteId]) => svc.cloud?.getForm(siteId, key).catch(() => null) ?? null));
  const headings = new Map(keys.map(([key], i) => [key, defs[i]?.heading[locale] ?? defs[i]?.heading.en ?? defs[i]?.heading.am ?? key]));

  return {
    status: header.status,
    address,
    versions: versions.count,
    lastChange: versions.lastAt,
    stats,
    recent: recent.map((a) => ({ id: a.id, heading: headings.get(a.formKey) ?? a.formKey, preview: answerPreview(a.data), createdAt: a.createdAt, unread: !a.readAt })),
    steps: setupSteps({ hasVersion: versions.count > 0, live: !!address, photos: photos.length, telegram: !!telegram, ownDomain: !!(site?.customDomain && site.customDomainVerifiedAt) }),
    canOwnDomain: PLAN_FEATURES[allowance?.plan ?? "free"].customDomain,
  };
}

export type Overview = Awaited<ReturnType<typeof loadOverview>>;
