import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FocusOnMount } from "@/components/admin/focus-on-mount";
import { SiteFiles } from "@/components/admin/site-files";
import { PostsTab } from "@/components/admin/posts-tab";
import { ModerateForm } from "@/components/admin/moderate-form";
import { ReviewForm } from "@/components/admin/review-form";
import { SettingsForm } from "@/components/admin/settings-form";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { adminStats, analytics, services } from "@/lib/server/services";
import { cookies } from "next/headers";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BadgePercent, ChartColumn, CircleCheck, Cpu, Flag, Globe, LayoutDashboard, Megaphone, MessageSquareHeart, Monitor, Moon, Settings2, Sun, Sprout, TrendingDown, TrendingUp, Users, Wallet, X } from "lucide-react";
import { FeedbackReplyForm } from "@/components/admin/feedback-reply-form";
import { TYPE_ICONS } from "@/components/feedback/type-icons";
import { emptyCounts, FEEDBACK_STATUSES, FEEDBACK_TYPES } from "@/lib/feedback/types";
import { shortAgent } from "@/lib/feedback/agent";
import { reportError } from "@/lib/observability/report";
import { BarChart } from "@/components/admin/bar-chart";
import { AnalyticsView } from "@/components/admin/analytics-view";
import { PERIODS, type Period } from "@/lib/analytics/periods";
import { isPresetId } from "@/lib/template/presets";
import { inviteOwnersToFeature, setAdminTheme, setShowcaseHidden, toggleDiscountCode } from "./actions";
import { INVITE_BATCH, invitable } from "@/lib/growth/feature-invites";
import { PostSubmit } from "@/components/admin/post-submit";
import { offerEndsAt, offerUntilLabel } from "@/lib/billing/discounts";
import { offerProductsText } from "@/lib/billing/offer-text";
import { CreditsForm } from "@/components/admin/credits-form";
import { CodeForm, OfferForm } from "@/components/admin/discount-forms";
import { planFeaturesWith } from "@/lib/billing/credits";
import { OwnerActions } from "@/components/admin/owner-actions";
import { PlanComparison } from "@/components/pricing/plan-comparison";
import { monthlyRevenueMinor, type PlanFilter } from "@/lib/admin/stats";
import { PLAN_IDS, PRODUCTS, productName } from "@/lib/billing/plans";
import { SOURCES } from "@/lib/growth/attribution";
import { emptySourceCounts } from "@/lib/growth/sources";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).admin.metaTitle : undefined, robots: { index: false } };
}

const amount = (minor: number) => new Intl.NumberFormat("en-US").format(minor / 100);
const usdFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usdSmall = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 });
const usd = (nano: number) => (nano > 0 && nano < 1e7 ? usdSmall : usdFmt).format(nano / 1e9);
/** Text people typed may be in either language; screen readers need to know which. */
const langOf = (s: string) => (/[\u1200-\u137F]/.test(s) ? "am" : "en");
const DONE = ["ok", "deploy_failed", "failed", "not_found"] as const;
const TABS = ["overview", "analytics", "payments", "reports", "feedback", "sites", "users", "growth", "costs", "discounts", "posts", "settings"] as const;
type Tab = (typeof TABS)[number];
type AdminUserPlan = (typeof PLAN_IDS)[number];

