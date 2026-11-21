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

export interface VideoRenderer {
  render(req: VideoRequest): Promise<Buffer>;
}

/** The renderer on our server (RENDERER_URL, RENDERER_SECRET), over the private network. */
export class HttpVideoRenderer implements VideoRenderer {
  constructor(
    private readonly url: string,
    private readonly secret: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async render(req: VideoRequest): Promise<Buffer> {
    const res = await this.fetchImpl(`${this.url.replace(/\/$/, "")}/render`, {
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
  async render(req: VideoRequest): Promise<Buffer> {
    this.requests.push(req);
    const box = Buffer.alloc(2000);
    box.writeUInt32BE(24, 0);
    box.write("ftypisom", 4);
    return box;
  }
}
