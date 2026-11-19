import { describe, expect, it } from "vitest";
import { nextTimeline, startTimeline, type Timeline } from "./build-timeline";

const run = (events: { type: string; name?: string; ok?: boolean }[], tl: Timeline = startTimeline(0)) => events.reduce(nextTimeline, tl);
const keys = (tl: Timeline) => tl.steps.map((s) => `${s.key}${s.done ? "" : "*"}`);

describe("build timeline", () => {
  it("advances with the agent's real events of a first build, in the order the loop sends them", () => {
    let tl = startTimeline(0);
    tl = nextTimeline(tl, { type: "plan" });
    expect(keys(tl)).toEqual(["understand", "plan*"]);
    tl = run([{ type: "tool_start", name: "write_file" }, { type: "section", name: "hero" }, { type: "section", name: "menu" }, { type: "section", name: "gallery" }], tl);
    expect(keys(tl)).toEqual(["understand", "plan", "write*"]);
    expect(tl.sections).toEqual(["hero", "menu", "gallery"]);
    // The build call starts streaming before the write has run: checking starts, writing is done.
    tl = run([{ type: "tool_start", name: "run_build" }, { type: "tool", name: "write_file" }, { type: "tool", name: "run_build" }], tl);
    expect(keys(tl)).toEqual(["understand", "plan", "write", "check*"]);
    expect(tl.edits).toBe(1);
    tl = run([{ type: "build", ok: true }, { type: "plan" }, { type: "saving" }], tl);
    expect(keys(tl)).toEqual(["understand", "plan", "write", "check", "save*"]);
    tl = nextTimeline(tl, { type: "done" });
    expect(keys(tl)).toEqual(["understand", "plan", "write", "check", "save", "ready"]);
  });

  it("names only the template's section types; raw model text is dropped", () => {
    const tl = run([
      { type: "tool_start", name: "write_file" },
      { type: "section", name: "#B85C7A (contrast vs #FCF7F6…)" },
      { type: "section", name: "menu" },
      { type: "section", name: "constructor" },
      { type: "section", name: "" },
    ]);
    expect(tl.sections).toEqual(["menu"]);
  });

  it("goes straight to writing when the model starts with a tool, and through a fix", () => {
    const tl = run([
      { type: "tool_start", name: "search_replace" },
      { type: "tool_start", name: "run_build" },
      { type: "tool", name: "search_replace" },
      { type: "tool", name: "run_build" },
      { type: "build", ok: false },
      { type: "tool_start", name: "search_replace" },
      { type: "tool_start", name: "run_build" },
      { type: "tool", name: "search_replace" },
      { type: "tool", name: "run_build" },
      { type: "build", ok: true },
      { type: "done" },
    ]);
    expect(keys(tl)).toEqual(["understand", "write", "check", "fix", "check", "ready"]);
    expect(tl.edits).toBe(2);
  });

  it("shows finishing up when the budget is nearly used", () => {
    const tl = run([{ type: "tool_start", name: "write_file" }, { type: "tool", name: "write_file" }, { type: "wrap_up" }, { type: "tool_start", name: "search_replace" }]);
    expect(keys(tl)).toEqual(["understand", "write", "finish*"]);
  });

  it("still works with only executed-tool events (older servers)", () => {
    const tl = run([{ type: "plan" }, { type: "tool", name: "write_file" }, { type: "tool", name: "run_build" }, { type: "build", ok: true }, { type: "done" }]);
    expect(keys(tl)).toEqual(["understand", "plan", "write", "check", "ready"]);
  });

  it("returns the same timeline when nothing visible changed (streamed text)", () => {
    const tl = run([{ type: "plan" }, { type: "text" }]);
    expect(nextTimeline(tl, { type: "text" })).toBe(tl);
    expect(nextTimeline(tl, { type: "section", name: "menu" })).not.toBe(tl);
  });

  it("a plain answer shows no 'preview ready'", () => {
    const tl = run([{ type: "plan" }, { type: "text" }, { type: "done" }]);
    expect(keys(tl)).toEqual(["understand", "plan"]);
  });
});
