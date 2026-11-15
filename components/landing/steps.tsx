import { ArrowUp, Check, Globe, Send } from "lucide-react";
import Image from "next/image";
import type { Messages } from "@/lib/i18n";
import { Mosaic } from "./mosaic";

interface Props {
  t: Messages["landing"];
  prompt: string;
  buildSteps: string[];
  buildTitle: string;
  bot: string;
  /** A real site and its address-to-be, for the build and publish panels. */
  site: { name: string; shot: { src: string; width: number; height: number } };
  address: string;
  /** The two site languages, as the owner sees them named. */
  languages: string;
}

/**
 * The three steps on ink: the steps listed at the side, and beside them three large panels
 * that each show what the owner really sees at that step.
 */
export function Steps({ t, prompt, buildSteps, buildTitle, bot, site, address, languages }: Props) {
  const s = t.steps;
  const steps = [s.one, s.two, s.three];
  const panel = "relative isolate flex min-h-80 items-center justify-center overflow-hidden rounded-[1.75rem] p-5 sm:p-10";
  const card = "relative w-full max-w-md rounded-2xl bg-white text-ink shadow-[0_24px_60px_-24px_rgb(18_18_18/0.5)]";
  return (
    <section id="how" aria-labelledby="how-title" className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
        <div className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
          <h2 id="how-title" className="text-[1.75rem] display text-balance text-white min-[400px]:text-3xl sm:text-5xl">
            {s.title}
          </h2>
          <ol className="flex flex-col">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4 border-t border-white/15 py-5">
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sun font-display font-bold text-on-coral">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  <p className="text-sunken">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div aria-hidden="true" className="flex flex-col gap-4 sm:gap-6">
          {/* 1. What the owner writes. */}
          <div className={`${panel} bg-sun`}>
            <Mosaic cols={28} rows={12} className="fill-white opacity-50" />
            <div className={`${card} flex flex-col gap-3 p-3`}>
              <p className="px-2 pt-2 text-lg">{prompt}</p>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-sunken px-3 py-2 text-ink-muted">
                  <Globe className="size-4" /> {languages}
                </span>
                <span className="flex size-10 items-center justify-center rounded-full bg-ink text-white">
                  <ArrowUp className="size-5" strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </div>
          {/* 2. What the builder shows while it works, and the site that appears. */}
          <div className={`${panel} bg-paper`}>
            <Mosaic cols={28} rows={12} className="fill-sun opacity-70" />
            <div className="relative flex w-full max-w-lg items-end gap-4">
              <div className={`${card} flex-1 px-4 py-3`}>
                <p className="font-semibold">{buildTitle}</p>
                <ol className="mt-2 flex flex-col gap-1.5">
                  {buildSteps.map((step) => (
                    <li key={step} className="flex items-center gap-2 text-ink-muted">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lagoon text-white">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="h-64 w-36 shrink-0 overflow-hidden rounded-[1.25rem] border-[6px] border-ink bg-white shadow-xl max-sm:hidden">
                <Image src={site.shot.src} alt="" width={site.shot.width} height={site.shot.height} sizes="144px" loading="lazy" className="h-auto w-full" />
              </div>
            </div>
          </div>
          {/* 3. Live, and the first customer arrives on Telegram. */}
          <div className={`${panel} bg-lagoon`}>
            <Mosaic cols={28} rows={12} className="fill-white opacity-20" />
            <div className="relative flex w-full max-w-md flex-col gap-4">
              <div className={`${card} flex items-center gap-3 px-4 py-3`}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lagoon text-white">
                  <Check className="size-5" strokeWidth={3} />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{s.liveTitle}</p>
                  <p className="truncate text-ink-muted">{address}</p>
                </div>
              </div>
              <div className={`${card} overflow-hidden`}>
                <p className="flex items-center gap-2 bg-ink px-4 py-2 font-semibold text-white">
                  <Send className="size-4" /> @{bot}
                </p>
                <p className="px-4 py-3">
                  <strong className="block">{t.telegram.title}</strong>
                  {t.telegram.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
