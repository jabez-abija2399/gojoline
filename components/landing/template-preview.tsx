"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { Maximize2, Monitor, Smartphone } from "lucide-react";
import type { PreviewPage } from "@/lib/landing/template-preview";

export interface PreviewLabels {
  pages: string;
  view: string;
  desktop: string;
  phone: string;
  /** "{page} · {n} sections" */
  pageHeading: string;
  fullSize: string;
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
 * any section opens full size in a new tab.
 */
export function TemplatePreviewer({ pages, t }: { pages: PreviewPage[]; t: PreviewLabels }) {
  const [page, setPage] = useState(0);
  const [view, setView] = useState<"auto" | "d" | "m">("auto");
  // Until the visitor picks, a large screen shows the computer layout and a smaller one the phone layout.
  const wide = useSyncExternalStore(subscribe, () => matchMedia(WIDE).matches, () => false);
  const shown = view === "auto" ? (wide ? "d" : "m") : view;
  const current = pages[page] ?? pages[0]!;
  const sections = current.parts.filter((x) => x.kind !== "footer").length;
  const caption = (part: PreviewPage["parts"][number], i: number) => (
    <figcaption className="flex flex-col gap-0.5 px-1 pb-2 text-sm sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
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
  const picture = (size: { src: string; width: number; height: number }, i: number, rounded: string) => (
    <a href={size.src} target="_blank" rel="noopener" className="group/pic relative block">
      <Image src={size.src} alt="" width={size.width} height={size.height} unoptimized loading={i < 2 ? "eager" : "lazy"} className={`h-auto w-full border border-line bg-sunken shadow-sm ${rounded}`} />
      <span className="absolute end-2 bottom-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-medium text-ink shadow-sm opacity-90 transition group-hover/pic:opacity-100">
        <Maximize2 aria-hidden="true" className="size-3.5" />
        {t.fullSize}
      </span>
    </a>
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

      {/* Computer layout: each section full width, in order. */}
      <ol key={`d${page}`} className="hidden flex-col gap-6 lg:flex group-data-[view=d]:flex group-data-[view=m]:hidden">
        {current.parts.map((part, i) => (
          <li key={i}>
            <figure>
              {caption(part, i)}
              {picture(part.d, i, "rounded-xl")}
            </figure>
          </li>
        ))}
      </ol>

      {/* Phone layout: the same sections at phone width. */}
      <ol key={`m${page}`} className="mx-auto flex w-full max-w-[390px] flex-col gap-6 lg:hidden group-data-[view=d]:hidden group-data-[view=m]:flex">
        {current.parts.map((part, i) => (
          <li key={i}>
            <figure>
              {caption(part, i)}
              {picture(part.m, i, "rounded-2xl")}
            </figure>
          </li>
        ))}
      </ol>
    </div>
  );
}
