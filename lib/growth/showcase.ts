import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { projects, sites } from "@/lib/db/schema";
import type { ProjectStore } from "@/lib/projects/types";
import type { Site, SiteAdminStore, SiteStore } from "@/lib/sites/types";

/**
 * The public showcase (2026-11-18): live sites whose owners opted in (off by default). Only
 * published sites are listed (so they passed the publish checks), never taken down, resting or
 * hidden by an admin.
 */
export interface ShowcaseEntry {
  siteId: string;
  name: string;
  url: string;
  /** The preset the site started from (its sector), if any. */
  templateId: string | null;
  /** "/images/…" or "/stock/…" from the last publish, if any. */
  image: string | null;
  publishedAt: Date | null;
}

export interface AdminShowcaseEntry extends ShowcaseEntry {
  hidden: boolean;
  ownerId: string;
}

export interface ShowcaseStore {
  /** The owner's choice for one of their sites; null when the project has no site. */
  optedIn(ownerId: string, projectId: string): Promise<boolean | null>;
  /** Owner-scoped. False when the project has no site. */
  setOptIn(ownerId: string, projectId: string, on: boolean): Promise<boolean>;
  /** Saved at publish (owner-scoped). */
  saveImage(ownerId: string, projectId: string, image: string | null): Promise<void>;
  /** What the public page lists, newest first. */
  list(limit: number): Promise<ShowcaseEntry[]>;
  /** One listed entry (the picture route); null when it isn't shown publicly. */
  entry(siteId: string): Promise<(ShowcaseEntry & { ownerId: string; projectId: string }) | null>;
  /** Every opted-in live site, hidden ones too (admin). */
  adminList(limit: number): Promise<AdminShowcaseEntry[]>;
  /** Admin: hide or show again. False when the site doesn't exist. */
  setHidden(siteId: string, hidden: boolean): Promise<boolean>;
}

/** The hero photo of a site's home page, if it is one of the site's own or library photos. */
export function heroImageOf(siteJson: string | undefined): string | null {
  try {
    const site = JSON.parse(siteJson ?? "") as { pages?: { path?: string; sections?: { type?: string; image?: { src?: unknown } }[] }[] };
    const home = site.pages?.find((p) => p.path === "/") ?? site.pages?.[0];
    const src = home?.sections?.find((s) => s.type === "hero")?.image?.src;
    return typeof src === "string" && /^\/(images\/[a-z0-9-]{1,60}\.webp|stock\/[a-z0-9-]+\.webp)$/.test(src) ? src : null;
  } catch {
    return null;
  }
}

const listed = and(eq(sites.showcase, true), eq(sites.status, "published"), isNull(sites.offlineAt), isNull(sites.showcaseHiddenAt), sql`${sites.url} is not null`);

export class DbShowcaseStore implements ShowcaseStore {
  constructor(private db: Database) {}

  async optedIn(ownerId: string, projectId: string) {
    const [row] = await this.db.select({ on: sites.showcase }).from(sites).where(and(eq(sites.ownerId, ownerId), eq(sites.projectId, projectId))).limit(1);
    return row ? row.on : null;
  }

  async setOptIn(ownerId: string, projectId: string, on: boolean) {
    const rows = await this.db.update(sites).set({ showcase: on }).where(and(eq(sites.ownerId, ownerId), eq(sites.projectId, projectId))).returning({ id: sites.id });
    return rows.length > 0;
  }

  async saveImage(ownerId: string, projectId: string, image: string | null) {
    await this.db.update(sites).set({ showcaseImage: image }).where(and(eq(sites.ownerId, ownerId), eq(sites.projectId, projectId)));
  }

  private select() {
    return this.db
      .select({ siteId: sites.id, name: projects.name, slug: sites.slug, url: sites.url, templateId: projects.templateId, image: sites.showcaseImage, publishedAt: sites.publishedAt, ownerId: sites.ownerId, projectId: sites.projectId, hiddenAt: sites.showcaseHiddenAt })
      .from(sites)
      .innerJoin(projects, eq(projects.id, sites.projectId));
  }

