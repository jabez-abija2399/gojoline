"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronsUpDown,
  CreditCard,
  Globe,
  LayoutGrid,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquareHeart,
  Plus,
  Sparkles,
  X,
  Zap,
  UserPlus,
} from "lucide-react";
import { InstallApp } from "@/components/pwa/install-app";
import { LanguageSwitch } from "@/components/site/language-switch";
import { signOut } from "@/lib/auth/actions";
import type { Theme } from "@/lib/app/theme-shared";
import { ThemeSwitch } from "./theme-switch";
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
  upgrade: string;
  accountMenu: string;
  live: string;
  signOut: string;
  language: string;
  languageLabel: string;
  pwa: { install: string; iosTitle: string; iosSteps: string; close: string };
  feedback: string;
  /** "Guide": how to use Gojoline, step by step with a video. */
  guide: string;
  /** "Invite a business": the owner's invite link on the Plan page. */
  invite: string;
  /** Already worded for the number; empty when there is no unread reply. */
  feedbackUnread: string;
}

interface Props {
  locale: Locale;
  text: SidebarText;
  /** Name, phone or email: whichever the account has. */
  who: string;
  /** Null when the plan couldn't be read: the meter hides itself. */
  credits: number | null;
  monthly: number;
  theme: { value: Theme; label: string; names: Record<Theme, string> };
  /** A bigger plan exists: the card says Upgrade. */
  canUpgrade: boolean;
  recent: { id: string; name: string; live: boolean }[];
  /** Replies from the team the owner hasn't seen. */
  feedbackUnread: number;
}

const item =
  "relative flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-ink lg:min-h-9 transition-colors hover:bg-white aria-[current=page]:bg-white aria-[current=page]:font-semibold aria-[current=page]:shadow-sm aria-[current=page]:ring-1 aria-[current=page]:ring-line aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-2 aria-[current=page]:before:start-0 aria-[current=page]:before:w-[3px] aria-[current=page]:before:rounded-full aria-[current=page]:before:bg-ink";

/**
 * The signed-in area's navigation: a column beside the page on large screens, a drawer
 * behind a Menu button on phones. Everything the owner can go to is here, in one place.
 */
