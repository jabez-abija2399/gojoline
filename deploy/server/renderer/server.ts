/**
 * Video renderer (Admin → Posts, Step 3): films a public web page at phone size into a
 * 1080×1920 MP4 for social posts. The app asks over the private compose network with a shared
 * secret; one video at a time. Only public https pages: every request the browser makes is
 * checked against private and cloud-metadata addresses.
 */
import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { chromium, type Browser } from "playwright-core";
import sharp from "sharp";
import { allowedUrl, cardHtml, FPS, H, isPrivateAddress, pickStops, timeline, W, WINDOW, type RenderRequest, type Style } from "./lib.ts";

const SECRET = process.env.RENDERER_SECRET ?? "";
const PORT = Number(process.env.PORT) || 7071;
const CHROMIUM = process.env.CHROMIUM_PATH ?? "/usr/bin/chromium";
const LOGO = `data:image/svg+xml;base64,${readFileSync(new URL("./logo.svg", import.meta.url)).toString("base64")}`;
const MUSIC = new URL("./music.m4a", import.meta.url).pathname;
/** Pages longer than this (CSS px) are cut: a video shows the top of a very long page. */
const MAX_PAGE = 7000;
const STYLES: Style[] = ["tour", "spotlight", "template"];
/** Local testing only (never set in compose): allows http://localhost pages. */
const DEV = process.env.RENDERER_DEV === "1";

if (SECRET.length < 24) {
  console.error("RENDERER_SECRET is not set (24+ characters). Idle until then.");
  setInterval(() => undefined, 1 << 30);
  await new Promise(() => undefined);
}

const hostChecks = new Map<string, Promise<boolean>>();
/** A host is allowed when every address it resolves to is public (cached per render). */
function publicHost(host: string): Promise<boolean> {
  if (DEV && (host === "localhost" || host === "127.0.0.1")) return Promise.resolve(true);
  let p = hostChecks.get(host);
  if (!p) {
    p = lookup(host, { all: true }).then(
      (addrs) => addrs.length > 0 && addrs.every((a) => !isPrivateAddress(a.address)),
      () => false,
    );
    hostChecks.set(host, p);
  }
  return p;
}

let browser: Browser | null = null;
async function getBrowser() {
  if (!browser?.isConnected()) browser = await chromium.launch({ executablePath: CHROMIUM, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
  return browser;
}

/** The page as one tall screenshot at phone size (2× pixels), scaled to the window width, and where its sections start. */
async function capture(req: RenderRequest): Promise<{ page: Buffer; height: number; stops: number[]; cards: Record<"intro" | "outro" | "chrome", Buffer> }> {
  const b = await getBrowser();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce", locale: req.lang === "am" ? "am-ET" : "en-US", serviceWorkers: "block" });
  try {
    await ctx.route("**/*", async (route) => {
      const u = new URL(route.request().url());
      if (u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      const ok = (u.protocol === "https:" || u.protocol === "http:") && (!u.port || DEV) && (await publicHost(u.hostname));
      return ok ? route.continue() : route.abort();
    });
    const page = await ctx.newPage();
    await page.goto(req.url, { waitUntil: "load", timeout: 45_000 });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
    // Scroll once through the page so lazy photos load, then back to the top.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < Math.min(total, MAX_PAGE); y += 700) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
    const sections = await page.evaluate(() => [...document.querySelectorAll("main section, body > section, section[id]")].map((s) => ({ top: s.getBoundingClientRect().top + window.scrollY, text: (s.querySelector("h1,h2,h3")?.textContent ?? s.id ?? "").slice(0, 80) })));
    const height = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), MAX_PAGE);
    const shot = await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: 390, height }, type: "png" });
    const scale = WINDOW.w / 390;
    const scaled = await sharp(shot).resize({ width: WINDOW.w }).png().toBuffer();
    const meta = await sharp(scaled).metadata();
    // The title cards and the frame, drawn by the same browser (real Amharic text shaping).
    const cardPage = await ctx.newPage();
    await cardPage.setViewportSize({ width: W, height: H });
    const cards = {} as Record<"intro" | "outro" | "chrome", Buffer>;
    for (const c of ["intro", "outro", "chrome"] as const) {
      await cardPage.setContent(cardHtml(c, req, LOGO), { waitUntil: "load" });
      cards[c] = await cardPage.screenshot({ type: "png", omitBackground: c === "chrome" });
    }
    return { page: scaled, height: meta.height ?? Math.round(height * scale), stops: pickStops(sections, scale), cards };
  } finally {
    await ctx.close();
  }
}

