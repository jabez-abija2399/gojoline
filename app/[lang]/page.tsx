import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { looksSignedIn } from "@/lib/auth/signed-in";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Proof } from "@/components/landing/proof";
import { Steps } from "@/components/landing/steps";
import { Marquee } from "@/components/landing/marquee";
import { Compare } from "@/components/landing/compare";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { serif } from "@/lib/fonts-landing";
import { HERO_IDS, showcaseSites } from "@/lib/landing/showcase";
import { firstSections } from "@/lib/landing/hero-sections";
import { services } from "@/lib/server/services";
import { EXAMPLE_SLUG } from "@/lib/sites/slug";

export default async function LandingPage({ params, searchParams }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // Opening the installed app: signed-in owners go straight to their sites.
  const sp = await searchParams;
  if (sp.source === "app" && (await currentUser())) redirect(`/${lang}/build`);
  const t = getMessages(lang);
  const sites = showcaseSites(lang);
  const byId = new Map(sites.map((x) => [x.id, x]));
  const stageSites = HERO_IDS.flatMap((id) => {
    const x = byId.get(id);
    return x ? [{ id, label: t.landing.demo.labels[id], name: x.name, prompt: t.landing.demo.prompts[id], shot: x.brand ?? x.top, sections: firstSections(id, lang) }] : [];
  });
  // The same café, in both languages, for the language card.
  const cafe = { en: showcaseSites("en").find((s) => s.id === "cafe"), am: showcaseSites("am").find((s) => s.id === "cafe") };
  const sample = { en: { name: cafe.en?.name ?? "", tagline: cafe.en?.tagline ?? "" }, am: { name: cafe.am?.name ?? "", tagline: cafe.am?.tagline ?? "" } };
  const b = t.builder;
  const f = t.landing.features;
  const bot = services().telegram?.username ?? "gojoline_bot";
  const { prices } = await services().billing.settings();
  // The example address is built the way publishing builds real ones, and its name is reserved.
  const exampleAddress = (services().publish?.publisher.urlFor(EXAMPLE_SLUG) ?? `https://gojo-${EXAMPLE_SLUG}.vercel.app`).replace(/^https:\/\//, "");
  return (
    <>
      <div aria-hidden="true" className="read-progress" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 start-10 z-0 border-s border-line max-xl:hidden" />
      <div aria-hidden="true" className="pointer-events-none fixed inset-y-0 end-10 z-0 border-e border-line max-xl:hidden" />
      <SiteHeader locale={lang} t={t} nav />
      <main id="main" tabIndex={-1} className={`${serif.variable} focus:outline-none`}>
        <Hero
          live={t.landing.live}
          you={b.you}
          assistant={b.assistant}
          signedIn={await looksSignedIn()}
          t={t.landing.hero}
          locale={lang}
          sites={stageSites}
          install={t.pwa}
          promptTitle={t.landing.hero.promptTitle}
          templates={{ href: `/${lang}/templates`, label: t.landing.nav.seeTemplates }}
          text={{
            chipsLabel: t.landing.hero.chipsLabel,
            promptLabel: t.landing.hero.promptLabel,
            placeholder: t.landing.hero.placeholder,
            build: t.landing.hero.build,
            langTitle: b.startLang,
            langEn: b.langEn,
            langAm: b.langAm,
            langBoth: b.langBothShort,
            buildTitle: b.tlTitle,
            buildSteps: [b.tlUnderstand, b.tlWriting, b.tlChecking, b.tlReady],
            ready: b.readyTitle,
            publish: b.publish,
            chatPlaceholder: b.chatPlaceholder,
            showcaseLabel: t.landing.hero.showcaseLabel,
            picked: t.landing.hero.picked,
            pauseDemo: t.landing.hero.pauseDemo,
            noteTitle: t.landing.telegram.title,
            noteBody: t.landing.telegram.body,
            saved: b.versionSaved.replace("{n}", "1"),
          }}
        />
        <Proof t={t.landing} />
        <Marquee title={t.landing.marquee.title} names={t.builder.templates} pause={t.landing.marquee.pause} />
        <Steps t={t.landing} prompt={t.landing.demo.prompts.cafe} buildTitle={b.tlTitle} buildSteps={[b.tlUnderstand, b.tlWriting, b.tlChecking, b.tlReady]} bot={bot} site={{ name: stageSites[0]?.name ?? "", shot: stageSites[0]?.shot ?? { src: "", width: 1, height: 1 } }} address={exampleAddress} languages={`${b.langEn} · ${b.langAm}`} />
        <Compare t={t.landing.compare} message={t.landing.demo.prompts.cafe} shot={stageSites[0]?.shot ?? { src: "", width: 1, height: 1 }} />
        <Features
          title={f.title}
          items={(["language", "forms", "edits", "birr", "domain", "safe"] as const).map((key) => ({ key, title: f[key].title, body: f[key].body }))}
          m={{
            sample,
            langNames: f.language.names,
            noteTitle: t.landing.telegram.title,
            noteBody: t.landing.telegram.body,
            bot,
            ask: b.next.prices.label,
            saved: b.versionSaved.replace("{n}", "2"),
            plan: t.billing.plans.starter,
            price: `${new Intl.NumberFormat("en-US").format(prices.starter_month / 100)} ${t.landing.pricing.birr} ${t.landing.pricing.perMonth}`,
            address: exampleAddress,
            checking: b.tlChecking,
            ready: b.tlReady,
          }}
        />
        <Faq t={t.landing.faq} />
        <FinalCta t={t.landing.final} locale={lang} />
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
