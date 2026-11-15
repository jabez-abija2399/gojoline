"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { LanguageChoice, type SiteLanguages } from "@/components/builder/language-choice";
import { clearLandingPrompt, saveLandingPrompt } from "@/components/builder/start-prompt";
import type { Locale } from "@/lib/i18n/config";

export interface HeroSite {
  id: string;
  label: string;
  name: string;
  /** What an owner of this kind of business might write. */
  prompt: string;
  shot: { src: string; width: number; height: number };
}

export interface HeroStartText {
  promptLabel: string;
  placeholder: string;
  pick: string;
  build: string;
  note: string;
  langTitle: string;
  langEn: string;
  langAm: string;
  langBoth: string;
  phoneCaption: string;
  phoneLabel: string;
  shotAlt: string;
}

/**
 * The real start of the product, on the landing page: describe the business, press Build.
 * The description waits while the visitor signs in, then their first site starts building.
 * Beside it, a phone shows a real Gojoline site for the kind of business picked.
 */
export function HeroStart({ locale, sites, t, children }: { locale: Locale; sites: HeroSite[]; t: HeroStartText; children: React.ReactNode }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  // Nothing is "picked" until the visitor picks: the phone just starts on the first site.
  const [picked, setPicked] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [languages, setLanguages] = useState<SiteLanguages>([locale]);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  // A description from an earlier visit to this page is dropped: only this visit's counts.
  useEffect(clearLandingPrompt, []);
  const site = sites[index]!;
  const next = `/${locale}/build`;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
      <div className="flex min-w-0 flex-col gap-5 sm:gap-7">
        {children}
      <form
        action={`/${locale}/sign-in`}
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) saveLandingPrompt({ text, languages });
          router.push(`/${locale}/sign-in?next=${next}`);
        }}
        className="flex min-w-0 flex-col gap-4 rounded-3xl border border-line bg-white p-4 shadow-xl shadow-teal/10 sm:p-5"
      >
        <input type="hidden" name="next" value={next} />
        <label htmlFor="hero-prompt" className="sr-only">
          {t.promptLabel}
        </label>
        <div className="rounded-2xl border border-input bg-white has-[textarea:focus-visible]:outline has-[textarea:focus-visible]:outline-3 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-teal-mid">
          <textarea
            ref={boxRef}
            id="hero-prompt"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={4000}
            placeholder={t.placeholder}
            className="block max-h-48 min-h-20 w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-lg [field-sizing:content] placeholder:text-ink-muted focus-visible:outline-none"
          />
        </div>
        <div role="group" aria-label={t.pick} className="chips-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {sites.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={i === picked}
              onClick={() => {
                setIndex(i);
                setPicked(i);
                // Never replace the visitor's own words: only an empty box or an earlier example.
                if (!text.trim() || sites.some((x) => x.prompt === text)) setText(s.prompt);
                boxRef.current?.focus();
              }}
              className="min-h-11 shrink-0 rounded-full border border-teal-soft bg-white px-4 font-medium text-teal transition-colors hover:border-teal-mid hover:bg-teal-soft aria-pressed:border-teal aria-pressed:bg-teal aria-pressed:text-white"
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <LanguageChoice title={t.langTitle} labels={{ en: t.langEn, am: t.langAm, both: t.langBoth }} value={languages} onChange={setLanguages} name="hero-languages" />
          <button type="submit" className="group inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-clay px-7 text-lg font-semibold text-white shadow-lg shadow-clay/25 transition hover:bg-clay-hover">
            {t.build}
            <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
        <p className="flex items-center gap-2 text-ink-muted">
          <Check aria-hidden="true" className="size-4 shrink-0 text-teal" /> {t.note}
        </p>
      </form>
      </div>

      <figure className="mx-auto flex w-full max-w-[300px] flex-col items-center gap-3">
        <div className="relative w-full rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl shadow-teal/20 lg:rotate-2 lg:transition-transform lg:duration-500 lg:hover:rotate-0">
          <div key={site.id} tabIndex={0} role="group" aria-label={t.phoneLabel.replace("{name}", site.name)} className="h-[540px] animate-[pop-in_0.35s_ease-out] overflow-y-auto rounded-[1.9rem] bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Image src={site.shot.src} alt={t.shotAlt.replace("{name}", site.name)} width={site.shot.width} height={site.shot.height} sizes="280px" priority={index === 0} className="h-auto w-full" />
          </div>
        </div>
        <figcaption className="text-center text-ink-muted">{t.phoneCaption.replace("{name}", site.name)}</figcaption>
      </figure>
    </div>
  );
}
