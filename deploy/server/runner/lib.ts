import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Pure helpers for the sandbox runner (deploy/server/runner/server.ts): names, paths, the exact
 * `docker` arguments it may use, and a small tar writer. Kept free of I/O so they are unit-tested.
 * Node runs this file directly (type stripping): erasable TypeScript only.
 */

export const PROJECT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The only container names the runner ever touches. */
export function containerName(projectId: string): string | null {
  const id = projectId.toLowerCase();
  return PROJECT_ID.test(id) ? `gojo-${id}` : null;
}

/** A path inside the site folder: relative, no "..", no hidden tricks. Returns the clean path or null. */
export function safeSitePath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 200) return null;
  const path = raw.replace(/\\/g, "/").replace(/^\.\//, "");
  if (path.startsWith("/") || path.includes("\0") || path.split("/").some((p) => p === ".." || p === "" || p === ".")) return null;
  if (!/^[\w./@-]+$/.test(path)) return null;
  return path;
}

export interface Limits {
  memory: string;
  cpus: string;
  pids: number;
}

/**
 * `docker run` for one project's workspace. Fixed flags only: the caller picks nothing but the
 * project. No internet (an internal network), not root, no extra capabilities, capped resources,
 * removed when stopped (its files come back from Gojoline's saved versions).
 */
export function runArgs(name: string, image: string, network: string, limits: Limits): string[] {
  return [
    "run", "-d", "--rm",
    "--name", name,
    "--hostname", name,
    "--label", "gojoline.sandbox=1",
    "--network", network,
    "--user", "node",
    "--memory", limits.memory,
    "--memory-swap", limits.memory,
    "--cpus", limits.cpus,
    "--pids-limit", String(limits.pids),
    "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges",
    "--tmpfs", "/tmp:rw,size=256m",
    "--init",
    "--ulimit", "nofile=1024:1024",
    "--log-opt", "max-size=5m",
    "--log-opt", "max-file=1",
    image,
  ];
}

/** Commands the app may run inside a workspace (no shell). */
export const ALLOWED_COMMANDS = new Set(["npm", "node", "find", "rm", "cat", "ls"]);

/** Environment variable names the app may pass (the site's public VITE_* settings). */
export const ENV_NAME = /^VITE_[A-Z0-9_]{1,60}$/;
export const MAX_ENV_VALUE = 32_000;
export const MAX_ENV_TOTAL = 64_000;

export function execArgs(name: string, cmd: string[], opts: { cwd?: string; env?: Record<string, string>; timeoutS: number; stdin?: boolean }): string[] | null {
  if (cmd.length === 0 || !ALLOWED_COMMANDS.has(cmd[0]!)) return null;
  if (cmd.some((a) => typeof a !== "string" || a.length > 500 || a.includes("\0"))) return null;
  const cwd = opts.cwd ? safeSitePath(opts.cwd) : ".";
  if (cwd === null) return null;
  const env: string[] = [];
  let envBytes = 0;
  for (const [k, v] of Object.entries(opts.env ?? {})) {
    // Publish passes the site's SEO and business info (JSON): allow real sizes, cap the total.
    if (!ENV_NAME.test(k) || typeof v !== "string" || v.includes("\0") || v.length > MAX_ENV_VALUE) return null;
    envBytes += k.length + v.length;
    if (envBytes > MAX_ENV_TOTAL) return null;
    env.push("-e", `${k}=${v}`);
  }
  const workdir = cwd === "." ? "/site" : `/site/${cwd}`;
  return ["exec", ...(opts.stdin ? ["-i"] : []), "-u", "node", "-w", workdir, ...env, name, "timeout", "-k", "5", String(opts.timeoutS), ...cmd];
}

