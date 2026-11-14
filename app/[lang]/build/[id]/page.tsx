import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { Builder } from "@/components/builder/builder";
import { BuilderHeader } from "@/components/builder/builder-header";
import { currentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";

export const metadata: Metadata = { robots: { index: false } };

export default async function ProjectPage({ params }: PageProps<"/[lang]/build/[id]">) {
  const { lang, id } = await params;
  if (!isLocale(lang) || !z.uuid().safeParse(id).success) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/build/${id}`);
  const owner = user.id;
  const builder = services().builder;
  if (!builder) redirect(`/${lang}/build`);
  const project = await builder.store.getProject(owner, id);
  if (!project) notFound();
  const t = getMessages(lang);
  const [messages, versions] = await Promise.all([builder.store.listMessages(owner, id), builder.store.listVersions(owner, id)]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <BuilderHeader locale={lang} t={t} user={user} backHref={`/${lang}/build`} backLabel={t.builder.back} navLink={{ href: `/${lang}/dashboard/${id}`, label: t.dashboard.link }} />
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        <h1 className="sr-only">{project.name || t.builder.untitled}</h1>
        <Builder
          locale={lang}
          projectId={id}
          t={t.builder}
          noCreditsText={t.billing.noCredits}
          initialMessages={messages.map((m) => ({
            id: m.id,
            role: m.role,
            text: m.status === "failed" ? t.builder.reverted : m.text,
            versionNumber: m.versionNumber,
            tone: m.status === "failed" ? "error" : undefined,
          }))}
          initialVersions={versions.map((v) => ({ number: v.number, summary: v.summary, createdAt: v.createdAt.toISOString() }))}
        />
      </main>
    </div>
  );
}
