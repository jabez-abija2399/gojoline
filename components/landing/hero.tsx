import { Check } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { InstallApp } from "@/components/pwa/install-app";
import { HeroStart, type HeroIdea, type HeroStartText } from "./hero-start";

// Fine film grain over the colour, so the glow reads as light on paper and not a flat gradient.
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/** The whole first screen is one thing to do: say what your business is. */
export function Hero({ t, locale, ideas, text, install }: { t: Messages["landing"]["hero"]; locale: Locale; ideas: HeroIdea[]; text: HeroStartText; install: Messages["pwa"] }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* Coral, sun and lagoon light rising from below the prompt box; decoration only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_60%_at_50%_100%,color-mix(in_oklab,var(--gojo-coral)_70%,transparent),transparent_72%),radial-gradient(42%_55%_at_12%_92%,color-mix(in_oklab,var(--gojo-sun)_75%,transparent),transparent_70%),radial-gradient(42%_55%_at_90%_95%,color-mix(in_oklab,var(--gojo-lagoon)_45%,transparent),transparent_70%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" style={{ backgroundImage: GRAIN }} />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pt-8 pb-16 text-center sm:px-6 sm:pt-12 md:gap-6 md:pt-14 md:pb-24">
        <p className="rounded-full border border-line bg-white/70 px-3 py-1 font-medium text-ink backdrop-blur max-sm:hidden">{t.eyebrow}</p>
        <h1 id="hero-title" className={`text-5xl display text-balance sm:text-7xl ${locale === "am" ? "leading-[1.3]" : "leading-[1.05]"}`}>
          {t.titleStart}{" "}
          {/* The promise, marked with a highlighter. */}
          <span className="box-decoration-clone bg-[linear-gradient(transparent_62%,var(--gojo-sun)_62%,var(--gojo-sun)_92%,transparent_92%)] px-1 [line-height:inherit]">{t.titleEnd}</span>
        </h1>
        <p className="max-w-[58ch] text-lg text-ink-muted">{t.subtitle}</p>
        <HeroStart locale={locale} ideas={ideas} t={text} />
        <p className="flex items-center gap-2 text-ink-muted">
          <Check aria-hidden="true" className="size-4 shrink-0 text-lagoon" /> {t.note}
        </p>
        <InstallApp t={install} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line bg-white/80 px-4 font-medium text-ink hover:border-faint" />
      </div>
    </section>
  );
}
