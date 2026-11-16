"use client";

import Image from "next/image";
import { useRef, useState, useSyncExternalStore } from "react";
import { Lock, Maximize2, Monitor, Smartphone } from "lucide-react";
import type { PreviewPage } from "@/lib/landing/template-preview";

export interface PreviewLabels {
  pages: string;
  view: string;
  desktop: string;
  phone: string;
  /** "{page} · {n} sections" */
  pageHeading: string;
  fullSize: string;
  /** "Example address", read before the address bar's text. */
  address: string;
  /** "Sections on this page" */
  sectionsLabel: string;
  /** "{page} page, scroll to see it all" */
  screenLabel: string;
  kinds: Record<string, string>;
}

const WIDE = "(min-width: 1024px)";
const subscribe = (cb: () => void) => {
  const mq = matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * The whole template, page by page and section by section, as pictures of the real site.
 * A large screen sees the computer layout and a phone or tablet the phone layout, until the visitor picks one;
 * any section opens full size in a new tab. The computer layout sits in a browser window and the
 * phone layout in a phone, both showing the address the site would have.
 */
export function TemplatePreviewer({ pages, host, t }: { pages: PreviewPage[]; /** "bole-buna-house.gojoline.site", or null to leave the bar empty */ host: string | null; t: PreviewLabels }) {
  const [page, setPage] = useState(0);
  const [view, setView] = useState<"auto" | "d" | "m">("auto");
  // Until the visitor picks, a large screen shows the computer layout and a smaller one the phone layout.
  const wide = useSyncExternalStore(subscribe, () => matchMedia(WIDE).matches, () => false);
  const shown = view === "auto" ? (wide ? "d" : "m") : view;
  const current = pages[page] ?? pages[0]!;
  const sections = current.parts.filter((x) => x.kind !== "footer").length;
  const address = host ? `${host}${current.path === "/" ? "" : current.path}` : null;
  // Without an address we own, the bar stays as an empty, decorative shape.
  const addressBar = (size: string) =>
    address ? (
      <p className={`flex min-w-0 items-center gap-1.5 rounded-full border border-line bg-white text-ink-muted ${size}`}>
        <Lock aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="sr-only">{t.address}: </span>
        <span className="truncate">{address}</span>
      </p>
    ) : (
      <span aria-hidden="true" className={`block rounded-full border border-line bg-white ${size}`} />
    );
  const caption = (part: PreviewPage["parts"][number], i: number) => (
    <figcaption className="sr-only">
      <span className="flex items-baseline gap-2">
        <span className="text-xs text-ink-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
        <span className="font-semibold">{t.kinds[part.kind] ?? part.kind}</span>
        {part.heading && (
          <span aria-hidden="true" className="text-ink-muted max-sm:hidden">
            ·
          </span>
        )}
      </span>
      {part.heading && <span className="min-w-0 text-ink-muted">{part.heading}</span>}
      {part.summary && <span className="sr-only">{part.summary}</span>}
    </figcaption>
  );
  /** Only the phone's first section loads at once (phones are most visitors); the rest, and every computer picture, load when near. */
  const picture = (size: { src: string; width: number; height: number }, first: { eager: boolean; high: boolean }, rounded: string) => (
    <a href={size.src} target="_blank" rel="noopener" className="group/pic relative block">
      <Image src={size.src} alt="" width={size.width} height={size.height} unoptimized loading={first.eager ? "eager" : "lazy"} fetchPriority={first.high ? "high" : undefined} className={`block h-auto w-full bg-sunken ${rounded}`} />
      <span className="absolute end-2 bottom-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-medium text-ink shadow-sm opacity-90 transition group-hover/pic:opacity-100">
        <Maximize2 aria-hidden="true" className="size-3.5" />
        {t.fullSize}
      </span>
    </a>
  );
  const screens = useRef<Record<"d" | "m", HTMLDivElement | null>>({ d: null, m: null });
  /** Scrolls the visible screen to section i (only inside the screen, never the page). */
  const jump = (i: number) => {
    const box = screens.current[shown];
    const target = box?.querySelector<HTMLElement>(`[data-part="${i}"]`);
    if (box && target) box.scrollTo({ top: target.offsetTop, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  /** The page as one continuous site inside a device screen; scrolls by itself and with the keyboard. */
  const screen = (v: "d" | "m", height: string) => (
    <div
      ref={(el) => {
        screens.current[v] = el;
      }}
      key={`${v}${page}`}
      tabIndex={0}
      role="region"
      aria-label={t.screenLabel.replace("{page}", current.title)}
      className={`relative overflow-y-auto overscroll-contain bg-sunken ${height}`}
    >
      {current.parts.map((part, i) => (
        <figure key={i} data-part={i} className="relative m-0">
          {caption(part, i)}
          {picture(v === "d" ? part.d : part.m, v === "d" ? { eager: false, high: i === 0 } : { eager: i === 0, high: i === 0 }, "")}
        </figure>
      ))}
    </div>
  );
  const button = "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition";
  return (
    <div data-view={view} className="group flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {pages.length > 1 && (
          <div role="group" aria-label={t.pages} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {pages.map((p, i) => (
              <button key={i} type="button" aria-pressed={i === page} onClick={() => setPage(i)} className={`${button} shrink-0 border ${i === page ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-faint"}`}>
                {p.title}
              </button>
            ))}
          </div>
        )}
        <div role="group" aria-label={t.view} className="flex w-fit gap-1 rounded-full border border-line bg-white p-1">
          {(["d", "m"] as const).map((v) => {
            const on = view === v;
            return (
              <button key={v} type="button" aria-pressed={shown === v} onClick={() => setView(v)} className={`${button} min-h-10 ${on ? "bg-coral-soft text-ink" : "text-ink-muted hover:text-ink"} ${view === "auto" ? (v === "d" ? "lg:bg-coral-soft lg:text-ink" : "max-lg:bg-coral-soft max-lg:text-ink") : ""}`}>
                {v === "d" ? <Monitor aria-hidden="true" className="size-4" /> : <Smartphone aria-hidden="true" className="size-4" />}
                {v === "d" ? t.desktop : t.phone}
              </button>
            );
          })}
        </div>
      </div>

      <h2 aria-live="polite" className="text-xl font-semibold">
        {t.pageHeading.replace("{page}", current.title).replace("{n}", String(sections))}
      </h2>

      {/* Computer layout: a monitor with a browser window; the page scrolls inside the screen like the real site. */}
      <div data-frame="browser" className="hidden min-w-0 lg:block group-data-[view=d]:block group-data-[view=m]:hidden">
        <div className="mx-auto max-w-[1080px]">
          <div className="relative rounded-[1.25rem] bg-device p-2 shadow-xl sm:p-3">
            <span aria-hidden="true" className="absolute top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white/25 sm:top-1.5" />
            <div className="overflow-hidden rounded-md bg-paper">
              <div className="flex items-center gap-3 border-b border-line bg-paper px-3 py-2 sm:px-4">
                <span aria-hidden="true" className="flex shrink-0 gap-1.5">
                  <span className="size-2.5 rounded-full bg-line" />
                  <span className="size-2.5 rounded-full bg-line" />
                  <span className="size-2.5 rounded-full bg-line" />
                </span>
                {addressBar("min-h-8 flex-1 px-3 text-sm sm:mx-auto sm:max-w-md")}
                <span aria-hidden="true" className="w-[2.625rem] shrink-0 max-sm:hidden" />
              </div>
              {screen("d", "h-[clamp(18rem,58vh,40rem)]")}
            </div>
          </div>
          <div aria-hidden="true" className="mx-auto h-8 w-24 bg-device opacity-90 [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)] sm:h-10 sm:w-32" />
          <div aria-hidden="true" className="mx-auto h-2.5 w-56 rounded-full bg-device shadow-md sm:w-72" />
        </div>
      </div>

      {/* Phone layout: a phone with a camera notch and side buttons; the page scrolls inside its screen. */}
      <div data-frame="phone" className="mx-auto w-full max-w-[340px] lg:hidden group-data-[view=d]:hidden group-data-[view=m]:block">
        <div className="relative rounded-[3rem] bg-device p-2.5 shadow-xl">
          <span aria-hidden="true" className="absolute top-24 -left-1 h-10 w-1 rounded-l bg-device" />
          <span aria-hidden="true" className="absolute top-36 -left-1 h-14 w-1 rounded-l bg-device" />
          <span aria-hidden="true" className="absolute top-32 -right-1 h-20 w-1 rounded-r bg-device" />
          <div className="relative overflow-hidden rounded-[2.5rem] bg-paper">
            <span aria-hidden="true" className="absolute top-2 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-device" />
            <div className="flex flex-col items-center bg-paper px-4 pt-10 pb-2">{addressBar("min-h-7 w-full justify-center px-3 text-xs")}</div>
            {screen("m", "h-[min(34rem,70vh)]")}
            <div aria-hidden="true" className="flex justify-center bg-paper py-2">
              <span className="h-1 w-28 rounded-full bg-device/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Every section of this page: tap one to jump to it inside the screen. */}
      <ol aria-label={t.sectionsLabel} className="grid gap-2 sm:grid-cols-2">
        {current.parts.map((part, i) => (
          <li key={i}>
            <button type="button" onClick={() => jump(i)} className="flex min-h-11 w-full items-start gap-2 rounded-xl border border-line bg-white px-3 py-2 text-start text-sm transition hover:border-faint">
              <span className="text-xs text-ink-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className="font-semibold">{t.kinds[part.kind] ?? part.kind}</span>
                {part.heading && <span className="block text-ink-muted">{part.heading}</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
