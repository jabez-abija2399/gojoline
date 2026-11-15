// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearLandingPrompt, clearStartPrompt, saveLandingPrompt, saveStartPrompt, takeLandingPrompt, takeStartPrompt } from "./start-prompt";

describe("start prompt", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it("is handed over once", () => {
    saveStartPrompt({ text: "  Selam Coffee  ", languages: ["en", "am"] });
    expect(takeStartPrompt()).toEqual({ text: "Selam Coffee", languages: ["en", "am"] });
    expect(takeStartPrompt()).toBeNull();
  });

  it("can be dropped before it is used", () => {
    saveStartPrompt({ text: "Selam Coffee", languages: ["en"] });
    clearStartPrompt();
    expect(takeStartPrompt()).toBeNull();
  });

  it("landing prompt: read once, kept apart from the start prompt, gone after 5 minutes", () => {
    saveLandingPrompt({ text: "Kaldi Books", languages: ["am"] });
    expect(takeStartPrompt()).toBeNull();
    expect(takeLandingPrompt()).toEqual({ text: "Kaldi Books", languages: ["am"] });
    expect(takeLandingPrompt()).toBeNull();
    saveLandingPrompt({ text: "Kaldi Books", languages: ["am"] });
    clearLandingPrompt();
    expect(takeLandingPrompt()).toBeNull();
    vi.useFakeTimers();
    saveLandingPrompt({ text: "Kaldi Books", languages: ["am"] });
    vi.advanceTimersByTime(5 * 60_000 + 1000);
    expect(takeLandingPrompt()).toBeNull();
  });

  it("ignores an old prompt", () => {
    vi.useFakeTimers();
    saveStartPrompt({ text: "Selam Coffee", languages: ["en"] });
    vi.advanceTimersByTime(31_000);
    expect(takeStartPrompt()).toBeNull();
  });

  it("ignores anything that isn't a prompt", () => {
    for (const raw of ["not json", "null", JSON.stringify({ text: 5, at: Date.now() }), JSON.stringify({ text: "x", languages: ["fr"], at: Date.now() }), JSON.stringify({ text: " ", languages: ["en"], at: Date.now() })]) {
      sessionStorage.setItem("gojoline:start", raw);
      expect(takeStartPrompt()).toBeNull();
    }
  });

  it("keeps only known languages and caps the length", () => {
    sessionStorage.setItem("gojoline:start", JSON.stringify({ text: "a".repeat(5000), languages: ["am", "fr", "am"], at: Date.now() }));
    const start = takeStartPrompt();
    expect(start?.languages).toEqual(["am"]);
    expect(start?.text).toHaveLength(4000);
  });
});
