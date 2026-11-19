/**
 * Sandbox runner: the only process with access to Docker. The app asks it (over the private
 * compose network, with a shared secret) to open, change, build and stop one workspace container
 * per project; it never runs anything else. Caddy asks it which preview hosts may get a
 * certificate. See deploy/server/README.md and docs/DECISIONS.md (2026-11-20).
 */
import { spawn } from "node:child_process";
import { timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { containerName, execArgs, previewHostName, runArgs, safeSitePath, tarFiles, toStop } from "./lib.ts";

const SECRET = process.env.RUNNER_SECRET ?? "";
const IMAGE = process.env.SANDBOX_IMAGE ?? "gojoline-sandbox";
const NETWORK = process.env.SANDBOX_NETWORK ?? "gojoline-previews";
const BASE = process.env.APP_DOMAIN ?? "";
const MAX_RUNNING = Number(process.env.SANDBOX_MAX_RUNNING) || 3;
const IDLE_MS = (Number(process.env.SANDBOX_IDLE_MINUTES) || 15) * 60_000;
const LIMITS = { memory: process.env.SANDBOX_MEMORY ?? "768m", cpus: process.env.SANDBOX_CPUS ?? "1", pids: 512 };
const MAX_BODY = 30 * 1024 * 1024;
const MAX_OUTPUT = 2 * 1024 * 1024;

if (SECRET.length < 24) {
  // Not set up yet (run setup.sh once): stay idle instead of restarting in a loop.
  console.error("RUNNER_SECRET is not set (24+ characters): run deploy/server/setup.sh once. Idle until then.");
  setInterval(() => undefined, 1 << 30);
  await new Promise(() => undefined);
}

const lastUsed = new Map<string, number>();

interface Result {
  code: number;
  stdout: Buffer;
  stderr: Buffer;
}

function docker(args: string[], stdin?: Buffer, timeoutMs = 600_000): Promise<Result> {
  return new Promise((resolve) => {
    const child = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    let size = 0;
    const take = (into: Buffer[]) => (b: Buffer) => {
      size += b.length;
      if (size <= MAX_OUTPUT) into.push(b);
    };
    child.stdout.on("data", take(out));
    child.stderr.on("data", take(err));
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout: Buffer.concat(out), stderr: Buffer.concat(err) });
    });
    child.on("error", () => resolve({ code: 127, stdout: Buffer.alloc(0), stderr: Buffer.from("docker not available") }));
    child.stdin.end(stdin);
  });
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

async function open(name: string): Promise<{ fresh: boolean }> {
  lastUsed.set(name, Date.now());
  await stopNames(toStop(lastUsed, Date.now(), IDLE_MS, MAX_RUNNING, name));
  if (await running(name)) return { fresh: false };
  // A stopped leftover (should not exist with --rm) is cleared first.
  await docker(["rm", "-f", name], undefined, 30_000);
  const r = await docker(runArgs(name, IMAGE, NETWORK, LIMITS), undefined, 120_000);
  if (r.code !== 0) throw new Error(`start failed: ${r.stderr.toString().slice(-300)}`);
  return { fresh: true };
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

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function authorized(req: IncomingMessage): boolean {
  const given = Buffer.from(req.headers.authorization ?? "");
  const want = Buffer.from(`Bearer ${SECRET}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://runner");
  // Caddy's on-demand TLS check (no secret: it only says whether a workspace is running).
  if (req.method === "GET" && url.pathname === "/ask") {
    const name = previewHostName(url.searchParams.get("domain") ?? "", BASE);
    return send(res, name && (await running(name)) ? 200 : 404, {});
  }
  if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true });
  if (req.method !== "POST" || !authorized(req)) return send(res, 404, { error: "not_found" });
  const body = await readJson(req);
  if (!body) return send(res, 400, { error: "invalid" });
  const name = containerName(String(body.project ?? ""));
  if (!name) return send(res, 400, { error: "invalid" });

  switch (url.pathname) {
    case "/open": {
      const { fresh } = await open(name);
      return send(res, 200, { name, fresh, previewHost: BASE ? `${name}.preview.${BASE}` : null });
    }
    case "/exec": {
      lastUsed.set(name, Date.now());
      const cmd = Array.isArray(body.cmd) ? (body.cmd as string[]) : [];
      const timeoutS = Math.min(Math.max(Number(body.timeoutS) || 120, 1), 600);
      const args = execArgs(name, cmd, { cwd: typeof body.cwd === "string" ? body.cwd : undefined, env: body.env as Record<string, string> | undefined, timeoutS });
      if (!args) return send(res, 400, { error: "invalid" });
      const r = await docker(args, undefined, (timeoutS + 15) * 1000);
      return send(res, 200, { exitCode: r.code, stdout: r.stdout.toString("utf8"), stderr: r.stderr.toString("utf8") });
    }
    case "/write": {
      lastUsed.set(name, Date.now());
      const raw = Array.isArray(body.files) ? (body.files as { path?: unknown; data?: unknown }[]) : [];
      const files: { path: string; data: Buffer }[] = [];
      for (const f of raw) {
        const path = safeSitePath(f.path);
        if (!path || typeof f.data !== "string") return send(res, 400, { error: "invalid" });
        files.push({ path, data: Buffer.from(f.data, "base64") });
      }
      if (files.length === 0) return send(res, 200, { ok: true });
      const r = await docker(["exec", "-i", "-u", "node", "-w", "/site", name, "tar", "-x", "--no-same-owner", "--no-same-permissions", "-f", "-"], tarFiles(files), 120_000);
      return r.code === 0 ? send(res, 200, { ok: true }) : send(res, 500, { error: "write_failed" });
    }
    case "/read": {
      lastUsed.set(name, Date.now());
      const path = safeSitePath(body.path);
      if (!path) return send(res, 400, { error: "invalid" });
      const r = await docker(["exec", "-u", "node", "-w", "/site", name, "cat", "--", path], undefined, 30_000);
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

// Idle workspaces are stopped every minute.
setInterval(() => {
  void stopNames(toStop(lastUsed, Date.now(), IDLE_MS, MAX_RUNNING)).catch(() => undefined);
}, 60_000).unref();

createServer((req, res) => {
  handle(req, res).catch((e: unknown) => {
    console.error("runner error", e instanceof Error ? e.message : e);
    if (!res.headersSent) send(res, 500, { error: "failed" });
  });
}).listen(Number(process.env.PORT) || 7070, "0.0.0.0", () => console.log("sandbox runner ready"));
