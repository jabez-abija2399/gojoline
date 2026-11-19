import "server-only";
import type { BuildResult } from "@/lib/agent/workspace";
import { isVersionedPath, lockedTemplateFiles, stockFilesFor, type TemplateFile } from "@/lib/template/files";
import { PREVIEW_PARAM, signPreview } from "@/deploy/server/runner/lib";
import type { SandboxProvider, SiteSandbox } from "./types";

const PORT = 5173;
/** How long a preview pass works (the builder asks for a fresh one each time it opens). */
const PASS_SECONDS = 12 * 3600;

export interface RunnerConfig {
  /** The runner on the private compose network, e.g. http://runner:7070. */
  url: string;
  secret: string;
  fetch?: typeof fetch;
}

interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/** The runner's small HTTP API (deploy/server/runner/server.ts). */
export class RunnerClient {
  constructor(private config: RunnerConfig) {}

  async call<T>(path: string, body: Record<string, unknown>, timeoutMs = 120_000): Promise<T> {
    const res = await (this.config.fetch ?? fetch)(`${this.config.url.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.secret}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`runner ${path} answered ${res.status}`);
    return (await res.json()) as T;
  }
}

/**
 * One Docker container per project on our own server, started by the runner: the site template
 * with its packages, no internet, not root, capped memory and CPU. Its live preview is served by
 * Caddy on its own origin (https://gojo-<id>.preview.<domain>), never on the app's.
 */
export class DockerSandboxProvider implements SandboxProvider {
  private client: RunnerClient;
  constructor(private config: RunnerConfig) {
    this.client = new RunnerClient(config);
  }

  async open(projectId: string, files: Record<string, string> | null): Promise<SiteSandbox> {
    const opened = await this.client.call<{ name: string; fresh: boolean; previewHost: string | null }>("/open", { project: projectId });
    if (!opened.previewHost || !/^gojo-[0-9a-f-]{36}\.preview\.[a-z0-9.-]+$/.test(opened.previewHost)) throw new Error("Unexpected preview host");
    const pass = signPreview(this.config.secret, opened.name, Math.floor(Date.now() / 1000) + PASS_SECONDS);
    const site = new DockerSiteSandbox(this.client, projectId, opened.name, opened.previewHost, pass);
    // The image already holds this deployment's template: only the saved version is written in.
    if (files) await site.restoreFiles(files);
    await site.ensureDevServer();
    return site;
  }
}

const b64 = (c: string | Buffer) => (typeof c === "string" ? Buffer.from(c, "utf8") : c).toString("base64");

export class DockerSiteSandbox implements SiteSandbox {
  private stockSent = new Set<string>();
  constructor(
    private client: RunnerClient,
    private project: string,
    readonly id: string,
    private host: string,
    private pass: string,
  ) {}

  /** The owner's preview: Caddy lets it through only with this pass (the runner's /gate). */
  get previewUrl() {
    return `https://${this.host}/?${PREVIEW_PARAM}=${encodeURIComponent(this.pass)}`;
  }

  private exec(cmd: string[], opts: { cwd?: string; env?: Record<string, string>; timeoutS?: number } = {}) {
    const timeoutS = opts.timeoutS ?? 120;
    return this.client.call<ExecResult>("/exec", { project: this.project, cmd, cwd: opts.cwd, env: opts.env, timeoutS }, (timeoutS + 30) * 1000);
  }

  private async write(files: TemplateFile[]) {
    if (files.length === 0) return;
    await this.client.call("/write", { project: this.project, files: files.map((f) => ({ path: f.path, data: b64(f.content) })) });
  }

  async ensureDevServer() {
    const ping = ["node", "-e", `fetch("http://127.0.0.1:${PORT}/").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))`];
    // The container starts Vite itself; wait for it to answer.
    for (let i = 0; i < 60; i++) {
      if ((await this.exec(ping, { timeoutS: 10 })).exitCode === 0) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("Preview server did not start");
  }

  async readFile(path: string) {
    const r = await this.client.call<{ data: string | null }>("/read", { project: this.project, path });
    return r.data === null ? null : Buffer.from(r.data, "base64").toString("utf8");
  }

  async writeFile(path: string, content: string) {
    await this.write([{ path, content }]);
    if (path === "src/site.json") await this.syncStock(content);
  }

  /** Copies in the sample photos the site uses (the library itself stays out of the workspace). */
  private async syncStock(siteJson?: string | null) {
    const json = siteJson ?? (await this.readFile("src/site.json"));
    const files = (json ? stockFilesFor(json) : []).filter((f) => !this.stockSent.has(f.path));
    for (const f of files) this.stockSent.add(f.path);
    await this.write(files);
  }

  async deleteFile(path: string) {
    await this.exec(["rm", "-f", "--", path]);
  }

  async listFiles() {
    const res = await this.exec(["find", "src", "public", "-type", "f"]);
    return res.stdout.split("\n").map((s) => s.trim()).filter(Boolean).sort();
  }

  /** Puts back every locked template file (configs, scripts, schema), in case build-time code changed them. */
  private async syncLocked() {
    await this.write(lockedTemplateFiles());
    await this.syncStock();
  }

  async runBuild(): Promise<BuildResult> {
    const started = Date.now();
    await this.syncLocked();
    const res = await this.exec(["npm", "run", "build", "--silent"], { timeoutS: 300 });
    return { ok: res.exitCode === 0, output: tail(`${res.stdout}\n${res.stderr}`.trim(), 6000), durationMs: Date.now() - started };
  }

  async buildForPublish(env: Record<string, string>) {
    const started = Date.now();
    await this.syncLocked();
    const res = await this.exec(["npm", "run", "build", "--silent"], { env, timeoutS: 300 });
    const output = tail(`${res.stdout}\n${res.stderr}`.trim(), 6000);
    if (res.exitCode !== 0) return { ok: false, output, durationMs: Date.now() - started, files: [] };
    const list = await this.exec(["find", "dist", "-type", "f"]);
    const paths = list.stdout.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 500);
    const files = [];
    for (const p of paths) {
      const r = await this.client.call<{ data: string | null }>("/read", { project: this.project, path: p });
      if (r.data !== null) files.push({ path: p.replace(/^dist\//, ""), data: Buffer.from(r.data, "base64") });
    }
    return { ok: true, output, durationMs: Date.now() - started, files };
  }

  async writeAssets(files: { path: string; data: Buffer }[]) {
    await this.write(files.filter((f) => /^public\/images\/[\w.-]+\.webp$/.test(f.path)).map((f) => ({ path: f.path, content: f.data })));
  }

  async snapshotFiles() {
    const files: Record<string, string> = {};
    for (const path of await this.listFiles()) {
      if (!isVersionedPath(path)) continue;
      const content = await this.readFile(path);
      if (content !== null) files[path] = content;
    }
    return files;
  }

  async restoreFiles(files: Record<string, string>) {
    const current = await this.listFiles();
    const stale = current.filter((p) => isVersionedPath(p) && !(p in files));
    if (stale.length) await this.exec(["rm", "-f", "--", ...stale]);
    await this.write(Object.entries(files).filter(([p]) => isVersionedPath(p)).map(([path, content]) => ({ path, content })));
    await this.syncStock(files["src/site.json"]);
  }

  async stop() {
    await this.client.call("/stop", { project: this.project });
  }
}

function tail(text: string, max: number) {
  return text.length > max ? text.slice(-max) : text;
}
