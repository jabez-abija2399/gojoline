import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BuilderHeader } from "@/components/builder/builder-header";
import { AccessForm } from "@/components/builder/access-form";
import { hasBuilderAccess } from "@/lib/builder/access";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";

export const metadata: Metadata = { robots: { index: false } };

export default async function AccessPage({ params }: PageProps<"/[lang]/build/access">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  if (await hasBuilderAccess()) redirect(`/${lang}/build`);
  const t = getMessages(lang);
  return (
    <>
      <BuilderHeader locale={lang} t={t} />
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-16">
        <h1 className="text-3xl font-bold">{t.builder.accessTitle}</h1>
        <p className="text-ink-muted">{t.builder.accessBody}</p>
        <AccessForm locale={lang} t={t.builder} />
      </main>
    </>
  );
}
