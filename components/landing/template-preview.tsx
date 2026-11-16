"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import type { PreviewPage } from "@/lib/landing/template-preview";

export interface PreviewLabels {
  pages: string;
  view: string;
  desktop: string;
  phone: string;
  /** "{name}, live" (the frame's accessible name) */
  liveTitle: string;
  openTab: string;
  hint: string;
}

const WIDE = "(min-width: 1024px)";

/**
 * The template's real site, running: scroll it, tap it, change pages and language inside it.
 * In a computer window on large screens and a phone frame on small ones, until the visitor picks.
 */
export function TemplatePreviewer({ name, pages, t }: { name: string; pages: PreviewPage[]; t: PreviewLabels }) {
  const [page, setPage] = useState(0);
  const [view, setView] = useState<"auto" | "d" | "m">("auto");
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = matchMedia(WIDE);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const shown = view === "auto" ? (wide ? "d" : "m") : view;
  const src = pages[page]?.src ?? pages[0]!.src;
  const button = "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition";
  const frame = (
    <iframe
      key={src}
      src={src}
      title={t.liveTitle.replace("{name}", name)}
      className="block size-full border-0 bg-white"
    />
  );
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {pages.length > 1 && (
          <div role="group" aria-label={t.pages} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {pages.map((p, i) => (
              <button key={p.src} type="button" aria-pressed={i === page} onClick={() => setPage(i)} className={`${button} shrink-0 border ${i === page ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-faint"}`}>
                {p.title}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div role="group" aria-label={t.view} className="flex w-fit gap-1 rounded-full border border-line bg-white p-1">
            {(["d", "m"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={shown === v} onClick={() => setView(v)} className={`${button} min-h-10 ${shown === v ? "bg-coral-soft text-ink" : "text-ink-muted hover:text-ink"}`}>
                {v === "d" ? <Monitor aria-hidden="true" className="size-4" /> : <Smartphone aria-hidden="true" className="size-4" />}
                {v === "d" ? t.desktop : t.phone}
              </button>
            ))}
          </div>
          <a href={src} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-link hover:underline">
            <ExternalLink aria-hidden="true" className="size-4" />
            <span className="max-sm:sr-only">{t.openTab}</span>
          </a>
        </div>
      </div>
      <p className="text-sm text-ink-muted">{t.hint}</p>

      {/* One frame for both views, so switching never reloads the site: a computer window, or a phone. */}
      <div className={shown === "d" ? "overflow-hidden rounded-2xl border border-line bg-white shadow-xl" : "mx-auto w-full max-w-[400px] rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl"}>
        {shown === "d" && (
          <div className="flex items-center gap-3 border-b border-line bg-sunken px-4 py-2.5">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="size-3 rounded-full bg-line" />
              <span className="size-3 rounded-full bg-line" />
              <span className="size-3 rounded-full bg-line" />
            </span>
            <span className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-sm text-ink-muted">{name}</span>
          </div>
        )}
        <div className={shown === "d" ? "h-[78vh] min-h-[540px]" : "h-[min(780px,78vh)] min-h-[520px] overflow-hidden rounded-[1.9rem] bg-white"}>{frame}</div>
      </div>
    </div>
  );
}
