import { describe, expect, it } from "vitest";
import { signedMediaUrl, verifyMediaUrl } from "./media-url";
import { FacebookPagePublisher, InstagramPublisher, TikTokInboxPublisher } from "./publishers";

type Call = { url: string; method: string; body: unknown; headers: Record<string, string> };

/** A fake network: answers in order and records each request. */
function fakeFetch(answers: { status?: number; json?: unknown }[]) {
  const calls: Call[] = [];
  const impl = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), method: init?.method ?? "GET", body: init?.body, headers: (init?.headers ?? {}) as Record<string, string> });
    const a = answers.shift() ?? { status: 500, json: { error: { message: "no answer" } } };
    return new Response(JSON.stringify(a.json ?? {}), { status: a.status ?? 200 });
  }) as typeof fetch;
  return { impl, calls };
}

const photo = { kind: "photo" as const, data: Buffer.from("jpg"), name: "p.jpg" };
const video = { kind: "video" as const, data: Buffer.from("mp4-bytes"), name: "v.mp4" };

describe("FacebookPagePublisher", () => {
  it("posts text to the feed, photos with a caption and videos to the video host", async () => {
    const f = fakeFetch([{ json: { id: "1_2" } }, { json: { id: "p", post_id: "1_3" } }, { json: { id: "v9" } }]);
    const fb = new FacebookPagePublisher("123", "TOKEN", "v23.0", f.impl);
    expect(await fb.publish({ text: "Hello", media: null, mediaUrl: null })).toBe("1_2");
    expect(f.calls[0].url).toBe("https://graph.facebook.com/v23.0/123/feed");
    expect(String(f.calls[0].body)).toContain("message=Hello");
    expect(await fb.publish({ text: "Hi", media: photo, mediaUrl: null })).toBe("1_3");
    expect(f.calls[1].url).toBe("https://graph.facebook.com/v23.0/123/photos");
    expect((f.calls[1].body as FormData).get("caption")).toBe("Hi");
    expect(await fb.publish({ text: "Watch", media: video, mediaUrl: null })).toBe("v9");
    expect(f.calls[2].url).toBe("https://graph-video.facebook.com/v23.0/123/videos");
    expect((f.calls[2].body as FormData).get("description")).toBe("Watch");
  });

  it("reports Meta's reason, never the token", async () => {
    const f = fakeFetch([{ status: 400, json: { error: { message: "Invalid OAuth access token." } } }]);
    const err = await new FacebookPagePublisher("123", "SECRET-TOKEN", "v23.0", f.impl).publish({ text: "x", media: null, mediaUrl: null }).catch((e: Error) => e.message);
    expect(err).toBe("Invalid OAuth access token.");
    expect(err).not.toContain("SECRET-TOKEN");
  });
});

describe("InstagramPublisher", () => {
  it("makes a Reel from the video's public address, waits until it is ready, then publishes", async () => {
    const f = fakeFetch([{ json: { id: "c1" } }, { json: { status_code: "IN_PROGRESS" } }, { json: { status_code: "FINISHED" } }, { json: { id: "m7" } }]);
    const ig = new InstagramPublisher("17", "TOKEN", "v23.0", f.impl, async () => undefined);
    expect(await ig.publish({ text: "Reel", media: video, mediaUrl: "https://g.example/v.mp4" })).toBe("m7");
    const made = new URLSearchParams(String(f.calls[0].body));
    expect(made.get("media_type")).toBe("REELS");
    expect(made.get("video_url")).toBe("https://g.example/v.mp4");
    expect(f.calls[3].url).toBe("https://graph.facebook.com/v23.0/17/media_publish");
    expect(new URLSearchParams(String(f.calls[3].body)).get("creation_id")).toBe("c1");
  });

  it("with Instagram login, uses graph.instagram.com for every call", async () => {
    const f = fakeFetch([{ json: { id: "c2" } }, { json: { status_code: "FINISHED" } }, { json: { id: "m8" } }]);
    const ig = new InstagramPublisher("1784", "IGAA", "v23.0", f.impl, async () => undefined, "graph.instagram.com");
    expect(await ig.publish({ text: "Reel", media: video, mediaUrl: "https://g.example/v.mp4" })).toBe("m8");
    expect(f.calls.map((c) => c.url)).toEqual([
      "https://graph.instagram.com/v23.0/1784/media",
      "https://graph.instagram.com/v23.0/c2?fields=status_code",
      "https://graph.instagram.com/v23.0/1784/media_publish",
    ]);
    expect(f.calls[1].url).not.toContain("IGAA");
  });

  it("needs a picture or video, and stops when Instagram can't process the video", async () => {
    const ig = new InstagramPublisher("17", "T", "v23.0", fakeFetch([]).impl);
    await expect(ig.publish({ text: "x", media: null, mediaUrl: null })).rejects.toThrow("Instagram needs a picture or video");
    const f = fakeFetch([{ json: { id: "c1" } }, { json: { status_code: "ERROR" } }]);
    await expect(new InstagramPublisher("17", "T", "v23.0", f.impl, async () => undefined).publish({ text: "x", media: video, mediaUrl: "https://g.example/v.mp4" })).rejects.toThrow("couldn't process");
  });
});

