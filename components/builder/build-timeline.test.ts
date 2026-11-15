import { describe, expect, it } from "vitest";
import { nextTimeline, type Timeline } from "./build-timeline";

describe("build timeline", () => {
  it("follows the agent: understand, write, check, fix, check, ready", () => {
    let tl: Timeline = { steps: [{ key: "understand", done: false }], edits: 0, startedAt: 0 };
    for (const e of [
      { type: "text" },
      { type: "tool", name: "write_file" },
      { type: "tool", name: "search_replace" },
      { type: "tool", name: "run_build" },
      { type: "build", ok: false },
      { type: "tool", name: "search_replace" },
      { type: "tool", name: "run_build" },
      { type: "build", ok: true },
      { type: "done" },
    ])
      tl = nextTimeline(tl, e);
    expect(tl.steps.map((s) => s.key)).toEqual(["understand", "write", "check", "fix", "check", "ready"]);
    expect(tl.steps.every((s) => s.done)).toBe(true);
    expect(tl.edits).toBe(3);
  });

  it("a plain answer shows no 'preview ready'", () => {
    const tl = nextTimeline(nextTimeline({ steps: [{ key: "understand", done: false }], edits: 0, startedAt: 0 }, { type: "text" }), { type: "done" });
    expect(tl.steps.map((s) => s.key)).toEqual(["understand"]);
  });
});
