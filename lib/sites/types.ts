export interface Site {
  id: string;
  projectId: string;
  ownerId: string;
  slug: string;
  provider: string;
  providerProjectId: string | null;
  url: string | null;
  /** pending: address reserved, first publish not finished yet. */
  status: "pending" | "published" | "taken_down";
  publishedVersion: number | null;
  lastDeploymentId: string | null;
  customDomain: string | null;
  /** Public key sent by the published site's forms. */
  siteKey: string | null;
  publishedAt: Date | null;
  takenDownReason: string | null;
}

export interface SiteStore {
  getByProject(ownerId: string, projectId: string): Promise<Site | null>;
  /** True when another project already uses this slug. */
  slugTaken(slug: string, exceptProjectId: string): Promise<boolean>;
  /** Live sites this owner has, not counting the given project. */
  countPublished(ownerId: string, exceptProjectId: string): Promise<number>;
  /** Claims the address for this project before the first deploy. False when it's taken. */
  reserve(ownerId: string, projectId: string, slug: string, provider: string): Promise<boolean>;
  /** Null clears it. Returns false when another site already uses the domain. */
  setCustomDomain(ownerId: string, projectId: string, domain: string | null): Promise<boolean>;
  savePublished(ownerId: string, input: Omit<Site, "id" | "ownerId" | "status" | "takenDownReason" | "customDomain" | "siteKey">): Promise<Site>;
}
