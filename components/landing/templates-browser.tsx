"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { CatalogItem, TemplateFeature, TemplateStyle } from "@/lib/landing/catalog";
import { isTemplateCategory, type TemplateCategory } from "@/lib/landing/template-categories";

export interface BrowserLabels {
  searchLabel: string;
  searchPlaceholder: string;
  results: string;
  oneResult: string;
  category: string;
  all: string;
  allTemplates: string;
  style: string;
  includes: string;
  filters: string;
  clear: string;
  none: string;
  /** "See {n} matching in all templates" */
  seeAll: string;
  seeAllOne: string;
  listLabel: string;
  categories: Record<TemplateCategory, string>;
  styles: Record<TemplateStyle, string>;
  features: Record<TemplateFeature, string>;
}

/**
 * The templates as a searchable gallery: a picture of each site's top, what kind of business it
 * is for and what it includes. Filters: one category (plain links with ?category=, so they work
 * before any script loads, and switch at once in the page when it has), any number of styles and
 * inclusions (a template shows when it matches one of the ticked styles and all the ticked inclusions).
 */
export function TemplatesBrowser({ items, labels, about, locale, categories, styles, features, t }: {
  items: CatalogItem[];
  /** The kind of business each template is for ("Hotel or guest house"). */
  labels: Record<string, string>;
  /** One line on what each template has. */
  about: Record<string, string>;
  locale: string;
  categories: TemplateCategory[];
  styles: TemplateStyle[];
  features: TemplateFeature[];
  t: BrowserLabels;
}) {
  const [query, setQuery] = useState("");
  // The category lives in the address (?category=), so links, Back and sharing all work.
  const param = useSearchParams().get("category");
  const category = isTemplateCategory(param) ? param : null;
  const chips = useRef<HTMLUListElement>(null);
  // On phones the chips scroll sideways: keep the picked one in view.
  useEffect(() => {
    const on = chips.current?.querySelector<HTMLElement>("[aria-current=page]");
    const row = chips.current;
    if (on && row && row.scrollWidth > row.clientWidth) row.scrollTo({ left: on.offsetLeft - 16 });
  }, [category]);
  const [pickedStyles, setStyles] = useState<TemplateStyle[]>([]);
  const [pickedFeatures, setFeatures] = useState<TemplateFeature[]>([]);
  const [open, setOpen] = useState(false);

  // Everything matching the search and the other filters, in any category.
  const anyCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (pickedStyles.length && !pickedStyles.includes(it.style)) return false;
      if (pickedFeatures.some((f) => !it.features.includes(f))) return false;
      if (!q) return true;
      const hay = [labels[it.id], about[it.id], it.name, it.tagline, t.categories[it.category]].join(" ").toLowerCase();
      return q.split(/\s+/).every((w) => hay.includes(w));
    });
  }, [items, query, pickedStyles, pickedFeatures, labels, about, t]);
  const shown = category ? anyCategory.filter((it) => it.category === category) : anyCategory;

  const base = `/${locale}/templates`;
  const filtered = Boolean(category || pickedStyles.length || pickedFeatures.length || query.trim());
  const clear = () => {
    setQuery("");
    setStyles([]);
    setFeatures([]);
    if (category) history.pushState(null, "", base);
  };
  /** With scripts, a category switches in place (the same address, no trip to the server). */
  const pick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    history.pushState(null, "", href);
  };
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const count = shown.length === 1 ? t.oneResult : t.results.replace("{n}", String(shown.length));
  const heading = category ? t.categories[category] : t.allTemplates;

  const check = "size-5 shrink-0 rounded border-line accent-[var(--gojo-coral)]";
  const panel = (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-2 font-semibold">{t.style}</legend>
        {styles.map((s) => (
          <label key={s} className="flex min-h-10 cursor-pointer items-center gap-3 px-2 text-ink-muted hover:text-ink">
            <input type="checkbox" className={check} checked={pickedStyles.includes(s)} onChange={() => setStyles((l) => toggle(l, s))} />
            {t.styles[s]}
          </label>
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-2 font-semibold">{t.includes}</legend>
        {features.map((f) => (
          <label key={f} className="flex min-h-10 cursor-pointer items-center gap-3 px-2 text-ink-muted hover:text-ink">
            <input type="checkbox" className={check} checked={pickedFeatures.includes(f)} onChange={() => setFeatures((l) => toggle(l, f))} />
            {t.features[f]}
          </label>
        ))}
      </fieldset>
      {filtered && (
        <button type="button" onClick={clear} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line px-4 font-medium hover:border-faint">
          <X aria-hidden="true" className="size-4" />
          {t.clear}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="relative mx-auto w-full max-w-2xl">
        <Search aria-hidden="true" className="pointer-events-none absolute start-5 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t.searchLabel}
          placeholder={t.searchPlaceholder}
          className="min-h-14 w-full rounded-2xl border border-line bg-white ps-13 pe-5 text-lg shadow-sm outline-none placeholder:text-ink-muted focus-visible:border-ink"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between gap-4">
            <p aria-live="polite" className="font-semibold">
              {count}
            </p>
            <button type="button" aria-expanded={open} aria-controls="template-filters" onClick={() => setOpen((o) => !o)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-medium lg:hidden">
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              {t.filters}
            </button>
          </div>
          <div id="template-filters" className={`${open ? "block" : "hidden"} rounded-2xl border border-line bg-white p-4 lg:block lg:border-0 lg:bg-transparent lg:p-0`}>
            {panel}
          </div>
        </aside>

        <section aria-labelledby="templates-heading" className="flex min-w-0 flex-col gap-6">
          <nav aria-label={t.category}>
            {/* Phones: one row that scrolls sideways; larger screens: the chips wrap. */}
            <ul ref={chips} className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {[null, ...categories].map((c) => {
                const on = category === c;
                const href = c ? `${base}?category=${c}` : base;
                return (
                  <li key={c ?? "all"} className="shrink-0">
                    <a
                      href={href}
                      onClick={(e) => pick(e, href)}
                      aria-current={on ? "page" : undefined}
                      className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition lg:min-h-9 ${on ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:border-faint"}`}
                    >
                      {c ? t.categories[c] : t.all}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
          <h2 id="templates-heading" className="text-2xl font-semibold">
            {heading} <span className="font-normal text-ink-muted">({shown.length})</span>
          </h2>
          {shown.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line p-8">
              <p className="text-ink-muted">{t.none}</p>
              {category && anyCategory.length > 0 && (
                <a href={base} onClick={(e) => pick(e, base)} className="inline-flex min-h-11 items-center font-medium text-link underline underline-offset-4">
                  {anyCategory.length === 1 ? t.seeAllOne : t.seeAll.replace("{n}", String(anyCategory.length))}
                </a>
              )}
              <button type="button" onClick={clear} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 font-medium hover:border-faint">
                {t.clear}
              </button>
            </div>
          ) : (
            <ul aria-label={t.listLabel} className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((it, i) => (
                <li key={it.id}>
                  <Link href={`/${locale}/templates/${it.id}`} className="group flex flex-col gap-3 rounded-2xl">
                    <span className="relative block overflow-hidden rounded-xl border border-line bg-sunken shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg">
                      <Image src={it.card} alt="" width={640} height={400} unoptimized sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" loading={i < 2 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} className="aspect-[16/10] h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      <span aria-hidden="true" className="absolute start-2.5 bottom-2.5 rounded-md border border-line bg-white/95 px-2 py-0.5 text-sm font-medium text-ink">{t.categories[it.category]}</span>
                    </span>
                    <span className="flex flex-col gap-0.5 px-1">
                      <span className="font-semibold">{labels[it.id]}</span>
                      <span className="text-ink-muted">{about[it.id]}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
