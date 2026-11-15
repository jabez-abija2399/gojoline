import { Banknote, Bell, Check, Globe, Languages, Lock, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { FeatureTabs } from "./feature-tabs";
import { Mosaic } from "./mosaic";

/**
 * Design options for the landing page's features section, side by side on
 * /[lang]/preview/features for the founder to choose from. Once one is chosen it replaces
 * components/landing/features.tsx and this file and the preview page are deleted.
 */
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

const ICONS = { language: Languages, forms: Bell, edits: MessageSquareText, birr: Banknote, domain: Globe, safe: ShieldCheck };
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
        <span className="flex size-12 items-center justify-center rounded-full bg-sun text-on-coral">
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

interface Props {
  title: string;
  items: FeatureItem[];
  m: MockText;
}

const heading = "mx-auto max-w-[20ch] text-center text-3xl display sm:text-5xl";
const wrap = "mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24";

/** B. Six plain cells between thin lines: calm, quick to scan, no pictures. */
export function FeaturesHairline({ title, items }: Props) {
  return (
    <section className={wrap}>
      <h2 className={heading}>{title}</h2>
      <ul className="mt-12 grid border-t border-line sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const Icon = ICONS[it.key];
          return (
            <li key={it.key} className="flex flex-col gap-2 border-b border-line py-8 sm:px-8 sm:odd:border-e lg:border-e lg:[&:nth-child(3n)]:border-e-0 lg:[&:nth-child(3n+1)]:ps-0">
              <span className="flex items-center gap-2.5 text-lg font-semibold">
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                {it.title}
              </span>
              <p className="text-ink-muted">{it.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** C. A list on the left; picking a feature shows its piece of the product on the right. */
export function FeaturesTabs({ title, items, m }: Props) {
  return (
    <section className={wrap}>
      <h2 className={heading}>{title}</h2>
      <FeatureTabs items={items} panels={Object.fromEntries(items.map((it) => [it.key, <FeatureMock key={it.key} kind={it.key} m={m} />])) as Record<FeatureKey, React.ReactNode>} backdrop={<Mosaic cols={40} rows={16} className="fill-white opacity-50" />} />
    </section>
  );
}

/** D. Three big features as rows with a picture, sides alternating; the other three in a line below. */
export function FeaturesRows({ title, items, m }: Props) {
  const fills = ["bg-sun", "bg-sunken", "bg-lagoon"];
  const squares = ["fill-white opacity-50", "fill-sun opacity-70", "fill-white opacity-20"];
  return (
    <section className={wrap}>
      <h2 className={heading}>{title}</h2>
      <div className="mt-12 flex flex-col gap-6">
        {items.slice(0, 3).map((it, i) => (
          <div key={it.key} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
            <div className={`relative isolate flex min-h-64 items-center justify-center overflow-hidden rounded-[1.75rem] p-6 ${fills[i]} ${i % 2 ? "md:order-2" : ""}`}>
              <Mosaic cols={28} rows={12} className={squares[i]} />
              <div className="relative flex w-full justify-center">
                <FeatureMock kind={it.key} m={m} />
              </div>
            </div>
            <div className="flex flex-col gap-3 md:px-4">
              <h3 className="text-2xl display sm:text-4xl">{it.title}</h3>
              <p className="max-w-[44ch] text-lg text-ink-muted">{it.body}</p>
            </div>
          </div>
        ))}
        <ul className="mt-6 grid border-t border-line md:grid-cols-3">
          {items.slice(3).map((it) => {
            const Icon = ICONS[it.key];
            return (
              <li key={it.key} className="flex flex-col gap-2 border-b border-line py-6 md:border-b-0 md:border-e md:px-8 md:first:ps-0 md:last:border-e-0">
                <span className="flex items-center gap-2.5 text-lg font-semibold">
                  <Icon aria-hidden="true" className="size-5 shrink-0" />
                  {it.title}
                </span>
                <p className="text-ink-muted">{it.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** E. On ink: six quiet cards, icons on sun discs. Pairs with the dark steps section. */
export function FeaturesDark({ title, items }: Props) {
  return (
    <section className="bg-ink text-white">
      <div className={wrap}>
        <h2 className={`${heading} text-white`}>{title}</h2>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const Icon = ICONS[it.key];
            return (
              <li key={it.key} className="flex flex-col gap-3 rounded-3xl border border-white/15 bg-ink-hover p-6">
                <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-sun text-on-coral">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-xl font-semibold text-white">{it.title}</h3>
                <p className="text-sunken">{it.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** F. Editorial: six numbered lines in the serif face, the explanation beside each. No icons, no cards. */
export function FeaturesList({ title, items }: Props) {
  return (
    <section className={wrap}>
      <h2 className={heading}>{title}</h2>
      <ol className="mt-12 border-t border-line">
        {items.map((it, i) => (
          <li key={it.key} className="group grid gap-2 border-b border-line py-7 transition-colors hover:bg-white md:grid-cols-[4rem_1fr_1fr] md:items-baseline md:gap-8 md:px-4">
            <span aria-hidden="true" className="font-display font-bold text-ink-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="text-2xl display sm:text-4xl">
              <span className="bg-[linear-gradient(transparent_68%,var(--gojo-sun)_68%,var(--gojo-sun)_94%,transparent_94%)] bg-[length:0%_100%] bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_100%]">{it.title}</span>
            </h3>
            <p className="text-lg text-ink-muted">{it.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