export function Sidebar({
  locale,
  text,
  who,
  credits,
  monthly,
  canUpgrade,
  recent,
  theme,
  feedbackUnread,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const asideRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const other: Locale = locale === "en" ? "am" : "en";
  const home = `/${locale}/build`;
  const billing = `/${locale}/billing`;
  const feedbackPath = `/${locale}/feedback`;
  const guidePath = `/${locale}/guide`;
  // The page it was sent from goes along, so the team knows where it happened.
  const feedbackHref =
    pathname && pathname !== feedbackPath
      ? `${feedbackPath}?from=${encodeURIComponent(pathname)}`
      : feedbackPath;
  const low = credits !== null && credits <= 3;
  const share =
    credits === null
      ? 0
      : Math.max(0, Math.min(1, credits / Math.max(1, monthly)));

  // The open drawer is a modal: the page behind can't be reached, read or scrolled.
  useEffect(() => {
    if (!open) return;
    const behind = [
      headerRef.current,
      document.getElementById("app-content"),
    ].filter((el): el is HTMLElement => !!el);
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
      if (location.hash === hash)
        window.dispatchEvent(new HashChangeEvent("hashchange"));
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
      <header
        ref={headerRef}
        className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-paper/95 px-2 py-1.5 backdrop-blur lg:hidden"
      >
        <button
          ref={menuRef}
          type="button"
          aria-expanded={open}
          aria-controls="app-sidebar"
          aria-describedby={feedbackUnread > 0 ? "menu-unread" : undefined}
          onClick={() => setOpen(true)}
          className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-ink hover:bg-sunken"
        >
          <Menu aria-hidden="true" className="size-6" />
          <span className="sr-only">{text.menu}</span>
          {feedbackUnread > 0 && (
            <>
              <span
                aria-hidden="true"
                className="absolute top-2 end-2 size-2.5 rounded-full bg-ink ring-2 ring-paper"
              />
              <span id="menu-unread" hidden>
                {text.feedbackUnread}
              </span>
            </>
          )}
        </button>
        <Link
          href={home}
          aria-label={text.home}
          className="inline-flex min-h-11 shrink-0 items-center"
        >
          <Image
            src={locale === "am" ? "/brand/logo-am.svg" : "/brand/logo.svg"}
            alt={text.logoAlt}
            width={125}
            height={32}
            className="logo-light h-8 w-auto"
            priority
          />
          <Image
            src={
              locale === "am"
                ? "/brand/logo-am-reversed.svg"
                : "/brand/logo-reversed.svg"
            }
            alt={text.logoAlt}
            width={125}
            height={32}
            className="logo-dark h-8 w-auto"
            priority
          />
        </Link>
        {credits !== null && (
          <Link
            href={billing}
            className={`ms-auto inline-flex min-h-11 min-w-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold ${low ? "border-warning text-warning" : "border-line text-ink"} bg-white`}
          >
            <Sparkles aria-hidden="true" className="size-4 shrink-0" />
            {/* The same words as the sidebar ("1 change left", "No changes left"). */}
            <span aria-hidden="true" className="truncate">
              {text.creditsLeft}
            </span>
            <span className="sr-only">
              {text.creditsChipLabel.replace("{n}", String(credits))}
            </span>
          </Link>
        )}
      </header>
      {open && (
        <div
          aria-hidden="true"
          onClick={dismiss}
          className="fixed inset-0 z-40 bg-scrim lg:hidden"
        />
      )}
      <aside
        ref={asideRef}
        id="app-sidebar"
        aria-label={text.sidebarLabel}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        className={`flex w-72 shrink-0 flex-col gap-3 border-e max-lg:overflow-y-auto lg:overflow-hidden border-line bg-sunken p-3 max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:z-50 max-lg:max-w-[86vw] max-lg:shadow-2xl max-lg:transition-transform lg:sticky lg:top-0 lg:h-dvh lg:w-60 ${open ? "" : "max-lg:invisible max-lg:-translate-x-full"}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2">
          <Link
            href={home}
            aria-label={text.home}
            onClick={close}
            className="inline-flex min-h-11 items-center px-1"
          >
            <Image
              src={locale === "am" ? "/brand/logo-am.svg" : "/brand/logo.svg"}
              alt={text.logoAlt}
              width={125}
              height={32}
              className="logo-light h-8 w-auto"
            />
            <Image
              src={
                locale === "am"
                  ? "/brand/logo-am-reversed.svg"
                  : "/brand/logo-reversed.svg"
              }
              alt={text.logoAlt}
              width={125}
              height={32}
              className="logo-dark h-8 w-auto"
            />
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-white lg:hidden"
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">{text.closeMenu}</span>
          </button>
        </div>

        <nav aria-label={text.mainNav} className="flex shrink-0 flex-col gap-1">
          <Link
            href={home}
            onClick={toSection("")}
            aria-current={current(home)}
            className={item}
          >
            <Plus aria-hidden="true" className="size-4 shrink-0" />
            {text.newSite}
          </Link>
          <Link
            href={`${home}#sites`}
            onClick={toSection("#sites")}
            className={item}
          >
            <LayoutGrid aria-hidden="true" className="size-4 shrink-0" />
            {text.sites}
          </Link>
          <Link
            href={`${home}#templates`}
            onClick={toSection("#templates")}
            className={item}
          >
            <LayoutTemplate aria-hidden="true" className="size-4 shrink-0" />
            {text.templates}
          </Link>
          <Link
            href={guidePath}
            onClick={close}
            aria-current={current(guidePath)}
            className={item}
          >
            <BookOpen aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{text.guide}</span>
          </Link>
        </nav>
        {credits !== null && (
          // One compact card: what's left, how much of the month, and the way to more.
          <Link
            href={billing}
            onClick={close}
            className="group flex shrink-0 items-center gap-3 rounded-xl border border-line bg-white p-2.5 shadow-sm transition hover:border-faint hover:shadow-md"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span
                id="side-credits-title"
                className={`flex items-center gap-1.5 text-[13px] font-semibold ${low ? "text-warning" : "text-ink"}`}
              >
                {text.creditsLeft}
              </span>
              <span
                aria-hidden="true"
                className="block h-1 overflow-hidden rounded-full bg-sunken"
              >
                <span
                  className={`block h-full rounded-full ${low ? "bg-warning" : "bg-ink"}`}
                  style={{ width: `${Math.round(share * 100)}%` }}
                />
              </span>
              <span
                id="side-credits-plan"
                className="flex items-center gap-1 text-xs text-ink-muted"
              >
                {text.planBadge}
                {canUpgrade && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-link">
                      {text.upgrade}
                    </span>
                  </>
                )}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--gojo-coral),var(--gojo-coral-hover)_55%,var(--gojo-coral-soft))] text-on-coral shadow-inner transition-transform group-hover:scale-105"
            >
              {canUpgrade ? (
                <Zap className="size-5" />
              ) : (
                <Sparkles className="size-5" />
              )}
            </span>
          </Link>
        )}

        {recent.length > 0 && (
          <div className="flex flex-col gap-1 lg:min-h-0 lg:flex-1">
            <p
              id="recent-title"
              className="px-2.5 text-xs font-medium text-ink-muted"
            >
              {text.recent}
            </p>
            {/* Its own scroll area: the rest of the sidebar stays put however many sites there are. */}
            <ul
              aria-labelledby="recent-title"
              className="recent-scroll -mx-1 flex flex-col px-1 pb-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain"
            >
              {recent.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`${home}/${p.id}`}
                    prefetch={false}
                    onClick={close}
                    aria-current={
                      pathname === `${home}/${p.id}` ? "page" : undefined
                    }
                    className={`${item} gap-2`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-6 shrink-0 items-center justify-center rounded-md bg-line font-display text-xs font-bold text-ink"
                    >
                      {[...p.name.trim()][0]?.toUpperCase() ?? "·"}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {p.live && (
                      <span
                        className="flex shrink-0 items-center"
                        title={text.live}
                      >
                        <span
                          aria-hidden="true"
                          className="size-2 rounded-full bg-lagoon"
                        />
                        <span className="sr-only">{text.live}</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto shrink-0">
          <AccountMenu
            locale={locale}
            other={other}
            who={who}
            text={text}
            billing={billing}
            onNavigate={close}
            theme={theme}
            feedback={{
              href: feedbackHref,
              current: pathname === feedbackPath,
              unread: feedbackUnread,
            }}
          />
        </div>
      </aside>
    </>
  );
}

const menuRow =
  "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-sunken lg:min-h-9";

/** The account row: who is signed in. Plan, app, language and sign out open from it. */
function AccountMenu({
  locale,
  other,
  who,
  text,
  billing,
  onNavigate,
  theme,
  feedback,
}: {
  locale: Locale;
  other: Locale;
  who: string;
  text: SidebarText;
  billing: string;
  onNavigate: () => void;
  theme: Props["theme"];
  feedback: { href: string; current: boolean; unread: number };
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    wrapRef.current
      ?.querySelector<HTMLElement>("#account-menu a, #account-menu button")
      ?.focus();
    const outside = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // The drawer listens for Escape too: close only this menu first.
      e.stopImmediatePropagation();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative border-t border-line pt-2"
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null))
          setOpen(false);
      }}
    >
      <div
        id="account-menu"
        hidden={!open}
        className="absolute inset-x-0 bottom-full z-10 mb-2 flex animate-[pop-in_0.15s_ease-out] flex-col gap-0.5 rounded-xl border border-line bg-white p-1.5 shadow-xl"
      >
        <p
          className="truncate px-2.5 pt-1 pb-1.5 text-xs text-ink-muted"
          title={who}
        >
          {who}
        </p>
        <Link href={billing} onClick={onNavigate} className={menuRow}>
          <CreditCard aria-hidden="true" className="size-4 shrink-0" />
          {text.plan}
        </Link>
        <Link
          href={`${billing}?tab=invite`}
          onClick={onNavigate}
          className={menuRow}
        >
          <UserPlus aria-hidden="true" className="size-4 shrink-0" />
          {text.invite}
        </Link>
        <Link
          href={feedback.href}
          onClick={onNavigate}
          aria-current={feedback.current ? "page" : undefined}
          className={menuRow}
        >
          <MessageSquareHeart aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{text.feedback}</span>
          {feedback.unread > 0 && (
            <span className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white tabular-nums">
              <span aria-hidden="true">{feedback.unread}</span>
              <span className="sr-only">{text.feedbackUnread}</span>
            </span>
          )}
        </Link>
        <InstallApp t={text.pwa} className={menuRow} />
        <LanguageSwitch
          target={other}
          label={text.language}
          ariaLabel={text.languageLabel}
          className={menuRow}
        >
          <Globe aria-hidden="true" className="size-4 shrink-0" />
        </LanguageSwitch>
        <ThemeSwitch
          initial={theme.value}
          label={theme.label}
          names={theme.names}
        />
        <form action={signOut} className="border-t border-line pt-0.5">
          <input type="hidden" name="lang" value={locale} />
          <button type="submit" className={`${menuRow} text-ink-muted`}>
            <LogOut aria-hidden="true" className="size-4 shrink-0" />
            {text.signOut}
          </button>
        </form>
      </div>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-1.5 text-start transition-colors hover:bg-white aria-expanded:bg-white"
      >
        <span
          aria-hidden="true"
          className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-ink font-display text-[13px] font-bold text-white"
        >
          {[...who.trim()][0]?.toUpperCase() ?? "G"}
          {/* Unread replies to feedback live in this menu now: a dot says so. */}
          {feedback.unread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 size-2.5 rounded-full bg-ink ring-2 ring-sunken" />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
          {who}
        </span>
        <ChevronsUpDown
          aria-hidden="true"
          className="size-4 shrink-0 text-ink-muted"
        />
        <span className="sr-only">
          {text.accountMenu}
          {feedback.unread > 0 ? `, ${text.feedbackUnread}` : ""}
        </span>
      </button>
    </div>
  );
}
