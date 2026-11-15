"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Lock } from "lucide-react";
import { LanguageChoice, type SiteLanguages } from "@/components/builder/language-choice";
import { clearLandingPrompt, saveLandingPrompt } from "@/components/builder/start-prompt";
import type { Locale } from "@/lib/i18n/config";

export interface StageSite {
  id: string;
  label: string;
  /** The real example site's name. */
  name: string;
  /** What an owner of this kind of business might write. */
  prompt: string;
  /** Picture of the top of the real site. */
  shot: { src: string; width: number; height: number };
}

export interface StageText {
  chipsLabel: string;
  promptLabel: string;
  placeholder: string;
  build: string;
  langTitle: string;
  langEn: string;
  langAm: string;
  langBoth: string;
  buildTitle: string;
  buildSteps: string[];
  ready: string;
  publish: string;
  chatPlaceholder: string;
  showcaseLabel: string;
  /** Read to screen readers when a chip is picked. */
  picked: string;
  /** Small cards beside the phone on wide screens. */
  noteTitle: string;
  noteBody: string;
  saved: string;
}

interface Props {
  locale: Locale;
  sites: StageSite[];
  t: StageText;
  /** Background of the showcase (the mosaic), drawn on the server. */
  backdrop: React.ReactNode;
  /** Heading of the prompt section, written on the server. */
  promptHeading: React.ReactNode;
  /** What follows the prompt box (the note, the install button). */
  promptFooter: React.ReactNode;
}

/**
 * The top of the landing page that reacts to the visitor: pick a kind of business, see the
 * real builder with a real site for it, and the prompt box below is filled in ready to build.
 * The description waits while the visitor signs in, then their first site starts building.
 */
