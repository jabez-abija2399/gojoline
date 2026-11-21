import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { socialPosts } from "@/lib/db/schema";
import { CHANNELS, POST_KINDS, POST_STATUSES, type Channel, type ChannelResult, type NewPost, type PostKind, type PostMedia, type PostStatus, type SocialPost } from "./types";

export type PostPatch = Partial<Pick<SocialPost, "time" | "captionEn" | "captionAm" | "hashtags" | "channels" | "status" | "media">>;

export interface PostStore {
  /** Posts whose day is in [from, to], by day and time. */
  between(from: string, to: string): Promise<SocialPost[]>;
  /** The newest posts that were sent (or failed), newest first. */
  history(limit: number): Promise<SocialPost[]>;
  get(id: string): Promise<SocialPost | null>;
  createMany(posts: NewPost[]): Promise<SocialPost[]>;
  update(id: string, patch: PostPatch): Promise<SocialPost | null>;
  /** Saves one network's result; the post is "posted" once a network took it, "failed" if all tried failed. */
  saveResult(id: string, channel: Channel, result: ChannelResult): Promise<SocialPost | null>;
  /** Approved posts due by this Addis day (the caller checks the time). */
  due(day: string): Promise<SocialPost[]>;
}

const oneOf = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

type Row = typeof socialPosts.$inferSelect;
function toPost(r: Row): SocialPost {
  return {
    id: r.id,
    day: r.day,
    time: r.time,
    kind: oneOf<PostKind>(POST_KINDS, r.kind, "custom"),
    subject: r.subject,
    status: oneOf<PostStatus>(POST_STATUSES, r.status, "draft"),
    captionEn: r.captionEn,
    captionAm: r.captionAm,
    hashtags: r.hashtags,
    media: (r.media as PostMedia) ?? null,
    channels: (r.channels ?? []).filter((c): c is Channel => CHANNELS.includes(c as Channel)),
    results: (r.results ?? {}) as SocialPost["results"],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    postedAt: r.postedAt,
  };
}

/** posted when any network took it; failed when every network tried failed. */
function statusAfter(post: SocialPost): PostStatus {
  const tried = post.channels.map((c) => post.results[c]).filter(Boolean) as ChannelResult[];
  if (tried.some((r) => r.ok)) return "posted";
  if (tried.length > 0 && tried.length === post.channels.length) return "failed";
  return post.status;
}

export class DbPostStore implements PostStore {
  constructor(private db: Database) {}

  async between(from: string, to: string) {
    const rows = await this.db.select().from(socialPosts).where(and(gte(socialPosts.day, from), lte(socialPosts.day, to))).orderBy(asc(socialPosts.day), asc(socialPosts.time)).limit(200);
    return rows.map(toPost);
  }

  async history(limit: number) {
    const rows = await this.db.select().from(socialPosts).where(inArray(socialPosts.status, ["posted", "failed"])).orderBy(desc(socialPosts.day), desc(socialPosts.time)).limit(limit);
    return rows.map(toPost);
  }

  async get(id: string) {
    const [r] = await this.db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
    return r ? toPost(r) : null;
  }

  async createMany(posts: NewPost[]) {
    if (posts.length === 0) return [];
    const rows = await this.db
      .insert(socialPosts)
      .values(posts.map((p) => ({ ...p, media: p.media as Record<string, string> | null, channels: p.channels })))
      .returning();
    return rows.map(toPost);
  }

  async update(id: string, patch: PostPatch) {
    const [r] = await this.db
      .update(socialPosts)
      .set({ ...patch, media: patch.media === undefined ? undefined : (patch.media as Record<string, string> | null), updatedAt: new Date() })
      .where(eq(socialPosts.id, id))
      .returning();
    return r ? toPost(r) : null;
  }

  async saveResult(id: string, channel: Channel, result: ChannelResult) {
    const post = await this.get(id);
    if (!post) return null;
    const next = { ...post, results: { ...post.results, [channel]: result } };
    const status = statusAfter(next);
    const [r] = await this.db
      .update(socialPosts)
      .set({ results: next.results, status, postedAt: status === "posted" ? (post.postedAt ?? new Date()) : post.postedAt, updatedAt: new Date() })
      .where(eq(socialPosts.id, id))
      .returning();
    return r ? toPost(r) : null;
  }

  async due(day: string) {
    const rows = await this.db.select().from(socialPosts).where(and(eq(socialPosts.status, "approved"), lte(socialPosts.day, day))).orderBy(asc(socialPosts.day), asc(socialPosts.time)).limit(20);
    return rows.map(toPost);
  }
}

export class MemoryPostStore implements PostStore {
  private rows: SocialPost[] = [];

  async between(from: string, to: string) {
    return this.rows.filter((p) => p.day >= from && p.day <= to).sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
  }
  async history(limit: number) {
    return this.rows.filter((p) => p.status === "posted" || p.status === "failed").sort((a, b) => (b.day + b.time).localeCompare(a.day + a.time)).slice(0, limit);
  }
  async get(id: string) {
    return this.rows.find((p) => p.id === id) ?? null;
  }
  async createMany(posts: NewPost[]) {
    const now = new Date();
    const made = posts.map((p) => ({ ...p, id: crypto.randomUUID(), status: "draft" as const, results: {}, createdAt: now, updatedAt: now, postedAt: null }));
    this.rows.push(...made);
    return made;
  }
  async update(id: string, patch: PostPatch) {
    const p = await this.get(id);
    if (!p) return null;
    Object.assign(p, patch, { updatedAt: new Date() });
    return p;
  }
  async saveResult(id: string, channel: Channel, result: ChannelResult) {
    const p = await this.get(id);
    if (!p) return null;
    p.results = { ...p.results, [channel]: result };
    p.status = statusAfter(p);
    if (p.status === "posted") p.postedAt ??= new Date();
    return p;
  }
  async due(day: string) {
    return this.rows.filter((p) => p.status === "approved" && p.day <= day).sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
  }
}
