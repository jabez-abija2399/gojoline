import { createHash } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import sharp from "sharp";
import type { Database } from "@/lib/db/client";
import { projects, sites, siteShowcase } from "@/lib/db/schema";
import type { ProjectStore } from "@/lib/projects/types";
import type { Site, SiteAdminStore, SiteStore } from "@/lib/sites/types";

/**
 * The public showcase (2026-11-18): live sites whose owners opted in (off by default). Only
 * published sites are listed (so they passed the publish checks), never taken down, resting or
 * hidden by an admin. What a card shows (name and photo) is saved at publish from the published
 * version only, never from the draft or the project's name.
 */
export interface ShowcaseThumb {
  key: string;
  width: number;
  height: number;
}

export interface ShowcaseEntry {
  siteId: string;
  name: string;
  url: string;
  /** The preset the site started from (its sector), if any. */
  templateId: string | null;
  thumb: ShowcaseThumb | null;
  /** ISO time (the list is cached as JSON). */
  publishedAt: string | null;
}

export interface AdminShowcaseEntry extends ShowcaseEntry {
  hidden: boolean;
  ownerId: string;
}

export interface PublishedCard {
  name: string;
  thumb: (ShowcaseThumb & { data: Buffer }) | null;
}

export interface ShowcaseStore {
  /** The owner's choice for one of their sites; null when the project has no site. */
  optedIn(ownerId: string, projectId: string): Promise<boolean | null>;
  /** Owner-scoped. False when the project has no site. */
  setOptIn(ownerId: string, projectId: string, on: boolean): Promise<boolean>;
  /** Saved at every publish (owner-scoped), from the published version. */
  savePublished(ownerId: string, projectId: string, card: PublishedCard): Promise<void>;
  /** What the public page lists, newest first. */
  list(limit: number): Promise<ShowcaseEntry[]>;
  /** A thumbnail's bytes, only while a listed site uses it. */
  thumb(key: string): Promise<Buffer | null>;
  /** Every opted-in live site, hidden ones too (admin). */
  adminList(limit: number): Promise<AdminShowcaseEntry[]>;
  /** Admin: hide or show again. False when the site doesn't exist. */
  setHidden(siteId: string, hidden: boolean): Promise<boolean>;
}

type Text = string | { en?: string; am?: string } | undefined;

/** The published name and hero photo path of a site.json (the version that passed the checks). */
export function publishedCardSource(siteJson: string | undefined, locale: "en" | "am"): { name: string; hero: string | null } | null {
  try {
    const site = JSON.parse(siteJson ?? "") as { name?: Text; pages?: { path?: string; sections?: { type?: string; image?: { src?: unknown } }[] }[] };
    const pick = (t: Text) => (typeof t === "string" ? t : (t?.[locale] ?? t?.en ?? t?.am ?? ""));
    const name = pick(site.name).trim().slice(0, 80);
    if (!name) return null;
    const home = site.pages?.find((p) => p.path === "/") ?? site.pages?.[0];
    const src = home?.sections?.find((s) => s.type === "hero")?.image?.src;
    const hero = typeof src === "string" && /^\/(images\/[a-z0-9-]{1,60}\.webp|stock\/[a-z0-9-]+\.webp)$/.test(src) ? src : null;
    return { name, hero };
  } catch {
    return null;
  }
}

export const THUMB_WIDTH = 640;

