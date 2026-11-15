import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Waitlist } from "@/components/landing/waitlist";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/waitlist">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).waitlist.title : undefined };
}

/** For people who can't sign in yet (for example with a phone number): leave your details. */
export default async function WaitlistPage({ params }: PageProps<"/[lang]/waitlist">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  return (
    <>
      <SiteHeader locale={lang} t={t} />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Waitlist locale={lang} t={t.waitlist} />
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
