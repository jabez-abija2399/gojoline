import { randomUUID } from "node:crypto";
import type { Site, SiteStore } from "./types";

export class MemorySiteStore implements SiteStore {
  private sites = new Map<string, Site>();
  async getByProject(ownerId: string, projectId: string) {
    const s = this.sites.get(projectId);
    return s && s.ownerId === ownerId ? s : null;
  }
  async slugTaken(slug: string, exceptProjectId: string) {
    return [...this.sites.values()].some((s) => s.slug === slug && s.projectId !== exceptProjectId);
  }
  async setCustomDomain(ownerId: string, projectId: string, domain: string | null) {
    const site = await this.getByProject(ownerId, projectId);
    if (!site) return false;
    if (domain && [...this.sites.values()].some((s) => s.customDomain === domain && s.projectId !== projectId)) return false;
    site.customDomain = domain;
    return true;
  }
  async savePublished(ownerId: string, input: Omit<Site, "id" | "ownerId" | "status" | "takenDownReason" | "customDomain">) {
    const existing = this.sites.get(input.projectId);
    if (existing && existing.ownerId !== ownerId) throw new Error("Not your site");
    if (existing?.status === "taken_down") throw new Error("Site is taken down");
    const site: Site = { id: existing?.id ?? randomUUID(), ownerId, status: "published", takenDownReason: null, customDomain: existing?.customDomain ?? null, ...input };
    this.sites.set(input.projectId, site);
    return site;
  }
}
