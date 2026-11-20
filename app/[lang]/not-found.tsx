import Link from "next/link";
import { lang as rootLang } from "next/root-params";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { SiteHeader } from "@/components/site/site-header";

/** Any address no page matches, in the visitor's language, with the way home and the way to start. */
export default async function NotFound() {
  const value = await rootLang();
  const locale = isLocale(value) ? value : defaultLocale;
  const t = getMessages(locale);
  return (
    <>
      <SiteHeader locale={locale} t={t} />
      <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-4 px-4 py-16 sm:py-24">
        <p className="font-display text-6xl font-bold text-link" aria-hidden="true">404</p>
        <h1 className="font-display text-3xl font-bold">{t.errors.notFoundTitle}</h1>
        <p className="text-ink-muted">{t.errors.notFoundBody}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href={`/${locale}`} className="inline-flex min-h-11 items-center rounded-lg bg-coral px-5 font-medium text-on-coral hover:bg-coral-hover">
            {t.errors.backHome}
          </Link>
          <Link href={`/${locale}/templates`} className="inline-flex min-h-11 items-center rounded-lg border border-line px-5 font-medium hover:border-faint">
            {t.landing.nav.templates}
          </Link>
        </div>
      </main>
    </>
  );
}
