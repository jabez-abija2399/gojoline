import { MemoryWorkspace } from "@/lib/agent/workspace";
import { isVersionedPath } from "@/lib/template/files";
import type { SandboxProvider, SiteSandbox } from "./types";

/**
 * In-process stand-in for tests and e2e: no real build or preview. Builds "fail" when
 * src/site.ts contains the marker BROKEN so failure paths can be exercised.
 */
export class MemorySandboxProvider implements SandboxProvider {
  private sandboxes = new Map<string, MemorySiteSandbox>();
  constructor(private starter: Record<string, string>) {}

  async open(projectId: string, files: Record<string, string> | null): Promise<SiteSandbox> {
    let sb = this.sandboxes.get(projectId);
    if (!sb) {
      sb = new MemorySiteSandbox(projectId, { ...this.starter });
      this.sandboxes.set(projectId, sb);
    }
    if (files) await sb.restoreFiles(files);
    return sb;
  }
}

class MemorySiteSandbox extends MemoryWorkspace implements SiteSandbox {
  constructor(
    readonly id: string,
    files: Record<string, string>,
  ) {
    super(files, (f) => (f.get("src/site.json")?.includes("BROKEN") ? { ok: false, output: "site.name: broken" } : { ok: true, output: "" }));
  }
  get previewUrl() {
    return `about:blank#${this.id}`;
  }
  async snapshotFiles() {
    return Object.fromEntries([...this.files].filter(([p]) => isVersionedPath(p)));
  }
  async restoreFiles(files: Record<string, string>) {
    for (const p of [...this.files.keys()]) if (isVersionedPath(p) && !(p in files)) this.files.delete(p);
    for (const [p, c] of Object.entries(files)) if (isVersionedPath(p)) this.files.set(p, c);
  }
  async stop() {}
  readonly assets = new Map<string, Buffer>();
  async writeAssets(files: { path: string; data: Buffer }[]) {
    for (const f of files) this.assets.set(f.path, f.data);
  }
  async buildForPublish(env: Record<string, string>) {
    const build = await this.runBuild();
    if (!build.ok) return { ...build, files: [] };
    const name = /"en": "([^"]*)"/.exec(this.files.get("src/site.json") ?? "")?.[1] ?? "Site";
    const html = `<!doctype html><html lang="en"><head><title>${name.replace(/[<>&"]/g, "")}</title><script type="module" src="/assets/index-test.js"></script></head><body><h1>${name.replace(/[<>&"]/g, "")}</h1><a href="${env.VITE_REPORT_URL ?? ""}">Report</a></body></html>`;
    return { ...build, files: [{ path: "index.html", data: Buffer.from(html) }, { path: "assets/index-test.js", data: Buffer.from("console.log(1)") }] };
  }
}
