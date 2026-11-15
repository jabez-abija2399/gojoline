import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { sites } from "@/lib/db/schema";
import type { Site, SiteAdminStore, SiteStore } from "./types";

export class DbSiteStore implements SiteStore, SiteAdminStore {
  constructor(private db: Database) {}

  async getByProject(ownerId: string, projectId: string): Promise<Site | null> {
    const [row] = await this.db.select().from(sites).where(and(eq(sites.projectId, projectId), eq(sites.ownerId, ownerId))).limit(1);
    return row ?? null;
  }

  async slugTaken(slug: string, exceptProjectId: string): Promise<boolean> {
    const rows = await this.db.select({ id: sites.id }).from(sites).where(and(eq(sites.slug, slug), ne(sites.projectId, exceptProjectId))).limit(1);
    return rows.length > 0;
  }

  async countPublished(ownerId: string, exceptProjectId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(sites)
      .where(and(eq(sites.ownerId, ownerId), ne(sites.projectId, exceptProjectId), eq(sites.status, "published")));
    return Number(row?.n ?? 0);
  }

  async reserve(ownerId: string, projectId: string, slug: string, provider: string): Promise<boolean> {
    try {
      // Unique slug and project_id make this the atomic claim.
      await this.db.insert(sites).values({ projectId, ownerId, slug, provider, status: "pending", siteKey: randomBytes(18).toString("base64url") });
      return true;
    } catch {
      return false;
    }
  }

  async setCustomDomain(ownerId: string, projectId: string, domain: string | null, restore?: { claimedAt: Date | null; verifiedAt: Date | null }): Promise<boolean> {
    try {
      const rows = await this.db
        .update(sites)
        .set({
          customDomain: domain,
          customDomainClaimedAt: restore ? restore.claimedAt : domain ? new Date() : null,
          customDomainVerifiedAt: restore ? restore.verifiedAt : null,
          updatedAt: new Date(),
        })
        .where(and(eq(sites.projectId, projectId), eq(sites.ownerId, ownerId)))
        .returning({ id: sites.id });
      return rows.length === 1;
    } catch {
      return false; // unique violation: another site has it
    }
  }

  async savePublished(ownerId: string, input: Omit<Site, "id" | "ownerId" | "status" | "takenDownReason" | "customDomain" | "siteKey">): Promise<Site> {
    const values = { ...input, ownerId, status: "published" as const, updatedAt: new Date() };
    const existing = await this.getByProject(ownerId, input.projectId);
    if (existing) {
      // A site that was taken down stays down; only an admin can restore it.
      if (existing.status === "taken_down") throw new Error("Site is taken down");
      const [row] = await this.db.update(sites).set({ ...values, ...(existing.siteKey ? {} : { siteKey: randomBytes(18).toString("base64url") }) }).where(and(eq(sites.id, existing.id), eq(sites.ownerId, ownerId), ne(sites.status, "taken_down"))).returning();
      // Taken down while this publish was running: it stays down.
      if (!row) throw new Error("Site is taken down");
      return row;
    }
    const [row] = await this.db.insert(sites).values({ ...values, siteKey: randomBytes(18).toString("base64url") }).returning();
    return row!;
  }

  async markDomainVerified(ownerId: string, projectId: string): Promise<void> {
    await this.db
      .update(sites)
      .set({ customDomainVerifiedAt: new Date() })
      .where(and(eq(sites.projectId, projectId), eq(sites.ownerId, ownerId), isNull(sites.customDomainVerifiedAt), isNotNull(sites.customDomain)));
  }

  async staleDomainClaim(domain: string, claimedBefore: Date) {
    const [row] = await this.db
      .select({ siteId: sites.id, ownerId: sites.ownerId, projectId: sites.projectId, providerProjectId: sites.providerProjectId })
      .from(sites)
      .where(and(eq(sites.customDomain, domain), isNull(sites.customDomainVerifiedAt), lt(sites.customDomainClaimedAt, claimedBefore)))
      .limit(1);
    return row ?? null;
  }

  async releaseDomainClaim(siteId: string, domain: string, claimedBefore: Date): Promise<boolean> {
    const rows = await this.db
      .update(sites)
      .set({ customDomain: null, customDomainClaimedAt: null, updatedAt: new Date() })
      .where(and(eq(sites.id, siteId), eq(sites.customDomain, domain), isNull(sites.customDomainVerifiedAt), lt(sites.customDomainClaimedAt, claimedBefore)))
      .returning({ id: sites.id });
    return rows.length === 1;
  }

  async byId(siteId: string): Promise<Site | null> {
    const [row] = await this.db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    return row ?? null;
  }

  async byAddress(candidates: string[]): Promise<Site | null> {
    if (candidates.length === 0) return null;
    const rows = await this.db.select().from(sites).where(or(inArray(sites.slug, candidates), inArray(sites.customDomain, candidates))).limit(5);
    return rows.find((r) => candidates.includes(r.slug)) ?? rows[0] ?? null;
  }

  async recent(limit: number): Promise<Site[]> {
    return this.db.select().from(sites).orderBy(desc(sites.updatedAt)).limit(limit);
  }

  async takeDown(siteId: string, reason: string): Promise<boolean> {
    const rows = await this.db.update(sites).set({ status: "taken_down", takenDownReason: reason, updatedAt: new Date() }).where(eq(sites.id, siteId)).returning({ id: sites.id });
    return rows.length === 1;
  }

  async restore(siteId: string): Promise<boolean> {
    const rows = await this.db
      .update(sites)
      .set({ status: "pending", takenDownReason: null, updatedAt: new Date() })
      .where(and(eq(sites.id, siteId), eq(sites.status, "taken_down")))
      .returning({ id: sites.id });
    return rows.length === 1;
  }
}
