import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, House, Inbox, Settings, Sparkles, Store } from "lucide-react";
import dynamic from "next/dynamic";
import { HomePanel } from "@/components/dashboard/home-panel";
import { ActiveTabInView } from "@/components/dashboard/active-tab";
import { loadHeader, loadHome } from "@/lib/dashboard/overview";
import { AppShell } from "@/components/app/app-shell";
// Each section's client code loads only with its own tab.
const MessagesPanel = dynamic(() => import("@/components/dashboard/messages-panel").then((m) => m.MessagesPanel));
const BusinessPanel = dynamic(() => import("@/components/dashboard/business-panel").then((m) => m.BusinessPanel));
const SettingsPanel = dynamic(() => import("@/components/dashboard/settings-panel").then((m) => m.SettingsPanel));
import { currentUser } from "@/lib/auth/session";
import { readLists } from "@/lib/cloud/lists";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/[id]">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).dashboard.metaTitle : undefined, robots: { index: false } };
}

const TABS = ["home", "messages", "info", "settings"] as const;
type Tab = (typeof TABS)[number];
const TAB_ICONS = { home: House, messages: Inbox, info: Store, settings: Settings };
/**
 * Links saved earlier still land somewhere sensible. Content (lists and photos) was removed on
 * 2026-11-16: content changes go through the AI, so they use credits; those links open Home.
 */
const OLD_TABS: Record<string, Tab> = { overview: "home", answers: "messages", lists: "home", photos: "home", content: "home", telegram: "settings" };

export default async function DashboardPage({ params, searchParams }: PageProps<"/[lang]/dashboard/[id]">) {
  const { lang, id } = await params;
  if (!isLocale(lang) || !z.uuid().safeParse(id).success) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/dashboard/${id}`);
  const builder = services().builder;
  if (!builder) redirect(`/${lang}/build`);
  const rawTab = String((await searchParams).tab ?? "");
  const tab: Tab = TABS.find((x) => x === rawTab) ?? OLD_TABS[rawTab] ?? "home";
  const header = await loadHeader(user.id, id);
  // Ownership first: nothing else is read for a project that isn't this owner's.
  // The sidebar's list already holds the project; an older one (past its 100) is looked up.
  const project = header.project ?? (await builder.store.getProject(user.id, id));
  if (!project) notFound();
  // Only the open section's data is read (every read is scoped to this owner).
  const showcaseStore = services().growth.showcase;
  const [home, versions, latest, showcaseOn] = await Promise.all([
    tab === "home" ? loadHome(user.id, id, lang) : null,
    tab === "settings" ? builder.store.listVersions(user.id, id).catch(() => []) : null,
    tab === "settings" ? builder.store.latestVersion(user.id, id).catch(() => null) : null,
    tab === "settings" && showcaseStore ? showcaseStore.optedIn(user.id, id).catch(() => null) : null,
  ]);
  const t = getMessages(lang);
  const d = t.dashboard;
  const labels: Record<Tab, string> = { home: d.tabHome, messages: d.tabMessages, info: d.tabInfo, settings: d.tabSettings };
  const name = project.name || t.builder.untitled;
  const status = { live: d.statusLive, resting: d.statusResting, draft: d.statusDraft, taken_down: d.statusTakenDown }[header.status];
  const bot = services().telegram?.username ?? "gojoline_bot";
  const other = lang === "en" ? "am" : "en";
  const scan = [d.qrPosterScan, getMessages(other).dashboard.qrPosterScan];
  const published = header.status === "live" || header.status === "resting";

  return (
    <AppShell locale={lang} t={t} user={user}>
      <main id="main" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <Link href={`/${lang}/build`} className="-ms-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-muted hover:bg-sunken hover:text-ink lg:min-h-9">
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t.builder.back}
            </Link>
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{name}</h1>
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${header.status === "live" ? "border border-lagoon text-lagoon" : header.status === "taken_down" ? "bg-coral-soft text-destructive" : header.status === "resting" ? "border border-warning text-warning" : "bg-sunken text-ink-muted"}`}>
                {header.status === "live" && <span aria-hidden="true" className="size-1.5 rounded-full bg-lagoon" />}
                {status}
              </span>
            </div>
            <p className="text-sm text-ink-muted">{d.title}</p>
          </div>
          {/* The AI editor is always one tap away; a draft's Home leads with publishing instead, so this turns ink there. */}
          <Link href={`/${lang}/build/${id}`} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors lg:min-h-9 ${header.status === "draft" && tab === "home" ? "bg-ink text-white hover:bg-ink-hover" : "bg-coral text-on-coral hover:bg-coral-hover"}`}>
            <Sparkles aria-hidden="true" className="size-4" />
            {d.editWithAi}
          </Link>
        </div>
        <nav id="dashboard-tabs" aria-label={d.title} className="chips-scroll -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:mx-0 sm:px-0 sm:[mask-image:none]">
          {TABS.map((x) => {
            const Icon = TAB_ICONS[x];
            const count = x === "messages" ? header.counts.waiting : 0;
            return (
              <Link
                key={x}
                href={`/${lang}/dashboard/${id}?tab=${x}`}
                aria-current={x === tab ? "page" : undefined}
                className="relative -mb-px inline-flex min-h-12 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink lg:min-h-11"
              >
                <Icon aria-hidden="true" className="size-4" />
                {labels[x]}
                {count > 0 && (
                  <span className="rounded-full bg-ink px-1.5 text-xs font-semibold tabular-nums text-white">
                    {count}
                    <span className="sr-only"> {d.kpiWaiting}</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <ActiveTabInView navId="dashboard-tabs" />
        {home && <HomePanel o={home} t={d} locale={lang} projectId={id} siteName={name} supportBot={bot} scan={scan} guideLabel={t.guide.dashboardLink} />}
        {tab === "messages" && (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <MessagesPanel t={d} locale={lang} projectId={id} />
          </div>
        )}
        {tab === "info" && <BusinessPanel t={d} locale={lang} projectId={id} state={{ live: published, outdated: header.outdated }} />}
        {tab === "settings" && (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <SettingsPanel
              t={d}
              tb={t.builder}
              locale={lang}
              projectId={id}
              bot={bot}
              s={{
                status: header.status,
                address: header.address,
                versions: (versions ?? []).map((v) => ({ number: v.number, summary: v.summary, createdAt: v.createdAt.toISOString() })),
                current: latest?.number ?? null,
                languages: (latest?.files["src/site.json"] ? readLists(latest.files["src/site.json"])?.languages : null) ?? [lang],
                siteName: name,
              }}
              showcase={showcaseStore ? { t: t.growth.showcase, on: showcaseOn } : undefined}
            />
          </div>
        )}
      </main>
    </AppShell>
  );
}
