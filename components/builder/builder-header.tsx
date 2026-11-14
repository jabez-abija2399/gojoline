import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/site/language-switch";

export function BuilderHeader({ locale, t, backHref, backLabel }: { locale: Locale; t: Messages; backHref?: string; backLabel?: string }) {
  const other: Locale = locale === "en" ? "am" : "en";
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <Link href={`/${locale}`} aria-label={t.common.homeLink} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center">
          <Image src="/brand/mark.svg" alt={t.common.logoAlt} width={36} height={36} className="size-9" />
        </Link>
        {backHref && (
          <Link href={backHref} className="inline-flex min-h-11 items-center truncate rounded-lg px-2 font-medium text-ink hover:bg-sand">
            ← {backLabel}
          </Link>
        )}
      </div>
      <LanguageSwitch target={other} label={t.common.languageSwitch} ariaLabel={t.common.languageSwitchLabel} />
    </header>
  );
}
