import "server-only";
import type { EntitlementsResolver } from "@/lib/billing/entitlements";
import type { DomainStatus } from "@/lib/providers/publish/types";
import { normalizeDomain } from "@/lib/sites/domain";
import type { PublishDeps } from "./service";

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
  if (!(await deps.sites.setCustomDomain(userId, projectId, domain))) return { ok: false, error: "domain_in_use" };
  try {
    return { ok: true, domain, status: await deps.publisher.addDomain(site.providerProjectId, domain) };
  } catch (error) {
    await deps.sites.setCustomDomain(userId, projectId, site.customDomain);
    const msg = error instanceof Error ? error.message : "";
    return { ok: false, error: msg === "domain_in_use" ? "domain_in_use" : "failed" };
  }
}

export async function domainStatus(deps: PublishDeps, userId: string, projectId: string): Promise<DomainOutcome | null> {
  const site = await deps.sites.getByProject(userId, projectId);
  if (!site?.customDomain || !site.providerProjectId) return null;
  try {
    return { ok: true, domain: site.customDomain, status: await deps.publisher.checkDomain(site.providerProjectId, site.customDomain) };
  } catch {
    return { ok: false, error: "failed" };
  }
}
