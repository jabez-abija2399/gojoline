"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, BedDouble, ChevronDown, ChevronRight, Coffee, Pause, Play, ShoppingBag, Sparkles, Stethoscope, UserRound } from "lucide-react";
import { Mosaic } from "./mosaic";
import { BoxLiveBuild, BUILD_CYCLE_MS, type BuildSite } from "./box-live-build";
import type { Messages } from "@/lib/i18n";
import { LanguageChoice, type SiteLanguages } from "@/components/builder/language-choice";
import { clearLandingPrompt, saveLandingPrompt } from "@/components/builder/start-prompt";
import type { Locale } from "@/lib/i18n/config";

export interface StageSite {
  id: string;
  label: string;
  /** The real example site's name. */
  name: string;
  /** What an owner of this kind of business might write. */
  prompt: string;
  /** Picture of the top of the real site. */
  shot: { src: string; width: number; height: number };
  /** The real template's first sections at computer and phone width (the live build). */
  sections: BuildSite["sections"];
  /** The prompt with its key words in [brackets]: the empty box's example, key words underlined. */
  marked: string;
}

export interface StageText {
  chipsLabel: string;
  promptLabel: string;
  placeholder: string;
  build: string;
  langTitle: string;
  langEn: string;
  langAm: string;
  langBoth: string;
  buildTitle: string;
  buildSteps: string[];
  ready: string;
  publish: string;
  chatPlaceholder: string;
  showcaseLabel: string;
  /** Read to screen readers when a chip is picked. */
  picked: string;
  /** The examples under the prompt box. */
  ideasLabel: string;
  /** The preview size switch in the screen: its group name and the two sizes. */
  previewSizes: string;
  previewPhone: string;
  previewDesktop: string;
  /** The autoplay toggle (a pressed button means paused). */
  pauseDemo: string;
  /** Small cards beside the phone on wide screens. */
  noteTitle: string;
  noteBody: string;
  saved: string;
}

interface Props {
  locale: Locale;
  sites: StageSite[];
  t: StageText;
  /** Background of the showcase (the mosaic), drawn on the server. */
  /** Heading of the prompt section, written on the server. */
  /** A link under the showcase (to all the templates). */
  more: React.ReactNode;
  promptHeading: React.ReactNode;
  /** What follows the prompt box (the note, the install button). */
  promptFooter: React.ReactNode;
  /** The last chip: every template ("More"). */
  moreChip: { href: string; label: string };
  live: Messages["landing"]["live"];
  you: string;
  assistant: string;
  /** Phones: the picker that replaces the row of chips. */
  chooseLabel: string;
  /** Has a session cookie: the description goes straight to "Your sites" (no sign-in page). */
  signedIn?: boolean;
}

/**
 * The top of the landing page that reacts to the visitor: pick a kind of business, see the
 * real builder with a real site for it, and the prompt box below is filled in ready to build.
 * The description waits while the visitor signs in, then their first site starts building.
 */
/** Example addresses for the demo businesses (the same in both languages; addresses are Latin). */
const EXAMPLE_SLUGS: Record<string, string> = { cafe: "bole-buna", hotel: "tana-lodge", clinic: "tena-clinic", shop: "habesha-style", personal: "hana-bekele" };

const SITE_ICONS = { cafe: Coffee, hotel: BedDouble, clinic: Stethoscope, shop: ShoppingBag, personal: UserRound } as const;


