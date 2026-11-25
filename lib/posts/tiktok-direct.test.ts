import { describe, expect, it } from "vitest";
import { privacyAllowed, TikTokDirectClient } from "./tiktok-direct";

type Call = { url: string; body: unknown; headers: Record<string, string> };
function fake(answers: { status?: number; json?: unknown }[]) {
  const calls: Call[] = [];
  const impl = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), body: init?.body, headers: (init?.headers ?? {}) as Record<string, string> });
    const a = answers.shift() ?? { status: 500, json: {} };
    return new Response(JSON.stringify(a.json ?? {}), { status: a.status ?? 200 });
  }) as typeof fetch;
  return { impl, calls };
}

describe("TikTok Direct Post", () => {
  it("reads the account: name, only TikTok's known privacy options, interactions turned off, a safe avatar", async () => {
    const f = fake([{ json: { data: { creator_nickname: "Gojoline", creator_username: "gojoline", creator_avatar_url: "javascript:alert(1)", privacy_level_options: ["SELF_ONLY", "SOMETHING_NEW"], comment_disabled: false, duet_disabled: true, stitch_disabled: true, max_video_post_duration_sec: 600 }, error: { code: "ok" } } }]);
    const c = await new TikTokDirectClient(async () => "TOKEN", f.impl).creator();
    expect(c).toEqual({ nickname: "Gojoline", username: "gojoline", avatarUrl: null, privacyOptions: ["SELF_ONLY"], commentDisabled: false, duetDisabled: true, stitchDisabled: true, maxSeconds: 600 });
    expect(f.calls[0].url).toBe("https://open.tiktokapis.com/v2/post/publish/creator_info/query/");
    expect(f.calls[0].headers.Authorization).toBe("Bearer TOKEN");
  });

  it("posts with the chosen settings as one file upload, then uploads the bytes", async () => {
    const f = fake([{ json: { data: { publish_id: "p_1", upload_url: "https://upload.tiktok.example/u" }, error: { code: "ok" } } }, { status: 201 }]);
    const id = await new TikTokDirectClient(async () => "TOKEN", f.impl).post({ video: Buffer.from("mp4bytes"), title: "Hello", privacy: "SELF_ONLY", allowComment: true, allowDuet: false, allowStitch: false, yourBrand: true, brandedContent: false });
    expect(id).toBe("p_1");
    expect(f.calls[0].url).toBe("https://open.tiktokapis.com/v2/post/publish/video/init/");
    expect(JSON.parse(String(f.calls[0].body))).toEqual({
      post_info: { title: "Hello", privacy_level: "SELF_ONLY", disable_comment: false, disable_duet: true, disable_stitch: true, video_cover_timestamp_ms: 1000, brand_organic_toggle: true, brand_content_toggle: false },
      source_info: { source: "FILE_UPLOAD", video_size: 8, chunk_size: 8, total_chunk_count: 1 },
    });
    expect(f.calls[1].url).toBe("https://upload.tiktok.example/u");
    expect(f.calls[1].headers["Content-Range"]).toBe("bytes 0-7/8");
  });

  it("gives TikTok's reason, never the token", async () => {
    const f = fake([{ status: 403, json: { error: { code: "unaudited_client_can_only_post_to_private_accounts", message: "Unaudited client can only post to private accounts" } } }]);
    const err = await new TikTokDirectClient(async () => "SECRET-TOKEN", f.impl).post({ video: Buffer.from("x"), title: "t", privacy: "PUBLIC_TO_EVERYONE", allowComment: false, allowDuet: false, allowStitch: false, yourBrand: false, brandedContent: false }).catch((e: Error) => e.message);
    expect(err).toContain("Unaudited client");
    expect(err).toContain("unaudited_client_can_only_post_to_private_accounts");
    expect(err).not.toContain("SECRET-TOKEN");
  });

  it("a paid partnership can't be private", () => {
    expect(privacyAllowed("SELF_ONLY", true)).toBe(false);
    expect(privacyAllowed("SELF_ONLY", false)).toBe(true);
    expect(privacyAllowed("PUBLIC_TO_EVERYONE", true)).toBe(true);
  });
});

describe("MP4 length", () => {
  it("reads the movie header (version 0 and 1), or null when there is none", async () => {
    const { mp4Seconds } = await import("./mp4");
    const v0 = Buffer.alloc(64);
    v0.write("mvhd", 4);
    v0[8] = 0;
    v0.writeUInt32BE(1000, 12 + 8);
    v0.writeUInt32BE(27_500, 12 + 12);
    expect(mp4Seconds(v0)).toBe(27.5);
    const v1 = Buffer.alloc(64);
    v1.write("mvhd", 4);
    v1[8] = 1;
    v1.writeUInt32BE(600, 12 + 16);
    v1.writeBigUInt64BE(BigInt(36_000), 12 + 20);
    expect(mp4Seconds(v1)).toBe(60);
    expect(mp4Seconds(Buffer.from("not a video"))).toBeNull();
  });
});
