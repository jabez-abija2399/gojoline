import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { templatePreview } from "@/lib/landing/template-preview";

/**
 * Header and footer around a template's page, and the check that the template exists. The check
 * sits here, above loading.tsx, so an unknown template answers 404 before anything streams.
 */
export default async function TemplateLayout({ children, params }: LayoutProps<"/[lang]/templates/[id]">) {
  const { lang, id } = await params;
  if (!isLocale(lang) || !templatePreview(id, lang)) notFound();
  const t = getMessages(lang);
  return (
    <>
      <SiteHeader locale={lang} t={t} nav current="templates" />
      {children}
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
