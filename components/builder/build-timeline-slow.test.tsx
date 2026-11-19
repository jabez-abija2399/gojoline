// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { en } from "@/lib/i18n/messages/en";
import { am } from "@/lib/i18n/messages/am";
import { BuildTimeline, nextTimeline, SLOW_STEP_MS, startTimeline } from "./build-timeline";

describe("a long step", () => {
  beforeEach(() => vi.useFakeTimers({ now: 0 }));
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each([en, am])("says the AI is still working after 15 s, announced once in the status line", (m) => {
    const t = m.builder;
    const writing = nextTimeline(startTimeline(0), { type: "tool_start", name: "write_file" });
    const { rerender } = render(<BuildTimeline t={t} timeline={writing} />);
    expect(screen.getByRole("status").textContent).toBe(t.tlWriting);
    act(() => vi.advanceTimersByTime(SLOW_STEP_MS - 2000));
    expect(screen.queryByText(t.tlSlow, { selector: "p:not([role])" })).toBeNull();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole("status").textContent).toBe(t.tlSlow);
    expect(screen.getByText(t.tlSlow, { selector: "p:not([role])" })).toBeTruthy();
    // A new step starts its own clock: the note goes and the new step is announced.
    rerender(<BuildTimeline t={t} timeline={nextTimeline(writing, { type: "tool_start", name: "run_build" })} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("status").textContent).toBe(t.tlChecking);
    expect(screen.queryByText(t.tlSlow, { selector: "p:not([role])" })).toBeNull();
  });
});
