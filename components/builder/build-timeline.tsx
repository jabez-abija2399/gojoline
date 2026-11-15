"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";

export type TimelineKey = "understand" | "write" | "check" | "fix" | "ready";
export interface Timeline {
  steps: { key: TimelineKey; done: boolean }[];
  edits: number;
  startedAt: number;
}

/** What the AI is doing right now, step by step, with a running clock. */
export function BuildTimeline({ t, timeline, streamText }: { t: Messages["builder"]; timeline: Timeline; streamText: string }) {
  const [now, setNow] = useState(() => timeline.startedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.round((now - timeline.startedAt) / 1000));
  const label: Record<TimelineKey, string> = { understand: t.tlUnderstand, write: t.tlWriting, check: t.tlChecking, fix: t.tlFixing, ready: t.tlReady };

  return (
    <div role="status" className="flex max-w-[90%] flex-col gap-3 self-start rounded-2xl rounded-bl-sm border border-line bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold">{t.tlTitle}</p>
        <span className="text-sm tabular-nums text-ink-muted" aria-hidden="true">{t.tlElapsed.replace("{s}", String(seconds))}</span>
      </div>
      <ol className="flex flex-col gap-2">
        {timeline.steps.map((s) => (
          <li key={s.key} className="flex items-center gap-3">
            <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-teal text-white" : "bg-teal-soft text-teal"}`}>
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
      {streamText && <p className="whitespace-pre-wrap border-t border-line pt-3 text-ink">{streamText}</p>}
    </div>
  );
}

/** Advances the timeline from the agent's progress events. */
export function nextTimeline(tl: Timeline, event: { type: string; name?: string; ok?: boolean }): Timeline {
  const steps = tl.steps.map((s) => ({ ...s }));
  const finish = (key: TimelineKey) => steps.forEach((s) => s.key === key && (s.done = true));
  const start = (key: TimelineKey) => {
    if (!steps.some((s) => s.key === key && !s.done)) steps.push({ key, done: false });
  };
  let edits = tl.edits;
  if (event.type === "text") finish("understand");
  if (event.type === "tool") {
    finish("understand");
    if (event.name === "run_build") {
      finish("write");
      finish("fix");
      start("check");
    } else if (event.name === "write_file" || event.name === "search_replace") {
      edits += 1;
      if (!steps.some((s) => s.key === "fix" && !s.done)) start("write");
    }
  }
  if (event.type === "build") {
    finish("check");
    if (!event.ok) start("fix");
  }
  if (event.type === "done") {
    steps.forEach((s) => (s.done = true));
    if (edits > 0) steps.push({ key: "ready", done: true });
  }
  return { ...tl, steps, edits };
}
