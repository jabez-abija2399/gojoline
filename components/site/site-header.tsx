import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";
import { LanguageSwitch } from "./language-switch";

/** `nav` adds the landing page's own links (examples, how it works, prices) and Sign in. */
export function SiteHeader({ locale, t, nav = false }: { locale: Locale; t: Messages; nav?: boolean }) {
  const other: Locale = locale === "en" ? "am" : "en";
  const logo = (
    <Link href={`/${locale}`} aria-label={t.common.homeLink} className="inline-flex min-h-11 items-center rounded-md">
      <Image src={locale === "am" ? "/brand/logo-am.svg" : "/brand/logo.svg"} alt={t.common.logoAlt} width={locale === "am" ? 137 : 164} height={42} priority className={nav ? "h-9 w-auto" : "h-[42px] w-auto"} />
    </Link>
  );
  const language = <LanguageSwitch target={other} label={t.common.languageSwitch} ariaLabel={t.common.languageSwitchLabel} />;
  const signIn = `/${locale}/sign-in?next=/${locale}/build`;
  // Landing page: one floating bar, as on the product sites this page learns from.
  if (nav)
    return (
      <header className="sticky top-0 z-40 px-3 pt-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border border-line bg-white py-1.5 ps-4 pe-1.5 shadow-[0_8px_30px_-12px_rgb(18_18_18/0.25)]">
          {logo}
          <nav aria-label={t.landing.nav.label} className="hidden items-center md:flex">
            {(["examples", "how", "pricing"] as const).map((id) => (
              <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-full px-3 font-medium text-ink hover:bg-sunken">
                {id === "pricing" ? t.landing.nav.prices : t.landing.nav[id]}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href={signIn} className="inline-flex min-h-11 items-center rounded-full px-3 font-medium text-ink hover:bg-sunken max-sm:hidden">
              {t.landing.nav.signIn}
            </Link>
            <span className="[&>a]:rounded-full [&>a]:border-0 [&>a]:px-3 [&>a]:hover:bg-sunken">{language}</span>
            <Link href={signIn} className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 font-medium text-white hover:bg-ink-hover">
              <span className="sm:hidden">{t.landing.nav.signIn}</span>
              <span className="max-sm:hidden">{t.landing.nav.start}</span>
            </Link>
          </div>
        </div>
      </header>
    );
  return (
    <header className="border-b border-line bg-paper/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {logo}
        {language}
      </div>
    </header>
  );
}
