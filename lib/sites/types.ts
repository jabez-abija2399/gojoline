export interface Site {
  id: string;
  projectId: string;
  ownerId: string;
  slug: string;
  provider: string;
  providerProjectId: string | null;
  url: string | null;
  status: "published" | "taken_down";
  publishedVersion: number | null;
  lastDeploymentId: string | null;
  customDomain: string | null;
  publishedAt: Date | null;
  takenDownReason: string | null;
}

export interface SiteStore {
  getByProject(ownerId: string, projectId: string): Promise<Site | null>;
  /** True when another project already uses this slug. */
  slugTaken(slug: string, exceptProjectId: string): Promise<boolean>;
  /** Null clears it. Returns false when another site already uses the domain. */
  setCustomDomain(ownerId: string, projectId: string, domain: string | null): Promise<boolean>;
  savePublished(ownerId: string, input: Omit<Site, "id" | "ownerId" | "status" | "takenDownReason" | "customDomain">): Promise<Site>;
}
