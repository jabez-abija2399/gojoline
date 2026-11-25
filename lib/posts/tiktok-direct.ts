import type { TokenStore } from "./publishers";

/**
 * TikTok Direct Post (Content Posting API, scope video.publish), 2026-11-25. TikTok's rules for
 * apps that post directly: before each post the creator sees their TikTok name, picks the privacy
 * level from the options TikTok returns (no default), chooses comments/duet/stitch (greyed out
 * when the account turned them off), discloses commercial content, and sees the consent line.
 * Until TikTok audits the app, its only privacy option is "only me" (SELF_ONLY).
 */
export const PRIVACY_LEVELS = ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"] as const;
export type Privacy = (typeof PRIVACY_LEVELS)[number];

export interface CreatorInfo {
  nickname: string;
  username: string;
  avatarUrl: string | null;
  privacyOptions: Privacy[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  /** Longest video the account may post, in seconds. */
  maxSeconds: number;
}

export interface DirectPostInput {
  video: Buffer;
  title: string;
  privacy: Privacy;
  allowComment: boolean;
  allowDuet: boolean;
  allowStitch: boolean;
  /** "Your brand": promoting the creator's own business (shown as "Promotional content"). */
  yourBrand: boolean;
  /** "Branded content": paid partnership with a third party (shown as "Paid partnership"). */
  brandedContent: boolean;
}

/** Behind an interface so tests and e2e never call TikTok. */
export interface TikTokDirect {
  creator(): Promise<CreatorInfo>;
  post(input: DirectPostInput): Promise<string>;
}

type Fetch = typeof fetch;
const API = "https://open.tiktokapis.com/v2";

/** A fresh access token from the stored refresh token (TikTok may rotate it: the new one is kept). */
export async function tiktokAccessToken(clientKey: string, clientSecret: string, tokens: TokenStore, fetchImpl: Fetch = fetch): Promise<string> {
  const refresh = await tokens.get();
  if (!refresh) throw new Error("TikTok not connected");
  const res = await fetchImpl(`${API}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, grant_type: "refresh_token", refresh_token: refresh }),
    signal: AbortSignal.timeout(30_000),
  });
  const d = (await res.json().catch(() => null)) as { access_token?: string; refresh_token?: string; error_description?: string } | null;
  if (!res.ok || !d?.access_token) throw new Error(`TikTok sign-in failed: ${d?.error_description?.slice(0, 120) ?? res.status}`);
  if (d.refresh_token && d.refresh_token !== refresh) await tokens.set(d.refresh_token);
  return d.access_token;
}

type Envelope<T> = { data?: T; error?: { code?: string; message?: string } } | null;

export class TikTokDirectClient implements TikTokDirect {
  constructor(
    private readonly token: () => Promise<string>,
    private readonly fetchImpl: Fetch = fetch,
  ) {}

  private async call<T>(path: string, body: unknown, token: string): Promise<T> {
    const res = await this.fetchImpl(`${API}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const d = (await res.json().catch(() => null)) as Envelope<T>;
    // TikTok's reason only, never the token.
    if (!res.ok || !d?.data || (d.error?.code && d.error.code !== "ok")) throw new Error(`TikTok: ${d?.error?.message?.slice(0, 160) ?? d?.error?.code ?? res.status}`);
    return d.data;
  }

  async creator(): Promise<CreatorInfo> {
    const d = await this.call<{ creator_nickname?: string; creator_username?: string; creator_avatar_url?: string; privacy_level_options?: string[]; comment_disabled?: boolean; duet_disabled?: boolean; stitch_disabled?: boolean; max_video_post_duration_sec?: number }>("/post/publish/creator_info/query/", {}, await this.token());
    return {
      nickname: String(d.creator_nickname ?? ""),
      username: String(d.creator_username ?? ""),
      avatarUrl: /^https:\/\//.test(d.creator_avatar_url ?? "") ? d.creator_avatar_url! : null,
      privacyOptions: (d.privacy_level_options ?? []).filter((o): o is Privacy => (PRIVACY_LEVELS as readonly string[]).includes(o)),
      commentDisabled: !!d.comment_disabled,
      duetDisabled: !!d.duet_disabled,
      stitchDisabled: !!d.stitch_disabled,
      maxSeconds: Number(d.max_video_post_duration_sec ?? 60),
    };
  }

  async post(input: DirectPostInput): Promise<string> {
    const token = await this.token();
    const size = input.video.length;
    const init = await this.call<{ publish_id?: string; upload_url?: string }>(
      "/post/publish/video/init/",
      {
        post_info: {
          title: input.title.slice(0, 2200),
          privacy_level: input.privacy,
          disable_comment: !input.allowComment,
          disable_duet: !input.allowDuet,
          disable_stitch: !input.allowStitch,
          video_cover_timestamp_ms: 1000,
          brand_organic_toggle: input.yourBrand,
          brand_content_toggle: input.brandedContent,
        },
        source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: size, total_chunk_count: 1 },
      },
      token,
    );
    if (!init.upload_url || !init.publish_id) throw new Error("TikTok: no upload address");
    const up = await this.fetchImpl(init.upload_url, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4", "Content-Length": String(size), "Content-Range": `bytes 0-${size - 1}/${size}` },
      body: new Uint8Array(input.video),
      signal: AbortSignal.timeout(120_000),
    });
    if (!up.ok) throw new Error(`TikTok upload failed (${up.status})`);
    return init.publish_id;
  }
}

/** E2E and dev: an account that allows every privacy level; posting returns a fake id. */
export class FakeTikTokDirect implements TikTokDirect {
  readonly posts: Omit<DirectPostInput, "video">[] = [];
  async creator(): Promise<CreatorInfo> {
    return { nickname: "Gojoline", username: "gojoline", avatarUrl: null, privacyOptions: ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"], commentDisabled: false, duetDisabled: false, stitchDisabled: true, maxSeconds: 600 };
  }
  async post(input: DirectPostInput) {
    this.posts.push({ title: input.title, privacy: input.privacy, allowComment: input.allowComment, allowDuet: input.allowDuet, allowStitch: input.allowStitch, yourBrand: input.yourBrand, brandedContent: input.brandedContent });
    return `fake-${this.posts.length}`;
  }
}

/** TikTok's rule: a paid partnership (branded content) can't be private. */
export function privacyAllowed(p: Privacy, brandedContent: boolean): boolean {
  return !(brandedContent && p === "SELF_ONLY");
}
