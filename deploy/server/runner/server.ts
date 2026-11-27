/**
 * Sandbox runner: the only process with access to Docker. The app asks it (over the private
 * compose network, with a shared secret) to open, change, build and stop one workspace container
 * per project; it never runs anything else. Caddy asks it which preview hosts may get a
 * certificate (`/ask`) and whether a preview request carries the owner's pass (`/gate`).
 * See deploy/server/README.md and docs/DECISIONS.md (2026-11-20).
 */
import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";
import { stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { join } from "node:path";
import { containerName, execArgs, PREVIEW_COOKIE, PREVIEW_PARAM, previewHostName, runArgs, safeSitePath, siteHostSlug, tarFiles, toStop, TtlCache, verifyPreview } from "./lib.ts";

const SECRET = process.env.RUNNER_SECRET ?? "";
const IMAGE = process.env.SANDBOX_IMAGE ?? "gojoline-sandbox";
const NETWORK = process.env.SANDBOX_NETWORK ?? "gojoline-previews";
const BASE = process.env.APP_DOMAIN ?? "";
const MAX_RUNNING = Number(process.env.SANDBOX_MAX_RUNNING) || 2;
const IDLE_MS = (Number(process.env.SANDBOX_IDLE_MINUTES) || 15) * 60_000;
const LIMITS = { memory: process.env.SANDBOX_MEMORY ?? "700m", cpus: process.env.SANDBOX_CPUS ?? "1", pids: 512 };
const MAX_BODY = 30 * 1024 * 1024;
const MAX_OUTPUT = 4 * 1024 * 1024;
/** At most this many `docker` processes at once (the runner has little memory). */
const MAX_DOCKER = 6;
/** Customer sites (read-only mount of the sites volume) and their domain, for `/ask`. */
const SITES_DIR = process.env.SITES_DIR ?? "";
const SITES_BASE = (process.env.PUBLISH_BASE_DOMAIN ?? "").toLowerCase();
const liveSites = new TtlCache(30_000);

if (SECRET.length < 24) {
  // Not set up yet (run setup.sh once): stay idle instead of restarting in a loop.
  console.error("RUNNER_SECRET is not set (24+ characters): run deploy/server/setup.sh once. Idle until then.");
  setInterval(() => undefined, 1 << 30);
  await new Promise(() => undefined);
}

/** Workspaces this runner has running, and when each was last used. */
const lastUsed = new Map<string, number>();
/** Workspaces with a command in flight (never stopped for the limit). */
const inFlight = new Map<string, number>();
const busy = () => new Set([...inFlight].filter(([, n]) => n > 0).map(([k]) => k));

interface Result {
  code: number;
  stdout: Buffer;
  stderr: Buffer;
  truncated: boolean;
}

let dockerRunning = 0;
const dockerQueue: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (dockerRunning >= MAX_DOCKER) await new Promise<void>((r) => dockerQueue.push(r));
  dockerRunning++;
  try {
    return await fn();
  } finally {
    dockerRunning--;
    dockerQueue.shift()?.();
  }
}

function docker(args: string[], stdin?: Buffer, timeoutMs = 600_000): Promise<Result> {
  return slot(
    () =>
      new Promise((resolve) => {
        const child = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
        const out: Buffer[] = [];
        const err: Buffer[] = [];
        let size = 0;
        let truncated = false;
        const take = (into: Buffer[]) => (b: Buffer) => {
          size += b.length;
          if (size <= MAX_OUTPUT) into.push(b);
          else truncated = true;
        };
        child.stdout.on("data", take(out));
        child.stderr.on("data", take(err));
        const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
        child.on("close", (code) => {
          clearTimeout(timer);
          resolve({ code: code ?? 1, stdout: Buffer.concat(out), stderr: Buffer.concat(err), truncated });
        });
        child.on("error", () => resolve({ code: 127, stdout: Buffer.alloc(0), stderr: Buffer.from("docker not available"), truncated: false }));
        child.stdin.end(stdin);
      }),
  );
}

async function running(name: string): Promise<boolean> {
  const r = await docker(["inspect", "-f", "{{.State.Running}}", name], undefined, 15_000);
  return r.code === 0 && r.stdout.toString().trim() === "true";
}

