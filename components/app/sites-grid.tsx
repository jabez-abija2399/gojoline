"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Inbox, Lock, Search } from "lucide-react";

export interface SiteCard {
  id: string;
  name: string;
  status: "live" | "draft" | "taken_down";
  /** Where the site lives, when it is live. */
  address: { href: string; text: string } | null;
  /** "Changed 2 hours ago", worded on the server. */
  changed: string;
}

export interface SitesGridText {
  searchSites: string;
  noMatch: string;
  live: string;
  draft: string;
  takenDown: string;
  visit: string;
  answers: string;
}

const TINTS = ["bg-coral-soft", "bg-sunken", "bg-line", "bg-paper"];
/** Enough sites that finding one by eye gets slow. */
const SEARCH_FROM = 5;

/** The owner's sites as cards: what it is, whether the world can see it, and the three things to do with it. */
export function SitesGrid({ locale, sites, t }: { locale: string; sites: SiteCard[]; t: SitesGridText }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase();
  const shown = q ? sites.filter((s) => s.name.toLocaleLowerCase().includes(q) || s.address?.text.includes(q)) : sites;

  return (
    <div className="flex flex-col gap-4">
      {sites.length >= SEARCH_FROM && (
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-input bg-white px-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link sm:max-w-sm">
          <Search aria-hidden="true" className="size-5 shrink-0 text-ink-muted" />
          <span className="sr-only">{t.searchSites}</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchSites} maxLength={80} className="min-w-0 flex-1 bg-transparent py-2 text-base placeholder:text-ink-muted focus-visible:outline-none" />
        </label>
      )}
      <p role="status" className="text-ink-muted empty:hidden">
        {shown.length === 0 ? t.noMatch : ""}
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((s) => {
          const i = sites.indexOf(s);
          const badge =
            s.status === "live" ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-lagoon bg-white px-2 py-0.5 text-xs font-semibold text-lagoon">
                <span aria-hidden="true" className="size-2 rounded-full bg-lagoon" />
                {t.live}
              </span>
            ) : (
              <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${s.status === "taken_down" ? "bg-coral-soft text-destructive" : "bg-sunken text-ink-muted"}`}>{s.status === "taken_down" ? t.takenDown : t.draft}</span>
            );
          return (
            <li key={s.id} className="group relative flex min-w-0 overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-faint hover:shadow-md sm:flex-col">
              {/* A small browser window: the site's address is its picture until it has one. */}
              <div aria-hidden="true" className={`flex w-24 shrink-0 flex-col ${TINTS[i % TINTS.length]} sm:aspect-[16/9] sm:w-full`}>
                <div className="hidden items-center gap-1.5 border-b border-ink/10 px-3 py-2 sm:flex">
                  <span className="size-2 rounded-full bg-ink/20" />
                  <span className="size-2 rounded-full bg-ink/20" />
                  <span className="size-2 rounded-full bg-ink/20" />
                  <span className="ms-2 flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] text-ink-muted">
                    {!s.address && <Lock className="size-3 shrink-0" />}
                    <span className="truncate">{s.address?.text ?? (s.status === "taken_down" ? t.takenDown : t.draft)}</span>
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center">
                  <span className="font-display text-3xl font-bold text-ink sm:text-5xl">{[...s.name.trim()][0]?.toUpperCase() ?? "+"}</span>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                  <h3 className="min-w-0 truncate font-sans text-sm font-semibold">
                    {/* The whole card opens the site; the links below sit above this cover. */}
                    <Link href={`/${locale}/build/${s.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-link">
                      {s.name}
                    </Link>
                  </h3>
                  {badge}
                </div>
                <p className="text-xs text-ink-muted">{s.changed}</p>
                <div className="relative z-10 -mx-1 mt-auto flex flex-wrap gap-1">
                  {s.address && (
                    <a href={s.address.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink lg:min-h-8 hover:bg-sunken">
                      <ExternalLink aria-hidden="true" className="size-4" />
                      {t.visit}
                      <span className="sr-only">: {s.name}</span>
                    </a>
                  )}
                  <Link href={`/${locale}/dashboard/${s.id}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink lg:min-h-8 hover:bg-sunken">
                    <Inbox aria-hidden="true" className="size-4" />
                    {t.answers}
                    <span className="sr-only">: {s.name}</span>
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
