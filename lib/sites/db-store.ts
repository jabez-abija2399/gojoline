import { and, eq, ne } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { sites } from "@/lib/db/schema";
import type { Site, SiteStore } from "./types";

export class DbSiteStore implements SiteStore {
  constructor(private db: Database) {}

  async getByProject(ownerId: string, projectId: string): Promise<Site | null> {
    const [row] = await this.db.select().from(sites).where(and(eq(sites.projectId, projectId), eq(sites.ownerId, ownerId))).limit(1);
    return row ?? null;
  }

  async slugTaken(slug: string, exceptProjectId: string): Promise<boolean> {
    const rows = await this.db.select({ id: sites.id }).from(sites).where(and(eq(sites.slug, slug), ne(sites.projectId, exceptProjectId))).limit(1);
    return rows.length > 0;
  }

  async setCustomDomain(ownerId: string, projectId: string, domain: string | null): Promise<boolean> {
    try {
      const rows = await this.db
        .update(sites)
        .set({ customDomain: domain, updatedAt: new Date() })
        .where(and(eq(sites.projectId, projectId), eq(sites.ownerId, ownerId)))
        .returning({ id: sites.id });
      return rows.length === 1;
    } catch {
      return false; // unique violation: another site has it
    }
  }

  async savePublished(ownerId: string, input: Omit<Site, "id" | "ownerId" | "status" | "takenDownReason" | "customDomain">): Promise<Site> {
    const values = { ...input, ownerId, status: "published" as const, updatedAt: new Date() };
    const existing = await this.getByProject(ownerId, input.projectId);
    if (existing) {
      // A site that was taken down stays down; only an admin can restore it.
      if (existing.status === "taken_down") throw new Error("Site is taken down");
      const [row] = await this.db.update(sites).set(values).where(and(eq(sites.id, existing.id), eq(sites.ownerId, ownerId))).returning();
      return row!;
    }
    const [row] = await this.db.insert(sites).values(values).returning();
    return row!;
  }
}
