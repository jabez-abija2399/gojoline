import type { CurrentUser } from "@/lib/auth/session";
import { liveAddress, ownerAllowance, ownerSites } from "@/lib/app/shell-data";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { readTheme } from "@/lib/app/theme";
import { Sidebar } from "./sidebar";
import { LazyInstallSheet } from "@/components/pwa/install-sheet-lazy";
import { services } from "@/lib/server/services";

/** The frame around every signed-in page except the builder itself: navigation, then the page. */
/** `feedbackUnread`: set by a page that already knows (My feedback passes 0: the replies are on screen). */
export async function AppShell({ locale, t, user, children, feedbackUnread }: { locale: Locale; t: Messages; user: CurrentUser; children: React.ReactNode; feedbackUnread?: number }) {
  const [sites, allowance, theme, unread] = await Promise.all([
    ownerSites(user.id),
    ownerAllowance(user.id),
    readTheme(),
    // A badge, not the page: a failed count shows none.
    feedbackUnread ?? services().feedback.unreadReplies(user.id).catch(() => 0),
  ]);
  const a = t.app;
  return (
    <div data-gojo-theme={theme} className="flex min-h-dvh flex-1 flex-col bg-paper leading-normal text-ink lg:flex-row">
      <Sidebar
        locale={locale}
        who={user.name || user.phone || user.email || ""}
        credits={allowance?.credits ?? null}
        monthly={allowance?.monthly ?? 0}
        theme={{ value: theme, label: a.theme, names: a.themes }}
        canUpgrade={!allowance || allowance.plan !== "business"}
        feedbackUnread={unread}
        recent={sites.slice(0, 6).map((s) => ({ id: s.project.id, name: s.project.name || t.builder.untitled, live: !!liveAddress(s.site) }))}
        text={{
          sidebarLabel: a.sidebarLabel,
          mainNav: a.mainNav,
          creditsChipLabel: a.creditsChipLabel,
          menu: a.menu,
          closeMenu: a.closeMenu,
          home: t.common.homeLink,
          logoAlt: t.common.logoAlt,
          newSite: a.newSite,
          sites: a.sites,
          templates: a.templates,
          plan: a.plan,
          recent: a.recent,
          planBadge: allowance ? a.planBadge.replace("{plan}", t.billing.plans[allowance.plan]) : "",
          creditsLeft: !allowance ? "" : allowance.credits <= 0 ? a.creditsNone : allowance.credits === 1 ? a.creditsLeftOne : a.creditsLeft.replace("{n}", String(allowance.credits)),
          creditsShort: a.creditsShort,
          creditsHint: a.creditsHint,
          getMore: a.getMore,
          upgrade: a.upgrade,
          accountMenu: a.accountMenu,
          live: a.live,
          signOut: t.auth.signOut,
          language: t.common.languageSwitch,
          languageLabel: t.common.languageSwitchLabel,
          pwa: t.pwa,
          feedback: t.feedback.navLabel,
          feedbackUnread: unread === 0 ? "" : unread === 1 ? t.feedback.navUnreadOne : t.feedback.navUnread.replace("{n}", String(unread)),
        }}
      />
      <div id="app-content" className="flex min-w-0 flex-1 flex-col">
        {children}
      </div>
      <LazyInstallSheet t={t.pwa} />
    </div>
  );
}
