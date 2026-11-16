import "server-only";
import { liveAddress } from "@/lib/app/shell-data";
import { services } from "@/lib/server/services";
import { answerPreview, answerStats, setupSteps } from "./stats";

const DAY = 86_400_000;
const none = { total: 0, unread: 0 };

/** What every tab's header needs: the site's state and how many answers are new (two small queries). */
export async function loadHeader(ownerId: string, projectId: string) {
  const svc = services();
  const [site, counts] = await Promise.all([
    svc.publish?.sites.getByProject(ownerId, projectId).catch(() => null) ?? null,
    svc.cloud?.countSubmissions(ownerId, projectId).catch(() => none) ?? none,
  ]);
  const address = liveAddress(site ? { status: site.status, slug: site.slug, url: site.url, customDomain: site.customDomain, customDomainVerifiedAt: site.customDomainVerifiedAt } : null);
  return { site, counts, address, status: site?.status === "taken_down" ? ("taken_down" as const) : address ? ("live" as const) : ("draft" as const) };
}

/** Everything the overview shows; every read is scoped to this owner. A failed read shows as empty, never as a broken page. */
export async function loadOverview(ownerId: string, projectId: string, locale: "en" | "am", header: Awaited<ReturnType<typeof loadHeader>>) {
  const svc = services();
  const builder = svc.builder!;
  const { site, address, counts } = header;
  const [versions, answers, photos, telegram, entitlements] = await Promise.all([
    builder.store.listVersions(ownerId, projectId).catch(() => []),
    svc.cloud?.submissionsSince(ownerId, projectId, new Date(Date.now() - 14 * DAY)).catch(() => []) ?? [],
    builder.assets?.list(ownerId, projectId).catch(() => []) ?? [],
    svc.telegram?.store.byUser(ownerId).catch(() => null) ?? null,
    svc.entitlements(ownerId).catch(() => null),
  ]);
  const stats = answerStats(answers, counts);

  // The latest answers (older than two weeks too, if that's all there is), with their form's heading.
  const recent = answers.length >= 4 ? answers.slice(0, 4) : ((await svc.cloud?.listSubmissions(ownerId, projectId, 4).catch(() => [])) ?? []);
  const keys = [...new Map(recent.map((a) => [a.formKey, a.siteId])).entries()];
  const defs = await Promise.all(keys.map(([key, siteId]) => svc.cloud?.getForm(siteId, key).catch(() => null) ?? null));
  const headings = new Map(keys.map(([key], i) => [key, defs[i]?.heading[locale] ?? defs[i]?.heading.en ?? defs[i]?.heading.am ?? key]));

  return {
    status: header.status,
    address,
    versions: versions.length,
    lastChange: versions[0]?.createdAt ?? null,
    stats,
    recent: recent.map((a) => ({ id: a.id, heading: headings.get(a.formKey) ?? a.formKey, preview: answerPreview(a.data), createdAt: a.createdAt, unread: !a.readAt })),
    steps: setupSteps({ hasVersion: versions.length > 0, live: !!address, photos: photos.length, telegram: !!telegram, ownDomain: !!(site?.customDomain && site.customDomainVerifiedAt) }),
    canOwnDomain: entitlements?.customDomain ?? false,
  };
}

export type Overview = Awaited<ReturnType<typeof loadOverview>>;