async function stopNames(names: string[]) {
  for (const n of names) {
    lastUsed.delete(n);
    // --rm on run: stopping also removes it.
    await docker(["stop", "-t", "3", n], undefined, 30_000);
  }
}

/** One open at a time per workspace (two at once could remove each other's new container). */
const opening = new Map<string, Promise<{ fresh: boolean }>>();
function open(name: string): Promise<{ fresh: boolean }> {
  const prev = opening.get(name) ?? Promise.resolve({ fresh: false });
  const next = prev.catch(() => undefined).then(() => openNow(name));
  opening.set(name, next);
  void next.finally(() => opening.get(name) === next && opening.delete(name)).catch(() => undefined);
  return next;
}

async function openNow(name: string): Promise<{ fresh: boolean }> {
  lastUsed.set(name, Date.now());
  await stopNames(toStop(lastUsed, Date.now(), IDLE_MS, MAX_RUNNING, name, busy()));
  if (await running(name)) return { fresh: false };
  // A stopped leftover (should not exist with --rm) is cleared first.
  await docker(["rm", "-f", name], undefined, 30_000);
  const r = await docker(runArgs(name, IMAGE, NETWORK, LIMITS), undefined, 120_000);
  if (r.code !== 0) {
    lastUsed.delete(name);
    throw new Error(`start failed: ${r.stderr.toString().slice(-300)}`);
  }
  return { fresh: true };
}

/** Marks a workspace used and busy while `fn` runs; only workspaces this runner started count. */
async function using<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (lastUsed.has(name)) lastUsed.set(name, Date.now());
  inFlight.set(name, (inFlight.get(name) ?? 0) + 1);
  try {
    return await fn();
  } finally {
    const n = (inFlight.get(name) ?? 1) - 1;
    if (n > 0) inFlight.set(name, n);
    else inFlight.delete(name);
    if (lastUsed.has(name)) lastUsed.set(name, Date.now());
  }
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown> | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > MAX_BODY) return null;
    chunks.push(c as Buffer);
  }
  try {
    const v = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(body));
}

