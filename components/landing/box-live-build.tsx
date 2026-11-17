"use client";

import Image from "next/image";
import { memo, useEffect, useMemo, useState } from "react";
import { Check, FileCode2, Loader2, Lock, Monitor, Send, Smartphone, Sparkles } from "lucide-react";
import type { Messages } from "@/lib/i18n";

type Live = Messages["landing"]["live"];
type Size = { src: string; width: number; height: number };
export interface BuildSite {
  id: string;
  name: string;
  prompt: string;
  /** The real template's first sections, at computer (d) and phone (m) width. */
  sections: { d: Size; m: Size }[];
}

/** When each moment of a build happens (ms from the start). */
const TYPED = 1100;
const THOUGHT = 1800;
const REPLIED = 3200;
const STEP_MS = 900;
const STEPS = 6;
const READY = REPLIED + STEPS * STEP_MS + 200;
const BOOKED = READY + 700;
/** The whole build is done: what the first view (and reduced motion) shows. */
export const BUILD_DONE = BOOKED + 1;
/** A build plus a moment to look at the result, before the next business. */
export const BUILD_CYCLE_MS = BOOKED + 3400;
/** Which files each step "edits", as the real agent does (src/site.json, src/styles.css). */
const FILES: (string | null)[] = ["styles.css", "site.json", "site.json", "site.json", "site.json", null];
/** The step that checks the site on a phone: from then on the preview shows phone width. */
const PHONE_STEP = 5;

interface Props {
  site: BuildSite;
  live: Live;
  you: string;
  assistant: string;
  publish: string;
  booking: { title: string; body: string };
  /** Each change plays the build again; 0 shows it finished. */
  run: number;
  slug: string;
  priority: boolean;
  /** The preview's phone / computer switch, which visitors can press. */
  sizes: { group: string; phone: string; desktop: string };
  /** A visitor pressed something in the screen: stop the demo moving on, so they can look. */
  onInteract: () => void;
}

/**
 * Gojoline building a site, the way it really happens: the owner's message types in,
 * Gojoline answers, the build steps tick with the files they change, and the real site
 * appears section by section in the preview, at computer width and then at phone width.
 * Large screens see it on a computer screen; phones see it on a phone.
 */
export function BoxLiveBuild(props: Props) {
  const { run } = props;
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
  // A section appears as each of "home page", "prices" and "booking form" is done.
  const built = done ? 99 : Math.max(0, stepsDone - 1);
  // A finished first view shows computer width; a live build ends on the phone check.
  // A visitor's own choice wins until the next build starts.
  const [choice, setChoice] = useState<{ run: number; view: "m" | "d" } | null>(null);
  const autoPhone = run > 0 && (working >= PHONE_STEP || done);
  const phoneView = choice && choice.run === run ? choice.view === "m" : autoPhone;
  const choose = (view: "m" | "d") => {
    setChoice({ run, view });
    props.onInteract();
  };
  const state = { ...props, ms, done, stepsDone, working, built, phoneView, choose };

  return (
    <>
      <MonitorView {...state} />
      <PhoneView {...state} />
    </>
  );
}

/** True once the window's load event has fired (false during server render and hydration). */
function usePageLoaded(enabled: boolean) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const done = () => setLoaded(true);
    if (document.readyState === "complete") {
      const t = setTimeout(done, 0);
      return () => clearTimeout(t);
    }
    window.addEventListener("load", done, { once: true });
    return () => window.removeEventListener("load", done);
  }, [enabled]);
  return loaded;
}

type State = Props & { ms: number; done: boolean; stepsDone: number; working: number; built: number; phoneView: boolean; choose: (view: "m" | "d") => void };

/** The real site, section by section: built ones show, the rest are their outline. The column
 *  scrolls (a transform) to follow the newest section while it's being built. */
/** `first`: how the first picture loads ("preload" for the visible device's main picture). `animate`: fade new
 *  sections in (only during a live build; the first view is simply there, for a fast first paint). */
