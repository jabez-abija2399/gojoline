"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreditCard, LayoutGrid, LayoutTemplate, LogOut, Menu, Plus, Sparkles, X } from "lucide-react";
import { InstallApp } from "@/components/pwa/install-app";
import { LanguageSwitch } from "@/components/site/language-switch";
import { signOut } from "@/lib/auth/actions";
import type { Locale } from "@/lib/i18n/config";

export interface SidebarText {
  sidebarLabel: string;
  mainNav: string;
  creditsChipLabel: string;
  menu: string;
  closeMenu: string;
  home: string;
  logoAlt: string;
  newSite: string;
  sites: string;
  templates: string;
  plan: string;
  recent: string;
  planBadge: string;
  /** Already worded for the number (plural, or "none left"). */
  creditsLeft: string;
  creditsShort: string;
  creditsHint: string;
  getMore: string;
  live: string;
  signOut: string;
  language: string;
  languageLabel: string;
  pwa: { install: string; iosTitle: string; iosSteps: string; close: string };
}

interface Props {
  locale: Locale;
  text: SidebarText;
  /** Name, phone or email: whichever the account has. */
  who: string;
  /** Null when the plan couldn't be read: the meter hides itself. */
  credits: number | null;
  monthly: number;
  recent: { id: string; name: string; live: boolean }[];
}

const item = "relative flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium text-ink transition-colors hover:bg-white aria-[current=page]:bg-white aria-[current=page]:font-semibold aria-[current=page]:shadow-sm aria-[current=page]:ring-1 aria-[current=page]:ring-line aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-2 aria-[current=page]:before:start-0 aria-[current=page]:before:w-[3px] aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-ink";

/**
 * The signed-in area's navigation: a column beside the page on large screens, a drawer
 * behind a Menu button on phones. Everything the owner can go to is here, in one place.
 */
