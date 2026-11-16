"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { LanguageChoice, type SiteLanguages } from "./language-choice";
import { clearStartPrompt, saveStartPrompt, takeLandingPrompt } from "./start-prompt";

export type StartText = Pick<Messages["builder"], "startBody" | "startPlaceholder" | "ideasLabel" | "ideas" | "startLang" | "langEn" | "langAm" | "langBothShort" | "newSite">;

interface Props {
  /** Only the words this box shows, so the page doesn't send the whole builder vocabulary. */
  t: StartText;
  locale: Locale;
  action: (form: FormData) => void | Promise<void>;
  /** The page's greeting: it names the box. */
  title: string;
  /**
   * A description typed on the landing page starts the first site by itself only on an
   * account with no sites yet. An existing account gets it filled in and presses Start,
   * so a tab someone else left behind can never spend its credit.
   */
  autoStart: boolean;
}

const IDEAS = ["cafe", "shop", "clinic", "personal"] as const;

/** Describe the business right on "Your sites": the new site opens and starts building. */
export function StartBox({ t, locale, action, title, autoStart }: Props) {
  const [text, setText] = useState("");
  const [languages, setLanguages] = useState<SiteLanguages>([locale]);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Back on "Your sites" with a prompt still waiting means no new site was made for it:
  // drop it, so it can never start a build in a different site.
  // Unless the visitor described their business on the landing page before signing in:
  // then that description starts their first site right away.
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const fromLanding = takeLandingPrompt();
    if (!fromLanding) return clearStartPrompt();
    if (autoStart) {
      saveStartPrompt(fromLanding);
      if (boxRef.current) boxRef.current.placeholder = fromLanding.text;
      formRef.current?.requestSubmit();
      return;
    }
    // After hydration: show the description and wait for the owner's own press.
    const id = setTimeout(() => {
      setText(fromLanding.text);
      setLanguages(fromLanding.languages);
      boxRef.current?.focus();
    }, 0);
    return () => clearTimeout(id);
  }, [autoStart]);

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={() => {
        if (text.trim()) saveStartPrompt({ text, languages });
      }}
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5"
    >
      <input type="hidden" name="lang" value={locale} />
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
          <label htmlFor="start-text">{title}</label>
        </h1>
        <p className="max-w-[52ch] text-ink-muted">{t.startBody}</p>
      </div>
      <div className="w-full rounded-2xl border border-line bg-white p-2 shadow-xl shadow-black/5 transition-shadow has-[textarea:focus-visible]:outline has-[textarea:focus-visible]:outline-3 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-link">
        <textarea
          ref={boxRef}
          id="start-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) formRef.current?.requestSubmit();
          }}
          rows={3}
          maxLength={4000}
          placeholder={t.startPlaceholder}
          className="block max-h-56 min-h-24 w-full resize-none rounded-2xl bg-transparent px-3 py-2.5 text-base [field-sizing:content] placeholder:text-ink-muted focus-visible:outline-none sm:px-4 sm:py-3"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <LanguageChoice compact title={t.startLang} labels={{ en: t.langEn, am: t.langAm, both: t.langBothShort }} value={languages} onChange={setLanguages} name="start-languages" />
          <StartButton label={t.newSite} />
        </div>
      </div>
      <div className="flex w-full flex-col items-center gap-2">
        <p id="ideas-label" className="flex items-center gap-2 text-xs font-medium text-ink-muted">
          <Sparkles aria-hidden="true" className="size-4 text-faint" />
          {t.ideasLabel}
        </p>
        <ul aria-labelledby="ideas-label" className="chips-scroll -mx-4 flex max-w-[100vw] gap-2 overflow-x-auto px-4 py-1.5 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
          {IDEAS.map((id) => (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setText(t.ideas[id].text);
                  boxRef.current?.focus();
                }}
                className="min-h-11 rounded-full border border-line bg-white px-3.5 text-sm font-medium text-ink transition-colors hover:border-faint hover:bg-sunken lg:min-h-9"
              >
                {t.ideas[id].label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}

function StartButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-disabled={pending}
      onClick={(e) => pending && e.preventDefault()}
      className="group inline-flex min-h-11 shrink-0 grow items-center justify-center gap-2 rounded-full bg-coral px-4 text-sm sm:grow-0 lg:min-h-9 font-medium text-on-coral transition-colors hover:bg-coral-hover aria-disabled:opacity-60"
    >
      {label}
      {pending ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}
