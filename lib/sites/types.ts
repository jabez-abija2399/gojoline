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
  customDomainClaimedAt?: Date | null;
  customDomainVerifiedAt?: Date | null;
  /** Public key sent by the published site's forms. */
  siteKey: string | null;
  publishedAt: Date | null;
  takenDownReason: string | null;
}

/** Unscoped site access for admins and public reports only. Never use it for owner actions. */
export interface SiteAdminStore {
  byId(siteId: string): Promise<Site | null>;
  /** A site by its slug or custom domain (any status). */
  byAddress(slugOrDomain: string): Promise<Site | null>;
  recent(limit: number): Promise<Site[]>;
  /** Marks a site taken down (stops publishing and its forms). False when it doesn't exist. */
  takeDown(siteId: string, reason: string): Promise<boolean>;
  /** Lets the owner publish again (status back to pending until they do). */
  restore(siteId: string): Promise<boolean>;
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
  setCustomDomain(ownerId: string, projectId: string, domain: string | null, restore?: { claimedAt: Date | null; verifiedAt: Date | null }): Promise<boolean>;
  /** Records that the owner's domain is pointing at us (first time only). */
  markDomainVerified(ownerId: string, projectId: string): Promise<void>;
  /** Another site's claim on this domain that was never verified and is older than the cutoff. */
  staleDomainClaim(domain: string, claimedBefore: Date): Promise<{ siteId: string; ownerId: string; projectId: string; providerProjectId: string | null } | null>;
  /** Drops a stale claim (only if it is still unverified and older than the cutoff). */
  releaseDomainClaim(siteId: string, domain: string, claimedBefore: Date): Promise<boolean>;
  savePublished(ownerId: string, input: Omit<Site, "id" | "ownerId" | "status" | "takenDownReason" | "customDomain" | "siteKey">): Promise<Site>;
}
