import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { InstallApp } from "@/components/pwa/install-app";
import { HeroStart, type HeroSite, type HeroStartText } from "./hero-start";

export function Hero({ t, locale, sites, text, install }: { t: Messages["landing"]["hero"]; locale: Locale; sites: HeroSite[]; text: HeroStartText; install: Messages["pwa"] }) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* Soft brand-coloured light behind the hero; purely decorative. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_90%_5%,var(--color-clay-soft),transparent_70%),radial-gradient(45%_40%_at_0%_100%,var(--color-teal-soft),transparent_70%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-6 pb-16 sm:px-6 md:pt-8 md:pb-24">
        <HeroStart locale={locale} sites={sites} t={text}>
          <div className="flex flex-col gap-4 sm:gap-5">
            <p className="w-fit rounded-full border border-teal-soft bg-white/80 px-3 py-1 font-medium text-teal max-sm:hidden">{t.eyebrow}</p>
            <h1 id="hero-title" className={`text-[2.6rem] font-bold text-balance sm:text-6xl ${locale === "am" ? "leading-[1.3]" : "leading-[1.08]"}`}>
              {t.titleStart}{" "}
              <span className="relative inline-block text-teal [line-height:inherit]">
                {t.titleEnd}
                {/* A stitched line under the promise, like a thread run through cloth. */}
                <svg aria-hidden="true" focusable="false" viewBox="0 0 200 8" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-2 h-2 w-full text-clay">
                  <path d="M0 6 10 2 20 6 30 2 40 6 50 2 60 6 70 2 80 6 90 2 100 6 110 2 120 6 130 2 140 6 150 2 160 6 170 2 180 6 190 2 200 6" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
              </span>
            </h1>
            <p className="max-w-[60ch] text-lg text-ink-muted">{t.subtitle}</p>
          </div>
        </HeroStart>
        <InstallApp t={install} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-teal-soft bg-white px-4 font-medium text-teal hover:border-teal-mid" />
      </div>
    </section>
  );
}
