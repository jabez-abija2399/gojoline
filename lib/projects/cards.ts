import { and, eq, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { projectCards } from "@/lib/db/schema";
import { makeThumb } from "@/lib/growth/showcase";
import { libraryPhoto } from "@/lib/template/files";
import type { AssetStore } from "@/lib/cloud/assets";
import type { ProjectStore } from "./types";

/**
 * The picture on a site's card in "Your sites" (2026-11-21): its home page photo, colours and
 * headline, taken from the newest saved version (drafts too). Only for the owner's own list;
 * the public showcase keeps its own card made from the published version.
 */
export interface ProjectCard {
  projectId: string;
  versionNumber: number;
  heading: string | null;
  colors: { primary: string; background: string; text: string } | null;
  thumbKey: string | null;
  updatedAt: Date;
}

export interface CardStore {
  forOwner(ownerId: string, projectIds: string[]): Promise<Map<string, ProjectCard>>;
  thumb(ownerId: string, projectId: string): Promise<{ key: string; data: Buffer } | null>;
  save(ownerId: string, card: Omit<ProjectCard, "updatedAt">, thumb: Buffer | null): Promise<void>;
}

type Text = string | { en?: string; am?: string } | undefined;
const HEX = /^#[0-9a-fA-F]{6}$/;
const PHOTO = /^\/(images\/[a-z0-9-]{1,60}\.webp|stock\/[a-z0-9-]+\.webp)$/;

/** What the card shows, read from a version's site.json; null when it can't be read. */
export function cardSource(siteJson: string | undefined, locale: "en" | "am"): { heading: string | null; colors: ProjectCard["colors"]; hero: string | null } | null {
  try {
    const site = JSON.parse(siteJson ?? "") as {
      tagline?: Text;
      theme?: { primary?: string; background?: string; text?: string };
      pages?: { path?: string; sections?: { type?: string; heading?: Text; image?: { src?: unknown } }[] }[];
    };
    const pick = (t: Text) => (typeof t === "string" ? t : (t?.[locale] ?? t?.en ?? t?.am ?? "")).trim();
    const home = site.pages?.find((p) => p.path === "/") ?? site.pages?.[0];
    const hero = home?.sections?.find((s) => s.type === "hero");
    const heading = (pick(hero?.heading) || pick(site.tagline)).slice(0, 120) || null;
    const th = site.theme;
    const colors = th && HEX.test(th.primary ?? "") && HEX.test(th.background ?? "") && HEX.test(th.text ?? "") ? { primary: th.primary!, background: th.background!, text: th.text! } : null;
    const src = hero?.image?.src;
    return { heading, colors, hero: typeof src === "string" && PHOTO.test(src) ? src : null };
  } catch {
    return null;
  }
}

/** The photo's bytes: a library photo, or the owner's own upload for this project. */
async function photoFile(assets: AssetStore | undefined, ownerId: string, projectId: string, hero: string | null) {
  if (!hero) return [];
  if (hero.startsWith("/stock/")) {
    const data = libraryPhoto(hero.slice("/stock/".length));
    return data ? [{ path: hero.slice(1), data }] : [];
  }
  const a = await assets?.get(ownerId, projectId, hero.slice("/images/".length));
  return a ? [{ path: hero.slice(1), data: a.data }] : [];
}

/** Makes (or remakes) a project's card from its newest version. */
export async function refreshCard(deps: { store: ProjectStore; assets?: AssetStore; cards: CardStore }, ownerId: string, project: { id: string; locale: "en" | "am" }) {
  const version = await deps.store.latestVersion(ownerId, project.id);
  if (!version) return;
  const src = cardSource(version.files["src/site.json"], project.locale);
  if (!src) return;
  const thumb = await makeThumb(await photoFile(deps.assets, ownerId, project.id, src.hero), src.hero);
  await deps.cards.save(ownerId, { projectId: project.id, versionNumber: version.number, heading: src.heading, colors: src.colors, thumbKey: thumb?.key ?? null }, thumb?.data ?? null);
}

/** How many cards one page view may (re)make: the rest follow on the next visit. */
export const CARDS_PER_VIEW = 6;

/** The owner's cards, remaking those older than their project (or missing), a few per view. */
export async function ownerCards(deps: { store: ProjectStore; assets?: AssetStore; cards: CardStore }, ownerId: string, projects: { id: string; locale: "en" | "am"; updatedAt: Date }[]) {
  const have = await deps.cards.forOwner(ownerId, projects.map((p) => p.id));
  const stale = projects.filter((p) => {
    const c = have.get(p.id);
    return !c || c.updatedAt < p.updatedAt;
  });
  if (stale.length === 0) return have;
  await Promise.all(stale.slice(0, CARDS_PER_VIEW).map((p) => refreshCard(deps, ownerId, p).catch(() => undefined)));
  return deps.cards.forOwner(ownerId, projects.map((p) => p.id));
}

const cols = {
  projectId: projectCards.projectId,
  versionNumber: projectCards.versionNumber,
  heading: projectCards.heading,
  primary: projectCards.primaryColor,
  background: projectCards.backgroundColor,
  text: projectCards.textColor,
  thumbKey: projectCards.thumbKey,
  updatedAt: projectCards.updatedAt,
};

type Row = { projectId: string; versionNumber: number; heading: string | null; primary: string | null; background: string | null; text: string | null; thumbKey: string | null; updatedAt: Date };
const toCard = (r: Row): ProjectCard => ({
  projectId: r.projectId,
  versionNumber: r.versionNumber,
  heading: r.heading,
  colors: r.primary && r.background && r.text ? { primary: r.primary, background: r.background, text: r.text } : null,
  thumbKey: r.thumbKey,
  updatedAt: r.updatedAt,
});

export class DbCardStore implements CardStore {
  constructor(private db: Database) {}

  async forOwner(ownerId: string, projectIds: string[]) {
    if (projectIds.length === 0) return new Map<string, ProjectCard>();
    const rows = await this.db.select(cols).from(projectCards).where(and(eq(projectCards.ownerId, ownerId), inArray(projectCards.projectId, projectIds)));
    return new Map(rows.map((r) => [r.projectId, toCard(r)]));
  }

  async thumb(ownerId: string, projectId: string) {
    const [r] = await this.db.select({ key: projectCards.thumbKey, data: projectCards.thumb }).from(projectCards).where(and(eq(projectCards.ownerId, ownerId), eq(projectCards.projectId, projectId))).limit(1);
    return r?.key && r.data ? { key: r.key, data: r.data } : null;
  }

  async save(ownerId: string, c: Omit<ProjectCard, "updatedAt">, thumb: Buffer | null) {
    const values = {
      ownerId,
      versionNumber: c.versionNumber,
      heading: c.heading,
      primaryColor: c.colors?.primary ?? null,
      backgroundColor: c.colors?.background ?? null,
      textColor: c.colors?.text ?? null,
      thumb,
      thumbKey: c.thumbKey,
      updatedAt: new Date(),
    };
    // The project must be the owner's: the insert names both, and the conflict update checks it.
    await this.db
      .insert(projectCards)
      .values({ projectId: c.projectId, ...values })
      .onConflictDoUpdate({ target: projectCards.projectId, set: values, where: eq(projectCards.ownerId, ownerId) });
  }
}

export class MemoryCardStore implements CardStore {
  private rows = new Map<string, { ownerId: string; card: ProjectCard; thumb: Buffer | null }>();

  async forOwner(ownerId: string, projectIds: string[]) {
    const out = new Map<string, ProjectCard>();
    for (const id of projectIds) {
      const r = this.rows.get(id);
      if (r && r.ownerId === ownerId) out.set(id, r.card);
    }
    return out;
  }

  async thumb(ownerId: string, projectId: string) {
    const r = this.rows.get(projectId);
    return r && r.ownerId === ownerId && r.card.thumbKey && r.thumb ? { key: r.card.thumbKey, data: r.thumb } : null;
  }

  async save(ownerId: string, c: Omit<ProjectCard, "updatedAt">, thumb: Buffer | null) {
    const prev = this.rows.get(c.projectId);
    if (prev && prev.ownerId !== ownerId) return;
    this.rows.set(c.projectId, { ownerId, card: { ...c, updatedAt: new Date() }, thumb });
  }
}