/** A ~640 px WebP of the published hero photo (the bytes visitors of the site get), keyed by its hash. */
export async function makeThumb(files: { path: string; data: Buffer }[], hero: string | null): Promise<PublishedCard["thumb"]> {
  const file = hero ? files.find((f) => f.path === hero.slice(1)) : undefined;
  if (!file) return null;
  const { data, info } = await sharp(file.data, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: THUMB_WIDTH, height: 400, fit: "cover", withoutEnlargement: false })
    .webp({ quality: 70 })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, key: createHash("sha256").update(data).digest("hex").slice(0, 32) };
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

  async savePublished(ownerId: string, projectId: string, card: PublishedCard) {
    const [site] = await this.db.select({ id: sites.id }).from(sites).where(and(eq(sites.ownerId, ownerId), eq(sites.projectId, projectId))).limit(1);
    if (!site) return;
    const values = { name: card.name, thumb: card.thumb?.data ?? null, thumbKey: card.thumb?.key ?? null, thumbWidth: card.thumb?.width ?? null, thumbHeight: card.thumb?.height ?? null, updatedAt: new Date() };
    await this.db.insert(siteShowcase).values({ siteId: site.id, ...values }).onConflictDoUpdate({ target: siteShowcase.siteId, set: values });
  }

  private select() {
    return this.db
      .select({ siteId: sites.id, name: siteShowcase.name, url: sites.url, templateId: projects.templateId, thumbKey: siteShowcase.thumbKey, thumbWidth: siteShowcase.thumbWidth, thumbHeight: siteShowcase.thumbHeight, publishedAt: sites.publishedAt, ownerId: sites.ownerId, hiddenAt: sites.showcaseHiddenAt })
      .from(sites)
      .innerJoin(siteShowcase, eq(siteShowcase.siteId, sites.id))
      .innerJoin(projects, eq(projects.id, sites.projectId));
  }

  private toEntry(r: { siteId: string; name: string; url: string | null; templateId: string | null; thumbKey: string | null; thumbWidth: number | null; thumbHeight: number | null; publishedAt: Date | null }): ShowcaseEntry {
    return { siteId: r.siteId, name: r.name, url: r.url ?? "", templateId: r.templateId, thumb: r.thumbKey && r.thumbWidth && r.thumbHeight ? { key: r.thumbKey, width: r.thumbWidth, height: r.thumbHeight } : null, publishedAt: r.publishedAt?.toISOString() ?? null };
  }

  async list(limit: number) {
    const rows = await this.select().where(listed).orderBy(desc(sites.publishedAt)).limit(limit);
    return rows.map((r) => this.toEntry(r));
  }

  async thumb(key: string) {
    const [r] = await this.db
      .select({ thumb: siteShowcase.thumb })
      .from(siteShowcase)
      .innerJoin(sites, eq(sites.id, siteShowcase.siteId))
      .where(and(eq(siteShowcase.thumbKey, key), listed))
      .limit(1);
    return r?.thumb ?? null;
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
  private cards = new Map<string, PublishedCard>();
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
  async savePublished(ownerId: string, projectId: string, card: PublishedCard) {
    const s = await this.sites.getByProject(ownerId, projectId);
    if (s) this.cards.set(s.id, card);
  }
  private async entries(): Promise<(AdminShowcaseEntry & { site: Site; data: Buffer | null })[]> {
    const all = (await this.sites.recent(1000)).filter((s) => this.on.has(s.id) && s.status === "published" && this.cards.has(s.id));
    const out = await Promise.all(
      all.map(async (s) => {
        const p = await this.projects.getProject(s.ownerId, s.projectId);
        const card = this.cards.get(s.id)!;
        const thumb = card.thumb ? { key: card.thumb.key, width: card.thumb.width, height: card.thumb.height } : null;
        return { siteId: s.id, name: card.name, url: s.url ?? "", templateId: p?.templateId ?? null, thumb, publishedAt: s.publishedAt?.toISOString() ?? null, hidden: this.hidden.has(s.id), ownerId: s.ownerId, site: s, data: card.thumb?.data ?? null };
      }),
    );
    return out.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  }
  private isListed(e: { hidden: boolean; url: string; site: Site }) {
    return !e.hidden && !!e.url && !e.site.offlineAt;
  }
  async list(limit: number) {
    return (await this.entries()).filter((e) => this.isListed(e)).slice(0, limit).map(({ siteId, name, url, templateId, thumb, publishedAt }) => ({ siteId, name, url, templateId, thumb, publishedAt }));
  }
  async thumb(key: string) {
    return (await this.entries()).find((e) => this.isListed(e) && e.thumb?.key === key)?.data ?? null;
  }
  async adminList(limit: number) {
    return (await this.entries()).slice(0, limit).map(({ siteId, name, url, templateId, thumb, publishedAt, hidden, ownerId }) => ({ siteId, name, url, templateId, thumb, publishedAt, hidden, ownerId }));
  }
  async setHidden(siteId: string, hidden: boolean) {
    if (!(await this.sites.byId(siteId))) return false;
    if (hidden) this.hidden.add(siteId);
    else this.hidden.delete(siteId);
    return true;
  }
}
