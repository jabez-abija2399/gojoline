import type { SiteSandbox } from "./types";

/**
 * A SiteSandbox whose sandbox is still starting. The agent's first model call runs while the
 * sandbox boots; tool calls wait for it. Cuts time-to-first-token on a cold sandbox.
 */
export class LazySiteSandbox implements SiteSandbox {
  constructor(
    private ready: Promise<SiteSandbox>,
    readonly id: string,
  ) {
    // Avoid an unhandled rejection if nothing awaits before it fails.
    ready.catch(() => undefined);
  }
  get previewUrl(): string {
    throw new Error("Use sandbox() to read the preview URL");
  }
  sandbox() {
    return this.ready;
  }
  async readFile(path: string) {
    return (await this.ready).readFile(path);
  }
  async writeFile(path: string, content: string) {
    return (await this.ready).writeFile(path, content);
  }
  async deleteFile(path: string) {
    return (await this.ready).deleteFile(path);
  }
  async listFiles() {
    return (await this.ready).listFiles();
  }
  async runBuild() {
    return (await this.ready).runBuild();
  }
  async snapshotFiles() {
    return (await this.ready).snapshotFiles();
  }
  async restoreFiles(files: Record<string, string>) {
    return (await this.ready).restoreFiles(files);
  }
  async stop() {
    return (await this.ready).stop();
  }
}
