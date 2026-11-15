import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Features } from "@/components/landing/features";
import { FeaturesDark, FeaturesHairline, FeaturesList, FeaturesRows, FeaturesTabs, type FeatureItem, type MockText } from "@/components/landing/feature-options";
import { SiteHeader } from "@/components/site/site-header";
import { serif } from "@/lib/fonts-landing";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { showcaseSites } from "@/lib/landing/showcase";
import { services } from "@/lib/server/services";
import { EXAMPLE_SLUG } from "@/lib/sites/slug";

export const metadata: Metadata = { title: "Features: design options", robots: { index: false, follow: false } };

// For the founder only: names of the options being compared. Not part of the product's UI.
const OPTIONS = [
  ["A", "Bento", "Unequal cards; the language card has a working switch. This is what the landing page has now."],
  ["B", "Hairline grid", "Six plain cells between thin lines. Calm and quick to scan; no pictures."],
  ["C", "Tabs with a showcase", "A list on the left; picking a feature shows its piece of the product on a sun panel."],
  ["D", "Alternating rows", "Three big features with a picture each, sides alternating; three more in a line below."],
  ["E", "Dark cards", "Six quiet cards on ink, icons on sun discs."],
  ["F", "Editorial list", "Six numbered lines in the serif face with the explanation beside each. Hover underlines in sun."],
] as const;

/** Every design option for the landing page's features section, one under another, with real content. */
export default async function FeaturesPreview({ params }: PageProps<"/[lang]/preview/features">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  const f = t.landing.features;
  const b = t.builder;
  const { prices } = await services().billing.settings();
  const cafe = { en: showcaseSites("en").find((s) => s.id === "cafe"), am: showcaseSites("am").find((s) => s.id === "cafe") };
  const sample = { en: { name: cafe.en?.name ?? "", tagline: cafe.en?.tagline ?? "" }, am: { name: cafe.am?.name ?? "", tagline: cafe.am?.tagline ?? "" } };
  const items: FeatureItem[] = [
    { key: "language", title: f.language.title, body: f.language.body },
    { key: "forms", title: f.forms.title, body: f.forms.body },
    { key: "edits", title: f.edits.title, body: f.edits.body },
    { key: "birr", title: f.birr.title, body: f.birr.body },
    { key: "domain", title: f.domain.title, body: f.domain.body },
    { key: "safe", title: f.safe.title, body: f.safe.body },
  ];
  const m: MockText = {
    sample,
    langNames: f.language.names,
    noteTitle: t.landing.telegram.title,
    noteBody: t.landing.telegram.body,
    bot: services().telegram?.username ?? "gojoline_bot",
    ask: b.next.prices.label,
    saved: b.versionSaved.replace("{n}", "2"),
    plan: t.billing.plans.starter,
    price: `${new Intl.NumberFormat("en-US").format(prices.starter_month / 100)} ${t.landing.pricing.birr} ${t.landing.pricing.perMonth}`,
    address: (services().publish?.publisher.urlFor(EXAMPLE_SLUG) ?? `https://gojo-${EXAMPLE_SLUG}.vercel.app`).replace(/^https:\/\//, ""),
    checking: b.tlChecking,
    ready: b.tlReady,
  };
  const props = { title: f.title, items, m };
  const views = [<Features key="a" t={t.landing} sample={sample} />, <FeaturesHairline key="b" {...props} />, <FeaturesTabs key="c" {...props} />, <FeaturesRows key="d" {...props} />, <FeaturesDark key="e" {...props} />, <FeaturesList key="f" {...props} />];
  return (
    <>
      <SiteHeader locale={lang} t={t} nav />
      <main id="main" tabIndex={-1} className={`${serif.variable} flex-1 focus:outline-none`}>
        <h1 className="sr-only">Features: design options</h1>
        {OPTIONS.map(([letter, name, note], i) => (
          <div key={letter} id={`option-${letter.toLowerCase()}`} lang="en" className="scroll-mt-24">
            <div className="border-y border-line bg-white">
              <p className="mx-auto flex max-w-6xl flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-4 sm:px-6">
                <span className="rounded-full bg-ink px-3 py-1 font-display font-bold text-white">Option {letter}</span>
                <strong className="text-lg">{name}</strong>
                <span className="text-ink-muted">{note}</span>
              </p>
            </div>
            <div lang={lang}>{views[i]}</div>
          </div>
        ))}
      </main>
    </>
  );
}
