import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";
import { LanguageSwitch } from "./language-switch";

/** `nav` adds the landing page's own links (examples, how it works, prices) and Sign in. */
export function SiteHeader({ locale, t, nav = false }: { locale: Locale; t: Messages; nav?: boolean }) {
  const other: Locale = locale === "en" ? "am" : "en";
  return (
    <header className={nav ? "sticky top-0 z-40 border-b border-line bg-paper md:bg-paper/85 md:backdrop-blur-md" : "border-b border-line bg-paper/95"}>
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
        <div className="flex items-center gap-1 sm:gap-2">
          {nav && (
            <>
              <nav aria-label={t.landing.nav.label} className="hidden items-center md:flex">
                {(["examples", "how", "pricing"] as const).map((id) => (
                  <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-lg px-3 font-medium text-ink hover:bg-white hover:text-ink">
                    {id === "pricing" ? t.landing.nav.prices : t.landing.nav[id]}
                  </a>
                ))}
              </nav>
              <Link href={`/${locale}/sign-in?next=/${locale}/build`} className="inline-flex min-h-11 items-center rounded-lg px-2 font-medium text-ink hover:bg-white sm:px-3">
                {t.landing.nav.signIn}
              </Link>
            </>
          )}
          <LanguageSwitch target={other} label={t.common.languageSwitch} ariaLabel={t.common.languageSwitchLabel} />
        </div>
      </div>
    </header>
  );
}
