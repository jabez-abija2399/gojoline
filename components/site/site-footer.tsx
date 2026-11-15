import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import { format, type Messages } from "@/lib/i18n";

export function SiteFooter({ locale, t }: { locale: Locale; t: Messages }) {
  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2">
          <Image
            src={locale === "am" ? "/brand/logo-am-reversed.svg" : "/brand/logo-reversed.svg"}
            alt={t.common.logoAlt}
            width={locale === "am" ? 118 : 141}
            height={36}
            className="h-9 w-auto"
          />
          <p className="text-sunken">{t.footer.tagline}</p>
        </div>
        <div className="flex flex-col gap-1 text-sunken sm:items-end">
          <nav aria-label={t.footer.linksLabel} className="flex flex-wrap gap-x-4">
            {(["privacy", "terms", "report"] as const).map((k) => (
              <a key={k} href={`/${locale}/${k}`} className="inline-flex min-h-11 items-center text-white underline underline-offset-4 hover:text-sunken">
                {t.footer[k]}
              </a>
            ))}
          </nav>
          <p>{t.footer.madeIn}</p>
          <p>{format(t.footer.rights, { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
