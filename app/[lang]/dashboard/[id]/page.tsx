import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, Pencil } from "lucide-react";
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

const TABS = ["answers", "lists", "photos", "telegram"] as const;

export default async function DashboardPage({ params, searchParams }: PageProps<"/[lang]/dashboard/[id]">) {
  const { lang, id } = await params;
  if (!isLocale(lang) || !z.uuid().safeParse(id).success) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/dashboard/${id}`);
  const builder = services().builder;
  if (!builder) redirect(`/${lang}/build`);
  const project = await builder.store.getProject(user.id, id);
  if (!project) notFound();
  const t = getMessages(lang);
  const rawTab = (await searchParams).tab;
  const tab = TABS.find((x) => x === rawTab) ?? "answers";
  const labels = { answers: t.dashboard.tabAnswers, lists: t.dashboard.tabLists, photos: t.dashboard.tabPhotos, telegram: t.dashboard.tabTelegram };

  return (
    <AppShell locale={lang} t={t} user={user}>
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/${lang}/build`} className="-ms-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-medium text-ink-muted hover:bg-sunken hover:text-ink">
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t.builder.back}
            </Link>
            <h1 className="truncate text-3xl font-bold">{project.name || t.builder.untitled}</h1>
            <p className="text-ink-muted">{t.dashboard.title}</p>
          </div>
          <Link href={`/${lang}/build/${id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 font-medium text-white transition-colors hover:bg-ink-hover">
            <Pencil aria-hidden="true" className="size-4" />
            {t.dashboard.backToBuilder}
          </Link>
        </div>
        <nav aria-label={t.dashboard.title} className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-white p-1 sm:flex">
          {TABS.map((x) => (
            <Link
              key={x}
              href={`/${lang}/dashboard/${id}?tab=${x}`}
              aria-current={x === tab ? "page" : undefined}
              className="inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 font-medium text-ink-muted aria-[current=page]:bg-ink aria-[current=page]:text-white"
            >
              {labels[x]}
            </Link>
          ))}
        </nav>
        {tab === "answers" && <AnswersPanel t={t.dashboard} locale={lang} projectId={id} />}
        {tab === "lists" && <ListsPanel t={t.dashboard} locale={lang} projectId={id} />}
        {tab === "photos" && <PhotosPanel t={t.dashboard} projectId={id} />}
        {tab === "telegram" && <TelegramPanel t={t.dashboard} locale={lang} bot={services().telegram?.username ?? "gojoline_bot"} />}
      </main>
    </AppShell>
  );
}