export default async function AdminPage({ params, searchParams }: PageProps<"/[lang]/admin">) {
  const { lang } = await params;
  const sp = await searchParams;
  const rawTab = sp.tab;
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "overview";
  const rawDone = sp.done;
  const done = DONE.find((d) => d === rawDone) ?? null;
  if (!isLocale(lang)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/admin`);
  const t = getMessages(lang);
  // Not admin: same answer as a missing page.
  if (!isAdmin(user)) notFound();
  const svc = services();
  const dateFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  const savedTheme = (await cookies()).get("gojo_admin_theme")?.value;
  const theme = (["light", "dark", "system"] as const).find((x) => x === savedTheme) ?? "system";
  const [counts, fbCounts] = await Promise.all([
    adminStats().overview(),
    // A count, not the page: without it the admin still opens.
    svc.feedback.countByStatus().catch((e: unknown) => (reportError("feedback count failed", e), emptyCounts())),
  ]);
  const badge: Partial<Record<Tab, number>> = { payments: counts.pendingPayments, reports: counts.openReports, feedback: fbCounts.new };
  const icons: Record<Tab, typeof LayoutDashboard> = { overview: LayoutDashboard, payments: Wallet, reports: Flag, feedback: MessageSquareHeart, sites: Globe, users: Users, growth: Sprout, costs: Cpu, analytics: ChartColumn, discounts: BadgePercent, posts: Megaphone, settings: Settings2 };
  const navItem = (x: Tab, compact: boolean) => {
    const Icon = icons[x];
    return (
      <Link
        key={x}
        href={`/${lang}/admin?tab=${x}`}
        aria-current={x === tab ? "page" : undefined}
        className={`flex min-h-11 pointer-fine:min-h-9 items-center gap-3 rounded-lg px-3 font-medium text-ink-muted transition-colors hover:bg-paper hover:text-ink aria-[current=page]:bg-ink aria-[current=page]:text-white ${compact ? "shrink-0" : ""}`}
      >
        <Icon aria-hidden="true" className="size-5 shrink-0" />
        <span className="truncate">{t.admin.tabs[x]}</span>
        {!!badge[x] && <span className="ms-auto rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-on-coral tabular-nums">{badge[x]}</span>}
      </Link>
    );
  };

  return (
    <div data-gojo-theme={theme} className="admin-root flex min-h-screen flex-1 bg-paper text-sm text-ink">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 border-e border-line bg-white p-3 lg:flex">
        <Link href={`/${lang}`} className="flex min-h-11 pointer-fine:min-h-9 items-center gap-2 font-display text-base font-bold">
          <Image src="/brand/mark.svg" alt="" width={32} height={32} className="size-8" />
          {t.admin.brand}
        </Link>
        <nav aria-label={t.admin.title} className="flex flex-col gap-1">
          {TABS.map((x) => navItem(x, false))}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <ThemeSwitch />
          <Link href={`/${lang}/build`} className="inline-flex min-h-11 pointer-fine:min-h-9 items-center gap-2 rounded-lg px-3 font-medium text-ink-muted hover:bg-paper hover:text-ink">
            <ArrowLeft aria-hidden="true" className="size-4" /> {t.admin.backToApp}
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-line bg-paper/90 px-4 py-2 backdrop-blur sm:px-6 lg:py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold">{t.admin.tabs[tab]}</h1>
            <div className="lg:hidden"><ThemeSwitch compact /></div>
          </div>
          <nav aria-label={t.admin.title} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:hidden">
            {TABS.map((x) => navItem(x, true))}
          </nav>
        </header>
        <main id="main" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
          {done && (
            <FocusOnMount>
              <p role={done === "ok" ? "status" : "alert"} className={`rounded-lg px-4 py-2 font-medium ${done === "ok" ? "border border-lagoon bg-white text-lagoon" : "bg-coral-soft text-destructive"}`}>
                {t.admin.tabStatus[done]}
              </p>
            </FocusOnMount>
          )}
          {tab === "overview" && <Overview />}
          {tab === "analytics" && <AnalyticsTab />}
          {tab === "payments" && <Payments />}
          {tab === "reports" && <Reports />}
          {tab === "feedback" && <FeedbackTab />}
          {tab === "sites" && <Sites />}
          {tab === "users" && <UsersTab />}
          {tab === "growth" && <GrowthTab />}
          {tab === "costs" && <Costs />}
          {tab === "discounts" && <Discounts />}
          {tab === "posts" && <PostsTab lang={lang} t={t.admin.posts} sp={sp} />}
          {tab === "settings" && <Settings />}
        </main>
      </div>
    </div>
  );

  function ThemeSwitch({ compact = false }: { compact?: boolean }) {
    const opts = [
      { v: "light" as const, Icon: Sun },
      { v: "dark" as const, Icon: Moon },
      { v: "system" as const, Icon: Monitor },
    ];
    return (
      <form action={setAdminTheme} className="flex flex-col gap-1">
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="tab" value={tab} />
        {!compact && <span className="px-1 text-xs font-medium text-ink-muted">{t.admin.theme}</span>}
        <div role="group" aria-label={t.admin.theme} className="flex gap-1 rounded-lg border border-line bg-paper p-1">
          {opts.map(({ v, Icon }) => (
            <button key={v} name="theme" value={v} aria-pressed={theme === v} title={t.admin.themes[v]} className="flex min-h-11 min-w-11 flex-auto items-center justify-center gap-1 whitespace-nowrap rounded-md px-1.5 text-ink-muted aria-pressed:bg-ink aria-pressed:text-white">
              <Icon aria-hidden="true" className="size-4" />
              <span className={compact ? "sr-only" : "text-xs"}>{t.admin.themes[v]}</span>
            </button>
          ))}
        </div>
      </form>
    );
  }

  async function AnalyticsTab() {
    const period: Period = PERIODS.includes(sp.period as Period) ? (sp.period as Period) : "day";
    const a = t.admin.analytics;
    const report = await analytics().report(period).catch((e: unknown) => {
      reportError("admin analytics failed", e);
      return null;
    });
    if (!report)
      return (
        <p role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-4 text-ink-muted">
          {a.failed}
          <Link href={`/${lang}/admin?tab=analytics&period=${period}`} className="inline-flex min-h-11 pointer-fine:min-h-9 items-center font-medium text-ink underline underline-offset-4">{a.retry}</Link>
        </p>
      );
    const src = t.growth.sources.names as Record<string, string>;
    return (
      <AnalyticsView
        r={report}
        t={a}
        locale={lang === "am" ? "am" : "en"}
        birr={(minor) => format(t.billing.price, { price: amount(minor) })}
        usd={usd}
        templateName={(id) => (id === null ? a.fromChat : isPresetId(id) ? t.builder.templates[id] : id)}
        sourceName={(s) => src[s] ?? s}
      />
    );
  }

  async function Overview() {
    const o = counts;
    const birr = (minor: number) => format(t.billing.price, { price: amount(minor) });
    const delta = o.usersNew7 - o.usersPrev7;
    const { prices } = await svc.billing.settings();
    const mrr = monthlyRevenueMinor(o.activeSubs, prices);
    const kpis = [
      { label: t.admin.kOwners, value: String(o.users), sub: format(t.admin.kNewWeek, { n: o.usersNew7 }), trend: delta },
      { label: t.admin.kLiveSites, value: String(o.sitesLive), sub: format(t.admin.kProjects, { n: o.projects }) },
      { label: t.admin.kPaying, value: String(o.paidUsers), sub: o.users ? format(t.admin.kConversion, { p: Math.round((o.paidUsers / o.users) * 100) }) : "—" },
      { label: t.admin.kRevenue, value: birr(o.revenueMonthMinor), sub: t.admin.kThisMonth },
      { label: t.admin.kMrr, value: birr(mrr), sub: t.admin.kMrrSub },
      { label: t.admin.kAiCost, value: usd(o.aiCost30Nano), sub: t.admin.k30Days },
    ];
    const attention = [
      ...(o.pendingPayments ? [{ href: `/${lang}/admin?tab=payments`, text: format(t.admin.attPayments, { n: o.pendingPayments }), Icon: Wallet }] : []),
      ...(o.openReports ? [{ href: `/${lang}/admin?tab=reports`, text: format(t.admin.attReports, { n: o.openReports }), Icon: Flag }] : []),
      ...(fbCounts.new ? [{ href: `/${lang}/admin?tab=feedback&status=new`, text: format(t.admin.attFeedback, { n: fbCounts.new }), Icon: MessageSquareHeart }] : []),
    ];
    const actionName = (a: string) => (t.admin.actions as Record<string, string>)[a.replace(".", "_")] ?? a;
    // A breakdown, not the page: without it the overview still opens.
    const sources = await svc.growth.sources.breakdown().catch((e: unknown) => (reportError("sign-up sources failed", e), { d7: emptySourceCounts(), d30: emptySourceCounts() }));
    return (
      <div className="flex flex-col gap-4">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          {kpis.map((k) => (
            <li key={k.label} className="flex min-w-0 flex-col gap-1 rounded-xl border border-line bg-white p-3 sm:p-4">
              <span className="text-xs font-medium text-ink-muted">{k.label}</span>
              <span className="font-display text-xl font-bold tabular-nums sm:text-2xl">{k.value}</span>
              <span className="flex items-center gap-1 text-xs text-ink-muted">
                {k.trend !== undefined && k.trend !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 font-semibold ${k.trend > 0 ? "text-lagoon" : "text-destructive"}`}>
                    {k.trend > 0 ? <TrendingUp aria-hidden="true" className="size-4" /> : <TrendingDown aria-hidden="true" className="size-4" />}
                    {format(t.admin.kVsLastWeek, { n: `${k.trend > 0 ? "+" : ""}${k.trend}` })}
                  </span>
                )}
                {k.trend === undefined || k.trend === 0 ? k.sub : <span className="sr-only">{k.sub}</span>}
              </span>
            </li>
          ))}
        </ul>
        <section aria-labelledby="plans-title" className="rounded-xl border border-line bg-white p-4">
          <h2 id="plans-title" className="text-base font-semibold">{t.admin.kPlans}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {PLAN_IDS.map((p) => {
              const share = o.users ? Math.round((o.plans[p] / o.users) * 100) : 0;
              return (
                <li key={p}>
                  <Link href={`/${lang}/admin?tab=users&plan=${p}`} className="flex min-h-11 pointer-fine:min-h-9 flex-col gap-2 rounded-xl border border-line p-3 hover:border-faint">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{t.billing.plans[p]}</span>
                      <span className="font-display text-lg font-bold tabular-nums">{o.plans[p]}</span>
                    </span>
                    <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-sunken">
                      <span className="block h-full rounded-full bg-ink" style={{ width: `${share}%` }} />
                    </span>
                    <span className="text-xs text-ink-muted tabular-nums">{share}%</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        <SignupSources counts={sources} />
        <section aria-labelledby="att-title" className="rounded-xl border border-line bg-white p-4">
          <h2 id="att-title" className="text-base font-semibold">{t.admin.attention}</h2>
          {attention.length === 0 ? (
            <p className="mt-2 flex items-center gap-2 text-ink-muted"><CircleCheck aria-hidden="true" className="size-5 text-ink" /> {t.admin.allClear}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {attention.map(({ href, text, Icon }) => (
                <li key={href}>
                  <Link href={href} className="flex min-h-11 pointer-fine:min-h-9 items-center gap-3 rounded-xl bg-coral-soft px-4 font-medium text-ink hover:ring-2 hover:ring-coral">
                    <Icon aria-hidden="true" className="size-5 text-link" /> {text}
                    <ArrowRight aria-hidden="true" className="ms-auto size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="grid gap-3 lg:grid-cols-3">
          <BarChart title={t.admin.chSignups} data={o.signups} format={(v) => String(v)} tableLabel={t.admin.showTable} dayLabel={t.admin.day} valueLabel={t.admin.value} emptyLabel={t.admin.noData} />
          <BarChart title={t.admin.chRevenue} data={o.revenue} format={birr} tableLabel={t.admin.showTable} dayLabel={t.admin.day} valueLabel={t.admin.value} emptyLabel={t.admin.noData} />
          <BarChart title={t.admin.chAi} data={o.aiCost} format={usd} tableLabel={t.admin.showTable} dayLabel={t.admin.day} valueLabel={t.admin.value} emptyLabel={t.admin.noData} />
        </div>
        <section aria-labelledby="act-title" className="rounded-xl border border-line bg-white p-4">
          <h2 id="act-title" className="text-base font-semibold">{t.admin.activity}</h2>
          {o.activity.length === 0 ? (
            <p className="mt-2 text-ink-muted">{t.admin.noActivity}</p>
          ) : (
            <ol className="mt-3 flex flex-col">
              {o.activity.map((a, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2 first:border-0">
                  <span className="font-medium">{actionName(a.action)}</span>
                  <span className="text-xs text-ink-muted tabular-nums">{dateFmt.format(a.createdAt)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    );
  }

  function SignupSources({ counts }: { counts: { d7: Record<(typeof SOURCES)[number], number>; d30: Record<(typeof SOURCES)[number], number> } }) {
    const g = t.growth.sources;
    const sum = (c: Record<string, number>) => Object.values(c).reduce((a, b) => a + b, 0);
    const total30 = sum(counts.d30);
    return (
      <section aria-labelledby="src-title" className="rounded-xl border border-line bg-white p-4">
        <h2 id="src-title" className="text-base font-semibold">{g.title}</h2>
        <p className="mt-1 text-xs text-ink-muted">{g.intro}</p>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead>
            <tr className="text-start text-xs text-ink-muted">
              <th scope="col" className="py-1 text-start font-medium">{g.source}</th>
              <th scope="col" className="w-16 py-1 text-end font-medium">{g.days7}</th>
              <th scope="col" className="w-16 py-1 text-end font-medium">{g.days30}</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map((s) => (
              <tr key={s} className="border-t border-line">
                <th scope="row" className="py-2 pe-2 text-start font-medium">
                  <span className="flex flex-col gap-1">
                    {g.names[s]}
                    <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-sunken">
                      <span className="block h-full rounded-full bg-ink" style={{ width: `${total30 ? Math.round((counts.d30[s] / total30) * 100) : 0}%` }} />
                    </span>
                  </span>
                </th>
                <td className="py-2 text-end tabular-nums">{counts.d7[s]}</td>
                <td className="py-2 text-end tabular-nums">{counts.d30[s]}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink font-semibold">
              <th scope="row" className="py-2 text-start">{g.total}</th>
              <td className="py-2 text-end tabular-nums">{sum(counts.d7)}</td>
              <td className="py-2 text-end tabular-nums">{total30}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    );
  }

  async function GrowthTab() {
    const g = t.growth.referralsAdmin;
    const showcase = svc.growth.showcase;
    const [list, show, canInvite] = await Promise.all([svc.growth.referrals.store.recent(100), showcase?.adminList(200) ?? [], showcase ? invitable({ showcase }).catch(() => null) : null]);
    const invited = sp.fi === "ok" ? { sent: Number(sp.sent) || 0, unreachable: Number(sp.unreachable) || 0 } : null;
    const sc = t.growth.showcase;
    const joinedFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium" });
    const who = (p: { name: string; contact: string }) => (
      <span className="flex min-w-0 flex-col">
        <span className="font-medium [overflow-wrap:anywhere]">{p.name || p.contact || "—"}</span>
        {p.name && <span className="text-xs text-ink-muted [overflow-wrap:anywhere]">{p.contact}</span>}
      </span>
    );
    return (
      <div className="flex flex-col gap-4">
        <section aria-labelledby="ref-title" className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
          <h2 id="ref-title" className="text-base font-semibold">{g.title}</h2>
          <p className="text-xs text-ink-muted">{g.intro}</p>
          {list.length === 0 ? (
            <p className="text-ink-muted">{g.empty}</p>
          ) : (
            <ul aria-labelledby="ref-title" className="flex flex-col">
              {list.map((r) => (
                <li key={r.referredId} className="grid gap-2 border-t border-line py-3 first:border-0 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                  <span className="flex flex-col gap-0.5">
                    <span className="text-xs text-ink-muted">{g.invited}</span>
                    {who(r.referred)}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-xs text-ink-muted">{g.inviter}</span>
                    {who(r.referrer)}
                  </span>
                  <span className="flex flex-col gap-0.5 sm:items-end">
                    <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === "rewarded" ? "border border-lagoon bg-white text-lagoon" : r.status === "blocked" ? "bg-coral-soft text-destructive" : "border border-line bg-paper text-ink"}`}>
                      {g.statuses[r.status]}
                      {r.status === "blocked" && r.blockReason ? ` · ${(g.reasons as Record<string, string>)[r.blockReason] ?? r.blockReason}` : ""}
                    </span>
                    <span className="text-xs text-ink-muted tabular-nums">
                      {joinedFmt.format(r.createdAt)}
                      {r.status === "rewarded" ? ` · ${format(r.referrerCredits > 0 ? g.rewardBoth : g.rewardCapped, { n: r.referredCredits })}` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {showcase && (
          <section aria-labelledby="invite-title" className="flex scroll-mt-28 flex-col gap-3 rounded-xl border border-line bg-white p-4">
            <h2 id="invite-title" className="text-base font-semibold">{sc.inviteTitle}</h2>
            <p className="text-xs text-ink-muted">{sc.inviteIntro}</p>
            {invited && <p role="status" className="rounded-lg bg-paper px-3 py-2 text-sm">{format(sc.inviteDone, invited)}</p>}
            {sp.fi === "failed" && <p role="alert" className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-destructive">{sc.inviteFailed}</p>}
            {canInvite === null ? (
              <p className="text-sm text-ink-muted">{sc.inviteFailed}</p>
            ) : canInvite === 0 ? (
              <p className="text-sm text-ink-muted">{sc.inviteNone}</p>
            ) : (
              <form action={inviteOwnersToFeature} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="lang" value={lang} />
                <span className="text-sm font-medium tabular-nums">{format(sc.inviteCount, { n: canInvite })}</span>
                <PostSubmit working={t.admin.posts.working} confirm={format(sc.inviteConfirm, { n: Math.min(canInvite, INVITE_BATCH) })} className="inline-flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink-hover pointer-fine:min-h-9">
                  {sc.inviteButton}
                </PostSubmit>
              </form>
            )}
          </section>
        )}
        <section aria-labelledby="showcase-title" className="flex scroll-mt-28 flex-col gap-3 rounded-xl border border-line bg-white p-4">
          <h2 id="showcase-title" className="text-base font-semibold">{sc.adminTitle}</h2>
          <p className="text-xs text-ink-muted">{sc.adminIntro} <Link href={`/${lang}/showcase`} className="font-medium text-ink underline underline-offset-4">{sc.view}</Link></p>
          {show.length === 0 ? (
            <p className="text-ink-muted">{sc.adminEmpty}</p>
          ) : (
            <ul aria-labelledby="showcase-title" className="flex flex-col">
              {show.map((e) => (
                <li key={e.siteId} className="flex flex-wrap items-center gap-3 border-t border-line py-3 first:border-0">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium [overflow-wrap:anywhere]">{e.name}</span>
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-xs text-ink-muted underline underline-offset-2 [overflow-wrap:anywhere]">{e.url}<span className="sr-only"> {sc.newTab}</span></a>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${e.hidden ? "bg-coral-soft text-destructive" : "border border-lagoon bg-white text-lagoon"}`}>{e.hidden ? sc.hidden : sc.shown}</span>
                  <form action={setShowcaseHidden}>
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="id" value={e.siteId} />
                    <input type="hidden" name="hidden" value={e.hidden ? "false" : "true"} />
                    <button aria-label={`${e.hidden ? sc.show : sc.hide}: ${e.name}`} className="min-h-11 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:border-faint pointer-fine:min-h-9">
                      {e.hidden ? sc.show : sc.hide}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  async function UsersTab() {
    const q = typeof sp.q === "string" ? sp.q : "";
    const plan: PlanFilter = PLAN_IDS.find((p) => p === sp.plan) ?? "all";
    const selected = typeof sp.user === "string" ? sp.user.slice(0, 200) : null;
    const stats = adminStats();
    const [list, detail] = await Promise.all([stats.users(q, 100, plan), selected ? stats.user(selected) : null]);
    const joinedFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium" });
    const link = (next: { plan?: PlanFilter; user?: string | null }) => {
      const params = new URLSearchParams({ tab: "users" });
      if (q) params.set("q", q);
      const p = next.plan ?? plan;
      if (p !== "all") params.set("plan", p);
      if (next.user) params.set("user", next.user);
      return `/${lang}/admin?${params.toString()}`;
    };
    const chips: { v: PlanFilter; label: string; n: number }[] = [{ v: "all", label: t.admin.planAll, n: counts.users }, ...PLAN_IDS.map((p) => ({ v: p, label: t.billing.plans[p], n: counts.plans[p] }))];
    const planBadge = (p: AdminUserPlan) => <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${p === "free" ? "border border-line bg-white text-ink-muted" : "bg-sunken text-ink"}`}>{t.billing.plans[p]}</span>;
    return (
      <section aria-labelledby="users-title" className="flex flex-col gap-3">
        <h2 id="users-title" className="sr-only">{t.admin.tabs.users}</h2>
        <nav aria-label={t.admin.planFilter}>
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c.v}>
                <Link href={link({ plan: c.v, user: null })} aria-current={c.v === plan ? "true" : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink-muted hover:text-ink aria-[current=true]:border-ink aria-[current=true]:bg-ink aria-[current=true]:text-white pointer-fine:min-h-9">
                  {c.label}
                  <span className="tabular-nums">{c.n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form role="search" className="flex gap-2">
          <input type="hidden" name="tab" value="users" />
          {plan !== "all" && <input type="hidden" name="plan" value={plan} />}
          <label className="flex-1">
            <span className="sr-only">{t.admin.searchLabel}</span>
            <input name="q" defaultValue={q} placeholder={t.admin.searchLabel} maxLength={100} className="min-h-11 pointer-fine:min-h-9 w-full rounded-lg border border-input bg-white px-3 text-base pointer-fine:text-sm" />
          </label>
          <button className="min-h-11 pointer-fine:min-h-9 rounded-lg bg-ink px-4 font-medium text-white">{t.admin.search}</button>
        </form>
        {selected && !detail && <p role="alert" className="rounded-lg bg-coral-soft px-4 py-2 font-medium text-destructive">{t.admin.ownerNotFound}</p>}
        {detail && (
          // A new key per owner: opening another owner moves focus (and scroll) to the panel again.
          <FocusOnMount key={detail.id} className="scroll-mt-44 lg:scroll-mt-28">
            <section aria-labelledby="owner-kicker owner-title" className="flex flex-col gap-3 rounded-xl border border-ink bg-white p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p id="owner-kicker" className="text-xs font-medium text-ink-muted">{t.admin.detailTitle}</p>
                  <h3 id="owner-title" className="text-base font-semibold [overflow-wrap:anywhere]">{detail.name || detail.contact || "—"}</h3>
                  {detail.name && <p className="text-ink-muted [overflow-wrap:anywhere]">{detail.contact}</p>}
                </div>
                <Link href={link({ user: null })} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-line px-3 text-sm font-medium hover:border-faint pointer-fine:min-h-9">
                  <X aria-hidden="true" className="size-4" /> {t.admin.closeDetails}
                </Link>
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  [t.admin.dPlan, planBadge(detail.plan)],
                  [t.admin.dUntil, detail.until ? joinedFmt.format(detail.until) : "—"],
                  [t.admin.dCredits, detail.credits],
                  [t.admin.dLiveSites, detail.sites],
                  [t.admin.dAiCost, usd(detail.aiCost30Nano)],
                  [t.admin.dJoined, joinedFmt.format(detail.joined)],
                ].map(([k, v], i) => (
                  <div key={i} className="flex flex-col gap-1 rounded-xl bg-paper p-3">
                    <dt className="text-xs text-ink-muted">{k}</dt>
                    <dd className="font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold">{t.admin.dProjects}</h4>
                  {detail.projects.length === 0 ? (
                    <p className="text-ink-muted">{t.admin.dNoProjects}</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {detail.projects.map((pr) => (
                        <li key={pr.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2 first:border-0">
                          <span className="min-w-0 break-words">{pr.name || t.admin.dUnnamed}{pr.site && <span className="block font-mono text-xs text-ink-muted">{pr.site.slug}</span>}</span>
                          <span className="text-xs text-ink-muted">{pr.site ? t.admin.siteStatus[pr.site.status] : t.admin.dNotPublished}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold">{t.admin.dPayments}</h4>
                  {detail.payments.length === 0 ? (
                    <p className="text-ink-muted">{t.admin.dNoPayments}</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {detail.payments.map((pay) => (
                        <li key={pay.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2 first:border-0">
                          <span>{productName(t.billing.productNames, pay.product)} · {format(t.billing.price, { price: amount(pay.amountMinor) })}</span>
                          <span className="text-xs text-ink-muted">{t.billing.status[pay.status]} · {joinedFmt.format(pay.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <OwnerActions key={detail.id} t={t.admin} userId={detail.id} lang={lang} />
            </section>
          </FocusOnMount>
        )}
        {list.length === 0 ? (
          <p className="text-ink-muted">{t.admin.usersEmpty}</p>
        ) : (
          <div className="relative overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full text-start md:min-w-[760px]">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-line text-xs text-ink-muted">
                  <th scope="col" className="px-4 py-2 text-start font-medium">{t.admin.colOwner}</th>
                  <th scope="col" className="hidden px-4 py-2 text-start font-medium md:table-cell">{t.admin.colJoined}</th>
                  <th scope="col" className="hidden px-4 py-2 text-start font-medium md:table-cell">{t.admin.colPlan}</th>
                  <th scope="col" className="hidden px-4 py-2 text-end font-medium md:table-cell">{t.admin.colCredits}</th>
                  <th scope="col" className="hidden px-4 py-2 text-end font-medium md:table-cell">{t.admin.colSites}</th>
                  <th scope="col" className="hidden px-4 py-2 text-end font-medium md:table-cell">{t.admin.colAiCost}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} aria-current={u.id === detail?.id ? "true" : undefined} className="border-b border-line last:border-0 hover:bg-paper aria-[current=true]:bg-sunken">
                    <th scope="row" className="px-4 py-2 text-start font-normal">
                      {/* The visible name is the link text; "details" is added for screen readers. */}
                      <Link href={link({ user: u.id })} className="block min-h-11 pointer-fine:min-h-9 rounded-md underline-offset-4 hover:underline">
                        <span className="block font-medium [overflow-wrap:anywhere]">{u.name || u.contact || u.id.slice(0, 8)}</span>
                        {u.name && <span className="block text-xs text-ink-muted [overflow-wrap:anywhere]">{u.contact}</span>}
                        <span className="sr-only">, {t.admin.colDetails}</span>
                      </Link>
                      {/* Phones: the plan and changes left under the name instead of extra columns. */}
                      <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted md:hidden">
                        {planBadge(u.plan)}
                        <span className="tabular-nums">{format(t.admin.creditsShort, { n: u.credits })}</span>
                      </span>
                    </th>
                    <td className="hidden px-4 py-2 text-xs tabular-nums md:table-cell">{joinedFmt.format(u.joined)}</td>
                    <td className="hidden px-4 py-2 md:table-cell">
                      {planBadge(u.plan)}
                      {u.until && <span className="mt-1 block text-xs text-ink-muted tabular-nums">{format(t.admin.untilShort, { date: joinedFmt.format(u.until) })}</span>}
                    </td>
                    <td className="hidden px-4 py-2 text-end tabular-nums md:table-cell">{u.credits}</td>
                    <td className="hidden px-4 py-2 text-end tabular-nums md:table-cell">{u.sites}</td>
                    <td className="hidden px-4 py-2 text-end tabular-nums md:table-cell">{usd(u.aiCost30Nano)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  async function Payments() {
    const pending = await svc.billing.store().pendingForAdmin();
    // Who invited each payer: the admin judges an invite before approving its reward.
    const invites = await svc.growth.referrals.notes(pending.map((p) => p.userId)).catch((e: unknown) => (reportError("invite notes failed", e), new Map()));
    const g = t.growth.referralsAdmin;
    return (
        <section aria-labelledby="pay-title" className="flex flex-col gap-3">
          <h2 id="pay-title" className="text-base font-semibold">{t.admin.paymentsTitle}</h2>
          <p className="text-ink-muted">{t.admin.checkHint}</p>
          {pending.length === 0 ? (
            <p className="text-ink-muted">{t.admin.paymentsEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pending.map((p) => (
                <li key={p.id} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3">
                  <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    <p className="font-semibold">{productName(t.billing.productNames, p.product)}</p>
                    {p.discountMinor ? (
                      <div className="flex flex-col">
                        <p>{format(t.admin.payOriginal, { price: amount(p.originalAmountMinor ?? p.amountMinor) })}</p>
                        <p>{format(t.admin.payDiscount, { amount: amount(p.discountMinor), what: p.discountSource === "offer" ? t.admin.payOffer : (p.discountCode ?? "") })}</p>
                        <p className="font-semibold">{format(t.admin.payFinal, { price: amount(p.amountMinor) })}</p>
                      </div>
                    ) : (
                      <p className="font-semibold">{format(t.billing.price, { price: amount(p.amountMinor) })}</p>
                    )}
                    <p>{t.billing.methods[p.method]}: <span className="font-mono">{p.reference}</span></p>
                    <p className="break-all">{t.admin.user}: {p.contact ?? p.userId.slice(0, 8)}</p>
                    <p className="text-ink-muted">{dateFmt.format(p.createdAt)}</p>
                    {invites.get(p.userId) && (() => {
                      const inv = invites.get(p.userId)!;
                      const plan = Boolean(PRODUCTS[p.product]?.plan);
                      return (
                        <p className="break-all sm:col-span-2">
                          {format(g.invitedBy, { who: inv.name || inv.contact || "—" })}
                          {inv.name && inv.contact ? ` (${inv.contact})` : ""}
                          {" · "}
                          {inv.status === "blocked" ? `${g.statuses.blocked}: ${(g.reasons as Record<string, string>)[inv.blockReason ?? ""] ?? inv.blockReason}` : inv.status === "rewarded" ? g.statuses.rewarded : plan ? g.rewardOnApprove : g.noRewardTopup}
                          {inv.sameNetwork && <span className="ms-2 rounded-full bg-coral-soft px-2 py-0.5 text-xs font-semibold text-destructive">{g.sameNetwork}</span>}
                        </p>
                      );
                    })()}
                  </div>
                  {p.hasReceipt ? (
                    <a href={`/api/admin/payments/${p.id}/receipt`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 pointer-fine:min-h-9 w-fit items-center font-medium text-ink underline underline-offset-4">{t.admin.viewReceipt}</a>
                  ) : (
                    <p className="text-ink-muted">{t.admin.noReceipt}</p>
                  )}
                  <ReviewForm t={t.admin} id={p.id} lang={lang} />
                </li>
              ))}
            </ul>
          )}
        </section>
    );
  }

  async function Reports() {
    const groups = (await svc.moderation?.reports.openBySite(50)) ?? [];
    return (
      <section aria-labelledby="rep-title" className="flex flex-col gap-3">
        <h2 id="rep-title" className="text-base font-semibold">{t.admin.reportsTitle}</h2>
        {groups.length === 0 ? (
          <p className="text-ink-muted">{t.admin.reportsEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {groups.map((g) => (
              <li key={g.siteId} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono font-semibold">{g.slug}</p>
                  <span className="rounded-full bg-coral-soft px-3 py-1 text-xs font-semibold text-destructive">{format(t.admin.reportCount, { n: g.reports.length, people: g.reporters })}</span>
                </div>
                {g.url && (
                  <a href={g.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 pointer-fine:min-h-9 w-fit items-center break-all font-medium text-ink underline underline-offset-4">{t.admin.openSite}</a>
                )}
                <ul className="flex flex-col gap-2">
                  {g.reports.slice(0, 10).map((r) => (
                    <li key={r.id} className="rounded-lg bg-paper p-3">
                      <p className="font-medium">{t.safety.reasons[r.reason]}</p>
                      {r.details && <p lang={langOf(r.details)} className="whitespace-pre-wrap break-words">{r.details}</p>}
                      <p className="text-xs text-ink-muted">{dateFmt.format(r.createdAt)}{r.contact ? ` · ${r.contact}` : ""}</p>
                    </li>
                  ))}
                </ul>
                <ModerateForm t={t.admin} siteId={g.siteId} lang={lang} tab="reports" ops={g.siteStatus === "taken_down" ? ["dismiss"] : ["take_down", "dismiss"]} />
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  async function FeedbackTab() {
    const f = t.feedback.admin;
    const status = FEEDBACK_STATUSES.find((x) => x === sp.status);
    const type = FEEDBACK_TYPES.find((x) => x === sp.type);
    const items = await svc.feedback.adminList({ status, type }, 100);
    const fbDone = sp.fb === "saved" || sp.fb === "unchanged" ? sp.fb : null;
    const savedId = fbDone && typeof sp.item === "string" ? sp.item : null;
    const savedHere = savedId && items.some((x) => x.id === savedId) ? savedId : null;
    const total = FEEDBACK_STATUSES.reduce((n, x) => n + fbCounts[x], 0);
    const link = (next: { status?: string | null; type?: string | null }) => {
      const params = new URLSearchParams({ tab: "feedback" });
      const st = next.status === undefined ? status : next.status;
      const ty = next.type === undefined ? type : next.type;
      if (st) params.set("status", st);
      if (ty) params.set("type", ty);
      return `/${lang}/admin?${params.toString()}`;
    };
    const chip = "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-sm font-medium text-ink-muted hover:text-ink aria-[current=true]:border-ink aria-[current=true]:bg-ink aria-[current=true]:text-white pointer-fine:min-h-9";
    const statusChips = [{ v: null, label: f.all, n: total }, ...FEEDBACK_STATUSES.map((x) => ({ v: x, label: f.status[x], n: fbCounts[x] }))];
    const typeChips = [{ v: null, label: f.allTypes }, ...FEEDBACK_TYPES.map((x) => ({ v: x, label: t.feedback.types[x] }))];
    return (
      <section aria-labelledby="fb-admin-title" className="flex flex-col gap-3">
        <h2 id="fb-admin-title" className="sr-only">{f.title}</h2>
        {fbDone && savedId && !savedHere && (
          <FocusOnMount>
            <p role="status" className="rounded-lg border border-lagoon bg-white px-4 py-2 font-medium text-lagoon">
              {fbDone === "saved" ? f.saved : f.unchanged}
            </p>
          </FocusOnMount>
        )}
        <div className="flex flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-center xl:gap-x-4">
        <nav aria-label={f.statusFilter}>
          <ul className="flex flex-wrap gap-1.5">
            {statusChips.map((c) => (
              <li key={c.v ?? "all"}>
                <Link href={link({ status: c.v })} aria-current={(c.v ?? undefined) === status ? "true" : undefined} className={chip}>
                  {c.label}
                  <span className="tabular-nums">{c.n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={f.typeFilter}>
          <ul className="flex flex-wrap gap-1.5">
            {typeChips.map((c) => (
              <li key={c.v ?? "all"}>
                <Link href={link({ type: c.v })} aria-current={(c.v ?? undefined) === type ? "true" : undefined} className={chip}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        </div>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-ink-muted">{f.empty}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((x) => {
              const Icon = TYPE_ICONS[x.type];
              const agent = shortAgent(x.userAgent);
              return (
                <li key={x.id} id={`fb-${x.id}`} className="scroll-mt-44 rounded-xl border border-line bg-white px-3 py-2 lg:scroll-mt-28">
                  <FeedbackReplyForm
                    key={`${x.id}-${x.status}-${x.reply ?? ""}`}
                    t={f}
                    id={x.id}
                    lang={lang}
                    status={x.status}
                    reply={x.reply}
                    replyRead={!!x.replyReadAt}
                    filters={{ status, type }}
                    date={dateFmt.format(x.createdAt)}
                    justSaved={savedHere === x.id ? fbDone : null}
                    heading={
                      <h3 className="inline-flex items-center gap-1.5 font-semibold">
                        <Icon aria-hidden="true" className="size-4" /> {t.feedback.types[x.type]}
                      </h3>
                    }
                  >
                    <div className="flex gap-3">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p lang={langOf(x.message)} className="whitespace-pre-wrap break-words text-base pointer-fine:text-sm">{x.message}</p>
                        <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                          <span className="min-w-0 [overflow-wrap:anywhere]">
                            {x.owner ? (
                              <Link href={`/${lang}/admin?tab=users&user=${encodeURIComponent(x.ownerId)}`} className="font-medium text-ink underline underline-offset-4">
                                {x.owner.name || x.owner.contact}
                              </Link>
                            ) : (
                              f.unknownOwner
                            )}
                            {x.owner?.name && x.owner.contact && x.owner.contact !== x.owner.name && <> · {x.owner.contact}</>}
                            {x.owner && <> · {t.billing.plans[x.owner.plan]}</>}
                          </span>
                          <span className="min-w-0 [overflow-wrap:anywhere]">
                            {f.page}: <span className="font-mono">{x.page ?? f.noPage}</span>
                          </span>
                          <span className="font-medium text-ink">{x.rating ? format(f.rating, { n: x.rating }) : f.noRating}</span>
                          <span title={x.userAgent ?? undefined}>
                            {f.languages[x.locale]} · {f.devices[x.device]}
                            {agent && <> · {agent}</>}
                          </span>
                        </p>
                      </div>
                      {x.hasScreenshot && (
                        <a href={`/api/feedback/${x.id}/screenshot`} target="_blank" rel="noopener noreferrer" title={f.openScreenshot} className="shrink-0 self-start rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element -- private picture (cached per browser only): next/image would share it */}
                          <img src={`/api/feedback/${x.id}/screenshot?size=thumb`} alt={f.screenshotAlt} loading="lazy" width={72} height={48} className="h-12 w-18 rounded-lg border border-line bg-paper object-cover" />
                        </a>
                      )}
                    </div>
                  </FeedbackReplyForm>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  async function Sites() {
    const list = (await svc.moderation?.sites.recent(50)) ?? [];
    return (
      <section aria-labelledby="sites-title" className="flex flex-col gap-3">
        <h2 id="sites-title" className="text-base font-semibold">{t.admin.sitesTitle}</h2>
        {list.length === 0 ? (
          <p className="text-ink-muted">{t.admin.sitesEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((site) => (
              <li key={site.id} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono font-semibold">{site.slug}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${site.status === "published" ? "border border-lagoon bg-white text-lagoon" : site.status === "taken_down" ? "bg-coral-soft text-destructive" : "bg-paper text-ink"}`}>{t.admin.siteStatus[site.status]}</span>
                </div>
                {site.url && site.status === "published" && (
                  <a href={site.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-11 pointer-fine:min-h-9 w-fit items-center font-medium text-ink underline underline-offset-4">{t.admin.openSite}</a>
                )}
                {/* For helping an owner: what the AI wrote (content and colours), read from the latest version. */}
                <SiteFiles t={t.builder} label={t.admin.siteFiles} siteId={site.id} />
                {site.takenDownReason && (
                  <p className="text-ink-muted">
                    {t.admin.reasonShown}: <span lang={langOf(site.takenDownReason)}>{site.takenDownReason}</span>
                  </p>
                )}
                {site.status === "taken_down" && <ModerateForm t={t.admin} siteId={site.id} lang={lang} tab="sites" ops={site.takedownDeployedAt ? ["restore"] : ["retry", "restore"]} reason={site.takenDownReason ?? "admin"} />}
                {site.status === "published" && (
                  <details>
                    <summary className="inline-flex min-h-11 pointer-fine:min-h-9 cursor-pointer items-center font-medium text-destructive">{t.admin.takeDown}</summary>
                    <ModerateForm t={t.admin} siteId={site.id} lang={lang} tab="sites" ops={["take_down"]} />
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  async function Settings() {
    const [s, credits] = await Promise.all([svc.billing.settings(), svc.billing.credits()]);
    const birr = (minor: number) => (minor % 100 === 0 ? String(minor / 100) : `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`);
    const values = { ...s, prices: Object.fromEntries(Object.entries(s.prices).map(([k, v]) => [k, birr(v)])) };
    return (
      <section aria-labelledby="settings-title" className="flex flex-col gap-3">
        <h2 id="settings-title" className="text-base font-semibold">{t.admin.settingsTitle}</h2>
        <p className="text-ink-muted">{t.admin.settingsHint}</p>
        <SettingsForm t={t.admin} tb={t.billing} lang={lang} values={values} topupCredits={credits.topupCredits} />
        <div className="mt-4 border-t border-line pt-6">
          <CreditsForm t={t.admin} planNames={t.billing.plans} lang={lang} values={credits} />
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-6">
          <p className="text-ink-muted">{t.admin.settingsIncludesHint}</p>
          <PlanComparison t={{ ...t.plans.compare, title: t.admin.settingsIncludes }} planNames={t.billing.plans} id="admin-compare" features={planFeaturesWith(credits)} />
        </div>
      </section>
    );
  }

  async function Discounts() {
    const [offer, codes, credits] = await Promise.all([svc.billing.launchOffer(), svc.billing.store().discounts(), svc.billing.credits()]);
    const names = Object.fromEntries((["starter_month", "starter_year", "business_month", "business_year", "topup"] as const).map((p) => [p, productName(t.billing.productNames, p, credits.topupCredits)])) as Record<"starter_month" | "starter_year" | "business_month" | "business_year" | "topup", string>;
    const dayFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeZone: "Africa/Addis_Ababa" });
    // The offer's state in words, beside its one-click switch.
    const end = offer ? offerEndsAt(offer) : null;
    const date = offer ? offerUntilLabel(offer, lang as "en" | "am") : null;
    const values = offer ? { percent: offer.percent, products: offerProductsText(offer.products, lang as "en" | "am", t.billing, credits.topupCredits), date: date ?? "" } : null;
    const ended = !!offer?.active && end !== null && end < new Date();
    const stateText = !offer ? t.admin.offerStateNone : !offer.active ? t.admin.offerStateOff : ended ? format(t.admin.offerStateEnded, values!) : format(date ? t.admin.offerStateOnUntil : t.admin.offerStateOn, values!);
    return (
      <div className="flex flex-col gap-4">
        <OfferForm t={t.admin} names={names} lang={lang} value={offer} stateText={stateText} live={!!offer?.active && !ended} />
        <section aria-labelledby="codes-title" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="codes-title" className="text-base font-semibold">{t.admin.codesTitle}</h2>
            <p className="text-ink-muted">{t.admin.codesHint}</p>
          </div>
          <CodeForm t={t.admin} names={names} lang={lang} />
          {codes.length === 0 ? (
            <p className="text-ink-muted">{t.admin.codesEmpty}</p>
          ) : (
            <ul aria-label={t.admin.codesCaption} className="flex flex-col gap-3">
              {codes.map((c) => (
                <li key={c.id} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-base font-semibold">{c.code}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.active ? "bg-sunken text-ink" : "border border-line bg-white text-ink-muted"}`}>{c.active ? t.admin.codeActive : t.admin.codeInactive}<span className="sr-only">, {c.code}</span></span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                    <div><dt className="text-ink-muted">{t.admin.colDiscount}</dt><dd className="font-semibold">{c.percentOff !== null ? format(t.admin.percentOff, { n: c.percentOff }) : format(t.admin.birrOff, { n: amount(c.amountOffMinor ?? 0) })}</dd></div>
                    <div><dt className="text-ink-muted">{t.admin.colUses}</dt><dd className="font-semibold tabular-nums">{c.maxUses !== null ? format(t.admin.usesOf, { n: c.uses, max: c.maxUses }) : c.uses}</dd></div>
                    <div><dt className="text-ink-muted">{t.admin.colLastDay}</dt><dd className="font-semibold">{c.expiresAt ? dayFmt.format(c.expiresAt) : t.admin.noEnd}</dd></div>
                    <div><dt className="text-ink-muted">{t.admin.codeProducts}</dt><dd>{c.products.map((p) => names[p]).join(", ")}</dd></div>
                  </dl>
                  {(c.firstPaymentOnly || c.perCustomerOnce) && <p className="text-xs text-ink-muted">{[c.perCustomerOnce ? t.admin.codePerCustomer : "", c.firstPaymentOnly ? t.admin.firstOnly : ""].filter(Boolean).join(" · ")}</p>}
                  <form action={toggleDiscountCode}>
                    <input type="hidden" name="lang" value={lang} />
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={c.active ? "false" : "true"} />
                    <button className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:border-faint pointer-fine:min-h-9">
                      {c.active ? t.admin.codeDeactivate : t.admin.codeActivate}
                      <span className="sr-only"> {c.code}</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  async function Costs() {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const s = await svc.usageReport.summary(since);
    const purpose = (k: string) => (t.admin.purposes as Record<string, string>)[k] ?? k;
    const table = (title: string, rows: { key: string; costNanoUsd: number; requests: number }[], label: (k: string) => string = (k) => k) => (
      <table className="w-full text-start">
        <caption className="mb-2 text-start text-base font-semibold">{title}</caption>
        <thead>
          <tr className="border-b border-line text-ink-muted">
            <th scope="col" className="py-2 pe-3 text-start font-medium">{t.admin.costWhat}</th>
            <th scope="col" className="py-2 pe-3 text-end font-medium">{t.admin.costRequests}</th>
            <th scope="col" className="py-2 text-end font-medium">{t.admin.costUsd}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-line">
              <th scope="row" className="py-2 pe-3 text-start font-normal break-all">{label(r.key)}</th>
              <td className="py-2 pe-3 text-end tabular-nums">{r.requests}</td>
              <td className="py-2 text-end font-semibold tabular-nums">{usd(r.costNanoUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
    return (
      <section aria-labelledby="costs-title" className="flex flex-col gap-3">
        <h2 id="costs-title" className="text-base font-semibold">{t.admin.costsTitle}</h2>
        {s.requests === 0 ? (
          <p className="text-ink-muted">{t.admin.costEmpty}</p>
        ) : (
          <>
            <p className="text-base font-semibold">{format(t.admin.costTotal, { usd: usd(s.costNanoUsd), n: s.requests })}</p>
            {table(t.admin.costByPurpose, s.byPurpose, purpose)}
            {table(t.admin.costByDay, s.byDay)}
            {table(t.admin.costTopUsers, s.topUsers.map((u) => ({ ...u, key: u.key.slice(0, 12) })))}
          </>
        )}
      </section>
    );
  }
}
