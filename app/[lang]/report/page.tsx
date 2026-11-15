import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuilderHeader } from "@/components/builder/builder-header";
import { ReportForm } from "@/components/safety/report-form";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/report">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).safety.reportMetaTitle : undefined, robots: { index: false } };
}

export default async function ReportPage({ params, searchParams }: PageProps<"/[lang]/report">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const raw = (await searchParams).site;
  const site = typeof raw === "string" ? raw.slice(0, 300) : "";
  const t = getMessages(lang);
  return (
    <>
      <BuilderHeader locale={lang} t={t} />
      <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-10">
        <h1 className="text-3xl font-bold">{t.safety.reportTitle}</h1>
        <p className="text-ink-muted">{t.safety.reportIntro}</p>
        <ReportForm t={t.safety} site={site} home={`/${lang}`} />
      </main>
    </>
  );
}
