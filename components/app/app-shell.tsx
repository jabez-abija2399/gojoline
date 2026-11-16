import type { CurrentUser } from "@/lib/auth/session";
import { liveAddress, ownerAllowance, ownerSites } from "@/lib/app/shell-data";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { Sidebar } from "./sidebar";

/** The frame around every signed-in page except the builder itself: navigation, then the page. */
export async function AppShell({ locale, t, user, children }: { locale: Locale; t: Messages; user: CurrentUser; children: React.ReactNode }) {
  const [sites, allowance] = await Promise.all([ownerSites(user.id), ownerAllowance(user.id)]);
  const a = t.app;
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <Sidebar
        locale={locale}
        who={user.name || user.phone || user.email || ""}
        credits={allowance.credits}
        monthly={allowance.monthly}
        recent={sites.slice(0, 6).map((s) => ({ id: s.project.id, name: s.project.name || t.builder.untitled, live: !!liveAddress(s.site) }))}
        text={{
          navLabel: a.navLabel,
          menu: a.menu,
          closeMenu: a.closeMenu,
          home: t.common.homeLink,
          logoAlt: t.common.logoAlt,
          newSite: a.newSite,
          sites: a.sites,
          templates: a.templates,
          plan: a.plan,
          recent: a.recent,
          planBadge: a.planBadge.replace("{plan}", t.billing.plans[allowance.plan]),
          creditsLeft: allowance.credits > 0 ? a.creditsLeft : a.creditsNone,
          creditsShort: a.creditsShort,
          creditsHint: a.creditsHint,
          getMore: a.getMore,
          live: a.live,
          signOut: t.auth.signOut,
          language: t.common.languageSwitch,
          languageLabel: t.common.languageSwitchLabel,
          pwa: t.pwa,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
