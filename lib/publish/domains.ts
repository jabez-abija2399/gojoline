import "server-only";
import type { EntitlementsResolver } from "@/lib/billing/entitlements";
import type { DomainStatus } from "@/lib/providers/publish/types";
import { normalizeDomain } from "@/lib/sites/domain";
import type { PublishDeps } from "./service";

const STALE_CLAIM_MS = 7 * 86_400_000;

export type DomainError = "plan_required" | "not_published" | "invalid_domain" | "domain_in_use" | "failed";
export type DomainOutcome = { ok: true; domain: string; status: DomainStatus } | { ok: false; error: DomainError };

export async function connectDomain(
  deps: PublishDeps & { entitlements: EntitlementsResolver },
  userId: string,
  projectId: string,
  input: string,
): Promise<DomainOutcome> {
  if (!(await deps.entitlements(userId)).customDomain) return { ok: false, error: "plan_required" };
  const site = await deps.sites.getByProject(userId, projectId);
  if (!site || site.status !== "published" || !site.providerProjectId) return { ok: false, error: "not_published" };
  const domain = normalizeDomain(input);
  if (!domain) return { ok: false, error: "invalid_domain" };
  // A claim that was never verified within a week no longer blocks the domain (anti-squatting).
  const cutoff = new Date(Date.now() - STALE_CLAIM_MS);
  const stale = await deps.sites.staleDomainClaim(domain, cutoff);
  if (stale && !(await releaseStaleClaim(deps, stale, domain, cutoff))) return { ok: false, error: "domain_in_use" };
  if (!(await deps.sites.setCustomDomain(userId, projectId, domain))) return { ok: false, error: "domain_in_use" };
  try {
    const status = await deps.publisher.addDomain(site.providerProjectId, domain);
    if (status.status === "active") await deps.sites.markDomainVerified(userId, projectId);
    return { ok: true, domain, status };
  } catch (error) {
    await deps.sites.setCustomDomain(userId, projectId, site.customDomain, { claimedAt: site.customDomainClaimedAt ?? null, verifiedAt: site.customDomainVerifiedAt ?? null });
    const msg = error instanceof Error ? error.message : "";
    return { ok: false, error: msg === "domain_in_use" ? "domain_in_use" : "failed" };
  }
}

export async function domainStatus(deps: PublishDeps, userId: string, projectId: string): Promise<DomainOutcome | null> {
  const site = await deps.sites.getByProject(userId, projectId);
  if (!site?.customDomain || !site.providerProjectId) return null;
  try {
    const status = await deps.publisher.checkDomain(site.providerProjectId, site.customDomain);
    if (status.status === "active" && !site.customDomainVerifiedAt) await deps.sites.markDomainVerified(userId, projectId);
    return { ok: true, domain: site.customDomain, status };
  } catch {
    return { ok: false, error: "failed" };
  }
}

/**
 * Frees a domain another site claimed long ago but never got working. The hosting provider is
 * asked first: a domain that works for that site is kept (and recorded as verified), and if
 * the provider can't confirm or detach it, nothing is released.
 */
async function releaseStaleClaim(deps: PublishDeps, stale: { siteId: string; ownerId: string; projectId: string; providerProjectId: string | null }, domain: string, cutoff: Date): Promise<boolean> {
  if (stale.providerProjectId) {
    const live = await deps.publisher.checkDomain(stale.providerProjectId, domain).catch((e: unknown) => (e instanceof Error && e.message === "domain_missing" ? "missing" : null));
    if (live === null) return false;
    if (live !== "missing" && live.status === "active") {
      await deps.sites.markDomainVerified(stale.ownerId, stale.projectId);
      return false;
    }
    try {
      await deps.publisher.removeDomain(stale.providerProjectId, domain);
    } catch {
      return false;
    }
  }
  return deps.sites.releaseDomainClaim(stale.siteId, domain, cutoff);
}