function authorized(req: IncomingMessage): boolean {
  const given = Buffer.from(req.headers.authorization ?? "");
  const want = Buffer.from(`Bearer ${SECRET}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

function cookie(req: IncomingMessage, name: string): string | null {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

/**
 * Caddy's forward_auth for previews: a request passes with the owner's pass as a cookie. The pass
 * arrives once in the URL (`?gojo_preview=`): it is moved into a cookie for this preview host only
 * and the address is cleaned. Anything else gets 403, so a preview address alone shows nothing.
 */
function gate(req: IncomingMessage, res: ServerResponse) {
  const name = previewHostName(String(req.headers["x-forwarded-host"] ?? ""), BASE);
  if (!name) return send(res, 403, {});
  const now = Math.floor(Date.now() / 1000);
  const uri = new URL(String(req.headers["x-forwarded-uri"] ?? "/"), "https://preview.invalid");
  const fromUrl = uri.searchParams.get(PREVIEW_PARAM);
  if (fromUrl && verifyPreview(SECRET, name, fromUrl, now)) {
    uri.searchParams.delete(PREVIEW_PARAM);
    const exp = Number(fromUrl.split(".")[0]);
    return send(res, 302, {}, {
      Location: `${uri.pathname}${uri.search}`,
      "Set-Cookie": `${PREVIEW_COOKIE}=${fromUrl}; Path=/; Max-Age=${Math.max(0, exp - now)}; Secure; HttpOnly; SameSite=None`,
    });
  }
  return verifyPreview(SECRET, name, cookie(req, PREVIEW_COOKIE), now) ? send(res, 200, {}) : send(res, 403, {});
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://runner");
  // Caddy's on-demand TLS check: answered from memory (no process per handshake).
  if (req.method === "GET" && url.pathname === "/ask") {
    const domain = (url.searchParams.get("domain") ?? "").toLowerCase();
    const name = previewHostName(domain, BASE);
    if (name) return send(res, lastUsed.has(name) ? 200 : 404, {});
    // A customer site (deploy/server/Caddyfile): only while it has a live deployment.
    const slug = SITES_DIR ? siteHostSlug(domain, SITES_BASE, BASE) : null;
    const live = slug ? await liveSites.get(slug, Date.now(), () => stat(join(SITES_DIR, slug, "current", "index.html")).then(() => true, () => false)) : false;
    return send(res, live ? 200 : 404, {});
  }
  if (url.pathname === "/gate") return gate(req, res);
  if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true });
  if (req.method !== "POST" || !authorized(req)) return send(res, 404, { error: "not_found" });
  const body = await readJson(req);
  if (!body) return send(res, 400, { error: "invalid" });
  // How many workspaces are open (moving sites waits while builders use them all).
  if (url.pathname === "/status") return send(res, 200, { running: lastUsed.size, busy: busy().size, max: MAX_RUNNING });
  const name = containerName(String(body.project ?? ""));
  if (!name) return send(res, 400, { error: "invalid" });

  switch (url.pathname) {
    case "/open": {
      const { fresh } = await open(name);
      return send(res, 200, { name, fresh, previewHost: BASE ? `${name}.preview.${BASE}` : null });
    }
    case "/exec": {
      const cmd = Array.isArray(body.cmd) ? (body.cmd as string[]) : [];
      const timeoutS = Math.min(Math.max(Number(body.timeoutS) || 120, 1), 600);
      const args = execArgs(name, cmd, { cwd: typeof body.cwd === "string" ? body.cwd : undefined, env: body.env as Record<string, string> | undefined, timeoutS });
      if (!args) return send(res, 400, { error: "invalid" });
      const r = await using(name, () => docker(args, undefined, (timeoutS + 15) * 1000));
      return send(res, 200, { exitCode: r.code, stdout: r.stdout.toString("utf8"), stderr: r.stderr.toString("utf8"), truncated: r.truncated });
    }
    case "/write": {
      const raw = Array.isArray(body.files) ? (body.files as { path?: unknown; data?: unknown }[]) : [];
      const files: { path: string; data: Buffer }[] = [];
      for (const f of raw) {
        const path = safeSitePath(f.path);
        if (!path || typeof f.data !== "string") return send(res, 400, { error: "invalid" });
        files.push({ path, data: Buffer.from(f.data, "base64") });
      }
      if (files.length === 0) return send(res, 200, { ok: true });
      const r = await using(name, () => docker(["exec", "-i", "-u", "node", "-w", "/site", name, "tar", "-x", "--no-same-owner", "--no-same-permissions", "-f", "-"], tarFiles(files), 120_000));
      return r.code === 0 ? send(res, 200, { ok: true }) : send(res, 500, { error: "write_failed" });
    }
    case "/read": {
      const path = safeSitePath(body.path);
      if (!path) return send(res, 400, { error: "invalid" });
      const r = await using(name, () => docker(["exec", "-u", "node", "-w", "/site", name, "cat", "--", path], undefined, 30_000));
      // A file cut off at the output cap is an error, never returned as if whole.
      if (r.truncated) return send(res, 413, { error: "too_large" });
      return send(res, 200, { data: r.code === 0 ? r.stdout.toString("base64") : null });
    }
    case "/stop": {
      await stopNames([name]);
      return send(res, 200, { ok: true });
    }
    default:
      return send(res, 404, { error: "not_found" });
  }
}

// Workspaces already running (after a runner restart) count as just used.
const existing = await docker(["ps", "--filter", "label=gojoline.sandbox=1", "--format", "{{.Names}}"], undefined, 15_000);
for (const n of existing.stdout.toString().split("\n").map((s) => s.trim()).filter(Boolean)) lastUsed.set(n, Date.now());

// Idle workspaces are stopped every minute (never one in the middle of a command).
setInterval(() => {
  void stopNames(toStop(lastUsed, Date.now(), IDLE_MS, MAX_RUNNING, undefined, busy())).catch(() => undefined);
}, 60_000).unref();

createServer((req, res) => {
  handle(req, res).catch((e: unknown) => {
    console.error("runner error", e instanceof Error ? e.message : e);
    if (!res.headersSent) send(res, 500, { error: "failed" });
  });
}).listen(Number(process.env.PORT) || 7070, "0.0.0.0", () => console.log("sandbox runner ready"));
