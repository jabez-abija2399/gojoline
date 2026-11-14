import type { Workspace } from "@/lib/agent/workspace";

/** A running copy of one project's site, with a live preview. */
export interface SiteSandbox extends Workspace {
  readonly id: string;
  /** HTTPS URL of the live preview (dev server with hot reload). */
  readonly previewUrl: string;
  /** Text files under src/ (and text files under public/), for saving a version. */
  snapshotFiles(): Promise<Record<string, string>>;
  /** Replaces the project's editable files with a saved version. */
  restoreFiles(files: Record<string, string>): Promise<void>;
  stop(): Promise<void>;
}

export interface SandboxProvider {
  /**
   * Opens (or resumes) the sandbox for a project. `files` is the latest saved version;
   * null starts from the template's starter site.
   */
  open(projectId: string, files: Record<string, string> | null): Promise<SiteSandbox>;
}
