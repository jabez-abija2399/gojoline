"use client";

import Image from "next/image";
import { memo, useEffect, useMemo, useState } from "react";
import { Check, FileCode2, Loader2, Lock, Send, Sparkles } from "lucide-react";
import type { Messages } from "@/lib/i18n";

type Live = Messages["landing"]["live"];
interface Site {
  id: string;
  name: string;
  prompt: string;
  shot: { src: string; width: number; height: number };
}

/** When each moment of a build happens (ms from the start). */
const TYPED = 1100;
const THOUGHT = 1800;
const REPLIED = 3200;
const STEP_MS = 850;
const STEPS = 6;
const READY = REPLIED + STEPS * STEP_MS + 200;
const BOOKED = READY + 700;
/** The whole build is done: what the first view (and reduced motion) shows. */
export const BUILD_DONE = BOOKED + 1;
/** A build plus a moment to look at the result, before the next business. */
export const BUILD_CYCLE_MS = BOOKED + 3200;
/** Which files each step "edits", as the real agent does (src/site.json, src/styles.css). */
const FILES: (string | null)[] = ["styles.css", "site.json", "site.json", "site.json", "site.json", null];

/**
 * Inside the hero's frame: Gojoline building a site, the way it really happens. The owner's
 * message types in, Gojoline answers, the build steps tick one by one with the files they
 * change, and the site fills in on the phone as each part is done. Then it's ready to
 * publish and a booking arrives. Every `run` plays it again; run 0 shows it finished.
 */
