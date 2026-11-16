export interface Site {
  id: string;
  projectId: string;
  ownerId: string;
  slug: string;
  provider: string;
  providerProjectId: string | null;
  /** The previous host's project after a move, until its old address forwards (see PublishDeps.legacy). */
  legacyProjectId?: string | null;
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
  takedownDeployedAt?: Date | null;
}

/** Unscoped site access for admins and public reports only. Never use it for owner actions. */
export interface SiteAdminStore {
  byId(siteId: string): Promise<Site | null>;
  /** The site matching any of these slugs or custom domains (one query; a slug match wins). */
  byAddress(candidates: string[]): Promise<Site | null>;
  recent(limit: number): Promise<Site[]>;
  /** Marks a site taken down (stops publishing and its forms). False when it doesn't exist. */
  takeDown(siteId: string, reason: string): Promise<boolean>;
  /** Lets the owner publish again (status back to pending until they do). */
  restore(siteId: string): Promise<boolean>;
  /** Records that the takedown notice is now what visitors see. */
  markTakedownDeployed(siteId: string): Promise<void>;
}

export interface SiteStore {
  getByProject(ownerId: string, projectId: string): Promise<Site | null>;
  /** This owner's sites for the given projects (one query), for the list of sites. */
  listByOwner(ownerId: string, projectIds: string[]): Promise<Site[]>;
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
  /** The old host now forwards: nothing left there to take down. */
  clearLegacy(ownerId: string, projectId: string): Promise<void>;
}
