import { randomBytes, randomUUID } from "node:crypto";
import type { Site, SiteAdminStore, SiteStore } from "./types";

export class MemorySiteStore implements SiteStore, SiteAdminStore {
  private sites = new Map<string, Site>();
  async getByProject(ownerId: string, projectId: string) {
    const s = this.sites.get(projectId);
    return s && s.ownerId === ownerId ? s : null;
  }
  async slugTaken(slug: string, exceptProjectId: string) {
    return [...this.sites.values()].some((s) => s.slug === slug && s.projectId !== exceptProjectId);
  }
  async countPublished(ownerId: string, exceptProjectId: string) {
    return [...this.sites.values()].filter((s) => s.ownerId === ownerId && s.projectId !== exceptProjectId && s.status === "published").length;
  }
  async reserve(ownerId: string, projectId: string, slug: string, provider: string) {
    if (this.sites.has(projectId) || (await this.slugTaken(slug, projectId))) return false;
    this.sites.set(projectId, {
      id: randomUUID(), projectId, ownerId, slug, provider, providerProjectId: null, url: null, status: "pending",
      publishedVersion: null, lastDeploymentId: null, customDomain: null, publishedAt: null, takenDownReason: null,
      siteKey: randomBytes(18).toString("base64url"),
    });
    return true;
  }
  async setCustomDomain(ownerId: string, projectId: string, domain: string | null, restore?: { claimedAt: Date | null; verifiedAt: Date | null }) {
    const site = await this.getByProject(ownerId, projectId);
    if (!site) return false;
    if (domain && [...this.sites.values()].some((s) => s.customDomain === domain && s.projectId !== projectId)) return false;
    site.customDomain = domain;
    site.customDomainClaimedAt = restore ? restore.claimedAt : domain ? new Date() : null;
    site.customDomainVerifiedAt = restore ? restore.verifiedAt : null;
    return true;
  }
  async markDomainVerified(ownerId: string, projectId: string) {
    const site = await this.getByProject(ownerId, projectId);
    if (site && !site.customDomainVerifiedAt) site.customDomainVerifiedAt = new Date();
  }
  async staleDomainClaim(domain: string, claimedBefore: Date) {
    const s = [...this.sites.values()].find((x) => x.customDomain === domain && !x.customDomainVerifiedAt && x.customDomainClaimedAt && x.customDomainClaimedAt < claimedBefore);
    return s ? { siteId: s.id, ownerId: s.ownerId, projectId: s.projectId, providerProjectId: s.providerProjectId } : null;
  }
  async releaseDomainClaim(siteId: string, domain: string, claimedBefore: Date) {
    const s = await this.byId(siteId);
    if (!s || s.customDomain !== domain || s.customDomainVerifiedAt || !s.customDomainClaimedAt || s.customDomainClaimedAt >= claimedBefore) return false;
    Object.assign(s, { customDomain: null, customDomainClaimedAt: null });
    return true;
  }
  async byId(siteId: string) {
    return [...this.sites.values()].find((s) => s.id === siteId) ?? null;
  }
  async byAddress(address: string) {
    return [...this.sites.values()].find((s) => s.slug === address || s.customDomain === address) ?? null;
  }
  async recent(limit: number) {
    return [...this.sites.values()].reverse().slice(0, limit);
  }
  async takeDown(siteId: string, reason: string) {
    const s = await this.byId(siteId);
    if (!s) return false;
    Object.assign(s, { status: "taken_down", takenDownReason: reason });
    return true;
  }
  async restore(siteId: string) {
    const s = await this.byId(siteId);
    if (!s || s.status !== "taken_down") return false;
    Object.assign(s, { status: "pending", takenDownReason: null });
    return true;
  }
  all() {
    return this.sites.values();
  }
  async savePublished(ownerId: string, input: Omit<Site, "id" | "ownerId" | "status" | "takenDownReason" | "customDomain" | "siteKey">) {
    const existing = this.sites.get(input.projectId);
    if (existing && existing.ownerId !== ownerId) throw new Error("Not your site");
    if (existing?.status === "taken_down") throw new Error("Site is taken down");
    const site: Site = { id: existing?.id ?? randomUUID(), ownerId, status: "published", takenDownReason: null, customDomain: existing?.customDomain ?? null, siteKey: existing?.siteKey ?? randomBytes(18).toString("base64url"), ...input };
    this.sites.set(input.projectId, site);
    return site;
  }
}