function SiteSections({ site, width, built, follow, first, animate }: { site: BuildSite; width: "d" | "m"; built: number; follow: boolean; first: "preload" | "lazy"; animate: boolean }) {
  const ratios = site.sections.map((s) => (s[width].height / s[width].width) * 100);
  // How far down the newest built section starts, in percent of the column's width.
  const newest = Math.min(built, site.sections.length) - 1;
  const offset = follow && newest > 0 ? ratios.slice(0, newest).reduce((a, b) => a + b, 0) * 0.7 : 0;
  // With a preloaded first picture, the ones below it wait for the page to finish loading, so on
  // a slow phone the first picture gets the whole connection (they sit below the phone's fold).
  const pageLoaded = usePageLoaded(first === "preload");
  return (
    <div className="h-full overflow-hidden [container-type:inline-size]">
      <div className="transition-transform duration-700 ease-out" style={{ transform: `translateY(calc(${-offset} * 1cqw))` }}>
        {site.sections.map((s, i) => {
          const pic = s[width];
          const shown = i < built && (i === 0 || first !== "preload" || pageLoaded);
          return (
            <div key={`${site.id}-${width}-${i}`} className="relative overflow-hidden" style={{ aspectRatio: `${pic.width} / ${pic.height}` }}>
              <div className={`absolute inset-0 flex flex-col gap-3 bg-white p-[6%] transition-opacity duration-500 ${shown ? "opacity-0" : "opacity-100"}`}>
                <div className={`skeleton h-[8%] w-2/3 rounded ${shown ? "[animation-play-state:paused]" : ""}`} />
                <div className={`skeleton h-[5%] w-1/2 rounded ${shown ? "[animation-play-state:paused]" : ""}`} />
                <div className={`skeleton h-[40%] w-full rounded-lg ${shown ? "[animation-play-state:paused]" : ""}`} />
              </div>
              {shown && (
                <Image
                  src={pic.src}
                  alt=""
                  width={pic.width}
                  height={pic.height}
                  sizes={width === "d" ? "(min-width: 1280px) 640px, 50vw" : "260px"}
                  priority={i === 0 && first === "preload"}
                  fetchPriority={i === 0 && first === "preload" ? "high" : undefined}
                  loading={i === 0 && first === "preload" ? undefined : "lazy"}
                  className={`relative h-auto w-full ${animate ? "animate-[rise-in_0.5s_ease-out]" : ""}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Status({ live, done }: { live: Live; done: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${done ? "border border-lagoon text-lagoon" : "bg-sunken text-ink-muted"}`}>
      {done ? <span className="size-1.5 rounded-full bg-lagoon" /> : <Loader2 className="size-3 animate-spin" />}
      {done ? live.ready : live.building}
    </span>
  );
}

function Steps({ live, stepsDone, working, ms, compact }: { live: Live; stepsDone: number; working: number; ms: number; compact: boolean }) {
  return (
    <ol className="flex flex-col gap-1">
      {live.steps.map((label, i) => {
        if (compact && i !== Math.min(stepsDone, STEPS - 1)) return null;
        const s = i < stepsDone ? "done" : i === working ? "now" : "todo";
        if (!compact && s === "todo" && ms < REPLIED) return null;
        return (
          <li key={label} className={`flex items-center gap-1.5 ${s === "todo" ? "opacity-40" : ""}`}>
            <span className={`flex size-4 shrink-0 items-center justify-center rounded-full ${s === "done" ? "bg-lagoon text-white" : "border border-line bg-white"}`}>
              {s === "done" ? <Check className="size-2.5" strokeWidth={3} /> : s === "now" ? <Loader2 className="size-2.5 animate-spin" /> : null}
            </span>
            <span className={`min-w-0 truncate ${s === "now" ? "font-medium text-ink" : "text-ink-muted"}`}>{label}</span>
            {!compact && s !== "todo" && FILES[i] && (
              <span className="ms-auto hidden shrink-0 items-center gap-1 rounded bg-sunken px-1 py-px font-mono text-[11px] text-ink-muted @[19rem]:inline-flex">
                <FileCode2 className="size-2.5" />
                {FILES[i]}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Toast({ booking, show }: { booking: Props["booking"]; show: boolean }) {
  return (
    <div className={`absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl border border-line bg-white p-2 text-start shadow-lg transition-all duration-500 ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-coral-soft text-ink">
        <Send className="size-3" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-[11px] font-semibold">{booking.title}</span>
        <span className="truncate text-[11px] text-ink-muted">{booking.body}</span>
      </span>
    </div>
  );
}

/** Large screens: a computer screen on its stand, with the Gojoline builder on it. */
function MonitorView({ site, live, you, assistant, publish, booking, run, slug, ms, done, stepsDone, working, built, phoneView, choose, sizes }: State) {
  const reply = live.reply.replace("{name}", site.name);
  return (
    <div className="mx-auto flex w-[min(100%,88rem,calc((100svh-10rem)*1.65))] min-w-[44rem] flex-col items-center max-md:hidden">
      <div className="w-full rounded-[1.6rem] bg-device p-3 pb-4 shadow-[0_40px_90px_-40px_rgb(18_18_18/0.6)]">
        <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-[0.8rem] bg-white text-start text-[13px] leading-snug xl:text-sm">
          <div aria-hidden="true" className="flex items-center gap-2 border-b border-line px-3 py-2">
            <span className="flex gap-1">
              <span className="size-2 rounded-full bg-line" />
              <span className="size-2 rounded-full bg-line" />
              <span className="size-2 rounded-full bg-line" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <Lock className="size-3 shrink-0 text-ink-muted" />
              <span className="truncate font-medium">{done ? `${slug}.gojoline.site` : site.name}</span>
              <Status live={live} done={done} />
            </span>
            <span className={`rounded-full px-2.5 py-0.5 font-medium ${done ? "bg-ink text-white" : "bg-sunken text-ink-muted"}`}>{publish}</span>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-[34%_1fr]">
            <div aria-hidden="true" className="@container flex min-h-0 flex-col gap-2 overflow-hidden border-e border-line p-3">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xs font-semibold text-ink-muted">{you}</span>
                <p className="max-w-[95%] rounded-xl rounded-br-sm bg-ink px-2.5 py-2 text-white">
                  <Reveal text={site.prompt} from={0} to={TYPED} ms={ms} run={run} />
                </p>
              </div>
              {ms >= TYPED && (
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink-muted">
                    <Sparkles className="size-3.5 text-coral" />
                    {assistant}
                  </span>
                  {ms < THOUGHT ? (
                    <p className="text-ink-muted">
                      {live.thinking}
                      <span className="thinking-dots" />
                    </p>
                  ) : (
                    <p className="rounded-xl rounded-bl-sm bg-paper px-2.5 py-2">
                      <Reveal text={reply} from={THOUGHT} to={REPLIED} ms={ms} run={run} />
                    </p>
                  )}
                </div>
              )}
              {ms >= REPLIED && (
                <div className="rounded-xl border border-line p-2">
                  <Steps live={live} stepsDone={stepsDone} working={working} ms={ms} compact={false} />
                </div>
              )}
              {done && (
                <p className="mt-auto flex items-center gap-1.5 rounded-lg bg-paper px-2 py-1.5 font-medium">
                  <Check className="size-3.5 text-lagoon" strokeWidth={3} />
                  {live.readyIn}
                </p>
              )}
            </div>
            {/* The preview, with the builder's own phone / computer switch. */}
            <div className="flex min-h-0 flex-col bg-paper">
              <div role="group" aria-label={sizes.group} className="flex items-center justify-center gap-1 border-b border-line py-1">
                {(["m", "d"] as const).map((v) => {
                  const on = (v === "m") === phoneView;
                  const Icon = v === "m" ? Smartphone : Monitor;
                  const label = v === "m" ? sizes.phone : sizes.desktop;
                  return (
                    <button key={v} type="button" aria-pressed={on} title={label} onClick={() => choose(v)} className={`flex size-9 items-center justify-center rounded-lg transition-colors ${on ? "bg-ink text-white" : "text-ink-muted hover:bg-sunken hover:text-ink"}`}>
                      <Icon aria-hidden="true" className="size-4" />
                      <span className="sr-only">{label}</span>
                    </button>
                  );
                })}
              </div>
              <div aria-hidden="true" className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(var(--gojo-line)_1px,transparent_1px)] bg-[size:16px_16px] p-3">
                {phoneView ? (
                  <div key="m" className="mx-auto h-full w-[38%] min-w-[9rem] animate-[pop-in_0.4s_ease-out] overflow-hidden rounded-[1.1rem] border-[5px] border-device bg-white">
                    <SiteSections site={site} width="m" built={built} follow={false} first="lazy" animate={run > 0} />
                  </div>
                ) : (
                  <div key="d" className="h-full overflow-hidden rounded-md border border-line bg-white shadow-sm">
                    <SiteSections site={site} width="d" built={built} follow={!done} first="lazy" animate={run > 0} />
                  </div>
                )}
                <Toast booking={booking} show={ms >= BOOKED && run > 0} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* The stand. */}
      <div aria-hidden="true" className="h-10 w-32 bg-device [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)]" />
      <div aria-hidden="true" className="h-2.5 w-72 rounded-full bg-device/90 shadow-[0_8px_20px_-6px_rgb(18_18_18/0.5)]" />
    </div>
  );
}

/** Phones: the same build on a phone. The step on top, the site filling in below. */
function PhoneView({ site, live, publish, booking, run, slug, priority, ms, done, stepsDone, working, built }: State) {
  return (
    <div aria-hidden="true" className="mx-auto w-[min(17.5rem,78vw)] md:hidden">
      <div className="rounded-[2.2rem] bg-device p-2 shadow-[0_30px_70px_-30px_rgb(18_18_18/0.6)]">
        <div className="relative flex h-[min(30rem,calc(100svh-19rem))] min-h-[20rem] flex-col overflow-hidden rounded-[1.7rem] bg-white text-start text-xs">
          <div className="flex items-center gap-1.5 border-b border-line px-3 pt-3 pb-2">
            <span className="min-w-0 flex-1 truncate font-semibold">{done ? `${slug}.gojoline.site` : site.name}</span>
            <Status live={live} done={done} />
          </div>
          <div className={`border-b border-line px-3 py-2 ${done ? "hidden" : ""}`}>
            {ms < REPLIED ? (
              <p className="flex items-center gap-1.5 font-medium">
                <Sparkles className="size-3.5 text-coral" />
                {live.thinking}
                <span className="thinking-dots" />
              </p>
            ) : (
              <Steps live={live} stepsDone={stepsDone} working={working} ms={ms} compact />
            )}
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sunken">
              <div className="h-full origin-left rounded-full bg-lagoon transition-transform duration-500" style={{ transform: `scaleX(${stepsDone / STEPS})` }} />
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <SiteSections site={site} width="m" built={built} follow={!done} first={priority ? "preload" : "lazy"} animate={run > 0} />
          </div>
          <div className={`flex items-center justify-end border-t border-line px-3 py-2 ${done ? "" : "hidden"}`}>
            <span className="rounded-full bg-ink px-3 py-1 font-medium text-white">{publish}</span>
          </div>
          <Toast booking={booking} show={ms >= BOOKED && run > 0} />
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
