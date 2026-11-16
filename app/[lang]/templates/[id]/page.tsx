import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createProject } from "@/app/[lang]/build/actions";
import { PendingButton } from "@/components/builder/pending-button";
import { StartFromLink } from "@/components/landing/start-from-link";
import { TemplatePreviewer } from "@/components/landing/template-preview";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { currentUser } from "@/lib/auth/session";
import { serif } from "@/lib/fonts-landing";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { templatePreview } from "@/lib/landing/template-preview";

export async function generateMetadata({ params }: PageProps<"/[lang]/templates/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLocale(lang)) return {};
  const preview = templatePreview(id, lang);
  if (!preview) return {};
  const t = getMessages(lang);
  return { title: `${t.builder.templates[preview.id]} · ${t.landing.gallery.title}`, description: preview.tagline };
}

/** One template in full: every page and section, then "Use this template". */
export default async function TemplatePage({ params }: PageProps<"/[lang]/templates/[id]">) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();
  const preview = templatePreview(id, lang);
  if (!preview) notFound();
  const t = getMessages(lang);
  const p = t.landing.templatePreview;
  const label = t.builder.templates[preview.id];
  const signedIn = Boolean(await currentUser());
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

  return (
    <>
      <SiteHeader locale={lang} t={t} nav current="templates" />
      <main id="main" tabIndex={-1} className={`${serif.variable} flex-1 focus:outline-none`}>
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:py-12">
          <Link href={`/${lang}/templates`} className="inline-flex min-h-11 w-fit items-center gap-2 font-medium text-link">
            <ArrowLeft aria-hidden="true" className="size-4" />
            {p.back}
          </Link>
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
            <div className="flex max-w-[60ch] flex-col gap-3">
              <p className="font-medium text-ink-muted">{label}</p>
              <h1 className="display text-4xl sm:text-5xl">{preview.name}</h1>
              {preview.tagline && <p className="text-lg text-ink-muted">{preview.tagline}</p>}
              <p className="text-ink-muted">
                {pageWord} · {format(p.sectionCount, { n: String(preview.sectionCount) })} · {p.languages}
              </p>
              <p className="text-ink-muted">{p.samples}</p>
            </div>
            <div className="shrink-0 max-md:hidden">{use}</div>
          </header>

          <TemplatePreviewer pages={preview.pages} t={{ pages: p.pages, view: p.view, desktop: p.desktop, phone: p.phone, kinds: p.kinds }} />

          <nav aria-label={p.more} className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
            <Link href={`/${lang}/templates/${preview.prev}`} className="inline-flex min-h-11 items-center gap-2 font-medium text-link">
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t.builder.templates[preview.prev]}
            </Link>
            <Link href={`/${lang}/templates/${preview.next}`} className="inline-flex min-h-11 items-center gap-2 font-medium text-link sm:justify-end">
              {t.builder.templates[preview.next]}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </nav>
        </div>

        {/* The one thing to do here, always in reach. */}
        <div className="sticky bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="min-w-0 truncate font-medium max-sm:hidden">{label}</p>
            <div className="max-sm:w-full max-sm:[&_a]:w-full max-sm:[&_button]:w-full">{use}</div>
          </div>
        </div>
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