export function LandingStage({ locale, sites, t, more, promptHeading, promptFooter, moreChip, chooseLabel, live, you, assistant, signedIn = false }: Props) {
  // The next business waits for the live build to finish.
  const cycleMs = BUILD_CYCLE_MS;
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  // The demo plays by itself while it is on screen, until the visitor takes over or pauses it.
  const [auto, setAuto] = useState(false);
  // Once autoplay has started, the pause/play control stays (until the visitor picks a business).
  const [autoStarted, setAutoStarted] = useState(false);
  // Bumped to re-arm the timer (after the tab comes back, or when the demo comes back into view).
  const [tick, setTick] = useState(0);
  const [inView, setInView] = useState(false);
  // How many times the picture changed: the first view is still, every change animates.
  const [shown, setShown] = useState(0);
  const figureRef = useRef<HTMLElement>(null);
  const [text, setText] = useState("");
  const [languages, setLanguages] = useState<SiteLanguages>([locale]);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  // A description from an earlier visit to this page is dropped: only this visit's counts.
  useEffect(clearLandingPrompt, []);

  // Autoplay only for people who haven't asked for less motion, and only while it can be seen.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Data saver or a slow connection: no autoplay (each business is a new picture).
    const conn = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || /(^|-)2g|3g/.test(conn?.effectiveType ?? "")) return;
    // Starts once the page has finished loading (no animation work while it starts up).
    const begin = () => {
      setAuto(true);
      setAutoStarted(true);
      // The live build plays for the business on screen first.
      setShown((n) => n + 1);
    };
    let id: ReturnType<typeof setTimeout> | undefined;
    const onLoad = () => (id = setTimeout(begin, 1500));
    if (document.readyState === "complete") onLoad();
    else addEventListener("load", onLoad, { once: true });
    const el = figureRef.current;
    const io = el ? new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), { threshold: 0.15 }) : null;
    if (el) io?.observe(el);
    return () => {
      clearTimeout(id);
      removeEventListener("load", onLoad);
      io?.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!auto || !inView) return;
    // Fetch the next business's picture a second early, so it's there when it swaps in.
    const nextShot = sites[(index + 1) % sites.length]!.sections[0]?.d ?? sites[(index + 1) % sites.length]!.shot;
    const early = setTimeout(() => {
      const img = new window.Image();
      img.src = `/_next/image?url=${encodeURIComponent(nextShot.src)}&w=640&q=75`;
    }, cycleMs - 1200);
    const id = setTimeout(() => {
      // A hidden tab waits; the timer starts again (full length) when it is shown.
      if (document.hidden) {
        const back = () => {
          document.removeEventListener("visibilitychange", back);
          setTick((n) => n + 1);
        };
        document.addEventListener("visibilitychange", back);
        return;
      }
      setIndex((i) => (i + 1) % sites.length);
      setShown((n) => n + 1);
    }, cycleMs);
    return () => {
      clearTimeout(id);
      clearTimeout(early);
    };
  }, [auto, inView, index, sites, tick, cycleMs]);
  const site = sites[index]!;
  const next = `/${locale}/build`;
  const pick = (i: number) => {
    setAuto(false);
    setIndex(i);
    setPicked(i);
    setShown((n) => n + 1);
    // Never replace the visitor's own words: only an empty box or an earlier example.
    if (!text.trim() || sites.some((x) => x.prompt === text)) setText(sites[i]!.prompt);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-5 md:gap-6">
        <div className="flex w-full items-center justify-center gap-2 px-4 sm:px-0">
          {/* Phones: one picker, as on the product sites this page learns from. */}
          <label className="relative flex min-h-12 w-full max-w-xs items-center gap-3 rounded-full border border-line bg-white ps-2 pe-10 shadow-sm sm:hidden has-[select:focus-visible]:outline has-[select:focus-visible]:outline-3 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-link">
            {(() => {
              const Icon = SITE_ICONS[site.id as keyof typeof SITE_ICONS] ?? Sparkles;
              return (
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-coral text-on-coral">
                  <Icon className="size-4" />
                </span>
              );
            })()}
            <span className="sr-only">{chooseLabel}</span>
            <select value={index} onChange={(e) => pick(Number(e.target.value))} className="absolute inset-0 w-full cursor-pointer appearance-none rounded-full bg-transparent ps-12 pe-10 font-medium text-ink focus-visible:outline-none">
              {sites.map((s, i) => (
                <option key={s.id} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-3 size-4 text-ink-muted" />
          </label>
          <div role="group" aria-label={t.chipsLabel} className="flex flex-wrap items-center justify-center gap-2 max-sm:hidden">
            <span aria-hidden="true" className="shrink-0 pe-1 font-medium text-ink">
              {t.chipsLabel}
            </span>
            {sites.map((s, i) => {
              const Icon = SITE_ICONS[s.id as keyof typeof SITE_ICONS] ?? Sparkles;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={i === index}
                  onClick={() => pick(i)}
                  className="relative inline-flex min-h-11 shrink-0 items-center gap-2 overflow-hidden rounded-full border border-line bg-white ps-3 pe-4 font-medium text-ink transition-colors hover:border-faint aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  {s.label}
                  {auto && i === index && (
                    <span key={`bar-${shown}-${tick}-${inView}`} aria-hidden="true" className="chip-progress absolute inset-x-0 bottom-0 h-[3px] origin-left bg-white/70" style={{ animationDuration: `${cycleMs}ms`, animationPlayState: inView ? "running" : "paused" }} />
                  )}
                </button>
              );
            })}
            <Link href={moreChip.href} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white ps-4 pe-3 font-medium text-ink transition-colors hover:border-faint">
              {moreChip.label}
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          {/* Moving content that runs longer than five seconds can be paused (WCAG 2.2.2).
              In the page from the start (so nothing moves when it appears); invisible until autoplay begins. */}
          <button type="button" title={t.pauseDemo} onClick={() => setAuto((a) => !a)} aria-pressed={!auto} className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken hover:text-ink max-sm:size-11 ${autoStarted && picked === null ? "" : "invisible"}`}>
            {auto ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
            <span className="sr-only">{t.pauseDemo}</span>
          </button>
        </div>

        {/* The real builder, drawn with its own pieces: the chat on the left, a real site on the right. */}
        <div className="w-full px-4 sm:px-0">
        <p role="status" className="sr-only">
          {picked === null ? "" : t.picked.replace("{name}", site.name)}
        </p>
        <figure ref={figureRef} aria-label={t.showcaseLabel.replace("{name}", site.name)} className="relative w-full">
          <BoxLiveBuild site={site} live={live} you={you} assistant={assistant} publish={t.publish} booking={{ title: t.noteTitle, body: t.noteBody }} run={shown} slug={EXAMPLE_SLUGS[site.id] ?? "my-site"} priority={index === 0} sizes={{ group: t.previewSizes, phone: t.previewPhone, desktop: t.previewDesktop }} onInteract={() => setAuto(false)} />
        </figure>
        </div>
        {more}
      </div>

      {/* "What does your business need?": one large box over a soft mosaic, as the reference does. */}
      <section aria-labelledby="start-title" className="below-fold relative isolate overflow-hidden border-t border-line px-4 py-20 sm:px-6 md:py-28">
        <Mosaic className="fill-coral opacity-[0.18]" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 h-2/3 bg-[linear-gradient(to_bottom,transparent,var(--gojo-paper))]" />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
          {promptHeading}
          <div className="w-full rounded-[30px] border border-line bg-paper p-1.5 shadow-[0_24px_70px_-28px_rgb(18_18_18/0.35)]">
            <form
              action={signedIn ? next : `/${locale}/sign-in`}
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) saveLandingPrompt({ text, languages });
                router.push(signedIn ? next : `/${locale}/sign-in?next=${next}`);
              }}
              className="flex w-full min-w-0 flex-col rounded-3xl border border-line bg-white p-2 text-start has-[textarea:focus-visible]:outline has-[textarea:focus-visible]:outline-3 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-link"
            >
              <input type="hidden" name="next" value={next} />
              <label htmlFor="hero-prompt" className="sr-only">
                {t.promptLabel}
              </label>
              <div className="relative">
                {/* The empty box shows an example in an owner's words, its key words underlined. */}
                {!text && (
                  <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 px-4 pt-4 text-lg text-ink-muted">
                    {site.marked.split(/(\[[^\]]+\])/).map((part, i) =>
                      part.startsWith("[") ? (
                        <span key={i} className="text-ink underline decoration-coral decoration-2 underline-offset-4">
                          {part.slice(1, -1)}
                        </span>
                      ) : (
                        part
                      ),
                    )}
                  </p>
                )}
                <textarea
                  ref={boxRef}
                  id="hero-prompt"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
                  }}
                  rows={3}
                  maxLength={4000}
                  placeholder={t.placeholder}
                  className="relative block max-h-56 min-h-32 w-full resize-none rounded-2xl bg-transparent px-4 pt-4 pb-2 text-lg [field-sizing:content] placeholder:text-transparent focus-visible:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 p-1">
                <LanguageChoice compact title={t.langTitle} labels={{ en: t.langEn, am: t.langAm, both: t.langBoth }} value={languages} onChange={setLanguages} name="hero-languages" />
                <button type="submit" className="group ms-auto inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-coral ps-5 pe-2 text-lg font-semibold text-on-coral transition hover:bg-coral-hover max-sm:w-full">
                  {t.build}
                  <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-ink text-white transition-transform group-hover:-translate-y-0.5">
                    <ArrowUp className="size-4" strokeWidth={3} />
                  </span>
                </button>
              </div>
            </form>
            {/* Examples to start from, in the tray under the box. */}
            <ul aria-label={t.ideasLabel} className="chips-scroll flex gap-2 overflow-x-auto px-2 pt-2 pb-1 sm:flex-wrap sm:justify-center">
              {sites.map((s) => {
                const Icon = SITE_ICONS[s.id as keyof typeof SITE_ICONS] ?? Sparkles;
                return (
                  <li key={s.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setText(s.prompt);
                        boxRef.current?.focus();
                      }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-sm font-medium text-ink transition-colors hover:border-faint hover:bg-sunken lg:min-h-9"
                    >
                      <Icon aria-hidden="true" className="size-4 text-ink-muted" />
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex flex-col items-center gap-4">
            {promptFooter}
          </div>
        </div>
      </section>
    </>
  );
}
