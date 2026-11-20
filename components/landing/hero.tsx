import { ArrowRight, Check, MessageCircle, PlayCircle, Send, Wallet } from "lucide-react";

const PILLAR_ICONS = [MessageCircle, Send, Wallet];
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { InstallApp } from "@/components/pwa/install-app";
import { LandingStage, type StageSite, type StageText } from "./landing-stage";

/**
 * Headline, then the real product: pick a business and the builder below shows a real site
 * for it. Then one box to describe your own.
 */
export function Hero({ t, locale, sites, text, install, promptTitle, templates, signedIn, live, you, assistant, pillars, pillarsLabel }: { pillars: Messages["landing"]["pillars"]; pillarsLabel: string; live: Messages["landing"]["live"]; you: string; assistant: string; t: Messages["landing"]["hero"]; locale: Locale; sites: StageSite[]; text: StageText; install: Messages["pwa"]; promptTitle: string; templates: { href: string; label: string }; signedIn: boolean }) {
  return (
    <div className="relative isolate overflow-x-clip">
      <div aria-hidden="true" className="hero-glow" />
      <section aria-labelledby="hero-title" className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 pt-6 text-center sm:px-6 md:gap-4 md:pt-8">
        <h1 id="hero-title" className={`relative isolate display whitespace-nowrap text-[clamp(1.6rem,7.6vw,4.75rem)] ${locale === "am" ? "leading-[1.3]" : "leading-[1.08]"}`}>
          {t.titleStart}{" "}
          <span className="relative inline-block whitespace-nowrap [line-height:inherit]">
            {t.titleEnd}
            {/* A brush stroke under the promise, drawn by hand rather than ruled. */}
            <svg aria-hidden="true" focusable="false" viewBox="0 0 300 18" preserveAspectRatio="none" className="brush-draw absolute inset-x-0 -bottom-[0.12em] -z-10 h-[0.22em] w-full text-coral">
              <path d="M4 12C60 4 120 3 180 6s86 4 116 1" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </span>
        </h1>
        <p className="max-w-[56ch] text-ink-muted sm:text-lg">{t.subtitle}</p>
        {/* For visitors who'd like to see it working before signing up: the guide video. */}
        <Link href={`/${locale}/guide`} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-medium text-ink underline decoration-line underline-offset-4 hover:bg-white/60 hover:decoration-ink">
          <PlayCircle aria-hidden="true" className="size-5 shrink-0" />
          {t.watchGuide}
        </Link>
      </section>
      <div className="mx-auto mt-5 max-w-[90rem] sm:px-6 md:mt-6">
        <LandingStage
          signedIn={signedIn}
          locale={locale}
          sites={sites}
          t={text}
          moreChip={{ href: templates.href, label: t.moreChip }}
          chooseLabel={t.choose}
          live={live}
          you={you}
          assistant={assistant}
          more={
            <>
              {/* Three things every site gets, under the screen as the reference does under its product. */}
              <ul aria-label={pillarsLabel} className="mx-auto mt-10 grid w-full max-w-6xl gap-6 px-4 text-start sm:px-0 md:mt-12 md:grid-cols-3 md:gap-8">
                {pillars.map((p, i) => {
                  const Icon = PILLAR_ICONS[i] ?? MessageCircle;
                  return (
                    <li key={p.title} className={`flex flex-col gap-2 border-t-2 pt-4 ${i === 0 ? "border-ink" : "border-line"}`}>
                      <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
                        <Icon aria-hidden="true" className="size-5 shrink-0" />
                        {p.title}
                      </h2>
                      <p className="text-ink-muted">{p.body}</p>
                    </li>
                  );
                })}
              </ul>
              <Link href={templates.href} className="group mt-6 inline-flex min-h-11 items-center gap-1 font-medium text-link underline-offset-4 hover:underline">
                {templates.label}
                <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </>
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
