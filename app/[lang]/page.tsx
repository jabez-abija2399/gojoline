import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Pricing } from "@/components/landing/pricing";
import { Steps } from "@/components/landing/steps";
import { Templates } from "@/components/landing/templates";
import { Waitlist } from "@/components/landing/waitlist";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { showcaseSites } from "@/lib/landing/showcase";
import { services } from "@/lib/server/services";

export default async function LandingPage({ params, searchParams }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // Opening the installed app: signed-in owners go straight to their sites.
  if ((await searchParams).source === "app" && (await currentUser())) redirect(`/${lang}/build`);
  const t = getMessages(lang);
  const { prices } = await services().billing.settings();
  return (
    <>
      <SiteHeader locale={lang} t={t} />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero t={t.landing} locale={lang} sites={showcaseSites(lang)} install={t.pwa} />
        <Steps t={t.landing} />
        <Features t={t.landing} />
        <Templates t={t.landing.templates} names={t.builder.templates} locale={lang} />
        <Pricing t={t.landing.pricing} planNames={t.billing.plans} prices={{ starter: prices.starter_month, business: prices.business_month }} locale={lang} />
        <Faq t={t.landing.faq} />
        <FinalCta t={t.landing.final} locale={lang} />
        <Waitlist locale={lang} t={t.waitlist} />
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
