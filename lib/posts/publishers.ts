import { escapeHtml, type TelegramClient } from "@/lib/telegram/client";
import type { Channel } from "./types";

/** A post's picture or video as bytes. */
export type MediaFile = { kind: "photo" | "video"; data: Buffer; name: string };

export interface PublishInput {
  /** The full text for this network (both languages, tracked link, hashtags). */
  text: string;
  media: MediaFile | null;
  /** A short-lived public address of the media, for networks that fetch it themselves (Instagram). */
  mediaUrl: string | null;
}

/** One network Gojoline posts to by itself. Throws with the network's reason; returns its post id. */
export interface ChannelPublisher {
  channel: Channel;
  /** Shown to admins: which account or page it posts to. */
  label: string;
  publish(input: PublishInput): Promise<string>;
}

/** Our Telegram channel, through the bot (it must be an admin of the channel). */
export class TelegramPublisher implements ChannelPublisher {
  readonly channel = "telegram" as const;
  constructor(
    private readonly client: TelegramClient,
    private readonly chatId: string,
  ) {}
  get label() {
    return this.chatId;
  }
  publish(input: PublishInput) {
    return this.client.post(this.chatId, { html: escapeHtml(input.text), media: input.media });
  }
}

type Fetch = typeof fetch;

async function graph<T>(fetchImpl: Fetch, url: string, init: RequestInit): Promise<T> {
  const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(120_000) });
  const data = (await res.json().catch(() => null)) as (T & { error?: { message?: string } }) | null;
  // The network's reason only; never the URL or the token.
  if (!res.ok || !data || data.error) throw new Error(data?.error?.message?.slice(0, 200) ?? `HTTP ${res.status}`);
  return data;
}

/**
 * Our Facebook Page, through Meta's Graph API with a Page access token (FACEBOOK_PAGE_ID,
 * FACEBOOK_PAGE_TOKEN): text with the link, a photo with a caption, or a video with a description.
 */
export class FacebookPagePublisher implements ChannelPublisher {
  readonly channel = "facebook" as const;
  constructor(
    private readonly pageId: string,
    private readonly token: string,
    private readonly version = "v23.0",
    private readonly fetchImpl: Fetch = fetch,
  ) {}
  get label() {
    return `Page ${this.pageId}`;
  }
  async publish({ text, media }: PublishInput) {
    if (!media) {
      const r = await graph<{ id: string }>(this.fetchImpl, `https://graph.facebook.com/${this.version}/${this.pageId}/feed`, { method: "POST", body: new URLSearchParams({ message: text, access_token: this.token }) });
      return r.id;
    }
    const form = new FormData();
    form.set("access_token", this.token);
    form.set(media.kind === "video" ? "description" : "caption", text);
    form.set("source", new Blob([new Uint8Array(media.data)], { type: media.kind === "video" ? "video/mp4" : "image/jpeg" }), media.name);
    const host = media.kind === "video" ? "graph-video.facebook.com" : "graph.facebook.com";
    const r = await graph<{ id: string; post_id?: string }>(this.fetchImpl, `https://${host}/${this.version}/${this.pageId}/${media.kind === "video" ? "videos" : "photos"}`, { method: "POST", body: form });
    return r.post_id ?? r.id;
  }
}

/**
 * Our Instagram professional account (INSTAGRAM_USER_ID, with the Page token): a photo, or a
 * video as a Reel. Instagram fetches the media from a public address, then publishes it.
 */
