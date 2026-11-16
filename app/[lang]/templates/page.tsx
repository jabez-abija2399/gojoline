import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/landing/final-cta";
import { Gallery } from "@/components/landing/gallery";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { serif } from "@/lib/fonts-landing";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { showcaseSites } from "@/lib/landing/showcase";

export async function generateMetadata({ params }: PageProps<"/[lang]/templates">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getMessages(lang).landing.gallery;
  return { title: t.title, description: t.intro };
}

/** The real starter sites: pick one, sign in, and it opens as your own. */
export default async function TemplatesPage({ params }: PageProps<"/[lang]/templates">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  return (
    <>
      <SiteHeader locale={lang} t={t} nav current="templates" />
      <main id="main" tabIndex={-1} className={`${serif.variable} flex-1 focus:outline-none`}>
        <Gallery t={t.landing.gallery} sites={showcaseSites(lang)} labels={t.builder.templates} locale={lang} />
        <FinalCta t={t.landing.final} locale={lang} />
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
