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
import http, { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import https from "node:https";
import { chromium, type Browser } from "playwright-core";
import sharp from "sharp";

// One render at a time: no image cache kept between videos, no thread per core.
sharp.cache(false);
sharp.concurrency(1);
import { allowedUrl, cardHtml, FPS, GREETING_SECONDS, greetingHtml, H, isPrivateAddress, parseGreeting, pickStops, timeline, W, WINDOW, type GreetingRequest, type RenderRequest, type Style } from "./lib.ts";

const SECRET = process.env.RENDERER_SECRET ?? "";
const PORT = Number(process.env.PORT) || 7071;
const CHROMIUM = process.env.CHROMIUM_PATH ?? "/usr/bin/chromium";
const asset = (file: string, type: string) => `data:${type};base64,${readFileSync(new URL(file, import.meta.url)).toString("base64")}`;
/** The logo in the video's language, and the brand's fonts (embedded in the cards). */
const ASSETS = {
  en: { logo: asset("./logo.svg", "image/svg+xml"), outfit: asset("./fonts/outfit-latin.woff2", "font/woff2"), ethiopic: asset("./fonts/noto-sans-ethiopic-core.woff2", "font/woff2") },
  am: { logo: asset("./logo-am.svg", "image/svg+xml"), outfit: asset("./fonts/outfit-latin.woff2", "font/woff2"), ethiopic: asset("./fonts/noto-sans-ethiopic-core.woff2", "font/woff2") },
};
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

/** Resolves a host and refuses private, loopback and metadata addresses; the connection then uses exactly the address checked. */
function checkedLookup(host: string, opts: { all?: boolean } | number, cb: (err: Error | null, address: string | { address: string; family: number }[], family?: number) => void) {
  // Node asks for every address (happy eyeballs) or for one: answer the way it asked.
  const answer = (address: string, family: number) => (typeof opts === "object" && opts.all ? cb(null, [{ address, family }]) : cb(null, address, family));
  if (DEV && (host === "localhost" || host === "127.0.0.1")) return answer("127.0.0.1", 4);
  lookup(host, { all: true }).then(
    (addrs) => {
      const ok = addrs.length > 0 && addrs.every((a) => !isPrivateAddress(a.address));
      if (!ok) return cb(new Error(`blocked address for ${host}`), "", 4);
      answer(addrs[0].address, addrs[0].family);
    },
    (e: Error) => cb(e, "", 4),
  );
}

const MAX_RESOURCE = 15 * 1024 * 1024;

/**
 * Fetches one browser request in Node (the browser never connects by itself): DNS pinned to the
 * checked address, no redirects followed here (the browser asks again for the new address, which
 * comes back through this same check), plain encoding, size and time limits.
 */
function pinnedFetch(url: URL, method: string, headers: Record<string, string>, body: Buffer | null, signal: AbortSignal): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const h = { ...headers, "accept-encoding": "identity" };
    delete (h as Record<string, string>).host;
    const req = mod.request(url, { method, headers: h, lookup: checkedLookup as never, timeout: 20_000, signal }, (res) => {
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (c: Buffer) => {
        size += c.length;
        if (size > MAX_RESOURCE) req.destroy(new Error("resource too large"));
        else chunks.push(c);
      });
      res.on("end", () => {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) if (v !== undefined && k !== "content-encoding" && k !== "transfer-encoding" && k !== "content-length") out[k] = Array.isArray(v) ? v.join(", ") : v;
        resolve({ status: res.statusCode ?? 502, headers: out, body: Buffer.concat(chunks) });
      });
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end(body ?? undefined);
  });
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

/** A fresh browser per video (closed as soon as the page is captured): no secrets in its environment, no WebRTC or DNS prefetch of its own. */
function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    executablePath: CHROMIUM,
    env: { HOME: "/tmp", PATH: "/usr/bin:/bin", FONTCONFIG_PATH: "/etc/fonts" },
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--dns-prefetch-disable", "--force-webrtc-ip-handling-policy", "--webrtc-ip-handling-policy=disable_non_proxied_udp", "--disable-background-networking"],
  });
}

