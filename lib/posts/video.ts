/**
 * Post videos (Step 3): the renderer service (deploy/server/renderer) films a page into a
 * 1080×1920 MP4. Behind an interface so tests and dev never need Chromium or ffmpeg.
 */
export type VideoStyle = "tour" | "spotlight" | "template";
export const VIDEO_STYLES: VideoStyle[] = ["tour", "spotlight"];

export interface VideoRequest {
  url: string;
  style: VideoStyle;
  lang: "en" | "am";
  text: { kicker: string; title: string; outroTitle: string; outroSub: string; site: string; footer: string };
}

/** The holiday pictures the renderer can draw (deploy/server/renderer/lib.ts MOTIFS). */
export type GreetingMotif = "meskel" | "flowers" | "star" | "water" | "dawn" | "crescent" | "mountains" | "sparkle";

/** A holiday greeting video: a drawn card (the holiday's picture, then the words), no web page. */
export interface GreetingRequest {
  lang: "en" | "am";
  motif: GreetingMotif;
  text: { kicker: string; title: string; sub: string; footer: string };
}

/** A text video: the hook, then up to four lines one by one, then the ask (no page to film). */
export interface StoryRequest {
  lang: "en" | "am";
  kicker: string;
  title: string;
  lines: string[];
  cta: string;
  footer: string;
}

export interface VideoRenderer {
  render(req: VideoRequest): Promise<Buffer>;
  greeting(req: GreetingRequest): Promise<Buffer>;
  story(req: StoryRequest): Promise<Buffer>;
  /**
   * An admin's own MP4, checked (a real H.264/HEVC video, at most 3 minutes) and re-written
   * without metadata (no GPS location) before it is stored. Throws a CleanError.
   */
  clean(data: Buffer): Promise<Buffer>;
}

/** Why an uploaded video was refused, as a code the page words. */
export class CleanError extends Error {
  constructor(readonly code: "too_big" | "not_video" | "too_long" | "busy" | "failed") {
    super(`clean: ${code}`);
  }
}

/** The renderer on our server (RENDERER_URL, RENDERER_SECRET), over the private network. */
export class HttpVideoRenderer implements VideoRenderer {
  constructor(
    private readonly url: string,
    private readonly secret: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async render(req: VideoRequest): Promise<Buffer> {
    return this.post("/render", req);
  }

  async greeting(req: GreetingRequest): Promise<Buffer> {
    return this.post("/greeting", req);
  }

  async story(req: StoryRequest): Promise<Buffer> {
    return this.post("/story", req);
  }

  async clean(data: Buffer): Promise<Buffer> {
    const res = await this.fetchImpl(`${this.url.replace(/\/$/, "")}/clean`, {
      method: "POST",
      headers: { "Content-Type": "video/mp4", Authorization: `Bearer ${this.secret}` },
      // A view of the same memory, not a copy.
      body: new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      const why = (await res.text().catch(() => "")).trim();
      throw new CleanError(res.status === 413 ? "too_big" : res.status === 415 ? "not_video" : res.status === 503 ? "busy" : why === "too long" ? "too_long" : res.status === 422 ? "not_video" : "failed");
    }
    return Buffer.from(await res.arrayBuffer());
  }

  private async post(path: string, req: unknown): Promise<Buffer> {
    const res = await this.fetchImpl(`${this.url.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.secret}` },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(280_000),
    });
    if (!res.ok) throw new Error(`renderer ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
    const data = Buffer.from(await res.arrayBuffer());
    if (data.length < 1000 || data.subarray(4, 8).toString() !== "ftyp") throw new Error("renderer returned no video");
    return data;
  }
}

/** Dev and e2e: a tiny stand-in "video" (not playable), so the flow can be tested end to end. */
export class FakeVideoRenderer implements VideoRenderer {
  readonly requests: VideoRequest[] = [];
  readonly greetings: GreetingRequest[] = [];
  readonly stories: StoryRequest[] = [];
  async greeting(req: GreetingRequest): Promise<Buffer> {
    this.greetings.push(req);
    return this.box();
  }
  async story(req: StoryRequest): Promise<Buffer> {
    this.stories.push(req);
    return this.box();
  }
  async clean(data: Buffer): Promise<Buffer> {
    return data;
  }
  async render(req: VideoRequest): Promise<Buffer> {
    this.requests.push(req);
    return this.box();
  }
  private box(): Buffer {
    const box = Buffer.alloc(2000);
    box.writeUInt32BE(24, 0);
    box.write("ftypisom", 4);
    return box;
  }
}
