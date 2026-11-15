import { Banknote, Bell, Globe, Languages, MessageSquareText, ShieldCheck } from "lucide-react";
import type { Messages } from "@/lib/i18n";

interface Sample {
  name: string;
  tagline: string;
}

const card = "reveal flex flex-col gap-3 rounded-3xl border border-line bg-white p-6 transition hover:border-teal-mid hover:shadow-lg";
const icon = "flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal";

/** What a small business gets, as a grid of unequal cards; the language card really switches. */
export function Features({ t, sample }: { t: Messages["landing"]; sample: { en: Sample; am: Sample } }) {
  const f = t.features;
  const small = [
    { icon: MessageSquareText, ...f.edits },
    { icon: Banknote, ...f.birr },
    { icon: Globe, ...f.domain },
    { icon: ShieldCheck, ...f.safe },
  ];
  return (
    <section aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <h2 id="features-title" className="max-w-[20ch] text-3xl font-bold sm:text-5xl">
        {f.title}
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-6">
        {/* Language: two radios and CSS show the same real site in either language. No script. */}
        <div className={`${card} group/lang md:col-span-3 md:row-span-2`}>
          <span aria-hidden="true" className={icon}>
            <Languages className="size-5" />
          </span>
          <h3 className="text-2xl font-bold">{f.language.title}</h3>
          <p className="text-ink-muted">{f.language.body}</p>
          <fieldset className="mt-auto flex flex-col gap-3 rounded-2xl bg-sand p-4">
            <legend className="sr-only">{f.language.try}</legend>
            <p aria-hidden="true" className="text-sm font-medium text-ink-muted">
              {f.language.try}
            </p>
            <div className="flex w-fit gap-1 rounded-full border border-line bg-white p-1">
              {(["en", "am"] as const).map((l) => (
                <label key={l} className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 font-medium transition-colors has-[:checked]:bg-teal has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-mid">
                  <input type="radio" name="feature-lang" value={l} defaultChecked={l === "en"} className="sr-only" />
                  <span lang={l}>{l === "en" ? "English" : "አማርኛ"}</span>
                </label>
              ))}
            </div>
            {(["en", "am"] as const).map((l) => (
              <div key={l} lang={l} className={`flex-col gap-1 rounded-xl border border-line bg-white p-4 ${l === "en" ? "flex group-has-[[value=am]:checked]/lang:hidden" : "hidden group-has-[[value=am]:checked]/lang:flex"}`}>
                <p className="font-display text-xl font-bold">{sample[l].name}</p>
                <p className="text-ink-muted">{sample[l].tagline}</p>
              </div>
            ))}
            <p className="text-sm text-ink-muted">{f.language.example}</p>
          </fieldset>
        </div>
        <div className={`${card} md:col-span-3`}>
          <span aria-hidden="true" className={icon}>
            <Bell className="size-5" />
          </span>
          <h3 className="text-2xl font-bold">{f.forms.title}</h3>
          <p className="text-ink-muted">{f.forms.body}</p>
          <p aria-hidden="true" className="mt-2 w-fit max-w-full rounded-2xl rounded-tl-sm bg-teal px-4 py-3 text-white shadow-md">
            <strong className="block">{t.telegram.title}</strong>
            {t.telegram.body}
          </p>
        </div>
        {small.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className={`${card} ${i === 0 ? "md:col-span-3" : "md:col-span-2"}`}>
            <span aria-hidden="true" className={icon}>
              <Icon className="size-5" />
            </span>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-ink-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
