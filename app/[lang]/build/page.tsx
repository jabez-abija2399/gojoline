import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { HomeTabs } from "@/components/app/home-tabs";
import { SitesGrid, type SiteCard } from "@/components/app/sites-grid";
import { PresetStart } from "@/components/builder/preset-start";
import { StartBox } from "@/components/builder/start-box";
import { PendingButton } from "@/components/builder/pending-button";
import { ago, greetingName, liveAddress, ownerSites } from "@/lib/app/shell-data";
import { currentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { showcaseSites } from "@/lib/landing/showcase";
import { services } from "@/lib/server/services";
import { createProject } from "./actions";

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
  const a = t.app;
  const b = t.builder;
  const builder = services().builder;
  const owned = await ownerSites(user.id);
  const tooMany = (await searchParams).error === "too_many";
  const name = greetingName(user.name);

  const cards: SiteCard[] = owned.map(({ project, site }) => ({
    id: project.id,
    name: project.name || b.untitled,
    status: site?.status === "taken_down" ? "taken_down" : liveAddress(site) ? "live" : "draft",
    address: liveAddress(site),
    changed: format(a.edited, { when: ago(project.updatedAt, lang) }),
  }));

  const sitesPanel =
    cards.length === 0 ? (
      <p className="rounded-2xl border border-dashed border-line p-6 text-center text-ink-muted">{a.sitesEmpty}</p>
    ) : (
      <SitesGrid locale={lang} sites={cards} t={{ searchSites: a.searchSites, noMatch: a.noMatch, live: a.live, draft: a.draft, takenDown: a.takenDown, visit: a.visit, answers: a.answers }} />
    );

  // Each template is shown by a picture of the real site it gives.
  const templatesPanel = (
    <div className="flex flex-col gap-4">
      <p className="max-w-[65ch] text-sm text-ink-muted">{b.templatesHint}</p>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {showcaseSites(lang).map((site, i) => (
          <li key={site.id} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-faint hover:shadow-md">
            {/* The picture and name open the full preview; "Use" starts a site from it at once. */}
            <Link href={`/${lang}/templates/${site.id}`} className="flex flex-1 flex-col">
              <span className="block aspect-[4/3] w-full overflow-hidden bg-sunken">
                <Image src={site.top.src} alt="" width={site.top.width} height={site.top.height} sizes="(min-width: 1280px) 220px, (min-width: 768px) 30vw, 46vw" loading={cards.length === 0 && i < 4 ? "eager" : "lazy"} className="w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
              </span>
              <span className="flex flex-1 items-center gap-2 px-3 pt-3 text-sm font-medium">{b.templates[site.id]}</span>
            </Link>
            <form action={createProject} data-preset={site.id} className="p-2 pt-1 sm:p-3 sm:pt-1">
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="preset" value={site.id} />
              <PendingButton aria-label={`${b.useTemplate}: ${b.templates[site.id]}`} className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-line px-3 text-sm font-medium whitespace-nowrap hover:border-faint">
                {b.useTemplate}
                <ArrowRight aria-hidden="true" className="size-4" />
              </PendingButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <AppShell locale={lang} t={t} user={user}>
      <main id="main" className="relative flex w-full flex-1 flex-col overflow-x-clip">
        {/* A warm glow behind the start box: the one place on the page that asks for something. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_70%_at_50%_0%,var(--gojo-coral-soft),transparent)]" />
        <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
          {builder && <PresetStart autoStart={cards.length === 0} />}
          {tooMany && (
            <p role="alert" className="rounded-lg bg-coral-soft px-4 py-3 text-destructive">
              {b.tooMany}
            </p>
          )}
          {!builder ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">{b.title}</h1>
              <p className="rounded-xl border border-line bg-white p-6 text-ink-muted">{b.unavailable}</p>
            </>
          ) : (
            <>
              <StartBox
                t={{ startBody: b.startBody, startPlaceholder: b.startPlaceholder, ideasLabel: b.ideasLabel, ideas: b.ideas, startLang: b.startLang, langEn: b.langEn, langAm: b.langAm, langBothShort: b.langBothShort, newSite: b.newSite }}
                locale={lang}
                action={createProject}
                title={name ? format(a.greeting, { name }) : a.greetingNoName}
                autoStart={cards.length === 0}
              />
              <HomeTabs label={a.homeTabs} labels={{ sites: `${a.sites}${cards.length ? ` (${cards.length})` : ""}`, templates: a.templates }} initial={cards.length === 0 ? "templates" : "sites"} sites={sitesPanel} templates={templatesPanel} />
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
