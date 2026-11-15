import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";
import { LanguageSwitch } from "./language-switch";

export function SiteHeader({ locale, t }: { locale: Locale; t: Messages }) {
  const other: Locale = locale === "en" ? "am" : "en";
  return (
    <header className="border-b border-line bg-sand/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={`/${locale}`} aria-label={t.common.homeLink} className="inline-flex min-h-11 items-center rounded-md">
          <Image
            src={locale === "am" ? "/brand/logo-am.svg" : "/brand/logo.svg"}
            alt={t.common.logoAlt}
            width={locale === "am" ? 137 : 164}
            height={42}
            priority
            className="h-[42px] w-auto"
          />
        </Link>
        <LanguageSwitch target={other} label={t.common.languageSwitch} ariaLabel={t.common.languageSwitchLabel} />
      </div>
    </header>
  );
}