export class InstagramPublisher implements ChannelPublisher {
  readonly channel = "instagram" as const;
  constructor(
    private readonly userId: string,
    private readonly token: string,
    private readonly version = "v23.0",
    private readonly fetchImpl: Fetch = fetch,
    private readonly wait = (ms: number) => new Promise((r) => setTimeout(r, ms)),
  ) {}
  get label() {
    return `Account ${this.userId}`;
  }
  async publish({ text, media, mediaUrl }: PublishInput) {
    if (!media || !mediaUrl) throw new Error("Instagram needs a picture or video");
    const base = `https://graph.facebook.com/${this.version}/${this.userId}`;
    const params: Record<string, string> = media.kind === "video" ? { media_type: "REELS", video_url: mediaUrl, caption: text.slice(0, 2200), share_to_feed: "true" } : { image_url: mediaUrl, caption: text.slice(0, 2200) };
    const made = await graph<{ id: string }>(this.fetchImpl, `${base}/media`, { method: "POST", body: new URLSearchParams({ ...params, access_token: this.token }) });
    // A video is processed first: wait until it is ready (up to about two minutes).
    if (media.kind === "video") {
      for (let i = 0; ; i++) {
        const s = await graph<{ status_code?: string }>(this.fetchImpl, `https://graph.facebook.com/${this.version}/${made.id}?fields=status_code&access_token=${encodeURIComponent(this.token)}`, { method: "GET" });
        if (s.status_code === "FINISHED") break;
        if (s.status_code === "ERROR" || i >= 40) throw new Error(`Instagram couldn't process the video (${s.status_code ?? "timeout"})`);
        await this.wait(3000);
      }
    }
    const done = await graph<{ id: string }>(this.fetchImpl, `${base}/media_publish`, { method: "POST", body: new URLSearchParams({ creation_id: made.id, access_token: this.token }) });
    return done.id;
  }
}

/** Where TikTok's refresh token is kept (it changes when used). */
export interface TokenStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
}

/**
 * Our TikTok account, through the Content Posting API: videos go to the account's TikTok inbox
 * as drafts (an app still in review may not post publicly), and the admin finishes them in TikTok.
 * Needs TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET and a refresh token (TIKTOK_REFRESH_TOKEN at first).
 */
export class TikTokInboxPublisher implements ChannelPublisher {
  readonly channel = "tiktok" as const;
  readonly label = "TikTok inbox (draft)";
  constructor(
    private readonly clientKey: string,
    private readonly clientSecret: string,
    private readonly tokens: TokenStore,
    private readonly fetchImpl: Fetch = fetch,
  ) {}

  private async accessToken(): Promise<string> {
    const refresh = await this.tokens.get();
    if (!refresh) throw new Error("TikTok not connected (TIKTOK_REFRESH_TOKEN)");
    const res = await this.fetchImpl("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_key: this.clientKey, client_secret: this.clientSecret, grant_type: "refresh_token", refresh_token: refresh }),
      signal: AbortSignal.timeout(30_000),
    });
    const d = (await res.json().catch(() => null)) as { access_token?: string; refresh_token?: string; error_description?: string } | null;
    if (!res.ok || !d?.access_token) throw new Error(`TikTok sign-in failed: ${d?.error_description?.slice(0, 120) ?? res.status}`);
    if (d.refresh_token && d.refresh_token !== refresh) await this.tokens.set(d.refresh_token);
    return d.access_token;
  }

  async publish({ media }: PublishInput) {
    if (media?.kind !== "video") throw new Error("TikTok needs a video");
    const token = await this.accessToken();
    const size = media.data.length;
    const init = await this.fetchImpl("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: size, total_chunk_count: 1 } }),
      signal: AbortSignal.timeout(30_000),
    });
    const d = (await init.json().catch(() => null)) as { data?: { publish_id?: string; upload_url?: string }; error?: { code?: string; message?: string } } | null;
    if (!init.ok || !d?.data?.upload_url || !d.data.publish_id || (d.error?.code && d.error.code !== "ok")) throw new Error(`TikTok: ${d?.error?.message?.slice(0, 160) ?? init.status}`);
    const up = await this.fetchImpl(d.data.upload_url, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4", "Content-Length": String(size), "Content-Range": `bytes 0-${size - 1}/${size}` },
      body: new Uint8Array(media.data),
      signal: AbortSignal.timeout(120_000),
    });
    if (!up.ok) throw new Error(`TikTok upload failed (${up.status})`);
    return d.data.publish_id;
  }
}
