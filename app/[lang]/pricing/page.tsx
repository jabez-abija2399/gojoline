import type { Metadata } from "next";
import { looksSignedIn } from "@/lib/auth/signed-in";
import { notFound } from "next/navigation";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { Pricing } from "@/components/landing/pricing";
import { periodFrom } from "@/components/pricing/billing-toggle";
import { PlanComparison } from "@/components/pricing/plan-comparison";
import { PricingExtras, PricingNotes } from "@/components/pricing/pricing-extras";
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
  // One address for search engines, whichever billing period is shown.
  return { title: t.title, description: t.intro, alternates: { canonical: `/${lang}/pricing` } };
}

/** Plans and prices in Birr (live from Admin → Settings), the full comparison, extras and questions. */
export default async function PricingPage({ params, searchParams }: PageProps<"/[lang]/pricing">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const period = periodFrom((await searchParams).billing);
  const t = getMessages(lang);
  const { prices } = await services().billing.settings();
  return (
    <>
      <SiteHeader locale={lang} t={t} nav current="pricing" />
      <main id="main" tabIndex={-1} className={`${serif.variable} flex-1 focus:outline-none`}>
        <Pricing t={t} locale={lang} prices={prices} period={period} />
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-6 md:py-12">
          <PlanComparison t={t.plans.compare} planNames={t.billing.plans} />
          <PricingNotes t={t.plans.notes} />
          <PricingExtras t={t.plans.extras} locale={lang} topupMinor={prices.topup} topupHref={(await looksSignedIn()) ? `/${lang}/billing` : undefined} />
        </div>
        <Faq t={t.landing.faq} />
        <FinalCta t={t.landing.final} locale={lang} />
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
