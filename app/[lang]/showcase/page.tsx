import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { serif } from "@/lib/fonts-landing";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { TEMPLATE_INFO } from "@/lib/landing/template-info";
import { reportError } from "@/lib/observability/report";
import { showcaseList } from "@/lib/growth/showcase-cache";
import type { ShowcaseEntry } from "@/lib/growth/showcase";

export async function generateMetadata({ params }: PageProps<"/[lang]/showcase">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getMessages(lang).growth.showcase;
  return { title: t.metaTitle, description: t.metaDescription, alternates: { canonical: `/${lang}/showcase`, languages: { en: "/en/showcase", am: "/am/showcase" } } };
}

/** Live sites whose owners chose to be shown (Settings → Gojoline showcase). */
export default async function ShowcasePage({ params }: PageProps<"/[lang]/showcase">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  const s = t.growth.showcase;
  let entries: ShowcaseEntry[] | null;
  try {
    entries = await showcaseList();
  } catch (e) {
    reportError("showcase list failed", e);
    entries = null;
  }
  const sector = (e: ShowcaseEntry) => {
    const info = e.templateId ? (TEMPLATE_INFO as Record<string, { category: keyof typeof t.landing.gallery.categories }>)[e.templateId] : undefined;
    return info ? t.landing.gallery.categories[info.category] : s.otherSector;
  };
  const host = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <>
      <SiteHeader locale={lang} t={t} nav />
      <main id="main" tabIndex={-1} className={`${serif.variable} mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 focus:outline-none sm:px-6 md:py-16`}>
        <header className="flex max-w-2xl flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{s.eyebrow}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">{s.title}</h1>
          <p className="text-lg text-ink-muted">{s.intro}</p>
        </header>
        {entries === null ? (
          <p role="alert" className="rounded-2xl bg-coral-soft p-6 font-medium text-destructive">{s.loadError}</p>
        ) : entries.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-6 text-ink-muted">{s.empty}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((e, i) => (
              <li key={e.siteId}>
                <a href={e.url} target="_blank" rel="noopener ugc" data-track="showcase_site" className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:border-faint hover:shadow-sm">
                  <span className="relative flex aspect-[16/10] items-center justify-center bg-sunken">
                    {e.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- our own ~640 px WebP, already sized; next/image would only re-encode it.
                      <img
                        src={`/api/showcase/image/${e.thumb.key}`}
                        alt=""
                        width={e.thumb.width}
                        height={e.thumb.height}
                        loading={i < 2 ? "eager" : "lazy"}
                        fetchPriority={i < 2 ? "high" : undefined}
                        decoding="async"
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <span aria-hidden="true" className="font-display text-5xl font-bold text-ink-muted">{[...e.name][0]?.toLocaleUpperCase(lang)}</span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-1 p-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{sector(e)}</span>
                    <span className="font-display text-lg font-bold [overflow-wrap:anywhere]">{e.name}</span>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm text-ink-muted" dir="ltr">
                      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                      <span className="truncate">{host(e.url)}</span>
                    </span>
                    <span className="sr-only"> {s.newTab}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <Link href={`/${lang}/sign-in?next=/${lang}/build`} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-coral px-6 font-semibold text-on-coral transition hover:bg-coral-hover">
          {s.cta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
