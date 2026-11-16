"use client";

import Image from "next/image";
import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import type { PreviewPage } from "@/lib/landing/template-preview";

export interface PreviewLabels {
  pages: string;
  view: string;
  desktop: string;
  phone: string;
  kinds: Record<string, string>;
}

/**
 * The whole template, page by page and section by section, as pictures of the real site.
 * A computer sees the computer layout and a phone the phone layout, until the visitor picks one.
 */
export function TemplatePreviewer({ pages, t }: { pages: PreviewPage[]; t: PreviewLabels }) {
  const [page, setPage] = useState(0);
  const [view, setView] = useState<"auto" | "d" | "m">("auto");
  const current = pages[page] ?? pages[0]!;
  const caption = (kind: string, heading: string, i: number) => (
    <figcaption className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-1 pb-2 text-sm">
      <span className="font-mono text-xs text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
      <span className="font-semibold">{t.kinds[kind] ?? kind}</span>
      {heading && <span className="min-w-0 text-ink-muted">· {heading}</span>}
    </figcaption>
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
              <button key={v} type="button" aria-pressed={on} onClick={() => setView(v)} className={`${button} min-h-10 ${on ? "bg-coral-soft text-ink" : "text-ink-muted hover:text-ink"} ${view === "auto" ? (v === "d" ? "md:bg-coral-soft md:text-ink" : "max-md:bg-coral-soft max-md:text-ink") : ""}`}>
                {v === "d" ? <Monitor aria-hidden="true" className="size-4" /> : <Smartphone aria-hidden="true" className="size-4" />}
                {v === "d" ? t.desktop : t.phone}
              </button>
            );
          })}
        </div>
      </div>

      {/* Computer layout: each section full width, in order. */}
      <ol key={`d${page}`} className="hidden flex-col gap-6 md:flex group-data-[view=d]:flex group-data-[view=m]:hidden">
        {current.parts.map((part, i) => (
          <li key={i}>
            <figure>
              {caption(part.kind, part.heading, i)}
              <Image src={part.d.src} alt="" width={part.d.width} height={part.d.height} unoptimized loading={i < 2 ? "eager" : "lazy"} className="h-auto w-full rounded-xl border border-line bg-sunken shadow-sm" />
            </figure>
          </li>
        ))}
      </ol>

      {/* Phone layout: the same sections at phone width. */}
      <ol key={`m${page}`} className="mx-auto flex w-full max-w-[390px] flex-col gap-6 md:hidden group-data-[view=d]:hidden group-data-[view=m]:flex">
        {current.parts.map((part, i) => (
          <li key={i}>
            <figure>
              {caption(part.kind, part.heading, i)}
              <Image src={part.m.src} alt="" width={part.m.width} height={part.m.height} unoptimized loading={i < 2 ? "eager" : "lazy"} className="h-auto w-full rounded-2xl border border-line bg-sunken shadow-sm" />
            </figure>
          </li>
        ))}
      </ol>
    </div>
  );
}
