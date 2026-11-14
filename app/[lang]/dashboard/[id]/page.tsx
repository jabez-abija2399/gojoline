import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { BuilderHeader } from "@/components/builder/builder-header";
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
    <>
      <BuilderHeader locale={lang} t={t} user={user} backHref={`/${lang}/build/${id}`} backLabel={t.dashboard.backToBuilder} />
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold">{t.dashboard.title}</h1>
          <p className="text-ink-muted">{project.name || t.builder.untitled}</p>
        </div>
        <nav aria-label={t.dashboard.title} className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1">
          {TABS.map((x) => (
            <Link
              key={x}
              href={`/${lang}/dashboard/${id}?tab=${x}`}
              aria-current={x === tab ? "page" : undefined}
              className="inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-3 font-medium text-ink-muted aria-[current=page]:bg-teal aria-[current=page]:text-white"
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
    </>
  );
}
