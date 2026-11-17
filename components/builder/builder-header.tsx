import Image from "next/image";
import Link from "next/link";
import { CreditCard, LayoutDashboard, LogOut } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/site/language-switch";
import type { CurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { readTheme } from "@/lib/app/theme";
import { ThemeToggle } from "@/components/site/theme-toggle";

export async function BuilderHeader({
  locale,
  t,
  backHref,
  backLabel,
  user,
  navLinks = [],
}: {
  locale: Locale;
  t: Messages;
  backHref?: string;
  backLabel?: string;
  user?: CurrentUser | null;
  navLinks?: { href: string; label: string; icon: "dashboard" | "plan" }[];
}) {
  const other: Locale = locale === "en" ? "am" : "en";
  const theme = await readTheme();
  return (
    <header className="flex items-center justify-between gap-2 border-b border-line bg-white px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link href={`/${locale}`} aria-label={t.common.homeLink} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center">
          <Image src="/brand/mark.svg" alt={t.common.logoAlt} width={36} height={36} className="size-9" />
        </Link>
        {backHref && (
          <Link href={backHref} aria-label={backLabel} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-2 font-medium text-ink hover:bg-paper">
            <span aria-hidden="true">←</span>
            <span className="ms-1 hidden sm:inline">{backLabel}</span>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        {navLinks.map((link) => {
          const Icon = link.icon === "plan" ? CreditCard : LayoutDashboard;
          return (
            <Link key={link.href} href={link.href} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-2 font-medium text-ink hover:bg-paper sm:px-3">
              <Icon aria-hidden="true" className="size-5 sm:hidden" />
              <span className="sr-only sm:not-sr-only">{link.label}</span>
            </Link>
          );
        })}
        {user && (
          <form action={signOut}>
            <input type="hidden" name="lang" value={locale} />
            <button
              type="submit"
              title={t.auth.signedInAs.replace("{who}", user.name || user.phone || user.email || "")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center whitespace-nowrap rounded-lg px-2 font-medium text-ink-muted hover:bg-paper sm:px-3"
            >
              <LogOut aria-hidden="true" className="size-5 sm:hidden" />
              <span className="sr-only sm:not-sr-only">{t.auth.signOut}</span>
            </button>
          </form>
        )}
        <ThemeToggle initial={theme} label={t.landing.nav.darkMode} />
        <LanguageSwitch target={other} label={t.common.languageSwitch} ariaLabel={t.common.languageSwitchLabel} />
      </div>
    </header>
  );
}