describe("TikTokInboxPublisher", () => {
  it("signs in with the refresh token (keeping the new one), then uploads the video to the inbox", async () => {
    let refresh = "R1";
    const f = fakeFetch([{ json: { access_token: "A", refresh_token: "R2" } }, { json: { data: { publish_id: "pub_1", upload_url: "https://upload.tiktok.example/u" }, error: { code: "ok" } } }, { json: {} }]);
    const tt = new TikTokInboxPublisher("key", "secret", { get: async () => refresh, set: async (t) => void (refresh = t) }, f.impl);
    expect(await tt.publish({ text: "x", media: video, mediaUrl: null })).toBe("pub_1");
    expect(refresh).toBe("R2");
    expect(JSON.parse(String(f.calls[1].body))).toEqual({ source_info: { source: "FILE_UPLOAD", video_size: 9, chunk_size: 9, total_chunk_count: 1 } });
    expect(f.calls[1].headers.Authorization).toBe("Bearer A");
    expect(f.calls[2]).toMatchObject({ url: "https://upload.tiktok.example/u", method: "PUT", headers: { "Content-Range": "bytes 0-8/9" } });
  });

  it("takes only videos, and says when it isn't connected", async () => {
    const tt = new TikTokInboxPublisher("k", "s", { get: async () => null, set: async () => undefined }, fakeFetch([]).impl);
    await expect(tt.publish({ text: "x", media: photo, mediaUrl: null })).rejects.toThrow("TikTok needs a video");
    await expect(tt.publish({ text: "x", media: video, mediaUrl: null })).rejects.toThrow("TikTok not connected");
  });
});

describe("signed media addresses", () => {
  it("work for their post until they expire, and for nothing else", () => {
    const now = Date.parse("2026-11-21T10:00:00Z");
    const url = new URL(signedMediaUrl("https://g.example", "s3cret", "post-1", now, 3600));
    expect(url.pathname).toBe("/api/public/post-media/post-1");
    const exp = url.searchParams.get("exp");
    const sig = url.searchParams.get("sig");
    expect(verifyMediaUrl("s3cret", "post-1", exp, sig, now + 1000)).toBe(true);
    expect(verifyMediaUrl("s3cret", "post-2", exp, sig, now)).toBe(false);
    expect(verifyMediaUrl("other", "post-1", exp, sig, now)).toBe(false);
    expect(verifyMediaUrl("s3cret", "post-1", exp, sig, now + 3601_000)).toBe(false);
    expect(verifyMediaUrl("", "post-1", exp, sig, now)).toBe(false);
  });
});

describe("Connect TikTok", () => {
  it("sends the admin to TikTok with our scopes and callback, and trades the code for a refresh token", async () => {
    const { tiktokAuthorizeUrl, tiktokExchange } = await import("./tiktok-auth");
    const u = new URL(tiktokAuthorizeUrl("key1", "https://g.example", "st"));
    expect(u.origin + u.pathname).toBe("https://www.tiktok.com/v2/auth/authorize/");
    expect(Object.fromEntries(u.searchParams)).toEqual({ client_key: "key1", scope: "user.info.basic,video.upload", response_type: "code", redirect_uri: "https://g.example/api/admin/tiktok/callback", state: "st" });
    const f = fakeFetch([{ json: { access_token: "A", refresh_token: "R" } }]);
    expect(await tiktokExchange({ clientKey: "key1", clientSecret: "s", code: "c", appUrl: "https://g.example" }, f.impl)).toBe("R");
    expect(new URLSearchParams(String(f.calls[0].body)).get("grant_type")).toBe("authorization_code");
    await expect(tiktokExchange({ clientKey: "k", clientSecret: "s", code: "c", appUrl: "https://g.example" }, fakeFetch([{ status: 400, json: { error_description: "bad code" } }]).impl)).rejects.toThrow("bad code");
  });
});
