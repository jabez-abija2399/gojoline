import Link from "next/link";
import { lang as rootLang } from "next/root-params";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";

export default async function NotFound() {
  const value = await rootLang();
  const locale = isLocale(value) ? value : defaultLocale;
  const t = getMessages(locale);
  return (
    <main id="main" className="mx-auto flex max-w-xl flex-1 flex-col items-start justify-center gap-4 px-4 py-24">
      <h1 className="text-3xl font-bold">{t.errors.notFoundTitle}</h1>
      <p className="text-ink-muted">{t.errors.notFoundBody}</p>
      <Link href={`/${locale}`} className="inline-flex min-h-11 items-center rounded-lg bg-teal px-5 font-medium text-white hover:bg-teal-deep">
        {t.errors.backHome}
      </Link>
    </main>
  );
}