export function BoxLiveBuild({ site, live, you, assistant, publish, booking, run, slug, priority }: { site: Site; live: Live; you: string; assistant: string; publish: string; booking: { title: string; body: string }; run: number; slug: string; priority: boolean }) {
  const [ms, setMs] = useState(BUILD_DONE);
  useEffect(() => {
    if (run === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // One state change per moment (not per frame): cheap on a slow phone.
    const moments = [0, TYPED, THOUGHT, REPLIED, ...Array.from({ length: STEPS }, (_, i) => REPLIED + (i + 1) * STEP_MS), READY, BOOKED, BUILD_DONE];
    const timers = moments.map((at) => setTimeout(() => setMs(at), at));
    return () => timers.forEach(clearTimeout);
  }, [run]);

  const done = ms >= READY;
  const stepsDone = Math.max(0, Math.min(STEPS, Math.floor((ms - REPLIED) / STEP_MS)));
  const working = ms >= REPLIED && !done ? stepsDone : -1;
  const reply = live.reply.replace("{name}", site.name);

  const status = (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${done ? "border border-lagoon text-lagoon" : "bg-sunken text-ink-muted"}`}>
      {done ? <span className="size-1.5 rounded-full bg-lagoon" /> : <Loader2 className="size-3 animate-spin" />}
      {done ? live.ready : live.building}
    </span>
  );

  const stepList = (compact: boolean) => (
    <ol className="flex flex-col gap-1.5">
      {live.steps.map((label, i) => {
        if (compact && i !== Math.min(stepsDone, STEPS - 1)) return null;
        const state = i < stepsDone ? "done" : i === working ? "now" : "todo";
        if (!compact && state === "todo" && ms < REPLIED) return null;
        return (
          <li key={label} className={`flex flex-wrap items-center gap-x-2 gap-y-1 transition-opacity ${state === "todo" ? "opacity-40" : "opacity-100"}`}>
            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${state === "done" ? "bg-lagoon text-white" : "border border-line bg-white"}`}>
              {state === "done" ? <Check className="size-3" strokeWidth={3} /> : state === "now" ? <Loader2 className="size-3 animate-spin text-ink" /> : null}
            </span>
            <span className={state === "now" ? "font-medium text-ink" : "text-ink-muted"}>{label}</span>
            {!compact && state !== "todo" && FILES[i] && (
              <span className="inline-flex items-center gap-1 rounded-md bg-sunken px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                <FileCode2 className="size-3" />
                {live.edited} {FILES[i]}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );

  // The phone: the site, with the part not built yet covered by its outline. The cover slides
  // down (a transform: the GPU does it) as each part is done.
  const phone = (
    <div className="relative h-[360px] w-[250px] shrink-0 overflow-hidden rounded-t-[2rem] border-x-[8px] border-t-[8px] border-ink bg-white md:h-[440px] md:w-[280px] lg:h-[470px] lg:w-[296px]">
      <Image src={site.shot.src} alt="" width={site.shot.width} height={site.shot.height} sizes="(min-width: 1024px) 280px, (min-width: 768px) 264px, 234px" priority={priority} className="h-auto w-full" />
      <div className="absolute inset-0 bg-white transition-transform duration-700 ease-out" style={{ transform: `translateY(${(done ? 1 : stepsDone / STEPS) * 100}%)` }}>
        <div className="h-1 bg-[linear-gradient(90deg,transparent,var(--gojo-coral),transparent)] opacity-70" />
        <div className="flex flex-col gap-3 p-4">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-5 w-1/2 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-5/6 rounded" />
          <div className="skeleton mt-1 h-9 w-32 rounded-lg" />
          <div className="skeleton mt-2 h-28 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <div className="skeleton h-16 rounded-lg" />
            <div className="skeleton h-16 rounded-lg" />
          </div>
        </div>
      </div>
      <div className={`absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl border border-line bg-white p-2.5 text-start shadow-lg transition-all duration-500 ${ms >= BOOKED ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-coral-soft text-ink">
          <Send className="size-3.5" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-xs font-semibold">{booking.title}</span>
          <span className="truncate text-xs text-ink-muted">{booking.body}</span>
        </span>
      </div>
    </div>
  );

  return (
    <div aria-hidden="true" className="relative overflow-hidden rounded-2xl border border-ink/10 bg-white text-start text-sm shadow-[0_30px_80px_-30px_rgb(18_18_18/0.45)] md:rounded-b-none md:border-b-0">
      {/* The builder's top bar: the site, its state, Publish. */}
      <div className="flex items-center gap-3 border-b border-line px-3 py-2.5 sm:px-4">
        <span className="flex gap-1.5 max-sm:hidden">
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Lock className="size-3.5 shrink-0 text-ink-muted" />
          <span className="truncate font-medium">{done ? `${slug}.gojoline.site` : site.name}</span>
          {status}
        </span>
        <span className={`rounded-full px-3 py-1 font-medium transition-colors ${done ? "bg-ink text-white" : "bg-sunken text-ink-muted"}`}>{publish}</span>
      </div>
      <div className="grid md:grid-cols-[minmax(0,20rem)_1fr] lg:grid-cols-[minmax(0,23rem)_1fr]">
        {/* The chat: what the owner asked, what Gojoline is doing. */}
        <div className="flex min-h-[30rem] flex-col gap-3 p-4 max-md:hidden md:border-e md:border-line">
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-semibold text-ink-muted">{you}</span>
            <p className="max-w-[92%] rounded-2xl rounded-br-sm bg-ink px-3.5 py-2.5 text-white">
              <Reveal text={site.prompt} from={0} to={TYPED} ms={ms} run={run} />
            </p>
          </div>
          {ms >= TYPED && (
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                <Sparkles className="size-3.5 text-coral" />
                {assistant}
              </span>
              {ms < THOUGHT ? (
                <p className="flex items-center gap-1 text-ink-muted">
                  {live.thinking}
                  <span className="thinking-dots" />
                </p>
              ) : (
                <p className="rounded-2xl rounded-bl-sm bg-paper px-3.5 py-2.5 text-ink">
                  <Reveal text={reply} from={THOUGHT} to={REPLIED} ms={ms} run={run} />
                </p>
              )}
            </div>
          )}
          {ms >= REPLIED && <div className="rounded-2xl border border-line p-3">{stepList(false)}</div>}
          {done && (
            <p className="mt-auto flex items-center gap-2 rounded-xl bg-paper px-3 py-2 font-medium text-ink">
              <span className="flex size-5 items-center justify-center rounded-full bg-lagoon text-white">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {live.readyIn}
            </p>
          )}
        </div>
        {/* The preview: the site filling in. */}
        <div className="relative flex flex-col items-center justify-end bg-paper bg-[radial-gradient(var(--gojo-line)_1px,transparent_1px)] bg-[size:18px_18px] px-4 pt-4 md:flex-row md:items-end md:justify-center md:pt-10">
          {/* Phones: the build log floats over the preview (no room for the chat). */}
          <div className={`mb-3 w-full max-w-[250px] rounded-xl border border-line bg-white p-2.5 shadow-sm md:hidden ${done ? "invisible" : ""}`}>
            {ms < REPLIED ? (
              <p className="flex items-center gap-2 font-medium">
                <Sparkles className="size-4 text-coral" />
                {live.thinking}
                <span className="thinking-dots" />
              </p>
            ) : (
              stepList(true)
            )}
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken">
              <div className="h-full origin-left rounded-full bg-lagoon transition-transform duration-500" style={{ transform: `scaleX(${stepsDone / STEPS})` }} />
            </div>
          </div>
          {phone}
        </div>
      </div>
    </div>
  );
}

/** Text that appears as it's "written" between two moments of the build (whole once done). */
const Reveal = memo(function Reveal({ text, from, to, ms, run }: { text: string; from: number; to: number; ms: number; run: number }) {
  const chars = useMemo(() => [...text], [text]);
  const [n, setN] = useState<number | null>(null);
  const active = run > 0 && ms >= from && ms < to;
  useEffect(() => {
    if (!active || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = requestAnimationFrame(() => setN(0));
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(chars.length, Math.ceil(((now - start) / (to - from)) * chars.length));
      setN(k >= chars.length ? null : k);
      if (k < chars.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, chars, from, to]);
  if (!active || n === null) return <>{text}</>;
  // The whole text keeps its size underneath, so nothing moves while it's written.
  return (
    <span className="relative block">
      <span className="invisible">{text}</span>
      <span className="typing-caret absolute inset-0">{chars.slice(0, n).join("")}</span>
    </span>
  );
});