/** A ustar archive (regular files only, owned by node). Parent folders are made by `tar -x`. */
export function tarFiles(files: { path: string; data: Buffer }[]): Buffer {
  const blocks: Buffer[] = [];
  for (const f of files) {
    const header = Buffer.alloc(512, 0);
    let name = f.path;
    let prefix = "";
    if (Buffer.byteLength(name) > 100) {
      const cut = name.lastIndexOf("/", 154);
      if (cut <= 0 || Buffer.byteLength(name.slice(cut + 1)) > 100) throw new Error(`path too long: ${f.path}`);
      prefix = name.slice(0, cut);
      name = name.slice(cut + 1);
    }
    const put = (value: string, offset: number, length: number) => header.write(value, offset, length, "utf8");
    const octal = (n: number, length: number) => n.toString(8).padStart(length - 1, "0") + "\0";
    put(name, 0, 100);
    put(octal(0o644, 8), 100, 8);
    put(octal(1000, 8), 108, 8);
    put(octal(1000, 8), 116, 8);
    put(octal(f.data.length, 12), 124, 12);
    put(octal(Math.floor(Date.now() / 1000), 12), 136, 12);
    put("        ", 148, 8);
    put("0", 156, 1);
    put("ustar\0", 257, 6);
    put("00", 263, 2);
    put("node", 265, 32);
    put("node", 297, 32);
    put(prefix, 345, 155);
    let sum = 0;
    for (const b of header) sum += b;
    put(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8);
    blocks.push(header, f.data, Buffer.alloc((512 - (f.data.length % 512)) % 512, 0));
  }
  blocks.push(Buffer.alloc(1024, 0));
  return Buffer.concat(blocks);
}

/** Which running workspaces to stop: idle too long, then the least recently used beyond `max`. */
export function toStop(lastUsed: Map<string, number>, now: number, idleMs: number, max: number, keep?: string, busy: ReadonlySet<string> = new Set()): string[] {
  const stop = new Set<string>();
  for (const [name, at] of lastUsed) if (name !== keep && !busy.has(name) && now - at > idleMs) stop.add(name);
  const alive = [...lastUsed].filter(([n]) => !stop.has(n)).sort((a, b) => b[1] - a[1]);
  // The one being opened always stays; the oldest others go until at most `max` are running.
  // A workspace in the middle of a command (a build, a publish) is never stopped: the limit waits.
  const ordered = keep ? [...alive.filter(([n]) => n === keep), ...alive.filter(([n]) => n !== keep)] : alive;
  for (const [name] of ordered.slice(max)) if (!busy.has(name) && name !== keep) stop.add(name);
  return [...stop];
}

/**
 * Caddy asks before getting a customer site's certificate: only `<slug>.<base>` (exactly one
 * label, a valid site address, never the app's own name) qualifies, and only while that site is
 * live (the caller checks its folder on the sites volume). Returns the slug, or null.
 */
export function siteHostSlug(host: string, base: string, appDomain = ""): string | null {
  if (!base || host === appDomain || !host.endsWith(`.${base}`)) return null;
  const label = host.slice(0, -(base.length + 1));
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(label) && !label.includes("--") ? label : null;
}

/** Answers from memory for a short while: a handshake storm never turns into a disk storm. */
export class TtlCache {
  // Plain fields (Node runs this file with type stripping: no parameter properties).
  private map = new Map<string, { at: number; value: boolean }>();
  private ttlMs: number;
  private max: number;
  constructor(ttlMs: number, max = 5000) {
    this.ttlMs = ttlMs;
    this.max = max;
  }
  async get(key: string, now: number, load: () => Promise<boolean>): Promise<boolean> {
    const hit = this.map.get(key);
    if (hit && now - hit.at < this.ttlMs) return hit.value;
    const value = await load();
    this.map.delete(key);
    while (this.map.size >= this.max) this.map.delete(this.map.keys().next().value!);
    this.map.set(key, { at: now, value });
    return value;
  }
}

/** Caddy asks before getting a preview certificate: only hosts of running workspaces qualify. */
export function previewHostName(host: string, base: string): string | null {
  const suffix = `.preview.${base}`;
  if (!host.endsWith(suffix)) return null;
  const label = host.slice(0, -suffix.length);
  return /^gojo-[0-9a-f-]{36}$/.test(label) && containerName(label.slice(5)) === label ? label : null;
}

/**
 * A preview pass: only the owner's builder gets it (in the preview URL), and Caddy lets a preview
 * through only with a valid one (`/gate`). `exp` is in seconds; the pass names one workspace.
 */
export function signPreview(secret: string, name: string, exp: number): string {
  const mac = createHmac("sha256", secret).update(`preview|${name}|${exp}`).digest("base64url");
  return `${exp}.${mac}`;
}

export function verifyPreview(secret: string, name: string, token: string | null | undefined, nowS: number): boolean {
  if (!token || token.length > 200) return false;
  const [expRaw, mac] = token.split(".");
  const exp = Number(expRaw);
  if (!Number.isInteger(exp) || exp < nowS || !mac) return false;
  const want = Buffer.from(signPreview(secret, name, exp).split(".")[1]!);
  const got = Buffer.from(mac);
  return want.length === got.length && timingSafeEqual(want, got);
}

export const PREVIEW_PARAM = "gojo_preview";
export const PREVIEW_COOKIE = "gojo_preview";
