import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { InstallApp } from "@/components/pwa/install-app";
import { LandingStage, type StageSite, type StageText } from "./landing-stage";
import { Mosaic } from "./mosaic";

/**
 * Headline, then the real product: pick a business and the builder below shows a real site
 * for it. Then one box to describe your own.
 */
export function Hero({ t, locale, sites, text, install, promptTitle, templates, signedIn }: { t: Messages["landing"]["hero"]; locale: Locale; sites: StageSite[]; text: StageText; install: Messages["pwa"]; promptTitle: string; templates: { href: string; label: string }; signedIn: boolean }) {
  return (
    <div className="relative">
      <section aria-labelledby="hero-title" className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 pt-10 text-center sm:px-6 md:gap-7 md:pt-16">
        <h1 id="hero-title" className={`max-w-[16ch] text-5xl display text-balance sm:text-7xl ${locale === "am" ? "leading-[1.3]" : "leading-[1.04]"}`}>
          {t.titleStart}{" "}
          <span className="relative inline-block whitespace-nowrap [line-height:inherit]">
            {t.titleEnd}
            {/* A brush stroke under the promise, drawn by hand rather than ruled. */}
            <svg aria-hidden="true" focusable="false" viewBox="0 0 300 18" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-[0.12em] -z-10 h-[0.22em] w-full text-coral">
              <path d="M4 12C60 4 120 3 180 6s86 4 116 1" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </span>
        </h1>
        <p className="max-w-[56ch] text-lg text-ink-muted sm:text-xl">{t.subtitle}</p>
      </section>
      <div className="mx-auto mt-8 max-w-6xl sm:px-6 md:mt-10">
        <LandingStage
          signedIn={signedIn}
          locale={locale}
          sites={sites}
          t={text}
          backdrop={<Mosaic />}
          more={
            <Link href={templates.href} className="group inline-flex min-h-11 items-center gap-1 font-medium text-link underline-offset-4 hover:underline">
              {templates.label}
              <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          }
          promptHeading={
            <h2 id="start-title" className="text-3xl display text-balance sm:text-5xl">
              {promptTitle}
            </h2>
          }
          promptFooter={
            <>
              <p className="flex items-center gap-2 font-medium text-ink">
                <Check aria-hidden="true" className="size-4 shrink-0 text-lagoon" /> {t.note}
              </p>
              <InstallApp t={install} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line bg-white px-4 font-medium text-ink hover:border-faint" />
            </>
          }
        />
      </div>
    </div>
  );
}
