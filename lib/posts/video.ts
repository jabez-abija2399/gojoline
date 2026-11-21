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

export interface VideoRenderer {
  render(req: VideoRequest): Promise<Buffer>;
  greeting(req: GreetingRequest): Promise<Buffer>;
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
  async greeting(req: GreetingRequest): Promise<Buffer> {
    this.greetings.push(req);
    return this.box();
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
