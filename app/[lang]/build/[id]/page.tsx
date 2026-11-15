import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { Builder } from "@/components/builder/builder";
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

  const who = user.name || user.phone || user.email || "";

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <main id="main" className="flex min-h-0 flex-1 flex-col">
        <h1 className="sr-only">{project.name || t.builder.untitled}</h1>
        <Builder
          locale={lang}
          projectId={id}
          t={t.builder}
          siteName={project.name || t.builder.untitled}
          chrome={{
            home: t.common.homeLink,
            logoAlt: t.common.logoAlt,
            back: t.builder.back,
            dashboard: t.dashboard.link,
            plan: t.billing.link,
            signOut: t.auth.signOut,
            signedInAs: t.auth.signedInAs.replace("{who}", who),
            language: t.common.languageSwitch,
            languageLabel: t.common.languageSwitchLabel,
            more: t.builder.menuMore,
          }}
          photoText={{
            photoAdded: t.dashboard.photoAdded,
            photoRemoved: t.dashboard.photoRemoved,
            photoLabel: t.dashboard.photoLabel,
            photoRemoveNamed: t.dashboard.photoRemoveNamed,
            photoRemove: t.dashboard.photoRemove,
            photoErrors: t.dashboard.photoErrors,
            loading: t.dashboard.loading,
          }}
          noCredits={{ text: t.billing.noCredits, action: t.billing.getMore }}
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
