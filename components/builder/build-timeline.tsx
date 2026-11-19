"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { SECTION_TYPES, type SectionType } from "@/lib/agent/progress";
import { announcedStep, stepLabels } from "./timeline-label";

export type TimelineKey = "understand" | "plan" | "write" | "check" | "fix" | "finish" | "save" | "ready";
export interface Timeline {
  steps: { key: TimelineKey; done: boolean }[];
  edits: number;
  /** Site sections the AI is writing, in order (from the streamed tool input). */
  sections: SectionType[];
  startedAt: number;
}

/** A fresh timeline for a request sent now. */
export const startTimeline = (now: number): Timeline => ({ steps: [{ key: "understand", done: false }], edits: 0, sections: [], startedAt: now });

/**
 * What the AI is doing right now, step by step, with a running clock. Only fixed step labels and
 * whitelisted section names: the model's own text (working notes such as colour checks) never shows.
 */
export function BuildTimeline({ t, timeline }: { t: Messages["builder"]; timeline: Timeline }) {
  const [now, setNow] = useState(() => timeline.startedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.round((now - timeline.startedAt) / 1000));
  const label = stepLabels(t, timeline);
  // Screen readers hear only the step, once when it changes (not section names or streamed text).
  const announced = announcedStep(t, timeline);

  return (
    <div role="group" aria-label={t.tlTitle} className="msg-in relative flex w-full max-w-[90%] shrink-0 flex-col gap-3 self-start overflow-hidden rounded-2xl rounded-bl-sm border border-line bg-white px-4 pt-4 pb-3 shadow-sm">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-sunken">
        <span className="progress-slide block h-full w-1/3 rounded-full bg-ink" />
      </span>
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold">{t.tlTitle}</p>
        <span className="text-sm tabular-nums text-ink-muted" aria-hidden="true">{t.tlElapsed.replace("{s}", String(seconds))}</span>
      </div>
      <p role="status" className="sr-only">
        {announced}
      </p>
      <ol aria-live="off" className="flex flex-col gap-2">
        {timeline.steps.map((s, i) => (
          <li key={`${s.key}-${i}`} className="flex items-center gap-3">
            <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-ink text-white" : "bg-sunken text-ink"}`}>
              {s.done ? <Check className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
            </span>
            <span className={s.done ? "text-ink-muted" : "font-medium text-ink"}>
              {label[s.key]}
              {s.key === "write" && timeline.edits > 1 && <span className="text-ink-muted"> · {t.tlEdits.replace("{n}", String(timeline.edits))}</span>}
              <span className="sr-only">{s.done ? ` (${t.tlDone})` : ` (${t.tlNow})`}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

type ProgressEvent = { type: string; name?: string; ok?: boolean };
const KNOWN_SECTIONS = new Set<string>(SECTION_TYPES);
/** Only the template's section types become names on screen; anything else is dropped. */
const isSection = (name?: string): name is SectionType => typeof name === "string" && KNOWN_SECTIONS.has(name);
const isEdit = (name?: string) => name === "write_file" || name === "search_replace";

/**
 * Advances the timeline from the agent's real progress events (no timers): understanding until
 * the model starts, planning while it thinks or writes text first, writing (with the sections
 * it is writing) from the moment a file edit starts streaming, checking while the site builds,
 * fixing after a failed build, finishing up when the budget is nearly used, saving, ready.
 */
export function nextTimeline(tl: Timeline, event: ProgressEvent): Timeline {
  const steps = tl.steps.map((s) => ({ ...s }));
  const has = (key: TimelineKey) => steps.some((s) => s.key === key);
  const open = (key: TimelineKey) => steps.some((s) => s.key === key && !s.done);
  const finish = (...keys: TimelineKey[]) => steps.forEach((s) => keys.includes(s.key) && (s.done = true));
  const start = (key: TimelineKey) => {
    if (!open(key)) steps.push({ key, done: false });
  };
  let { edits, sections } = tl;
  switch (event.type) {
    case "text":
    case "plan":
      finish("understand");
      // Only before any work: the closing reply is not planning.
      if (!has("write") && !has("check")) start("plan");
      break;
    case "tool_start":
      finish("understand", "plan");
      if (event.name === "run_build") {
        finish("write", "fix");
        start("check");
      } else if (isEdit(event.name) && !open("fix") && !open("finish") && !open("check")) start("write");
      break;
    case "section":
      if (!isSection(event.name)) break;
      finish("understand", "plan");
      if (!sections.includes(event.name)) sections = [...sections, event.name];
      if (!open("fix") && !open("finish") && !open("check")) start("write");
      break;
    case "tool":
      // The call already ran; its step started when it began streaming.
      finish("understand", "plan");
      if (isEdit(event.name)) {
        edits += 1;
        if (!has("write")) start("write");
      } else if (event.name === "run_build" && !open("check")) {
        finish("write", "fix");
        start("check");
      }
      break;
    case "build":
      finish("check");
      if (!event.ok) start("fix");
      break;
    case "wrap_up":
      finish("understand", "plan", "write");
      start("finish");
      break;
    case "saving":
      steps.forEach((s) => (s.done = true));
      start("save");
      break;
    case "done":
      steps.forEach((s) => (s.done = true));
      if (edits > 0) steps.push({ key: "ready", done: true });
      break;
  }
  // Nothing visible changed (most streamed text): the same object, so memoized views skip a render.
  const same = edits === tl.edits && sections === tl.sections && steps.length === tl.steps.length && steps.every((s, i) => s.key === tl.steps[i]!.key && s.done === tl.steps[i]!.done);
  return same ? tl : { ...tl, steps, edits, sections };
}