  private toEntry(r: { siteId: string; name: string; slug: string; url: string | null; templateId: string | null; image: string | null; publishedAt: Date | null }): ShowcaseEntry {
    return { siteId: r.siteId, name: r.name || r.slug, url: r.url ?? "", templateId: r.templateId, image: r.image, publishedAt: r.publishedAt };
  }

  async list(limit: number) {
    const rows = await this.select().where(listed).orderBy(desc(sites.publishedAt)).limit(limit);
    return rows.map((r) => this.toEntry(r));
  }

  async entry(siteId: string) {
    const [r] = await this.select().where(and(eq(sites.id, siteId), listed)).limit(1);
    return r ? { ...this.toEntry(r), ownerId: r.ownerId, projectId: r.projectId } : null;
  }

  async adminList(limit: number) {
    const rows = await this.select()
      .where(and(eq(sites.showcase, true), eq(sites.status, "published")))
      .orderBy(desc(sites.publishedAt))
      .limit(limit);
    return rows.map((r) => ({ ...this.toEntry(r), hidden: r.hiddenAt !== null, ownerId: r.ownerId }));
  }

  async setHidden(siteId: string, hidden: boolean) {
    const rows = await this.db.update(sites).set({ showcaseHiddenAt: hidden ? new Date() : null }).where(eq(sites.id, siteId)).returning({ id: sites.id });
    return rows.length > 0;
  }
}

/** Development and e2e: keeps the showcase fields beside the in-memory sites. */
export class MemoryShowcaseStore implements ShowcaseStore {
  private on = new Set<string>();
  private hidden = new Set<string>();
  private images = new Map<string, string | null>();
  constructor(
    private sites: SiteStore & SiteAdminStore,
    private projects: ProjectStore,
  ) {}

  async optedIn(ownerId: string, projectId: string) {
    const s = await this.sites.getByProject(ownerId, projectId);
    return s ? this.on.has(s.id) : null;
  }
  async setOptIn(ownerId: string, projectId: string, on: boolean) {
    const s = await this.sites.getByProject(ownerId, projectId);
    if (!s) return false;
    if (on) this.on.add(s.id);
    else this.on.delete(s.id);
    return true;
  }
  async saveImage(ownerId: string, projectId: string, image: string | null) {
    const s = await this.sites.getByProject(ownerId, projectId);
    if (s) this.images.set(s.id, image);
  }
  private async entries(): Promise<(AdminShowcaseEntry & { projectId: string; site: Site })[]> {
    const all = (await this.sites.recent(1000)).filter((s) => this.on.has(s.id) && s.status === "published");
    const out = await Promise.all(
      all.map(async (s) => {
        const p = await this.projects.getProject(s.ownerId, s.projectId);
        return { siteId: s.id, name: p?.name || s.slug, url: s.url ?? "", templateId: p?.templateId ?? null, image: this.images.get(s.id) ?? null, publishedAt: s.publishedAt, hidden: this.hidden.has(s.id), ownerId: s.ownerId, projectId: s.projectId, site: s };
      }),
    );
    return out.sort((a, b) => +(b.publishedAt ?? 0) - +(a.publishedAt ?? 0));
  }
  private isListed(e: { hidden: boolean; url: string; site: Site }) {
    return !e.hidden && !!e.url && !e.site.offlineAt;
  }
  async list(limit: number) {
    return (await this.entries()).filter((e) => this.isListed(e)).slice(0, limit).map(({ siteId, name, url, templateId, image, publishedAt }) => ({ siteId, name, url, templateId, image, publishedAt }));
  }
  async entry(siteId: string) {
    const e = (await this.entries()).find((x) => x.siteId === siteId && this.isListed(x));
    return e ? { siteId: e.siteId, name: e.name, url: e.url, templateId: e.templateId, image: e.image, publishedAt: e.publishedAt, ownerId: e.ownerId, projectId: e.projectId } : null;
  }
  async adminList(limit: number) {
    return (await this.entries()).slice(0, limit).map(({ siteId, name, url, templateId, image, publishedAt, hidden, ownerId }) => ({ siteId, name, url, templateId, image, publishedAt, hidden, ownerId }));
  }
  async setHidden(siteId: string, hidden: boolean) {
    if (!(await this.sites.byId(siteId))) return false;
    if (hidden) this.hidden.add(siteId);
    else this.hidden.delete(siteId);
    return true;
  }
}
