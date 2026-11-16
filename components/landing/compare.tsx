"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCheck, MoveHorizontal } from "lucide-react";

interface Props {
  t: { title: string; body: string; before: string; after: string; slider: string; from: string };
  message: string;
  shot: { src: string; width: number; height: number };
}

/**
 * Before and after, one slider apart: the owner's chat message on one side, the real site it
 * became on the other. A native range input moves the edge, so keyboard and screen readers
 * work without extra code; only clip-path changes (no layout work).
 */
export function Compare({ t, message, shot }: Props) {
  const [pos, setPos] = useState(62);
  return (
    <section aria-labelledby="compare-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 below-fold">
      <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3 text-center">
        <h2 id="compare-title" className="text-[1.75rem] display text-balance min-[400px]:text-3xl sm:text-5xl">
          {t.title}
        </h2>
        <p className="text-lg text-ink-muted">{t.body}</p>
      </div>
      <div className="reveal relative mx-auto aspect-[520/933] w-full max-w-[20rem] overflow-hidden rounded-[2.25rem] border-[8px] border-ink bg-white has-[input:focus-visible]:outline has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-4 has-[input:focus-visible]:outline-link shadow-[0_30px_80px_-30px_rgb(18_18_18/0.45)] select-none">
        {/* After: the real site (underneath). */}
        <div aria-hidden="true" className="absolute inset-0">
          <Image src={shot.src} alt="" width={shot.width} height={shot.height} sizes="320px" className="h-full w-full object-cover object-top" />
          <span className="absolute end-3 top-3 rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">{t.after}</span>
        </div>
        {/* Before: the message, clipped at the slider. */}
        <div aria-hidden="true" className="absolute inset-0 flex flex-col bg-sunken" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-coral-soft font-display font-bold text-ink">{[...t.from][0]}</span>
            <span className="truncate font-semibold">{t.from}</span>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-3 bg-[radial-gradient(var(--gojo-line)_1px,transparent_1px)] bg-[size:16px_16px] p-4">
            <p className="me-auto max-w-[78%] rounded-2xl rounded-bl-sm bg-ink px-4 py-3 text-white">
              {message}
              <span className="mt-1 flex items-center justify-end text-white/70">
                <CheckCheck className="size-3.5" />
              </span>
            </p>
          </div>
          <span className="absolute start-3 top-16 rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink shadow">{t.before}</span>
        </div>
        {/* The edge and its handle follow the slider. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgb(18_18_18/0.15)]" style={{ left: `${pos}%` }}>
          <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lg ring-1 ring-line">
            <MoveHorizontal className="size-5" />
          </span>
        </div>
        <label className="absolute inset-0">
          <span className="sr-only">{t.slider}</span>
          <input type="range" min={0} max={100} value={pos} aria-valuetext={`${pos}%`} onChange={(e) => setPos(Number(e.target.value))} className="h-full w-full cursor-ew-resize touch-pan-y opacity-0" />
        </label>
      </div>
    </section>
  );
}
