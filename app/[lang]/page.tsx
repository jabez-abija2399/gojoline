import { notFound } from "next/navigation";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { Steps } from "@/components/landing/steps";
import { Waitlist } from "@/components/landing/waitlist";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";

export default async function LandingPage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  return (
    <>
      <SiteHeader locale={lang} t={t} />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero t={t.landing.hero} />
        <Steps t={t.landing.steps} />
        <Features t={t.landing} />
        <Waitlist locale={lang} t={t.waitlist} />
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
