import "server-only";
import { cache } from "react";
import { planFeaturesWith } from "@/lib/billing/credits";
import type { Project } from "@/lib/projects/types";
import { services } from "@/lib/server/services";
import type { Site } from "@/lib/sites/types";

export interface OwnerSite {
  project: Project;
  /** Null until the owner has chosen an address. */
  site: Pick<Site, "status" | "slug" | "url" | "customDomain" | "customDomainVerifiedAt" | "offlineAt" | "runtimeVersion"> | null;
}

/** The owner's sites with their publish state: two queries, shared by the sidebar and the page. */
export const ownerSites = cache(async (ownerId: string): Promise<OwnerSite[]> => {
  const svc = services();
  if (!svc.builder) return [];
  const projects = await svc.builder.store.listProjects(ownerId);
  const sites = (await svc.publish?.sites.listByOwner(ownerId, projects.map((p) => p.id))) ?? [];
  const byProject = new Map(sites.map((s) => [s.projectId, s]));
  return projects.map((project) => {
    const s = byProject.get(project.id);
    return { project, site: s ? { status: s.status, slug: s.slug, url: s.url, customDomain: s.customDomain, customDomainVerifiedAt: s.customDomainVerifiedAt, offlineAt: s.offlineAt ?? null, runtimeVersion: s.runtimeVersion ?? null } : null };
  });
});

/**
 * Plan and AI changes left (monthly total from Admin → Settings), for the sidebar's meter, the
 * Plan page and the builder.
 */
export const ownerAllowance = cache(async (ownerId: string) => {
  try {
    return await services().billing.allowance(ownerId);
  } catch {
    // The meter is a help, not the page: without it every signed-in page still opens.
    return null;
  }
});

/** Credit settings (admin-editable over defaults): one read per request. */
export const creditSettings = cache(() => services().billing.credits());

/** Plan features with the admin's monthly changes and rollover. */
export const planFeatures = cache(async () => planFeaturesWith(await creditSettings()));

/** The launch offer, if one is saved (shown only while it applies). */
export const launchOffer = cache(() => services().billing.launchOffer().catch(() => null));

/** Where a published site lives, without the protocol; null when it isn't live. */
export function liveAddress(site: OwnerSite["site"]): { href: string; text: string } | null {
  if (!site || site.status !== "published" || !site.url?.startsWith("https://")) return null;
  // Their own address only once it is known to point at us.
  const href = site.customDomain && site.customDomainVerifiedAt ? `https://${site.customDomain}` : site.url;
  return { href, text: href.replace(/^https?:\/\//, "") };
}

/** A first name to greet by, or null when the account only has a phone or email. */
export function greetingName(name: string): string | null {
  const first = name.trim().split(/\s+/)[0] ?? "";
  if (!first || first.includes("@") || /^[+\d]/.test(first)) return null;
  return [...first].slice(0, 24).join("");
}

/** "2 hours ago", "yesterday": easier to read on a card than a date and a time. */
export function ago(date: Date, locale: "en" | "am", now = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.round((date.getTime() - now) / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(Math.min(minutes, -1), "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  return rtf.format(Math.round(days / 30), "month");
}
