import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, BedDouble, Church, Coffee, GraduationCap, HeartHandshake, House, MoonStar, Mountain, PartyPopper, ShoppingBag, Stethoscope, UserRound } from "lucide-react";
import { BuilderHeader } from "@/components/builder/builder-header";
import { PresetStart } from "@/components/builder/preset-start";
import { StartBox } from "@/components/builder/start-box";
import { PendingButton } from "@/components/builder/pending-button";
import { currentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";
import { createProject } from "./actions";
import { PRESET_IDS } from "@/lib/template/presets";
import { InstallApp } from "@/components/pwa/install-app";

const TEMPLATE_ICONS = { cafe: Coffee, hotel: BedDouble, clinic: Stethoscope, school: GraduationCap, shop: ShoppingBag, worship: Church, mosque: MoonStar, events: PartyPopper, ngo: HeartHandshake, "real-estate": House, tours: Mountain, personal: UserRound } as const;
const installClass = "inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-teal-soft bg-white px-4 font-medium text-teal hover:border-teal-mid";

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

  const tints = ["bg-teal-soft text-teal", "bg-line text-ink", "bg-teal text-white", "bg-sand text-teal"];

  const templates = builder ? (
    <section aria-labelledby="templates-title" className="flex flex-col gap-3">
      <h2 id="templates-title" className="text-2xl font-bold">
        {t.builder.templatesTitle}
      </h2>
      <p className="max-w-[65ch] text-ink-muted">{t.builder.templatesHint}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {PRESET_IDS.map((id) => {
          const Icon = TEMPLATE_ICONS[id];
          return (
            <li key={id}>
              <form action={createProject} data-preset={id} className="h-full">
                <input type="hidden" name="lang" value={lang} />
                <input type="hidden" name="preset" value={id} />
                <PendingButton className="group flex h-full min-h-24 w-full flex-col items-start gap-3 rounded-2xl border border-line bg-white p-4 text-start font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-teal-mid hover:shadow-md">
                  <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-teal-soft text-teal transition-colors group-hover:bg-teal group-hover:text-white">
                    <Icon className="size-5" />
                  </span>
                  {t.builder.templates[id]}
                </PendingButton>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  ) : null;

  const b = t.builder;
  const startText = { startTitle: b.startTitle, startAgainTitle: b.startAgainTitle, startBody: b.startBody, startPlaceholder: b.startPlaceholder, ideasLabel: b.ideasLabel, ideas: b.ideas, startLang: b.startLang, langEn: b.langEn, langAm: b.langAm, langBothShort: b.langBothShort, newSite: b.newSite };
  const startBox = builder ? <StartBox t={startText} locale={lang} action={createProject} heading={projects.length === 0 ? "h1" : "h2"} autoStart={projects.length === 0} /> : null;

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
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10"
      >
        {builder && <PresetStart autoStart={projects.length === 0} />}
        {tooMany && (
          <p
            role="alert"
            className="rounded-lg bg-clay-soft px-4 py-3 text-destructive"
          >
            {t.builder.tooMany}
          </p>
        )}
        {!builder ? (
          <>
            <h1 className="text-3xl font-bold">{t.builder.title}</h1>
            <p className="rounded-xl border border-line bg-white p-6 text-ink-muted">
              {t.builder.unavailable}
            </p>
          </>
        ) : projects.length === 0 ? (
          <>
            {startBox}
            <InstallApp t={t.pwa} className={installClass} />
            {templates}
          </>
        ) : (
          <>
            <section aria-labelledby="sites-title" className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 id="sites-title" className="text-3xl font-bold">
                  {t.builder.title}
                </h1>
                <InstallApp t={t.pwa} className={installClass} />
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p, i) => {
                  const name = p.name || t.builder.untitled;
                  return (
                    <li key={p.id} className="min-w-0">
                      <Link
                        href={`/${lang}/build/${p.id}`}
                        className="group flex h-full min-h-20 items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-mid hover:shadow-md"
                      >
                        <span aria-hidden="true" className={`flex size-12 shrink-0 items-center justify-center rounded-xl font-display text-xl font-bold ${tints[i % tints.length]}`}>
                          {[...name.trim()][0]?.toUpperCase() ?? "+"}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-semibold">{name}</span>
                          <span className="text-sm text-ink-muted">
                            {format(t.builder.updated, {
                              date: dateFmt.format(p.updatedAt),
                            })}
                          </span>
                        </span>
                        <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-teal" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
            {startBox}
            {templates}
          </>
        )}
      </main>
    </>
  );
}
