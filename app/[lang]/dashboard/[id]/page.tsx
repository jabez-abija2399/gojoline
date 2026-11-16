import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, Images, Inbox, LayoutDashboard, ListOrdered, Send, Sparkles } from "lucide-react";
import { OverviewPanel } from "@/components/dashboard/overview";
import { ActiveTabInView } from "@/components/dashboard/active-tab";
import { loadHeader, loadOverview } from "@/lib/dashboard/overview";
import { AppShell } from "@/components/app/app-shell";
import { AnswersPanel } from "@/components/dashboard/answers-panel";
import { ListsPanel } from "@/components/dashboard/lists-panel";
import { PhotosPanel } from "@/components/dashboard/photos-panel";
import { TelegramPanel } from "@/components/dashboard/telegram-panel";
import { currentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/[id]">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).dashboard.metaTitle : undefined, robots: { index: false } };
}

const TABS = ["overview", "answers", "lists", "photos", "telegram"] as const;
const TAB_ICONS = { overview: LayoutDashboard, answers: Inbox, lists: ListOrdered, photos: Images, telegram: Send };

export default async function DashboardPage({ params, searchParams }: PageProps<"/[lang]/dashboard/[id]">) {
  const { lang, id } = await params;
  if (!isLocale(lang) || !z.uuid().safeParse(id).success) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/dashboard/${id}`);
  const builder = services().builder;
  if (!builder) redirect(`/${lang}/build`);
  const rawTab = (await searchParams).tab;
  const tab = TABS.find((x) => x === rawTab) ?? "overview";
  // All reads start together (every one is scoped to this owner). Every tab shows the site's
  // state and the New count; only the overview loads the rest.
  const [header, overview] = await Promise.all([loadHeader(user.id, id), tab === "overview" ? loadOverview(user.id, id, lang) : null]);
  // The sidebar's list already holds the project; an older one (past its 100) is looked up.
  const project = header.project ?? (await builder.store.getProject(user.id, id));
  if (!project) notFound();
  const t = getMessages(lang);
  const d = t.dashboard;
  const labels = { overview: d.tabOverview, answers: d.tabAnswers, lists: d.tabLists, photos: d.tabPhotos, telegram: d.tabTelegram };
  const name = project.name || t.builder.untitled;
  const status = { live: d.statusLive, draft: d.statusDraft, taken_down: d.statusTakenDown }[header.status];

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
              <h1 className="truncate text-2xl font-semibold tracking-tight">{name}</h1>
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${header.status === "live" ? "border border-lagoon text-lagoon" : header.status === "taken_down" ? "bg-coral-soft text-destructive" : "bg-sunken text-ink-muted"}`}>
                {header.status === "live" && <span aria-hidden="true" className="size-1.5 rounded-full bg-lagoon" />}
                {status}
              </span>
            </div>
            <p className="text-sm text-ink-muted">{d.title}</p>
          </div>
          <Link href={`/${lang}/build/${id}`} className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors lg:min-h-9 ${overview?.status === "draft" ? "bg-ink text-white hover:bg-ink-hover" : "bg-coral text-on-coral hover:bg-coral-hover"}`}>
            <Sparkles aria-hidden="true" className="size-4" />
            {d.editWithAi}
          </Link>
        </div>
        <nav id="dashboard-tabs" aria-label={d.title} className="chips-scroll -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:mx-0 sm:px-0 sm:[mask-image:none]">
          {TABS.map((x) => {
            const Icon = TAB_ICONS[x];
            const count = x === "answers" ? header.counts.unread : 0;
            return (
              <Link
                key={x}
                href={`/${lang}/dashboard/${id}?tab=${x}`}
                aria-current={x === tab ? "page" : undefined}
                className="relative -mb-px inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink aria-[current=page]:border-ink aria-[current=page]:text-ink"
              >
                <Icon aria-hidden="true" className="size-4" />
                {labels[x]}
                {count > 0 && (
                  <span className="rounded-full bg-ink px-1.5 text-xs font-semibold tabular-nums text-white">
                    {count}
                    <span className="sr-only"> {d.answersNew}</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <ActiveTabInView navId="dashboard-tabs" />
        {overview && <OverviewPanel o={overview} t={d} locale={lang} projectId={id} siteName={name} supportBot={services().telegram?.username ?? "gojoline_bot"} />}
        {tab !== "overview" && (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            {tab === "answers" && <AnswersPanel t={d} locale={lang} projectId={id} />}
            {tab === "lists" && <ListsPanel t={d} locale={lang} projectId={id} />}
            {tab === "photos" && <PhotosPanel t={d} projectId={id} />}
            {tab === "telegram" && <TelegramPanel t={d} locale={lang} bot={services().telegram?.username ?? "gojoline_bot"} />}
          </div>
        )}
      </main>
    </AppShell>
  );
}