/** The page as one tall screenshot at phone size (2× pixels), scaled to the window width, and where its sections start. */
async function capture(req: RenderRequest, signal: AbortSignal): Promise<{ page: Buffer; width: number; height: number; stops: number[]; cards: Record<"intro" | "outro" | "chrome", Buffer> }> {
  const b = await launchBrowser();
  const stop = () => void b.close().catch(() => undefined);
  signal.addEventListener("abort", stop, { once: true });
  // Cancelled while Chromium was starting: stop here.
  if (signal.aborted) stop();
  // Captured at the window's own width (900 px = 390 CSS px × 2.31): no resizing, sharper text.
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: WINDOW.w / 390, reducedMotion: "reduce", locale: req.lang === "am" ? "am-ET" : "en-US", serviceWorkers: "block" });
  try {
    await ctx.routeWebSocket(/.*/, (ws) => ws.close());
    await ctx.route("**/*", async (route) => {
      const r = route.request();
      const u = new URL(r.url());
      if (u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      if ((u.protocol !== "https:" && u.protocol !== "http:") || (u.port && !DEV)) return route.abort();
      try {
        const res = await pinnedFetch(u, r.method(), await r.allHeaders(), r.postDataBuffer(), signal);
        return route.fulfill({ status: res.status, headers: res.headers, body: res.body });
      } catch {
        return route.abort();
      }
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
    const meta = await sharp(shot).metadata();
    // The title cards and the frame, drawn by the same browser (real Amharic text shaping).
    const cardPage = await ctx.newPage();
    await cardPage.setViewportSize({ width: W, height: H });
    const cards = {} as Record<"intro" | "outro" | "chrome", Buffer>;
    for (const c of ["intro", "outro", "chrome"] as const) {
      await cardPage.setContent(cardHtml(c, req, ASSETS[req.lang]), { waitUntil: "load" });
      await cardPage.evaluate(() => document.fonts.ready);
      cards[c] = await cardPage.screenshot({ type: "png", omitBackground: c === "chrome" });
    }
    return { page: shot, width: meta.width ?? WINDOW.w, height: meta.height ?? Math.round(height * scale), stops: pickStops(sections, scale), cards };
  } finally {
    signal.removeEventListener("abort", stop);
    await b.close().catch(() => undefined);
  }
}

/** Draws every frame and pipes them into ffmpeg (H.264, music under it, faded in and out). */
async function render(req: RenderRequest, signal: AbortSignal): Promise<Buffer> {
  const t0 = Date.now();
  const { page, width, height, stops, cards } = await capture(req, signal);
  console.log(`captured in ${Date.now() - t0} ms (page ${height} px, ${stops.length} stops)`);
  const shots = timeline(req.style, height, stops);
  const seconds = shots.length / FPS;
  const raw = async (png: Buffer) => sharp(png).resize(W, H).removeAlpha().raw().toBuffer();
  const intro = await raw(cards.intro);
  const outro = await raw(cards.outro);
  const bg = { create: { width: W, height: H, channels: 3 as const, background: "#FBF9F6" } };
  const pageImg = sharp(page);
  // MP4 with its index at the front (plays while downloading) needs a seekable file.
  const dir = await mkdtemp(join(tmpdir(), "render-"));
  const outFile = join(dir, "video.mp4");
  // At low priority and two threads: the app and site builds share these two CPUs.
  const ff = spawn("nice", ["-n", "10", "ffmpeg", "-threads", "2",
    "-v", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
    "-stream_loop", "-1", "-i", MUSIC,
    "-filter_complex", `[0:v]fade=t=in:st=0:d=0.4,fade=t=out:st=${(seconds - 0.5).toFixed(2)}:d=0.5[v];[1:a]atrim=0:${seconds.toFixed(2)},afade=t=in:d=1,afade=t=out:st=${(seconds - 2).toFixed(2)}:d=2,volume=0.8[a]`,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "27", "-maxrate", "3M", "-bufsize", "6M", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-shortest", outFile,
  ], { stdio: ["pipe", "ignore", "pipe"], signal });
  const err: Buffer[] = [];
  ff.stderr.on("data", (d: Buffer) => err.push(d));
  // An abort kills ffmpeg and emits "error": reported through "close", never an uncaught exception.
  ff.on("error", () => undefined);
  const done = new Promise<void>((resolve, reject) => ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${Buffer.concat(err).toString().slice(-400)}`)))));
  done.catch(() => undefined);
  // ffmpeg stopping early shows up as a broken pipe here: report ffmpeg's reason, never crash.
  ff.stdin.on("error", () => undefined);
  const write = (buf: Buffer) =>
    new Promise<void>((resolve, reject) => {
      if (ff.exitCode !== null || ff.stdin.destroyed) return reject(new Error("ffmpeg stopped"));
      ff.stdin.write(buf, (e) => (e ? reject(e) : resolve()));
    });
  // Decode once: the page as raw rows, the frame (title, line, rounded window) drawn over the background.
  // The capture is the window's width already; a rounding pixel is trimmed or padded here.
  const pageRaw = await (width === WINDOW.w ? pageImg : pageImg.resize({ width: WINDOW.w })).removeAlpha().raw().toBuffer();
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

/**
 * A holiday greeting: the card drawn in a browser with no network at all (every request is
 * refused), filmed as its picture settles and the words appear, then held. Only the JPEG
 * screenshots are kept (about 7 MB); ffmpeg doubles them to 30 fps and holds the last one after
 * the browser has closed, so Chromium and ffmpeg never share the container's memory.
 */
async function greeting(req: GreetingRequest, signal: AbortSignal): Promise<Buffer> {
  const t0 = Date.now();
  const b = await launchBrowser();
  const stop = () => void b.close().catch(() => undefined);
  signal.addEventListener("abort", stop, { once: true });
  const frames: Buffer[] = [];
  const DRAWN_FPS = 15;
  const moving = Math.round(4.5 * DRAWN_FPS);
  try {
    if (signal.aborted) throw new Error("cancelled");
    const ctx = await b.newContext({ viewport: { width: W, height: H }, reducedMotion: "reduce", serviceWorkers: "block" });
    await ctx.routeWebSocket(/.*/, (ws) => ws.close());
    await ctx.route("**/*", (route) => (route.request().url().startsWith("data:") ? route.continue() : route.abort()));
    const page = await ctx.newPage();
    await page.setContent(greetingHtml(req, ASSETS[req.lang]), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    for (let i = 0; i < moving; i++) {
      if (signal.aborted) throw new Error("cancelled");
      const t = i / (moving - 1);
      const e = 1 - (1 - Math.min(1, t * 1.6)) ** 3;
      await page.evaluate(([tt, ee]) => {
        document.documentElement.style.setProperty("--t", String(tt));
        document.documentElement.style.setProperty("--e", String(ee));
      }, [t, e] as const);
      frames.push(await page.screenshot({ type: "jpeg", quality: 92 }));
    }
  } finally {
    signal.removeEventListener("abort", stop);
    await b.close().catch(() => undefined);
  }
  console.log(`greeting drawn in ${Date.now() - t0} ms`);
  if (signal.aborted) throw new Error("cancelled");
  const hold = GREETING_SECONDS - frames.length / DRAWN_FPS;
  return encode(["-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(DRAWN_FPS), "-i", "-"], `[0:v]tpad=stop_mode=clone:stop_duration=${hold.toFixed(2)},fps=${FPS},format=yuv420p`, GREETING_SECONDS, frames, signal);
}

/** Frames into an MP4 with the music under it, faded in and out; never crashes the process on an abort or a dead ffmpeg. */
async function encode(input: string[], video: string, seconds: number, frames: Buffer[], signal: AbortSignal): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "render-"));
  const outFile = join(dir, "video.mp4");
  const ff = spawn("nice", ["-n", "10", "ffmpeg", "-threads", "1",
    "-v", "error", "-y",
    ...input,
    "-stream_loop", "-1", "-i", MUSIC,
    "-filter_complex", `${video},fade=t=out:st=${(seconds - 0.5).toFixed(2)}:d=0.5[v];[1:a]atrim=0:${seconds.toFixed(2)},afade=t=in:d=1,afade=t=out:st=${(seconds - 2).toFixed(2)}:d=2,volume=0.8[a]`,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "27", "-maxrate", "3M", "-bufsize", "6M", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-t", seconds.toFixed(2), outFile,
  ], { stdio: ["pipe", "ignore", "pipe"], signal });
  const err: Buffer[] = [];
  ff.stderr.on("data", (d: Buffer) => err.push(d));
  // An abort kills ffmpeg and emits "error": reported through "close" below, never an uncaught exception.
  ff.on("error", () => undefined);
  ff.stdin.on("error", () => undefined);
  const done = new Promise<void>((resolve, reject) => ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(signal.aborted ? "cancelled" : `ffmpeg ${code}: ${Buffer.concat(err).toString().slice(-400)}`)))));
  done.catch(() => undefined);
  try {
    for (const f of frames) {
      if (ff.exitCode !== null || ff.stdin.destroyed) break;
      await new Promise<void>((resolve) => ff.stdin.write(f, () => resolve()));
    }
    ff.stdin.end();
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

let running = 0;
let waiting = 0;
let queue: Promise<unknown> = Promise.resolve();

createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "GET" && req.url === "/health") return void res.writeHead(200).end("ok");
  if (req.method !== "POST" || (req.url !== "/render" && req.url !== "/greeting")) return void res.writeHead(404).end();
  if (!authorized(req)) return void res.writeHead(401).end();
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 16_000) return void res.writeHead(413).end();
    chunks.push(c as Buffer);
  }
  const body = Buffer.concat(chunks).toString();
  let work: (signal: AbortSignal) => Promise<Buffer>;
  if (req.url === "/greeting") {
    let g: GreetingRequest | null = null;
    try {
      g = parseGreeting(JSON.parse(body));
    } catch {
      g = null;
    }
    if (!g) return void res.writeHead(400).end("bad request");
    const input = g;
    work = (signal) => greeting(input, signal);
  } else {
    const input = parse(body);
    if (!input || !(await publicHost(new URL(input.url).hostname))) return void res.writeHead(400).end("bad request");
    work = (signal) => render(input, signal);
  }
  // One video at a time and at most one waiting: Chromium and ffmpeg share a small server with the app.
  if (running + waiting >= 2) return void res.writeHead(503).end("busy");
  const ac = new AbortController();
  // The caller gave up: stop the work, never finish a video nobody receives.
  res.on("close", () => !res.writableFinished && ac.abort());
  waiting++;
  const job = queue.then(async () => {
    waiting--;
    running++;
    // The time limit counts from when this video starts, not while it waits.
    const timer = setTimeout(() => ac.abort(new Error("render timed out")), 180_000);
    try {
      if (ac.signal.aborted) throw new Error("cancelled");
      return await work(ac.signal);
    } finally {
      clearTimeout(timer);
      running--;
      hostChecks.clear();
    }
  });
  queue = job.catch(() => undefined);
  try {
    const video = await job;
    res.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": video.length }).end(video);
  } catch (e) {
    console.error("render failed:", e instanceof Error ? e.message : e);
    if (!res.headersSent) res.writeHead(502).end(ac.signal.aborted ? "render stopped" : "render failed");
  }
}).listen(PORT, () => console.log(`renderer on ${PORT}`));
