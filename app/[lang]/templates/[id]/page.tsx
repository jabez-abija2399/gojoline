import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Users } from "lucide-react";
import { createProject } from "@/app/[lang]/build/actions";
import { PendingButton } from "@/components/builder/pending-button";
import { StartFromLink } from "@/components/landing/start-from-link";
import { TemplatePreviewer } from "@/components/landing/template-preview";
import { currentUser } from "@/lib/auth/session";
import { serif } from "@/lib/fonts-landing";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { exampleHost } from "@/lib/landing/example-address";
import { templateHighlights } from "@/lib/landing/template-highlights";
import { TEMPLATE_INFO } from "@/lib/landing/template-info";
import { templatePreview } from "@/lib/landing/template-preview";
import { templateUsage, usageToShow } from "@/lib/landing/template-usage";
import { services } from "@/lib/server/services";
import { suggestSlug } from "@/lib/sites/slug";
import { presetName, type PresetId } from "@/lib/template/presets";

export async function generateMetadata({ params }: PageProps<"/[lang]/templates/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLocale(lang)) return {};
  const preview = templatePreview(id, lang);
  if (!preview) return {};
  const t = getMessages(lang);
  const g = t.landing.gallery;
  return {
    title: `${t.builder.templates[preview.id]} · ${g.categories[TEMPLATE_INFO[preview.id].category]} · ${g.title}`,
    description: format(t.landing.templatePreview.metaDescription, {
      about: g.about[preview.id],
      list: TEMPLATE_INFO[preview.id].designedFor[lang].join(t.landing.templatePreview.listSeparator),
    }),
  };
}

/** The address the example would get on our own publishing domain (the English name as the slug), or null. */
function exampleAddress(id: PresetId): string | null {
  return exampleHost(suggestSlug(presetName(id, "en"), id), { PUBLISH_BASE_DOMAIN: process.env.PUBLISH_BASE_DOMAIN }, services().publish?.publisher ?? null);
}

/**
 * One template in full (the header, footer and the check that the template exists are in layout.tsx). Phones: what it is, who it suits and its highlights, then every page and
 * section, with "Use this template" in a bar at the bottom. Large screens: the preview on the
 * left and the same details in a column on the right that stays in view, button included.
 */
