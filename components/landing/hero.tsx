import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { ShowcaseSite } from "@/lib/landing/showcase";
import { HeroDemo } from "./hero-demo";

export function Hero({ t, locale, sites }: { t: Messages["landing"]; locale: Locale; sites: ShowcaseSite[] }) {
  const h = t.hero;
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      {/* Soft brand-coloured light behind the hero; purely decorative. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_10%,var(--color-clay-soft),transparent_70%),radial-gradient(50%_45%_at_0%_90%,var(--color-teal-soft),transparent_70%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-16 sm:px-6 md:grid-cols-[1.05fr_1fr] md:items-center md:pt-20 md:pb-24">
        <div className="flex flex-col gap-6">
          <p className="w-fit rounded-full border border-teal-soft bg-white/80 px-3 py-1 font-medium text-teal">{h.eyebrow}</p>
          <h1 id="hero-title" className="text-4xl leading-[1.1] font-bold text-balance sm:text-6xl">
            {h.titleStart} <span className="text-teal">{h.titleEnd}</span>
          </h1>
          <p className="max-w-[56ch] text-lg text-ink-muted">{h.subtitle}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={`/${locale}/sign-in?next=/${locale}/build`} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-clay px-6 text-lg font-semibold text-white shadow-md shadow-clay/20 transition hover:bg-clay-hover">
              {h.cta}
              <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#how" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line bg-white px-6 text-lg font-medium hover:border-teal-mid">
              {h.secondary}
            </a>
          </div>
          <p className="flex items-center gap-2 text-ink-muted">
            <Check aria-hidden="true" className="size-4 text-teal" /> {h.note}
          </p>
        </div>
        <HeroDemo sites={sites} labels={t.demo.labels} prompts={t.demo.prompts} t={t.demo} />
      </div>
    </section>
  );
}
