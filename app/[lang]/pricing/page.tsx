import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Pricing } from "@/components/landing/pricing";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { serif } from "@/lib/fonts-landing";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";

export async function generateMetadata({ params }: PageProps<"/[lang]/pricing">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getMessages(lang).landing.pricing;
  return { title: t.title, description: t.intro };
}

/** Plans and prices in Birr (live from Admin → Settings), with the common questions. */
export default async function PricingPage({ params }: PageProps<"/[lang]/pricing">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  const { prices } = await services().billing.settings();
  return (
    <>
      <SiteHeader locale={lang} t={t} nav current="pricing" />
      <main id="main" tabIndex={-1} className={`${serif.variable} flex-1 focus:outline-none`}>
        <Pricing navSites={t.landing.nav.mySites} t={t.landing.pricing} planNames={t.billing.plans} prices={{ starter: prices.starter_month, business: prices.business_month }} locale={lang} />
        <Faq t={t.landing.faq} />
        <FinalCta t={t.landing.final} locale={lang} />
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
