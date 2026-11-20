import { describe, expect, it } from "vitest";
import { previewView, type PreviewState } from "./preview-view";

const base: PreviewState = { hasVersion: false, working: false, firstBuildFailed: false, url: null, loading: false, error: false };
const url = "https://sb-1.vercel.run";

describe("what the preview area shows", () => {
  it("a first build in progress with nothing saved shows the placeholder, even once the sandbox has a URL", () => {
    expect(previewView({ ...base, working: true })).toBe("building");
    expect(previewView({ ...base, working: true, url })).toBe("building");
    expect(previewView({ ...base, working: true, url, loading: true })).toBe("building");
  });

  it("a saved version shows the live preview, also while a later edit runs", () => {
    expect(previewView({ ...base, hasVersion: true, url })).toBe("live");
    expect(previewView({ ...base, hasVersion: true, url, working: true })).toBe("live");
  });

  it("a site started from a template shows it at once (its template version is saved)", () => {
    expect(previewView({ ...base, hasVersion: true, loading: true })).toBe("loading");
    expect(previewView({ ...base, hasVersion: true, url })).toBe("live");
  });

  it("a first build that failed or stopped shows the recovery message, never the template", () => {
    expect(previewView({ ...base, firstBuildFailed: true, url })).toBe("failed");
  });

  it("nothing asked yet, or a plain answer: the empty state, not the template", () => {
    expect(previewView(base)).toBe("empty");
    expect(previewView({ ...base, url })).toBe("empty");
  });

  it("a saved site whose preview could not open shows the error", () => {
    expect(previewView({ ...base, hasVersion: true, error: true })).toBe("error");
  });

  it("says paused while building is paused, whatever else is going on (never the retry error)", () => {
    for (const hasVersion of [true, false]) for (const error of [true, false]) expect(previewView({ paused: true, hasVersion, working: false, firstBuildFailed: false, url: null, loading: true, error })).toBe("paused");
  });
});
