"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { ShowcaseSite } from "@/lib/landing/showcase";

interface Props {
  sites: ShowcaseSite[];
  labels: Record<string, string>;
  prompts: Record<string, string>;
  t: { you: string; bot: string; reply: string; pick: string; book: string };
  /** The same build steps owners see in the builder. */
  steps: string[];
}

/** Pick a kind of business and watch its site appear. Rotates by itself until someone picks. */
export function HeroDemo({ sites, labels, prompts, t, steps }: Props) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % sites.length), 5000);
    return () => clearInterval(id);
  }, [auto, sites.length]);
  const s = sites[index]!;
  const choose = (i: number) => {
    setAuto(false);
    setIndex(i);
  };

  return (
    <figure className="flex flex-col gap-4">
      <div role="group" aria-label={t.pick} className="flex flex-wrap gap-2">
        {sites.map((x, i) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={i === index}
            onClick={() => choose(i)}
            className="min-h-11 rounded-full border border-line bg-white px-4 font-medium transition-colors hover:border-teal-mid aria-pressed:border-teal aria-pressed:bg-teal aria-pressed:text-white"
          >
            {labels[x.id]}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-4 shadow-lg shadow-teal/5 sm:p-5" aria-live="polite">
        <div key={`u-${s.id}`} className="ml-auto max-w-[88%] animate-in fade-in slide-in-from-bottom-2 rounded-2xl rounded-br-sm bg-teal px-4 py-3 text-white duration-500">
          <p className="font-semibold text-teal-soft">{t.you}</p>
          <p>{prompts[s.id]}</p>
        </div>
        <ol key={`t-${s.id}`} aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          {steps.map((step, i) => (
            <li key={step} className="flex animate-in items-center gap-1.5 fade-in duration-300 fill-mode-both" style={{ animationDelay: `${150 + i * 180}ms` }}>
              <span className="flex size-4 items-center justify-center rounded-full bg-teal text-white">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div key={`b-${s.id}`} className="max-w-[88%] animate-in fade-in slide-in-from-bottom-2 rounded-2xl rounded-bl-sm bg-clay-soft px-4 py-3 delay-700 duration-500 fill-mode-both">
          <p className="font-semibold">{t.bot}</p>
          <p>{t.reply}</p>
        </div>
        <div key={`s-${s.id}`} className="animate-in fade-in zoom-in-95 overflow-hidden rounded-xl border border-line delay-1000 duration-700 fill-mode-both" style={{ background: s.background, color: s.text }}>
          <div className="flex items-center gap-1.5 border-b border-black/10 bg-white/70 px-3 py-2" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-black/15" />
            <span className="size-2.5 rounded-full bg-black/15" />
            <span className="size-2.5 rounded-full bg-black/15" />
          </div>
          <div className="flex flex-col gap-2 px-4 py-5" style={{ background: s.primary, color: s.onPrimary }}>
            <p className="font-display text-xl font-bold leading-tight">{s.name}</p>
            <p className="text-sm">{s.tagline}</p>
            <span className="mt-1 w-fit rounded-md px-3 py-1.5 text-sm font-semibold" style={{ background: s.accent, color: s.onAccent }}>{t.book}</span>
          </div>
          <ul className="grid gap-1.5 p-4 text-sm">
            {s.items.map((it) => (
              <li key={it.name} className="flex justify-between gap-3 border-b border-black/10 pb-1.5 last:border-0">
                <span className="truncate">{it.name}</span>
                {it.price && <span className="shrink-0 font-semibold">{it.price}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}
