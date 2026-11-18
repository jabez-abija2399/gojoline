import { describe, expect, it } from "vitest";
import { EMPTY_MEMORY, INSTALL_SNOOZE_MS, parseMemory, shouldShowInstall } from "./install-rules";

const now = Date.UTC(2026, 10, 16);
const ready = { standalone: false, canPrompt: true, ios: false, busy: false, memory: { ...EMPTY_MEMORY, visits: 2 }, now };

describe("shouldShowInstall", () => {
  it("shows from the second visit, or after the first site, where installing is possible", () => {
    expect(shouldShowInstall(ready)).toBe(true);
    expect(shouldShowInstall({ ...ready, memory: { ...EMPTY_MEMORY, visits: 1 } })).toBe(false);
    expect(shouldShowInstall({ ...ready, memory: { ...EMPTY_MEMORY, visits: 1, goodMoment: true } })).toBe(true);
    expect(shouldShowInstall({ ...ready, canPrompt: false, ios: true })).toBe(true);
    expect(shouldShowInstall({ ...ready, canPrompt: false })).toBe(false);
  });

  it("never shows inside the installed app or while the AI is working", () => {
    expect(shouldShowInstall({ ...ready, standalone: true })).toBe(false);
    expect(shouldShowInstall({ ...ready, busy: true })).toBe(false);
  });

  it("'Not now' hides it for 14 days; installing or answering the prompt hides it for good", () => {
    expect(shouldShowInstall({ ...ready, memory: { ...ready.memory, snoozedUntil: now + INSTALL_SNOOZE_MS } })).toBe(false);
    expect(shouldShowInstall({ ...ready, memory: { ...ready.memory, snoozedUntil: now - 1 } })).toBe(true);
    expect(shouldShowInstall({ ...ready, memory: { ...ready.memory, never: true } })).toBe(false);
    expect(INSTALL_SNOOZE_MS).toBe(14 * 24 * 60 * 60 * 1000);
  });
});

describe("parseMemory", () => {
  it("reads saved memory and survives junk", () => {
    expect(parseMemory(JSON.stringify({ never: true, snoozedUntil: 5, visits: 3, goodMoment: true }))).toEqual({ never: true, snoozedUntil: 5, visits: 3, goodMoment: true });
    expect(parseMemory("{oops")).toEqual(EMPTY_MEMORY);
    expect(parseMemory(null)).toEqual(EMPTY_MEMORY);
    expect(parseMemory(JSON.stringify({ never: "yes", visits: -2, snoozedUntil: "x" }))).toEqual(EMPTY_MEMORY);
  });
});
