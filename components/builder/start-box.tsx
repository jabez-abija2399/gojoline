"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { LanguageChoice, type SiteLanguages } from "./language-choice";
import { clearStartPrompt, saveStartPrompt } from "./start-prompt";

export type StartText = Pick<Messages["builder"], "startTitle" | "startAgainTitle" | "startBody" | "startPlaceholder" | "ideasLabel" | "ideas" | "startLang" | "langEn" | "langAm" | "langBothShort" | "newSite">;

interface Props {
  /** Only the words this box shows, so the page doesn't send the whole builder vocabulary. */
  t: StartText;
  locale: Locale;
  action: (form: FormData) => void | Promise<void>;
  /** "h1" on an empty account, where this box is the page; "h2" under the list of sites. */
  heading: "h1" | "h2";
}

const IDEAS = ["cafe", "shop", "clinic", "personal"] as const;

/** Describe the business right on "Your sites": the new site opens and starts building. */
export function StartBox({ t, locale, action, heading: Heading }: Props) {
  const [text, setText] = useState("");
  const [languages, setLanguages] = useState<SiteLanguages>([locale]);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Back on "Your sites" with a prompt still waiting means no new site was made for it:
  // drop it, so it can never start a build in a different site.
  useEffect(clearStartPrompt, []);

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={() => {
        if (text.trim()) saveStartPrompt({ text, languages });
      }}
      className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -end-16 -top-16 size-48 rounded-full bg-clay-soft opacity-60 blur-2xl" />
      <input type="hidden" name="lang" value={locale} />
      <div className="relative flex flex-col gap-1">
        <Heading className={Heading === "h1" ? "text-3xl font-bold sm:text-4xl" : "text-2xl font-bold"}>
          <label htmlFor="start-text">{Heading === "h1" ? t.startTitle : t.startAgainTitle}</label>
        </Heading>
        <p className="max-w-[60ch] text-ink-muted">{t.startBody}</p>
      </div>
      <div className="relative rounded-xl border border-input bg-white has-[textarea:focus-visible]:outline has-[textarea:focus-visible]:outline-3 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-teal-mid">
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
          className="block max-h-56 min-h-24 w-full resize-none rounded-xl bg-transparent px-4 py-3 text-base [field-sizing:content] placeholder:text-ink-muted focus-visible:outline-none"
        />
      </div>
      <div className="relative flex flex-col gap-2">
        <p id="ideas-label" className="flex items-center gap-2 text-sm font-medium text-ink-muted">
          <Sparkles aria-hidden="true" className="size-4 text-teal-mid" />
          {t.ideasLabel}
        </p>
        <ul aria-labelledby="ideas-label" className="chips-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {IDEAS.map((id) => (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setText(t.ideas[id].text);
                  boxRef.current?.focus();
                }}
                className="min-h-11 rounded-full border border-teal-soft bg-white px-4 font-medium text-teal transition-colors hover:border-teal-mid hover:bg-teal-soft"
              >
                {t.ideas[id].label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <LanguageChoice title={t.startLang} labels={{ en: t.langEn, am: t.langAm, both: t.langBothShort }} value={languages} onChange={setLanguages} name="start-languages" />
        <StartButton label={t.newSite} />
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
      className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-clay px-6 font-medium text-white transition-colors hover:bg-clay-hover aria-disabled:opacity-60"
    >
      {label}
      {pending ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}