export function LandingStage({ locale, sites, t, backdrop, promptHeading, promptFooter }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [languages, setLanguages] = useState<SiteLanguages>([locale]);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  // A description from an earlier visit to this page is dropped: only this visit's counts.
  useEffect(clearLandingPrompt, []);
  const site = sites[index]!;
  const next = `/${locale}/build`;

  return (
    <>
      <div className="flex flex-col items-center gap-8 md:gap-10">
        <div role="group" aria-label={t.chipsLabel} className="flex w-full flex-wrap items-center justify-center gap-2 px-4 sm:px-0">
          <span aria-hidden="true" className="shrink-0 pe-1 font-medium text-ink max-sm:basis-full max-sm:text-center">
            {t.chipsLabel}
          </span>
          {sites.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={i === index}
              onClick={() => {
                setIndex(i);
                setPicked(i);
                // Never replace the visitor's own words: only an empty box or an earlier example.
                if (!text.trim() || sites.some((x) => x.prompt === text)) setText(s.prompt);
              }}
              className="min-h-11 shrink-0 rounded-full border border-line bg-white px-4 font-medium text-ink transition-colors hover:border-faint aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* The real builder, drawn with its own pieces: the chat on the left, a real site on the right. */}
        <div className="w-full px-4 sm:px-0">
        <p role="status" className="sr-only">
          {picked === null ? "" : t.picked.replace("{name}", site.name)}
        </p>
        <figure role="img" aria-label={t.showcaseLabel.replace("{name}", site.name)} className="relative w-full overflow-hidden rounded-[1.75rem] border border-line bg-sun/20 p-4 pt-8 sm:rounded-[2.25rem] sm:p-6 md:p-10 md:pb-0">
          {backdrop}
          <div aria-hidden="true" className="relative overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_30px_80px_-30px_rgb(18_18_18/0.45)] md:rounded-b-none md:border-b-0">
            <div className="flex items-center gap-3 border-b border-line px-3 py-2.5 sm:px-4">
              <span className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-line" />
                <span className="size-2.5 rounded-full bg-line" />
                <span className="size-2.5 rounded-full bg-line" />
              </span>
              <span className="flex min-w-0 flex-1 items-center justify-center gap-2 text-ink-muted">
                <Lock className="size-3.5 shrink-0" />
                <span className="truncate">{site.name}</span>
              </span>
              <span className="rounded-full bg-ink px-3 py-1 font-medium text-white">{t.publish}</span>
            </div>
            <div className="grid md:grid-cols-[minmax(0,18rem)_1fr] lg:grid-cols-[minmax(0,22rem)_1fr]">
              <div key={`c-${site.id}`} className="flex flex-col gap-3 p-4 text-start md:border-e md:border-line">
                <p className="ms-auto max-w-[92%] rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-white">{site.prompt}</p>
                <div className="rounded-2xl rounded-bl-sm border border-line px-4 py-3">
                  <p className="font-semibold">{t.buildTitle}</p>
                  <ol className="mt-2 flex flex-col gap-1.5">
                    {t.buildSteps.map((step, i) => (
                      <li key={step} className={`flex items-center gap-2 text-ink-muted ${picked === null ? "" : "animate-[rise-in_0.35s_ease-out_backwards]"}`} style={{ animationDelay: `${i * 140}ms` }}>
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lagoon text-white">
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                <p className="w-fit rounded-2xl rounded-bl-sm bg-sunken px-4 py-3 font-medium">{t.ready}</p>
                <div className="mt-auto flex items-center gap-2 rounded-2xl border border-line p-1.5 max-md:hidden">
                  <span className="flex-1 truncate px-2.5 text-ink-muted">{t.chatPlaceholder}</span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                    <ArrowUp className="size-5" />
                  </span>
                </div>
              </div>
              <div className="relative flex items-end justify-center gap-6 bg-paper bg-[radial-gradient(var(--gojo-line)_1px,transparent_1px)] bg-[size:18px_18px] px-4 pt-6 max-md:border-t max-md:border-line md:pt-10 lg:min-h-[32rem]">
                {/* Wide screens: what happens around the site, beside it. */}
                <div className="mb-16 flex w-52 flex-col gap-3 text-start max-lg:hidden">
                  <p className="rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
                    <strong className="block">{t.noteTitle}</strong>
                    <span className="text-ink-muted">{t.noteBody}</span>
                  </p>
                  <p className="flex w-fit items-center gap-2 rounded-full border border-line bg-white px-3 py-2 font-medium shadow-lg">
                    <span className="flex size-5 items-center justify-center rounded-full bg-lagoon text-white">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    {t.saved}
                  </p>
                </div>
                <div key={`p-${site.id}`} className={`h-[340px] w-[250px] shrink-0 overflow-hidden rounded-t-[2rem] border-x-[8px] border-t-[8px] border-ink bg-white md:h-[440px] md:w-[280px] lg:h-[480px] lg:w-[300px] ${picked === null ? "" : "animate-[pop-in_0.35s_ease-out]"}`}>
                  <Image src={site.shot.src} alt="" width={site.shot.width} height={site.shot.height} sizes="(min-width: 1024px) 284px, (min-width: 768px) 264px, 234px" priority={index === 0} className="h-auto w-full" />
                </div>
              </div>
            </div>
          </div>
        </figure>
        </div>
      </div>

      <section aria-labelledby="start-title" className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 md:py-24">
        {promptHeading}
        <form
          action={`/${locale}/sign-in`}
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) saveLandingPrompt({ text, languages });
            router.push(`/${locale}/sign-in?next=${next}`);
          }}
          className="flex w-full min-w-0 flex-col rounded-[28px] border border-ink/10 bg-white p-2 text-start shadow-[0_24px_70px_-24px_rgb(18_18_18/0.35)] has-[textarea:focus-visible]:outline has-[textarea:focus-visible]:outline-3 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-link"
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
            <button type="submit" className="group ms-auto inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-coral ps-5 pe-2 text-lg font-semibold text-on-coral transition hover:bg-coral-hover max-sm:w-full">
              {t.build}
              <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-ink text-white transition-transform group-hover:-translate-y-0.5">
                <ArrowUp className="size-4" strokeWidth={3} />
              </span>
            </button>
          </div>
        </form>
        {promptFooter}
      </section>
    </>
  );
}
