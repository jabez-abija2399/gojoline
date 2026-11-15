"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { LanguageChoice, type SiteLanguages } from "@/components/builder/language-choice";
import { clearLandingPrompt, saveLandingPrompt } from "@/components/builder/start-prompt";
import type { Locale } from "@/lib/i18n/config";

export interface HeroIdea {
  id: string;
  label: string;
  /** What an owner of this kind of business might write. */
  prompt: string;
}

export interface HeroStartText {
  promptLabel: string;
  placeholder: string;
  pick: string;
  build: string;
  langTitle: string;
  langEn: string;
  langAm: string;
  langBoth: string;
}

/**
 * The real start of the product, on the landing page: one box. Describe the business, choose
 * the site's language, press Build. The description waits while the visitor signs in, then
 * their first site starts building.
 */
export function HeroStart({ locale, ideas, t }: { locale: Locale; ideas: HeroIdea[]; t: HeroStartText }) {
  const router = useRouter();
  const [picked, setPicked] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [languages, setLanguages] = useState<SiteLanguages>([locale]);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  // A description from an earlier visit to this page is dropped: only this visit's counts.
  useEffect(clearLandingPrompt, []);
  const next = `/${locale}/build`;

  return (
    <div className="flex w-full flex-col gap-4">
      <form
        action={`/${locale}/sign-in`}
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) saveLandingPrompt({ text, languages });
          router.push(`/${locale}/sign-in?next=${next}`);
        }}
        className="flex min-w-0 flex-col rounded-[28px] border border-ink/10 bg-white p-2 text-start shadow-[0_24px_70px_-24px_rgb(18_18_18/0.35)] has-[textarea:focus-visible]:outline has-[textarea:focus-visible]:outline-3 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-link"
      >
        <input type="hidden" name="next" value={next} />
        <label htmlFor="hero-prompt" className="sr-only">
          {t.promptLabel}
        </label>
        <textarea
          ref={boxRef}
          id="hero-prompt"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          rows={3}
          maxLength={4000}
          placeholder={t.placeholder}
          className="block max-h-56 min-h-28 w-full resize-none rounded-3xl bg-transparent px-4 pt-4 pb-2 text-lg [field-sizing:content] placeholder:text-ink-muted focus-visible:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 p-1">
          <LanguageChoice compact title={t.langTitle} labels={{ en: t.langEn, am: t.langAm, both: t.langBoth }} value={languages} onChange={setLanguages} name="hero-languages" />
          <button type="submit" className="group ms-auto inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-coral ps-5 pe-2 text-lg max-sm:w-full font-semibold text-on-coral transition hover:bg-coral-hover">
            {t.build}
            <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-ink text-white transition-transform group-hover:-translate-y-0.5">
              <ArrowUp className="size-4" strokeWidth={3} />
            </span>
          </button>
        </div>
      </form>
      <div role="group" aria-label={t.pick} className="chips-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        {ideas.map((idea, i) => (
          <button
            key={idea.id}
            type="button"
            aria-pressed={i === picked}
            onClick={() => {
              setPicked(i);
              // Never replace the visitor's own words: only an empty box or an earlier example.
              if (!text.trim() || ideas.some((x) => x.prompt === text)) setText(idea.prompt);
              boxRef.current?.focus();
            }}
            className="min-h-11 shrink-0 rounded-full border border-line bg-white/90 px-4 font-medium text-ink transition-colors hover:border-faint hover:bg-white aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
          >
            {idea.label}
          </button>
        ))}
      </div>
    </div>
  );
}
