import { Banknote, Check, Lock, Send } from "lucide-react";
import { FeatureTabs } from "./feature-tabs";
import { Mosaic } from "./mosaic";

export type FeatureKey = "language" | "forms" | "edits" | "birr" | "domain" | "safe";

export interface FeatureItem {
  key: FeatureKey;
  title: string;
  body: string;
}

/** The words the small product pictures need, all from the app's own messages. */
export interface MockText {
  sample: { en: { name: string; tagline: string }; am: { name: string; tagline: string } };
  langNames: { en: string; am: string };
  noteTitle: string;
  noteBody: string;
  bot: string;
  ask: string;
  saved: string;
  plan: string;
  price: string;
  address: string;
  checking: string;
  ready: string;
}

const card = "w-full max-w-sm rounded-2xl bg-white text-ink shadow-[0_24px_60px_-24px_rgb(18_18_18/0.5)]";

/** A small, real-looking piece of the product for each feature. Decoration: hidden from screen readers. */
export function FeatureMock({ kind, m }: { kind: FeatureKey; m: MockText }) {
  if (kind === "language")
    return (
      <div aria-hidden="true" className={`${card} flex flex-col gap-3 p-4`}>
        <div className="flex w-fit gap-1 rounded-full bg-sunken p-1">
          <span className="rounded-full bg-ink px-3 py-1.5 font-medium text-white">{m.langNames.en}</span>
          <span lang="am" className="rounded-full px-3 py-1.5 font-medium text-ink-muted">
            {m.langNames.am}
          </span>
        </div>
        <div className="rounded-xl border border-line p-3">
          <p className="font-display text-lg font-bold">{m.sample.en.name}</p>
          <p className="text-ink-muted">{m.sample.en.tagline}</p>
        </div>
        <div lang="am" className="rounded-xl border border-line p-3">
          <p className="font-display text-lg font-bold">{m.sample.am.name}</p>
          <p className="text-ink-muted">{m.sample.am.tagline}</p>
        </div>
      </div>
    );
  if (kind === "forms")
    return (
      <div aria-hidden="true" className={`${card} overflow-hidden`}>
        <p className="flex items-center gap-2 bg-ink px-4 py-2 font-semibold text-white">
          <Send className="size-4" /> @{m.bot}
        </p>
        <p className="px-4 py-3">
          <strong className="block">{m.noteTitle}</strong>
          {m.noteBody}
        </p>
      </div>
    );
  if (kind === "edits")
    return (
      <div aria-hidden="true" className={`${card} flex flex-col gap-3 p-4`}>
        <p className="ms-auto rounded-2xl rounded-br-sm bg-ink px-4 py-2.5 text-white">{m.ask}</p>
        <p className="flex w-fit items-center gap-2 rounded-2xl rounded-bl-sm bg-sunken px-4 py-2.5 font-medium">
          <span className="flex size-5 items-center justify-center rounded-full bg-lagoon text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          {m.saved}
        </p>
      </div>
    );
  if (kind === "birr")
    return (
      <div aria-hidden="true" className={`${card} flex items-center justify-between gap-4 p-5`}>
        <div>
          <p className="text-ink-muted">{m.plan}</p>
          <p className="text-3xl display">{m.price}</p>
        </div>
        <span className="flex size-12 items-center justify-center rounded-full bg-coral text-on-coral">
          <Banknote className="size-6" />
        </span>
      </div>
    );
  if (kind === "domain")
    return (
      <div aria-hidden="true" className={`${card} flex items-center gap-3 rounded-full px-5 py-4`}>
        <Lock className="size-4 shrink-0 text-lagoon" />
        <span className="truncate font-medium">{m.address}</span>
      </div>
    );
  return (
    <div aria-hidden="true" className={`${card} flex flex-col gap-2 p-4`}>
      {[m.checking, m.ready].map((line) => (
        <p key={line} className="flex items-center gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lagoon text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          {line}
        </p>
      ))}
    </div>
  );
}

/**
 * What a small business gets: a list of features, and for the one picked, its piece of the
 * product on a coral panel.
 */
export function Features({ title, items, m }: { title: string; items: FeatureItem[]; m: MockText }) {
  return (
    <section aria-labelledby="features-title" className="below-fold mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <h2 id="features-title" className="mx-auto max-w-[20ch] text-center text-3xl display sm:text-5xl">
        {title}
      </h2>
      <FeatureTabs items={items} panels={Object.fromEntries(items.map((it) => [it.key, <FeatureMock key={it.key} kind={it.key} m={m} />])) as Record<FeatureKey, React.ReactNode>} backdrop={<Mosaic cols={40} rows={16} className="fill-white opacity-40" />} />
    </section>
  );
}
