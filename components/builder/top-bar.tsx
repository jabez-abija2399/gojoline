"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CreditCard, LayoutDashboard, LogOut, MoreVertical } from "lucide-react";
import { LanguageSwitch } from "@/components/site/language-switch";
import { signOut } from "@/lib/auth/actions";
import type { Locale } from "@/lib/i18n/config";
import type { Theme } from "@/lib/app/theme-shared";
import { ThemeSwitch } from "@/components/app/theme-switch";

/** Words for the bar, picked on the server so the client gets only what it shows. */
export interface TopBarText {
  home: string;
  logoAlt: string;
  back: string;
  dashboard: string;
  plan: string;
  signOut: string;
  signedInAs: string;
  language: string;
  languageLabel: string;
  more: string;
  theme: string;
  themes: Record<Theme, string>;
  themeValue: Theme;
}

interface Props {
  locale: Locale;
  projectId: string;
  text: TopBarText;
  siteName: string;
  status: React.ReactNode;
  publish: React.ReactNode;
}

const quiet = "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-2 text-sm font-medium lg:min-h-9 lg:min-w-9 transition-colors hover:bg-paper";

/** One bar for the whole builder: where you are, the site's status, Publish, and the rest. */
export function TopBar({ locale, projectId, text, siteName, status, publish }: Props) {
  const other: Locale = locale === "en" ? "am" : "en";
  const language = <LanguageSwitch target={other} label={text.language} ariaLabel={text.languageLabel} />;
  const signOutForm = (className: string, icon: boolean) => (
    <form action={signOut}>
      <input type="hidden" name="lang" value={locale} />
      <button type="submit" title={text.signedInAs} className={className}>
        {icon && <LogOut aria-hidden="true" className="size-5 shrink-0" />}
        {text.signOut}
      </button>
    </form>
  );

  return (
    <header className="relative z-20 flex items-center gap-1 border-b border-line bg-white px-2 py-1.5 sm:gap-2 sm:px-4">
      <Link href={`/${locale}`} aria-label={text.home} className="hidden min-h-11 min-w-11 shrink-0 items-center justify-center lg:inline-flex">
        <Image src="/brand/mark.svg" alt={text.logoAlt} width={36} height={36} className="size-9" />
      </Link>
      <Link href={`/${locale}/build`} aria-label={text.back} className={`${quiet} shrink-0 text-ink`}>
        <ArrowLeft aria-hidden="true" className="size-5" />
        <span className="hidden xl:inline">{text.back}</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-center ps-1 leading-tight">
        <p className="truncate font-display text-sm font-semibold text-ink sm:text-base">{siteName}</p>
        {status}
      </div>
      <Link href={`/${locale}/dashboard/${projectId}`} className={`${quiet} shrink-0 text-ink max-sm:hidden sm:px-3`}>
        <LayoutDashboard aria-hidden="true" className="size-5 lg:hidden" />
        <span className="sr-only lg:not-sr-only">{text.dashboard}</span>
      </Link>
      {publish}
      <MoreMenu label={text.more}>
        <Link href={`/${locale}/dashboard/${projectId}`} className={`${quiet} justify-start px-3 text-ink sm:hidden`}>
          <LayoutDashboard aria-hidden="true" className="size-5 shrink-0 text-ink" />
          {text.dashboard}
        </Link>
        <Link href={`/${locale}/billing`} className={`${quiet} justify-start px-3 text-ink`}>
          <CreditCard aria-hidden="true" className="size-5 shrink-0 text-ink" />
          {text.plan}
        </Link>
        {signOutForm(`${quiet} w-full justify-start px-3 text-ink`, true)}
        <div className="border-t border-line pt-1">
          <ThemeSwitch initial={text.themeValue} label={text.theme} names={text.themes} />
        </div>
        <div className="border-t border-line pt-2">{language}</div>
      </MoreMenu>
    </header>
  );
}

/** The less-used links live behind one button, so Publish is the only loud thing in the bar. */
function MoreMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative shrink-0"
      onBlur={(e) => {
        // Tabbing out closes the menu, so it never covers what has focus.
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button ref={buttonRef} type="button" aria-expanded={open} aria-controls="builder-more" onClick={() => setOpen((o) => !o)} className={`${quiet} text-ink aria-expanded:bg-paper`}>
        <MoreVertical aria-hidden="true" className="size-5" />
        <span className="sr-only">{label}</span>
      </button>
      <div id="builder-more" hidden={!open} className="absolute end-0 top-full z-30 mt-2 flex w-56 animate-[pop-in_0.15s_ease-out] flex-col gap-1 rounded-2xl border border-line bg-white p-2 shadow-xl">
        {children}
      </div>
    </div>
  );
}
