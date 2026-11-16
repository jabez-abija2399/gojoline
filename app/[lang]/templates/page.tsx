import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/landing/final-cta";
import { TemplatesBrowser } from "@/components/landing/templates-browser";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { serif } from "@/lib/fonts-landing";
import { isLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { TEMPLATE_FEATURES, TEMPLATE_STYLES, templateCatalog } from "@/lib/landing/catalog";
import { z } from "zod";
import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/lib/landing/template-categories";

/** The category in the address (?category=food); anything else means all templates. */
async function pickedCategory(searchParams: PageProps<"/[lang]/templates">["searchParams"]): Promise<TemplateCategory | null> {
  const parsed = z.enum(TEMPLATE_CATEGORIES).safeParse((await searchParams).category);
  return parsed.success ? parsed.data : null;
}

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/templates">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getMessages(lang).landing.gallery;
  const category = await pickedCategory(searchParams);
  return { title: category ? `${t.categories[category]} · ${t.title}` : t.title, description: t.intro };
}

/** Every starter site: search, filter, open one to see all its sections, then use it. */
export default async function TemplatesPage({ params }: PageProps<"/[lang]/templates">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  const g = t.landing.gallery;
  return (
    <>
      <SiteHeader locale={lang} t={t} nav current="templates" />
      <main id="main" tabIndex={-1} className={`${serif.variable} flex-1 focus:outline-none`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 md:py-20">
          <header className="flex flex-col items-center gap-4 text-center">
            <h1 className="max-w-[7em] text-[2.25rem] display min-[400px]:text-5xl sm:text-6xl">{g.title}</h1>
            <p className="max-w-[60ch] text-lg text-ink-muted">{g.intro}</p>
          </header>
          <TemplatesBrowser
            items={templateCatalog(lang)}
            labels={t.builder.templates}
            about={g.about}
            locale={lang}
            categories={[...TEMPLATE_CATEGORIES]}
            styles={[...TEMPLATE_STYLES]}
            features={[...TEMPLATE_FEATURES]}
            t={{
              searchLabel: g.searchLabel,
              searchPlaceholder: g.searchPlaceholder,
              results: g.results,
              oneResult: g.oneResult,
              category: g.category,
              all: g.all,
              allTemplates: g.allTemplates,
              style: g.style,
              includes: g.includes,
              filters: g.filters,
              clear: g.clear,
              none: g.none,
              seeAll: g.seeAll,
              seeAllOne: g.seeAllOne,
              listLabel: g.listLabel,
              categories: g.categories,
              styles: g.styles,
              features: g.features,
            }}
          />
        </div>
        <FinalCta t={t.landing.final} locale={lang} />
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
