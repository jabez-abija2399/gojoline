import type { SandboxProvider } from "./types";

/** Thrown when something tries to open a sandbox while building is paused. */
export class BuildingPausedError extends Error {
  constructor() {
    super("building is paused: no sandbox is configured");
    this.name = "BuildingPausedError";
  }
}

/**
 * Building paused (docs/DECISIONS.md 2026-11-19): the app runs, owners see their sites and
 * dashboards, but no sandbox is configured, so nothing can build. Callers check `paused`
 * first; this only guards anything that slips through.
 */
export class PausedSandboxProvider implements SandboxProvider {
  async open(): Promise<never> {
    throw new BuildingPausedError();
  }
}