export default async function TemplatePage({ params }: PageProps<"/[lang]/templates/[id]">) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const preview = templatePreview(id, lang);
  if (!preview) notFound();
  const t = getMessages(lang);
  const p = t.landing.templatePreview;
  const g = t.landing.gallery;
  const label = t.builder.templates[preview.id];
  const info = TEMPLATE_INFO[preview.id];
  const highlights = templateHighlights(preview.id, lang);
  const [user, usage] = await Promise.all([currentUser(), templateUsage()]);
  const used = usageToShow(usage, preview.id);
  const signedIn = Boolean(user);
  const useClass = "inline-flex min-h-12 whitespace-nowrap items-center justify-center gap-2 rounded-full bg-coral px-6 font-semibold text-on-coral transition hover:bg-coral-hover";
  // Signed in: the template opens as a new site at once. Otherwise sign in first; the pick is kept.
  const use = signedIn ? (
    <form action={createProject}>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="preset" value={preview.id} />
      <PendingButton className={useClass}>
        {p.use}
        <ArrowRight aria-hidden="true" className="size-4" />
      </PendingButton>
    </form>
  ) : (
    <StartFromLink href={`/${lang}/sign-in?next=/${lang}/build`} preset={preview.id} className={useClass}>
      {p.use}
      <ArrowRight aria-hidden="true" className="size-4" />
    </StartFromLink>
  );
  const pageWord = preview.pages.length === 1 ? p.onePage : format(p.pageCount, { n: String(preview.pages.length) });
  const category = g.categories[info.category];

  return (
    <>
      <main id="main" tabIndex={-1} className={`${serif.variable} flex-1 focus:outline-none`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:py-10">
          <nav aria-label={p.breadcrumb}>
            <ol className="flex flex-wrap items-center gap-x-1 text-sm">
              <li className="flex items-center gap-1">
                <Link href={`/${lang}/templates`} className="inline-flex min-h-11 min-w-11 items-center justify-center font-medium text-link underline-offset-4 hover:underline lg:min-h-9">
                  {p.templates}
                </Link>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-muted rtl:rotate-180" />
              </li>
              <li className="flex items-center gap-1">
                <Link href={`/${lang}/templates?category=${info.category}`} className="inline-flex min-h-11 min-w-11 items-center justify-center font-medium text-link underline-offset-4 hover:underline lg:min-h-9">
                  {category}
                </Link>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-muted rtl:rotate-180" />
              </li>
              <li className="flex min-h-11 items-center lg:min-h-9">
                <span aria-current="page" className="text-ink-muted">
                  {label}
                </span>
              </li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
            {/* Phones and tablets: summary, then the preview, then the details (this wrapper is display: contents).
                Large screens: the right-hand column, where only the summary and its button stay in view. */}
            <div className="contents lg:col-start-2 lg:row-start-1 lg:block">
              <section
                aria-labelledby="template-name"
                className="order-1 flex min-w-0 flex-col gap-3 lg:sticky lg:top-24 lg:z-10 lg:bg-paper lg:pb-6 lg:before:absolute lg:before:inset-x-0 lg:before:bottom-full lg:before:h-24 lg:before:bg-paper"
              >
                <h1 id="template-name" className="display text-4xl sm:text-5xl lg:text-4xl">
                  {label}
                </h1>
                <p className="font-medium">{format(p.example, { name: preview.name })}</p>
                <p className="text-lg text-ink-muted">{g.about[preview.id]}</p>
                <p className="text-ink-muted">
                  {pageWord} · {format(p.sectionCount, { n: String(preview.sectionCount) })} · {p.languages}
                </p>
                {used !== null && (
                  <p className="flex items-center gap-2 font-medium">
                    <Users aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
                    {format(p.usedBy, { n: used.toLocaleString(lang === "am" ? "am-ET" : "en-US") })}
                  </p>
                )}
                {/* Large screens: the one button lives here (the bottom bar is for phones and tablets). */}
                <div className="mt-3 max-lg:hidden [&_a]:w-full [&_button]:w-full">{use}</div>
              </section>

              <div className="order-3 flex min-w-0 flex-col gap-6 lg:pt-2">
                <section aria-labelledby="designed-for" className="flex flex-col gap-2">
                  <h2 id="designed-for" className="font-semibold">
                    {p.designedFor}
                  </h2>
                  <ul className="flex flex-col gap-1.5">
                    {info.designedFor[lang].map((who) => (
                      <li key={who} className="flex items-start gap-2">
                        <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-ink-muted" />
                        <span>{who}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section aria-labelledby="highlights" className="flex flex-col gap-3">
                  <h2 id="highlights" className="font-semibold">
                    {p.highlightsTitle}
                  </h2>
                  {/* Plain facts, not buttons: flat tags with no border. */}
                  <ul className="flex flex-wrap gap-2">
                    {highlights.map((h) => (
                      <li key={h.key} className="rounded-md bg-sunken px-2 py-1 text-sm">
                        {h.label ?? p.highlights[h.key]}
                      </li>
                    ))}
                  </ul>
                </section>

                <p className="text-sm text-ink-muted">{p.samples}</p>
              </div>
            </div>

            <section aria-label={p.pages} className="order-2 flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-1">
              <TemplatePreviewer
                pages={preview.pages}
                host={exampleAddress(preview.id)}
                t={{ pages: p.pages, view: p.view, desktop: p.desktop, phone: p.phone, pageHeading: p.pageHeading, fullSize: p.fullSize, address: p.address, sectionsLabel: p.sectionsLabel, screenLabel: p.screenLabel, kinds: p.kinds }}
              />
            </section>
          </div>

          <nav aria-label={p.more} className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
            <Link href={`/${lang}/templates/${preview.prev}`} className="inline-flex min-h-11 items-center gap-2 font-medium text-link">
              <ArrowLeft aria-hidden="true" className="size-4" />
              <span className="sr-only">{p.previous}: </span>
              {t.builder.templates[preview.prev]}
            </Link>
            <Link href={`/${lang}/templates/${preview.next}`} className="inline-flex min-h-11 items-center gap-2 font-medium text-link sm:justify-end">
              <span className="sr-only">{p.next}: </span>
              {t.builder.templates[preview.next]}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </nav>
        </div>

        {/* Phones and tablets: the one thing to do here, always in reach. */}
        <div data-use-bar className="sticky bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="min-w-0 truncate font-medium max-sm:hidden">
              {preview.name} <span className="font-normal text-ink-muted">· {pageWord}</span>
            </p>
            <div className="max-sm:w-full max-sm:[&_a]:w-full max-sm:[&_button]:w-full">{use}</div>
          </div>
        </div>
      </main>
    </>
  );
}
