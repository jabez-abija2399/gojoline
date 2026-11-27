"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import type { Timeline } from "./build-timeline";
import type { Device } from "./preview-panel";
import { currentStep, stepLabels } from "./timeline-label";

interface Props {
  t: Messages["builder"];
  device: Device;
  timeline: Timeline | null;
  /** The real site has loaded underneath: fade out. */
  fading: boolean;
}

/**
 * Shown in the device frame during a first build instead of the sandbox (which would only show the
 * starter template): the outline of a site, the step the AI is on, and how long it has taken.
 */
export function BuildPlaceholder({ t, device, timeline, fading }: Props) {
  const startedAt = timeline?.startedAt ?? null;
  // The clock stops when the request ends (the site may still be loading underneath).
  const running = !fading && !!timeline?.steps.some((s) => !s.done);
  const [now, setNow] = useState(() => startedAt ?? 0);
  useEffect(() => {
    if (startedAt === null || !running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt, running]);
  const seconds = startedAt === null ? 0 : Math.max(0, Math.round((now - startedAt) / 1000));
  const step = timeline && currentStep(timeline);
  const label = timeline && step ? stepLabels(t, timeline)[step] : t.tlUnderstand;

  return (
    <div
      data-testid="build-placeholder"
      role="group"
      aria-label={t.tlTitle}
      className={`absolute inset-0 z-10 flex flex-col overflow-hidden bg-white transition-opacity duration-500 ${fading ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <span aria-hidden="true" className="block h-1 shrink-0 overflow-hidden bg-sunken">
        <span className="progress-slide block h-full w-1/3 rounded-full bg-ink" />
      </span>
      <div aria-hidden="true" className="min-h-0 flex-1 overflow-hidden">
        {device === "desktop" ? <DesktopOutline /> : <PhoneOutline />}
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-4 flex justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white px-4 py-3 text-center shadow-lg">
          <p className="font-medium text-ink [overflow-wrap:anywhere]">
            {label}
            <span aria-hidden="true">…</span>
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            <span className="tabular-nums">{format(t.tlElapsed, { s: seconds })}</span>
            <span aria-hidden="true"> · </span>
            {t.previewUsually}
          </p>
        </div>
      </div>
    </div>
  );
}

/** One grey shape; neighbours start their soft pulse a little later, so it ripples down the page. */
function Bone({ className, i = 0 }: { className: string; i?: number }) {
  const style: CSSProperties = { animationDelay: `${i * 120}ms` };
  return <div className={`skeleton ${className}`} style={style} />;
}

export function PhoneOutline() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Bone className="h-6 w-24 rounded-full" />
        <Bone className="size-8 rounded-lg" i={1} />
      </div>
      <Bone className="h-44 w-full rounded-2xl" i={2} />
      <Bone className="h-7 w-4/5 rounded-lg" i={3} />
      <Bone className="h-4 w-full rounded" i={4} />
      <Bone className="h-4 w-2/3 rounded" i={4} />
      <Bone className="h-11 w-36 rounded-xl" i={5} />
      <div className="grid grid-cols-2 gap-3">
        <Bone className="h-24 rounded-xl" i={6} />
        <Bone className="h-24 rounded-xl" i={7} />
        <Bone className="h-24 rounded-xl" i={8} />
        <Bone className="h-24 rounded-xl" i={9} />
      </div>
    </div>
  );
}

export function DesktopOutline() {
  return (
    <div className="flex flex-col gap-10 px-8 py-5">
      <div className="flex items-center justify-between gap-6">
        <Bone className="h-7 w-32 rounded-full" />
        <div className="flex items-center gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Bone key={i} className="h-3 w-14 rounded-full" i={i} />
          ))}
          <Bone className="h-10 w-28 rounded-full" i={5} />
        </div>
      </div>
      <div className="grid grid-cols-2 items-center gap-10">
        <div className="flex flex-col gap-4">
          <Bone className="h-9 w-4/5 rounded-lg" i={2} />
          <Bone className="h-9 w-3/5 rounded-lg" i={3} />
          <Bone className="h-4 w-full rounded" i={4} />
          <Bone className="h-4 w-2/3 rounded" i={4} />
          <Bone className="mt-2 h-12 w-40 rounded-xl" i={5} />
        </div>
        <Bone className="h-64 rounded-2xl" i={3} />
      </div>
      <div className="flex flex-col items-center gap-6">
        <Bone className="h-6 w-56 rounded-lg" i={6} />
        <div className="grid w-full grid-cols-3 gap-5">
          {[7, 8, 9].map((i) => (
            <Bone key={i} className="h-40 rounded-2xl" i={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
