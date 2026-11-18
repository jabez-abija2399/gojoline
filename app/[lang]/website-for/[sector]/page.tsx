import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { createProject } from "@/app/[lang]/build/actions";
import { PendingButton } from "@/components/builder/pending-button";
import { StartFromLink } from "@/components/landing/start-from-link";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { looksSignedIn } from "@/lib/auth/signed-in";
import { serif } from "@/lib/fonts-landing";
import { isLocale, locales } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { isSector, SECTOR_PAGES, SECTORS } from "@/lib/landing/sectors";
import { sectorJsonLd } from "@/lib/landing/sector-jsonld";
import { showcaseSites } from "@/lib/landing/showcase";

export function generateStaticParams() {
  return SECTORS.map((sector) => ({ sector }));
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: PageProps<"/[lang]/website-for/[sector]">): Promise<Metadata> {
  const { lang, sector } = await params;
  if (!isLocale(lang) || !isSector(sector)) return {};
  const c = SECTOR_PAGES[sector].copy[lang];
  const path = `/website-for/${sector}`;
  return {
    title: c.headline,
    description: c.intro,
    alternates: { canonical: `/${lang}${path}`, languages: Object.fromEntries([...locales.map((l) => [l, `/${l}${path}`]), ["x-default", `/en${path}`]]) },
    openGraph: { title: c.headline, description: c.intro, url: `/${lang}${path}` },
  };
}

/**
 * One kind of business (café, church, school…): why a site helps, the template to start from,
 * and its questions, in the visitor's language. Made for search: unique words per sector.
 */
export default async function SectorPage({ params }: PageProps<"/[lang]/website-for/[sector]">) {
  const { lang, sector } = await params;
  if (!isLocale(lang) || !isSector(sector)) notFound();
  const t = getMessages(lang);
  const g = t.growth.sectors;
  const page = SECTOR_PAGES[sector];
  const c = page.copy[lang];
  const templateName = t.builder.templates[page.template];
  const shot = showcaseSites(lang).find((s) => s.id === page.template);
  const signedIn = await looksSignedIn();
  const cta = "inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full bg-coral px-6 font-semibold text-on-coral transition hover:bg-coral-hover";
  const start = signedIn ? (
    <form action={createProject}>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="preset" value={page.template} />
      <PendingButton className={cta}>
        {g.start}
        <ArrowRight aria-hidden="true" className="size-4" />
      </PendingButton>
    </form>
  ) : (
    <StartFromLink href={`/${lang}/sign-in?next=/${lang}/build`} preset={page.template} className={cta}>
      {g.start}
      <ArrowRight aria-hidden="true" className="size-4" />
    </StartFromLink>
  );
  const ld = sectorJsonLd({ url: `${siteUrl.replace(/\/$/, "")}/${lang}/website-for/${sector}`, lang, headline: c.headline, description: c.intro, faq: c.faq });

  return (
    <>
      <SiteHeader locale={lang} t={t} nav />
      <main id="main" tabIndex={-1} className={`${serif.variable} flex-1 focus:outline-none`}>
        <script type="application/ld+json" nonce={(await headers()).get("x-nonce") ?? undefined} dangerouslySetInnerHTML={{ __html: ld }} />
        <section aria-labelledby="sector-title" className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-center md:py-16">
          <div className="flex min-w-0 flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              {g.eyebrow} {c.short}
            </p>
            <h1 id="sector-title" className="font-display text-3xl font-bold tracking-tight text-balance sm:text-5xl">{c.headline}</h1>
            <p className="max-w-[60ch] text-lg text-ink-muted">{c.intro}</p>
            {start}
            <p className="text-sm text-ink-muted">{g.startNote}</p>
          </div>
          {shot && (
            <figure className="flex flex-col gap-3">
              <Image src={shot.top.src} width={shot.top.width} height={shot.top.height} alt={format(g.exampleAlt, { template: templateName })} sizes="(min-width: 768px) 40vw, 90vw" className="mx-auto h-auto w-full max-w-sm rounded-2xl border border-line shadow-md" priority />
              <figcaption className="mx-auto flex max-w-sm flex-col gap-1 text-sm text-ink-muted">
                <span className="font-semibold text-ink">{g.exampleTitle}</span>
                <span>{format(g.exampleBody, { template: templateName })}</span>
                <Link href={`/${lang}/templates/${page.template}`} className="inline-flex min-h-11 w-fit items-center gap-1 font-medium text-ink underline underline-offset-4 lg:min-h-9">
                  {g.seeExample}
                  <span className="sr-only">: {templateName}</span>
                </Link>
              </figcaption>
            </figure>
          )}
        </section>

        <section aria-labelledby="benefits-title" className="bg-white py-12 md:py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6">
            <h2 id="benefits-title" className="font-display text-2xl font-bold sm:text-3xl">{g.benefitsTitle}</h2>
            <ul className="grid gap-4 md:grid-cols-3">
              {c.benefits.map((b) => (
                <li key={b.title} className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-5">
                  <Check aria-hidden="true" className="size-5 text-lagoon" />
                  <h3 className="text-lg font-semibold">{b.title}</h3>
                  <p className="text-ink-muted">{b.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="sector-faq-title" className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-12 sm:px-6 md:py-16">
          <h2 id="sector-faq-title" className="font-display text-2xl font-bold sm:text-3xl">{g.faqTitle}</h2>
          {c.faq.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-line bg-white open:border-faint">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sunken transition-colors group-open:bg-ink group-open:text-white">
                  <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <p className="px-5 pb-5 text-ink-muted">{item.a}</p>
            </details>
          ))}
          <div className="mt-4 flex flex-col gap-2">{start}</div>
        </section>

        <nav aria-labelledby="others-title" className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-14 sm:px-6">
          <h2 id="others-title" className="text-lg font-semibold">{g.othersTitle}</h2>
          <ul className="flex flex-wrap gap-2">
            {SECTORS.filter((s) => s !== sector).map((s) => (
              <li key={s}>
                <Link href={`/${lang}/website-for/${s}`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-medium hover:border-faint">
                  {SECTOR_PAGES[s].copy[lang].short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter locale={lang} t={t} />
    </>
  );
}
