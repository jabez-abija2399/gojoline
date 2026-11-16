import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";
import { LanguageSwitch } from "./language-switch";
import { PhoneMenu } from "./phone-menu";
import { looksSignedIn } from "@/lib/auth/signed-in";

/** `nav` is the marketing pages' floating bar: Templates, How it works, Prices, Sign in. */
export async function SiteHeader({ locale, t, nav = false, current }: { locale: Locale; t: Messages; nav?: boolean; current?: "templates" | "pricing" }) {
  const other: Locale = locale === "en" ? "am" : "en";
  const logo = (
    <Link href={`/${locale}`} aria-label={t.common.homeLink} className="inline-flex min-h-11 items-center rounded-md">
      <Image src={locale === "am" ? "/brand/logo-am.svg" : "/brand/logo.svg"} alt={t.common.logoAlt} width={locale === "am" ? 137 : 164} height={42} priority className={nav ? "h-9 w-auto" : "h-[42px] w-auto"} />
    </Link>
  );
  const language = <LanguageSwitch target={other} label={t.common.languageSwitch} ariaLabel={t.common.languageSwitchLabel} />;
  // Signed in already: every way in goes to the owner's sites instead of the sign-in page.
  const signedIn = await looksSignedIn();
  const signIn = signedIn ? `/${locale}/build` : `/${locale}/sign-in?next=/${locale}/build`;
  const enterLabel = signedIn ? t.landing.nav.mySites : t.landing.nav.signIn;
  const startLabel = signedIn ? t.landing.nav.openApp : t.landing.nav.start;
  const links = [
    { href: `/${locale}/templates`, label: t.landing.nav.templates, key: "templates" },
    { href: `/${locale}#how`, label: t.landing.nav.how, key: "how" },
    { href: `/${locale}/pricing`, label: t.landing.nav.prices, key: "pricing" },
  ];
  // The marketing pages share one floating bar, as on the product sites these pages learn from.
  if (nav)
    return (
      <header className="sticky top-0 z-40 px-3 pt-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border border-line bg-white py-1.5 ps-4 pe-1.5 shadow-[0_8px_30px_-12px_rgb(18_18_18/0.25)]">
          {logo}
          <nav aria-label={t.landing.nav.label} className="hidden items-center md:flex">
            {links.map((l) => (
              <Link key={l.key} href={l.href} aria-current={current === l.key ? "page" : undefined} className="inline-flex min-h-11 items-center rounded-full px-3 font-medium text-ink hover:bg-sunken aria-[current=page]:bg-sunken">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href={signIn} className={`inline-flex min-h-11 items-center rounded-full px-3 font-medium text-ink hover:bg-sunken max-md:hidden ${signedIn ? "hidden" : ""}`}>
              {enterLabel}
            </Link>
            <span className="[&>a]:rounded-full [&>a]:border-0 [&>a]:px-3 [&>a]:hover:bg-sunken">{language}</span>
            <Link href={signIn} className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 font-medium text-white hover:bg-ink-hover max-md:hidden">
              {startLabel}
            </Link>
            {/* Phones: the page links and Sign in live behind one button. */}
            <PhoneMenu
              label={
                <>
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  </svg>
                  {t.landing.nav.menu}
                </>
              }
            >
              <nav aria-label={t.landing.nav.label} className="absolute end-0 top-full mt-3 flex w-60 flex-col gap-1 rounded-3xl border border-line bg-white p-2 shadow-xl">
                {[...links, ...(signedIn ? [] : [{ href: signIn, label: t.landing.nav.signIn, key: "signin" }])].map((l) => (
                  <Link key={l.key} href={l.href} aria-current={current === l.key ? "page" : undefined} className="flex min-h-11 items-center rounded-full px-4 font-medium text-ink hover:bg-sunken aria-[current=page]:bg-sunken">
                    {l.label}
                  </Link>
                ))}
                <Link href={signIn} className="flex min-h-11 items-center justify-center rounded-full bg-ink px-4 font-semibold text-white hover:bg-ink-hover">
                  {startLabel}
                </Link>
              </nav>
            </PhoneMenu>
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
