import type { SettingsStore } from "@/lib/billing/settings";
import { seal, unseal } from "@/lib/security/seal";
import type { Channel } from "./types";

/**
 * Gojoline's own social accounts, connected from Admin → Posts (2026-11-21). Kept in app_settings
 * "posts.connections"; tokens and secrets are sealed (AES-GCM with a key from the server secret)
 * and never sent back to the browser. Server settings (env) still work as a fallback.
 */
export interface Resolved {
  telegram?: { channelId: string };
  facebook?: { pageId: string; token: string; name?: string };
  instagram?: { userId: string; username?: string };
  tiktok?: { clientKey: string; clientSecret: string; refreshToken?: string };
}

/** What the admin page may know about a connection: never a token. */
export interface ConnectionView {
  connected: boolean;
  /** "@gojoline", the Page's name, "@account", or null. */
  label: string | null;
  /** Saved here in Admin, or set on the server. */
  source: "admin" | "server" | null;
  /** TikTok only: the app is saved but nobody has signed in with TikTok yet. */
  needsSignIn?: boolean;
}

type Stored = {
  telegram?: { channelId: string };
  facebook?: { pageId: string; token: string; name?: string };
  instagram?: { userId: string; username?: string };
  tiktok?: { clientKey: string; clientSecret: string; refreshToken?: string };
};

const KEY = "posts.connections";
type Env = Record<string, string | undefined>;

export class ConnectionStore {
  constructor(
    private readonly settings: SettingsStore,
    private readonly secret: string,
    private readonly env: Env = {},
  ) {}

  private async stored(): Promise<Stored> {
    return ((await this.settings.get(KEY)) ?? {}) as Stored;
  }

  private open(v: string | undefined): string | undefined {
    return v ? (unseal(v, this.secret) ?? undefined) : undefined;
  }

  /** Every connection with its secrets opened: saved here first, then the server's settings. */
  async load(): Promise<Resolved> {
    const s = await this.stored();
    const e = this.env;
    const out: Resolved = {};
    const channelId = s.telegram?.channelId ?? e.TELEGRAM_CHANNEL_ID?.trim();
    if (channelId) out.telegram = { channelId };
    const fbToken = this.open(s.facebook?.token) ?? (s.facebook ? undefined : e.FACEBOOK_PAGE_TOKEN);
    const pageId = s.facebook?.pageId ?? e.FACEBOOK_PAGE_ID;
    if (pageId && fbToken) out.facebook = { pageId, token: fbToken, name: s.facebook?.name };
    const userId = s.instagram?.userId ?? e.INSTAGRAM_USER_ID;
    if (userId) out.instagram = { userId, username: s.instagram?.username };
    const clientKey = s.tiktok?.clientKey ?? e.TIKTOK_CLIENT_KEY;
    const clientSecret = this.open(s.tiktok?.clientSecret) ?? (s.tiktok ? undefined : e.TIKTOK_CLIENT_SECRET);
    if (clientKey && clientSecret) out.tiktok = { clientKey, clientSecret, refreshToken: this.open(s.tiktok?.refreshToken) ?? e.TIKTOK_REFRESH_TOKEN };
    return out;
  }

  /** For the admin page: connected or not, a label, where it was set. Never a token. */
  async view(): Promise<Record<"telegram" | "facebook" | "instagram" | "tiktok", ConnectionView>> {
    const [s, r] = await Promise.all([this.stored(), this.load()]);
    const src = (c: keyof Stored, ok: boolean): ConnectionView["source"] => (!ok ? null : s[c] ? "admin" : "server");
    return {
      telegram: { connected: !!r.telegram, label: r.telegram?.channelId ?? null, source: src("telegram", !!r.telegram) },
      facebook: { connected: !!r.facebook, label: r.facebook?.name ?? (r.facebook ? `Page ${r.facebook.pageId}` : null), source: src("facebook", !!r.facebook) },
      // Instagram posts with the Facebook Page's token.
      instagram: { connected: !!r.instagram && !!r.facebook, label: r.instagram?.username ? `@${r.instagram.username}` : (r.instagram?.userId ?? null), source: src("instagram", !!r.instagram) },
      tiktok: { connected: !!r.tiktok?.refreshToken, label: r.tiktok?.refreshToken ? "TikTok inbox" : null, source: src("tiktok", !!r.tiktok), needsSignIn: !!r.tiktok && !r.tiktok.refreshToken },
    };
  }

  async saveTelegram(channelId: string, by: string) {
    await this.settings.merge(KEY, { telegram: { channelId } }, [], by, {});
  }

  async saveFacebook(v: { pageId: string; token: string; name?: string }, by: string) {
    await this.settings.merge(KEY, { facebook: { pageId: v.pageId, token: seal(v.token, this.secret), ...(v.name ? { name: v.name } : {}) } }, [], by, {});
  }

  async saveInstagram(v: { userId: string; username?: string }, by: string) {
    await this.settings.merge(KEY, { instagram: { userId: v.userId, ...(v.username ? { username: v.username } : {}) } }, [], by, {});
  }

  async saveTikTokApp(v: { clientKey: string; clientSecret: string }, by: string) {
    // A new app needs a new sign-in: any earlier TikTok token is dropped.
    await this.settings.merge(KEY, { tiktok: { clientKey: v.clientKey, clientSecret: seal(v.clientSecret, this.secret) } }, [], by, {});
  }

  /** After "Sign in with TikTok", and each time TikTok renews it. */
  async saveTikTokToken(refreshToken: string, by: string) {
    const s = await this.stored();
    if (!s.tiktok) {
      // Connected with the server's app settings: keep only the token here.
      const e = this.env;
      if (!e.TIKTOK_CLIENT_KEY || !e.TIKTOK_CLIENT_SECRET) return;
      await this.settings.merge(KEY, { tiktok: { clientKey: e.TIKTOK_CLIENT_KEY, clientSecret: seal(e.TIKTOK_CLIENT_SECRET, this.secret), refreshToken: seal(refreshToken, this.secret) } }, [], by, {});
      return;
    }
    await this.settings.merge(KEY, { tiktok: { ...s.tiktok, refreshToken: seal(refreshToken, this.secret) } }, [], by, {});
  }

  async remove(channel: Exclude<Channel, "youtube">, by: string) {
    await this.settings.merge(KEY, {}, [channel], by, null);
  }
}
