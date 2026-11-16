import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { siteSettings } from "@/lib/db/schema";
import { businessInfo, type BusinessInfo } from "./business";
import { seoSettings, type SeoSettings } from "./seo";

export interface SiteSettings {
  business: BusinessInfo | null;
  seo: SeoSettings | null;
}

/** Per-site settings the owner edits in the dashboard. Writes and owner reads are owner-scoped. */
export interface SiteSettingsStore {
  get(ownerId: string, projectId: string): Promise<SiteSettings>;
  saveBusiness(ownerId: string, projectId: string, info: BusinessInfo): Promise<void>;
  saveSeo(ownerId: string, projectId: string, seo: SeoSettings): Promise<void>;
  /** For the public Data API: business details only (never anything else). */
  publicBusiness(projectId: string): Promise<BusinessInfo | null>;
}

/** Stored JSON is checked again on the way out, so a bad row can never reach a page. */
const parseBusiness = (v: unknown) => (v ? (businessInfo.safeParse(v).data ?? null) : null);
const parseSeo = (v: unknown) => (v ? (seoSettings.safeParse(v).data ?? null) : null);

export class MemorySiteSettingsStore implements SiteSettingsStore {
  private rows = new Map<string, { ownerId: string; business: unknown; seo: unknown }>();
  async get(ownerId: string, projectId: string) {
    const r = this.rows.get(projectId);
    return r && r.ownerId === ownerId ? { business: parseBusiness(r.business), seo: parseSeo(r.seo) } : { business: null, seo: null };
  }
  private row(ownerId: string, projectId: string) {
    const r = this.rows.get(projectId) ?? { ownerId, business: null, seo: null };
    if (r.ownerId !== ownerId) throw new Error("not_owner");
    this.rows.set(projectId, r);
    return r;
  }
  async saveBusiness(ownerId: string, projectId: string, info: BusinessInfo) {
    this.row(ownerId, projectId).business = structuredClone(info);
  }
  async saveSeo(ownerId: string, projectId: string, seo: SeoSettings) {
    this.row(ownerId, projectId).seo = structuredClone(seo);
  }
  async publicBusiness(projectId: string) {
    return parseBusiness(this.rows.get(projectId)?.business);
  }
}

export class DbSiteSettingsStore implements SiteSettingsStore {
  constructor(private db: Database) {}
  async get(ownerId: string, projectId: string) {
    const [r] = await this.db.select({ business: siteSettings.business, seo: siteSettings.seo }).from(siteSettings).where(and(eq(siteSettings.projectId, projectId), eq(siteSettings.ownerId, ownerId))).limit(1);
    return { business: parseBusiness(r?.business), seo: parseSeo(r?.seo) };
  }
  private async upsert(ownerId: string, projectId: string, set: { business?: Record<string, unknown>; seo?: Record<string, unknown> }) {
    // The row belongs to the project's owner: an update never changes hands (owner_id must match).
    const rows = await this.db
      .insert(siteSettings)
      .values({ projectId, ownerId, ...set })
      .onConflictDoUpdate({ target: siteSettings.projectId, set: { ...set, updatedAt: new Date() }, setWhere: sql`${siteSettings.ownerId} = ${ownerId}` })
      .returning({ projectId: siteSettings.projectId });
    if (!rows.length) throw new Error("not_owner");
  }
  async saveBusiness(ownerId: string, projectId: string, info: BusinessInfo) {
    await this.upsert(ownerId, projectId, { business: info as Record<string, unknown> });
  }
  async saveSeo(ownerId: string, projectId: string, seo: SeoSettings) {
    await this.upsert(ownerId, projectId, { seo: seo as Record<string, unknown> });
  }
  async publicBusiness(projectId: string) {
    const [r] = await this.db.select({ business: siteSettings.business }).from(siteSettings).where(eq(siteSettings.projectId, projectId)).limit(1);
    return parseBusiness(r?.business);
  }
}
