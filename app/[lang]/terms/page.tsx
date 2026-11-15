import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { legal } from "@/lib/i18n/messages/legal";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: legal[lang].terms.title, alternates: { languages: { en: "/en/terms", am: "/am/terms" } } };
}

export default async function Page({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <LegalPage locale={lang} t={getMessages(lang)} doc={legal[lang].terms} />;
}
