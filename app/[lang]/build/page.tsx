import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { BuilderHeader } from "@/components/builder/builder-header";
import { Button } from "@/components/ui/button";
import { PendingButton } from "@/components/builder/pending-button";
import { currentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";
import { createProject } from "./actions";
import { PRESET_IDS } from "@/lib/template/presets";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/build">): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: isLocale(lang) ? getMessages(lang).builder.metaTitle : undefined,
    robots: { index: false },
  };
}

export default async function ProjectsPage({
  params,
  searchParams,
}: PageProps<"/[lang]/build">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/build`);
  const t = getMessages(lang);
  const builder = services().builder;
  const projects = builder ? await builder.store.listProjects(user.id) : [];
  const tooMany = (await searchParams).error === "too_many";
  const dateFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const templates = builder ? (
    <section aria-labelledby="templates-title" className="flex flex-col gap-3">
      <h2 id="templates-title" className="text-xl font-bold">
        {t.builder.templatesTitle}
      </h2>
      <p className="text-ink-muted">{t.builder.templatesHint}</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRESET_IDS.map((id) => (
          <li key={id}>
            <form action={createProject} className="h-full">
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="preset" value={id} />
              <PendingButton className="flex h-full min-h-14 w-full items-center rounded-xl border border-line bg-white px-4 py-3 text-start font-medium hover:border-teal-mid">
                {t.builder.templates[id]}
              </PendingButton>
            </form>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  return (
    <>
      <BuilderHeader
        locale={lang}
        t={t}
        user={user}
        navLinks={[
          { href: `/${lang}/billing`, label: t.billing.link, icon: "plan" },
        ]}
      />
      <main
        id="main"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">{t.builder.title}</h1>
          {builder && (
            <form action={createProject}>
              <input type="hidden" name="lang" value={lang} />
              <Button type="submit" size="lg">
                <Plus aria-hidden="true" /> {t.builder.newSite}
              </Button>
            </form>
          )}
        </div>
        {tooMany && (
          <p
            role="alert"
            className="rounded-lg bg-clay-soft px-4 py-3 text-destructive"
          >
            {t.builder.tooMany}
          </p>
        )}
        {projects.length === 0 && templates}
        {!builder ? (
          <p className="rounded-xl border border-line bg-white p-6 text-ink-muted">
            {t.builder.unavailable}
          </p>
        ) : projects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-ink-muted">
            {t.builder.empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/${lang}/build/${p.id}`}
                  className="flex min-h-16 flex-col justify-center rounded-xl border border-line bg-white px-5 py-3 hover:border-teal-mid"
                >
                  <span className="font-semibold">
                    {p.name || t.builder.untitled}
                  </span>
                  <span className="text-ink-muted">
                    {format(t.builder.updated, {
                      date: dateFmt.format(p.updatedAt),
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {projects.length > 0 && templates}
      </main>
    </>
  );
}
