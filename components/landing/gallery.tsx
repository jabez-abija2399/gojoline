import { ArrowUpRight } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { ShowcaseSite } from "@/lib/landing/showcase";
import { PanShot } from "./pan-shot";
import { StartFromLink } from "./start-from-link";

/** Twelve real Gojoline sites as a grid of cards. On a mouse, resting on one scrolls through its page. */
export function Gallery({ t, sites, labels, locale }: { t: Messages["landing"]["gallery"]; sites: ShowcaseSite[]; labels: Record<string, string>; locale: Locale }) {
  // This section is its own page (/templates), so its title is the page's h1.
  const href = `/${locale}/sign-in?next=/${locale}/build`;
  return (
    <section aria-labelledby="examples-title" className="py-12 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 id="examples-title" className="mx-auto max-w-[18ch] text-center text-[2rem] display min-[400px]:text-4xl sm:text-6xl">
          {t.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[60ch] text-center text-lg text-ink-muted">{t.intro}</p>
        <ul aria-label={t.listLabel} className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {sites.map((s, i) => (
            <li key={s.id}>
              <StartFromLink href={href} preset={s.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:border-faint hover:shadow-xl">
                <PanShot top={s.top} full={s.shot} eager={i < 4} first={i === 0} />
                <span className="flex flex-1 flex-col p-3 sm:p-4">
                  <span className="font-display text-lg leading-snug font-bold">{labels[s.id]}</span>
                  <span className="truncate text-ink-muted">{s.name}</span>
                  <span className="mt-auto inline-flex min-h-11 items-center gap-1 pt-1 font-medium text-link">
                    {t.start}
                    <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </span>
              </StartFromLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
