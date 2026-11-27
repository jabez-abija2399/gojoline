/**
 * Daily social posts (Admin → Posts, 2026-11-21): one planned post a day, written in English and
 * Amharic, approved by an admin, then sent to Gojoline's own channels (Telegram automatically;
 * the other networks from a posting kit until their APIs are connected).
 */
export const POST_KINDS = ["template", "site", "demo", "tip", "howto", "myth", "question", "feature", "idea", "story", "moment", "custom"] as const;
export type PostKind = (typeof POST_KINDS)[number];

export const POST_STATUSES = ["draft", "approved", "posted", "failed", "skipped"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const CHANNELS = ["telegram", "facebook", "instagram", "tiktok", "youtube"] as const;
export type Channel = (typeof CHANNELS)[number];

/** What a post shows: a template's picture, an opted-in site's picture, or a rendered video. */
export type PostMedia = { type: "template"; id: string } | { type: "site"; siteId: string } | { type: "video"; key: string } | null;

export interface ChannelResult {
  ok: boolean;
  /** ISO time. */
  at: string;
  /** The network's id for the post (a Telegram message id, a Facebook post id). */
  ref?: string;
  error?: string;
}

export interface SocialPost {
  id: string;
  /** Addis Ababa day, YYYY-MM-DD. */
  day: string;
  /** Addis Ababa time, HH:MM. */
  time: string;
  kind: PostKind;
  /** A template id, a site id or a library item id, depending on the kind. */
  subject: string | null;
  status: PostStatus;
  captionEn: string;
  captionAm: string;
  /** Space-separated, each starting with #. */
  hashtags: string;
  media: PostMedia;
  /** The networks this post is sent to automatically (the others use the kit). */
  channels: Channel[];
  /** Per network, plus "video" when making the post's video failed (the picture is used then). */
  results: Partial<Record<Channel | "video", ChannelResult>>;
  createdAt: Date;
  updatedAt: Date;
  postedAt: Date | null;
}

export type NewPost = Pick<SocialPost, "day" | "time" | "kind" | "subject" | "captionEn" | "captionAm" | "hashtags" | "media" | "channels">;

/** The default time of day for a post: early evening in Addis, when most people scroll. */
export const DEFAULT_TIME = "18:30";
