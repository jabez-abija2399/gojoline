import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Gallery } from "@/components/landing/gallery";
import { Hero } from "@/components/landing/hero";
import { Pricing } from "@/components/landing/pricing";
import { Proof } from "@/components/landing/proof";
import { Steps } from "@/components/landing/steps";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { HERO_IDS, showcaseSites } from "@/lib/landing/showcase";
import { services } from "@/lib/server/services";

export default async function LandingPage({ params, searchParams }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // Opening the installed app: signed-in owners go straight to their sites.
  if ((await searchParams).source === "app" && (await currentUser())) redirect(`/${lang}/build`);
  const t = getMessages(lang);
  const { prices } = await services().billing.settings();
  const sites = showcaseSites(lang);
  const ideas = HERO_IDS.map((id) => ({ id, label: t.landing.demo.labels[id], prompt: t.landing.demo.prompts[id] }));
  // The same café, in both languages, for the language card.
  const cafe = { en: showcaseSites("en").find((s) => s.id === "cafe"), am: showcaseSites("am").find((s) => s.id === "cafe") };
  const sample = { en: { name: cafe.en?.name ?? "", tagline: cafe.en?.tagline ?? "" }, am: { name: cafe.am?.name ?? "", tagline: cafe.am?.tagline ?? "" } };
  const b = t.builder;
  return (
    <>
      <SiteHeader locale={lang} t={t} nav />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero
          t={t.landing.hero}
          locale={lang}
          ideas={ideas}
          install={t.pwa}
          text={{
            promptLabel: t.landing.hero.promptLabel,
            placeholder: b.startPlaceholder,
            pick: t.landing.demo.pick,
            build: t.landing.hero.build,
            langTitle: b.startLang,
            langEn: b.langEn,
            langAm: b.langAm,
            langBoth: b.langBothShort,
          }}
        />
        <Proof t={t.landing} />
        <Gallery t={t.landing.gallery} sites={sites} labels={b.templates} locale={lang} />
        <Steps t={t.landing} prompt={t.landing.demo.prompts.cafe} buildTitle={b.tlTitle} buildSteps={[b.tlUnderstand, b.tlWriting, b.tlChecking, b.tlReady]} bot={services().telegram?.username ?? "gojoline_bot"} />
        <Features t={t.landing} sample={sample} />
        <Pricing t={t.landing.pricing} planNames={t.billing.plans} prices={{ starter: prices.starter_month, business: prices.business_month }} locale={lang} />
        <Faq t={t.landing.faq} />
        <FinalCta t={t.landing.final} locale={lang} />
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
