/**
 * What the preview area shows.
 * - building: a first build is running and nothing is saved yet. The sandbox would only show the
 *   generic starter template, which owners took for their site (or someone else's), so it stays hidden.
 * - failed: that first build failed or stopped; the recovery message, still no template.
 * - live: the site (a saved version: the owner's own, or the template they picked).
 * - loading / error / empty: opening the preview of a saved site, it failed to open, or nothing yet.
 * - paused: building is paused (no sandbox), so no preview opens; nothing failed.
 */
export type PreviewView = "building" | "failed" | "live" | "loading" | "error" | "empty" | "paused";

export interface PreviewState {
  /** Building is paused: no sandbox, no preview. */
  paused?: boolean;
  /** At least one saved version (a first build that finished, or a chosen template). */
  hasVersion: boolean;
  /** The AI is working on a request. */
  working: boolean;
  /** The latest first build ended without a site (failed, stopped or the connection dropped). */
  firstBuildFailed: boolean;
  url: string | null;
  loading: boolean;
  error: boolean;
}

export function previewView(s: PreviewState): PreviewView {
  if (s.paused) return "paused";
  if (!s.hasVersion) {
    if (s.working) return "building";
    return s.firstBuildFailed ? "failed" : "empty";
  }
  if (s.url) return "live";
  if (s.loading || s.working) return "loading";
  return s.error ? "error" : "empty";
}