/** Draws every frame and pipes them into ffmpeg (H.264, music under it, faded in and out). */
async function render(req: RenderRequest): Promise<Buffer> {
  const t0 = Date.now();
  const { page, height, stops, cards } = await capture(req);
  console.log(`captured in ${Date.now() - t0} ms (page ${height} px, ${stops.length} stops)`);
  const shots = timeline(req.style, height, stops);
  const seconds = shots.length / FPS;
  const raw = async (png: Buffer) => sharp(png).resize(W, H).removeAlpha().raw().toBuffer();
  const intro = await raw(cards.intro);
  const outro = await raw(cards.outro);
  const bg = { create: { width: W, height: H, channels: 3 as const, background: "#FAF8F4" } };
  const pageImg = sharp(page);
  // MP4 with its index at the front (plays while downloading) needs a seekable file.
  const dir = await mkdtemp(join(tmpdir(), "render-"));
  const outFile = join(dir, "video.mp4");
  const ff = spawn("ffmpeg", [
    "-v", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
    "-stream_loop", "-1", "-i", MUSIC,
    "-filter_complex", `[0:v]fade=t=in:st=0:d=0.4,fade=t=out:st=${(seconds - 0.5).toFixed(2)}:d=0.5[v];[1:a]atrim=0:${seconds.toFixed(2)},afade=t=in:d=1,afade=t=out:st=${(seconds - 2).toFixed(2)}:d=2,volume=0.8[a]`,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "27", "-maxrate", "3M", "-bufsize", "6M", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-shortest", outFile,
  ], { stdio: ["pipe", "ignore", "pipe"] });
  const err: Buffer[] = [];
  ff.stderr.on("data", (d: Buffer) => err.push(d));
  const done = new Promise<void>((resolve, reject) => ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${Buffer.concat(err).toString().slice(-400)}`)))));
  // ffmpeg stopping early shows up as a broken pipe here: report ffmpeg's reason, never crash.
  ff.stdin.on("error", () => undefined);
  const write = (buf: Buffer) =>
    new Promise<void>((resolve, reject) => {
      if (ff.exitCode !== null || ff.stdin.destroyed) return reject(new Error("ffmpeg stopped"));
      ff.stdin.write(buf, (e) => (e ? reject(e) : resolve()));
    });
  // Decode once: the page as raw rows, the frame (title, line, rounded window) drawn over the background.
  const pageRaw = await pageImg.removeAlpha().raw().toBuffer();
  const chrome = await sharp(cards.chrome).resize(W, H).png().toBuffer();
  const base = await sharp(bg).composite([{ input: chrome, left: 0, top: 0 }]).removeAlpha().raw().toBuffer();
  const spans = windowSpans();
  const frame = Buffer.alloc(base.length);
  let last = -1;
  try {
    for (const s of shots) {
      if (s.kind === "card") {
        await write(s.card === "intro" ? intro : outro);
        continue;
      }
      if (s.y !== last) {
        base.copy(frame);
        for (let r = 0; r < WINDOW.h; r++) {
          const src = s.y + r;
          if (src >= height) break;
          const [x0, x1] = spans[r];
          pageRaw.copy(frame, ((WINDOW.y + r) * W + WINDOW.x + x0) * 3, (src * WINDOW.w + x0) * 3, (src * WINDOW.w + x1) * 3);
        }
        last = s.y;
      }
      await write(frame);
    }
  } catch (e) {
    await done.catch((ffErr: unknown) => {
      throw ffErr;
    });
    throw e;
  }
  ff.stdin.end();
  console.log(`frames written in ${Date.now() - t0} ms`);
  try {
    await done;
    return await readFile(outFile);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** For each row of the window, the visible columns (its corners are rounded). */
function windowSpans(): [number, number][] {
  const { w, h, radius: r } = WINDOW;
  return Array.from({ length: h }, (_, y) => {
    const dy = y < r ? r - y - 0.5 : y >= h - r ? y - (h - r) + 0.5 : 0;
    const inset = dy > 0 ? Math.ceil(r - Math.sqrt(Math.max(0, r * r - dy * dy))) : 0;
    return [inset, w - inset] as [number, number];
  });
}

function authorized(req: IncomingMessage): boolean {
  const given = Buffer.from(req.headers.authorization ?? "");
  const want = Buffer.from(`Bearer ${SECRET}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

function parse(body: string): RenderRequest | null {
  try {
    const v = JSON.parse(body) as Partial<RenderRequest>;
    const t = v.text as Record<string, unknown> | undefined;
    const str = (x: unknown, max: number) => typeof x === "string" && x.length <= max;
    if (!v.url || !(allowedUrl(v.url) || (DEV && v.url.startsWith("http://localhost:"))) || !STYLES.includes(v.style as Style) || (v.lang !== "en" && v.lang !== "am") || !t) return null;
    if (!["kicker", "title", "outroTitle", "outroSub", "site", "footer"].every((k) => str(t[k], 160))) return null;
    return v as RenderRequest;
  } catch {
    return null;
  }
}

let queue: Promise<unknown> = Promise.resolve();

createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "GET" && req.url === "/health") return void res.writeHead(200).end("ok");
  if (req.method !== "POST" || req.url !== "/render") return void res.writeHead(404).end();
  if (!authorized(req)) return void res.writeHead(401).end();
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 16_000) return void res.writeHead(413).end();
    chunks.push(c as Buffer);
  }
  const input = parse(Buffer.concat(chunks).toString());
  if (!input || !(await publicHost(new URL(input.url).hostname))) return void res.writeHead(400).end("bad request");
  // One video at a time: Chromium and ffmpeg share a small server with the app.
  const job = queue.then(() => render(input));
  queue = job.catch(() => undefined);
  try {
    const video = await Promise.race([job, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("render timed out")), 240_000))]);
    hostChecks.clear();
    res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": video.length }).end(video);
  } catch (e) {
    hostChecks.clear();
    console.error("render failed:", e instanceof Error ? e.message : e);
    res.writeHead(502).end(e instanceof Error ? e.message.slice(0, 300) : "render failed");
  }
}).listen(PORT, () => console.log(`renderer on ${PORT}`));
