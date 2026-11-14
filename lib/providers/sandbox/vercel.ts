import "server-only";
import { Sandbox } from "@vercel/sandbox";
import type { BuildResult } from "@/lib/agent/workspace";
import { isVersionedPath, templateFiles } from "@/lib/template/files";
import type { SandboxProvider, SiteSandbox } from "./types";

const PORT = 5173;
const ROOT = "/vercel/sandbox/site";
const IDLE_TIMEOUT_MS = 30 * 60_000;

export interface VercelSandboxConfig {
  teamId: string;
  projectId: string;
  token: string;
  /** Snapshot with the template and node_modules installed (scripts/sandbox-snapshot.mts). */
  snapshotId?: string;
}

/**
 * Vercel Sandbox (Firecracker microVM per project). AI-written code runs only here.
 * After setup the sandbox gets no outbound network access, so generated code can't
 * reach anything; the preview is served on its own *.vercel.run origin.
 */
export class VercelSandboxProvider implements SandboxProvider {
  constructor(private config: VercelSandboxConfig) {}

  async open(projectId: string, files: Record<string, string> | null): Promise<SiteSandbox> {
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(projectId)) throw new Error("Invalid project id");
    const creds = { teamId: this.config.teamId, projectId: this.config.projectId, token: this.config.token };
    const name = `gojo-${projectId}`.toLowerCase();

    let sandbox: Sandbox;
    let fresh = false;
    try {
      sandbox = await Sandbox.get({ ...creds, name });
    } catch {
      fresh = true;
      sandbox = await Sandbox.create({
        ...creds,
        name,
        ports: [PORT],
        timeout: IDLE_TIMEOUT_MS,
        resources: { vcpus: 2 },
        ...(this.config.snapshotId
          ? { source: { type: "snapshot" as const, snapshotId: this.config.snapshotId } }
          : { runtime: "node22" }),
        tags: { app: "gojoline", project: projectId.slice(0, 60) },
      });
    }

    const site = new VercelSiteSandbox(sandbox);
    if (fresh && !this.config.snapshotId) await site.installTemplate();
    // The snapshot provides node_modules; template files always come from this deployment.
    else if (fresh) await site.syncTemplate();
    if (files) await site.restoreFiles(files);
    await sandbox.updateNetworkPolicy("deny-all");
    await site.ensureDevServer();
    return site;
  }
}

class VercelSiteSandbox implements SiteSandbox {
  constructor(private sandbox: Sandbox) {}

  get id() {
    return this.sandbox.name;
  }

  get previewUrl() {
    return this.sandbox.domain(PORT);
  }

  /** Slow path when no snapshot exists: copy the template and install dependencies. */
  async installTemplate() {
    await this.sandbox.mkDir(ROOT).catch(() => undefined);
    await this.sandbox.writeFiles(
      templateFiles().map((f) => ({ path: `${ROOT}/${f.path}`, content: typeof f.content === "string" ? f.content : new Uint8Array(f.content) })),
    );
    const install = await this.sandbox.runCommand({ cmd: "npm", args: ["ci", "--no-audit", "--no-fund"], cwd: ROOT });
    if (install.exitCode !== 0) throw new Error(`Template install failed: ${(await install.stderr()).slice(-500)}`);
  }

  async syncTemplate() {
    await this.sandbox.writeFiles(
      templateFiles().map((f) => ({ path: `${ROOT}/${f.path}`, content: typeof f.content === "string" ? f.content : new Uint8Array(f.content) })),
    );
  }

  async ensureDevServer() {
    const check = await this.sandbox.runCommand({ cmd: "sh", args: ["-c", `curl -sf -o /dev/null http://localhost:${PORT}/ && echo up || echo down`] });
    if ((await check.stdout()).trim() === "up") return;
    await this.sandbox.runCommand({ cmd: "npx", args: ["vite", "--host", "0.0.0.0", "--port", String(PORT)], cwd: ROOT, detached: true });
    for (let i = 0; i < 40; i++) {
      const ping = await this.sandbox.runCommand({ cmd: "sh", args: ["-c", `curl -sf -o /dev/null http://localhost:${PORT}/ && echo up || echo down`] });
      if ((await ping.stdout()).trim() === "up") return;
      await new Promise((r) => setTimeout(r, 250));
    }
    throw new Error("Preview server did not start");
  }

  async readFile(path: string) {
    const buf = await this.sandbox.readFileToBuffer({ path, cwd: ROOT });
    return buf ? buf.toString("utf8") : null;
  }

  async writeFile(path: string, content: string) {
    await this.sandbox.writeFiles([{ path: `${ROOT}/${path}`, content }]);
  }

  async deleteFile(path: string) {
    await this.sandbox.runCommand({ cmd: "rm", args: ["-f", "--", path], cwd: ROOT });
  }

  async listFiles() {
    const res = await this.sandbox.runCommand({ cmd: "find", args: ["src", "public", "-type", "f"], cwd: ROOT });
    return (await res.stdout()).split("\n").map((s) => s.trim()).filter(Boolean).sort();
  }

  async runBuild(): Promise<BuildResult> {
    const started = Date.now();
    const res = await this.sandbox.runCommand({ cmd: "npm", args: ["run", "build", "--silent"], cwd: ROOT });
    const output = `${await res.stdout()}\n${await res.stderr()}`.trim();
    return { ok: res.exitCode === 0, output: tail(output, 6000), durationMs: Date.now() - started };
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
    if (stale.length) await this.sandbox.runCommand({ cmd: "rm", args: ["-f", "--", ...stale], cwd: ROOT });
    const entries = Object.entries(files).filter(([p]) => isVersionedPath(p));
    if (entries.length) await this.sandbox.writeFiles(entries.map(([path, content]) => ({ path: `${ROOT}/${path}`, content })));
  }

  async stop() {
    await this.sandbox.stop();
  }
}

function tail(text: string, max: number) {
  return text.length > max ? text.slice(-max) : text;
}