export function Sidebar({ locale, text, who, credits, monthly, recent }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const asideRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const other: Locale = locale === "en" ? "am" : "en";
  const home = `/${locale}/build`;
  const billing = `/${locale}/billing`;
  const low = credits !== null && credits <= 3;
  const share = credits === null ? 0 : Math.max(0, Math.min(1, credits / Math.max(1, monthly)));

  // The open drawer is a modal: the page behind can't be reached, read or scrolled.
  useEffect(() => {
    if (!open) return;
    const behind = [headerRef.current, document.getElementById("app-content")].filter((el): el is HTMLElement => !!el);
    behind.forEach((el) => el.setAttribute("inert", ""));
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    asideRef.current?.querySelector<HTMLElement>("nav a")?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      menuRef.current?.focus();
    };
    document.addEventListener("keydown", escape);
    // Grown to a large screen: the drawer becomes the sidebar again.
    const wide = matchMedia("(min-width: 1024px)");
    const onWide = () => wide.matches && setOpen(false);
    wide.addEventListener("change", onWide);
    return () => {
      behind.forEach((el) => el.removeAttribute("inert"));
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", escape);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  /** Closed without going anywhere: focus goes back to the Menu button. */
  const dismiss = () => {
    setOpen(false);
    menuRef.current?.focus();
  };
  /** A link to a part of this page: close, then let the page move focus there. */
  const toSection = (hash: string) => (e: React.MouseEvent) => {
    setOpen(false);
    if (pathname !== home) return;
    e.preventDefault();
    if (hash) {
      if (location.hash === hash) window.dispatchEvent(new HashChangeEvent("hashchange"));
      else location.hash = hash;
    } else {
      document.getElementById("start-text")?.focus();
    }
  };
  const close = () => setOpen(false);
  const current = (href: string) => (pathname === href ? "page" : undefined);

  return (
    <>
      {/* Phones: one slim bar. The changes left are always in sight. */}
      <header ref={headerRef} className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-paper/95 px-2 py-1.5 backdrop-blur lg:hidden">
        <button ref={menuRef} type="button" aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen(true)} className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-ink hover:bg-sunken">
          <Menu aria-hidden="true" className="size-6" />
          <span className="sr-only">{text.menu}</span>
        </button>
        <Link href={home} aria-label={text.home} className="inline-flex min-h-11 items-center">
          <Image src={locale === "am" ? "/brand/logo-am.svg" : "/brand/logo.svg"} alt={text.logoAlt} width={125} height={32} className="h-8 w-auto" priority />
        </Link>
        {credits !== null && (
          <Link href={billing} className={`ms-auto inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold ${low ? "border-warning text-warning" : "border-line text-ink"} bg-white`}>
            <Sparkles aria-hidden="true" className="size-4" />
            <span aria-hidden="true">{text.creditsShort.replace("{n}", String(credits))}</span>
            <span className="sr-only">{text.creditsChipLabel.replace("{n}", String(credits))}</span>
          </Link>
        )}
      </header>
      {open && <div aria-hidden="true" onClick={dismiss} className="fixed inset-0 z-40 bg-ink/40 lg:hidden" />}
      <aside
        ref={asideRef}
        id="app-sidebar"
        aria-label={text.sidebarLabel}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        className={`flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-e border-line bg-sunken p-3 max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:z-50 max-lg:max-w-[86vw] max-lg:shadow-2xl max-lg:transition-transform lg:sticky lg:top-0 lg:h-dvh lg:w-64 ${open ? "" : "max-lg:invisible max-lg:-translate-x-full"}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2">
          <Link href={home} aria-label={text.home} onClick={close} className="inline-flex min-h-11 items-center px-1">
            <Image src={locale === "am" ? "/brand/logo-am.svg" : "/brand/logo.svg"} alt={text.logoAlt} width={125} height={32} className="h-8 w-auto" />
          </Link>
          <button type="button" onClick={dismiss} className="inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-white lg:hidden">
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">{text.closeMenu}</span>
          </button>
        </div>

        <nav aria-label={text.mainNav} className="flex shrink-0 flex-col gap-1">
          <Link href={home} onClick={toSection("")} aria-current={current(home)} className={item}>
            <Plus aria-hidden="true" className="size-5 shrink-0" />
            {text.newSite}
          </Link>
          <Link href={`${home}#sites`} onClick={toSection("#sites")} className={item}>
            <LayoutGrid aria-hidden="true" className="size-5 shrink-0" />
            {text.sites}
          </Link>
          <Link href={`${home}#templates`} onClick={toSection("#templates")} className={item}>
            <LayoutTemplate aria-hidden="true" className="size-5 shrink-0" />
            {text.templates}
          </Link>
          <Link href={billing} onClick={close} aria-current={current(billing)} className={item}>
            <CreditCard aria-hidden="true" className="size-5 shrink-0" />
            {text.plan}
          </Link>
        </nav>

        {recent.length > 0 && (
          <div className="flex min-h-24 flex-1 flex-col gap-1 overflow-hidden">
            <p id="recent-title" className="px-3 text-sm font-semibold text-ink-muted">
              {text.recent}
            </p>
            <ul aria-labelledby="recent-title" className="-mx-1 flex min-h-0 flex-col overflow-y-auto px-1 pb-3 [mask-image:linear-gradient(to_bottom,black_calc(100%-1rem),transparent)]">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link href={`${home}/${p.id}`} onClick={close} aria-current={pathname === `${home}/${p.id}` ? "page" : undefined} className={`${item} gap-2.5`}>
                    <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-line font-display text-sm font-bold text-ink">
                      {[...p.name.trim()][0]?.toUpperCase() ?? "·"}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {p.live && (
                      <span className="flex shrink-0 items-center" title={text.live}>
                        <span aria-hidden="true" className="size-2 rounded-full bg-lagoon" />
                        <span className="sr-only">{text.live}</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto flex shrink-0 flex-col gap-3">
          {credits !== null && (
            <section aria-labelledby="credits-title" className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-3">
              <span className="w-fit rounded-full bg-sunken px-2.5 py-0.5 text-sm font-medium text-ink">{text.planBadge}</span>
              <p id="credits-title" className={`flex items-center gap-2 font-semibold ${low ? "text-warning" : "text-ink"}`}>
                <Sparkles aria-hidden="true" className="size-4 shrink-0" />
                {text.creditsLeft}
              </p>
              <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-sunken">
                <span className={`block h-full rounded-full ${low ? "bg-warning" : "bg-ink"}`} style={{ width: `${Math.round(share * 100)}%` }} />
              </span>
              <p className="text-sm text-ink-muted [@media(max-height:720px)]:hidden">{text.creditsHint.replace("{total}", String(monthly))}</p>
              <Link href={billing} onClick={close} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-ink px-4 font-medium text-white transition-colors hover:bg-ink-hover">
                {text.getMore}
              </Link>
            </section>
          )}
          <InstallApp t={text.pwa} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-medium text-ink hover:bg-white" />
          <div className="flex items-center gap-2 border-t border-line pt-3">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink font-display font-bold text-white">
              {[...who.trim()][0]?.toUpperCase() ?? "G"}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink" title={who}>
              {who}
            </span>
            <LanguageSwitch target={other} label={text.language} ariaLabel={text.languageLabel} />
          </div>
          <form action={signOut}>
            <input type="hidden" name="lang" value={locale} />
            <button type="submit" className={`${item} w-full text-ink-muted`}>
              <LogOut aria-hidden="true" className="size-5 shrink-0" />
              {text.signOut}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
