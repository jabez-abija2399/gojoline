import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { ShowcaseSite } from "@/lib/landing/showcase";
import { StartFromLink } from "./start-from-link";

const WIDE_HOVER = "[@media(hover:hover)_and_(min-width:1024px)]";

/** Twelve real Gojoline sites as a grid of cards. On a mouse, resting on one scrolls through its page. */
export function Gallery({ t, sites, labels, locale }: { t: Messages["landing"]["gallery"]; sites: ShowcaseSite[]; labels: Record<string, string>; locale: Locale }) {
  const href = `/${locale}/sign-in?next=/${locale}/build`;
  return (
    <section id="examples" aria-labelledby="examples-title" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="examples-title" className="max-w-[18ch] text-3xl display sm:text-5xl">
          {t.title}
        </h2>
        <p className="mt-3 max-w-[60ch] text-lg text-ink-muted">{t.intro}</p>
        <ul aria-label={t.listLabel} className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {sites.map((s) => (
            <li key={s.id}>
              <StartFromLink href={href} preset={s.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:border-faint hover:shadow-xl">
                <span className="block aspect-[4/5] overflow-hidden border-b border-line bg-sunken">
                  {/* Phones and tablets get a small picture of the top of the page. */}
                  <Image src={s.top.src} alt="" width={s.top.width} height={s.top.height} sizes="(min-width: 1024px) 270px, (min-width: 768px) 33vw, 50vw" loading="lazy" className={`h-auto w-full ${WIDE_HOVER}:hidden`} />
                  {/* Large screens with a mouse get the whole page, which scrolls by while the pointer rests on it. */}
                  <Image
                    src={s.shot.src}
                    alt=""
                    width={s.shot.width}
                    height={s.shot.height}
                    sizes="270px"
                    loading="lazy"
                    className={`hidden h-auto w-full transition-transform duration-[9s] ease-linear motion-reduce:transition-none ${WIDE_HOVER}:block ${WIDE_HOVER}:group-hover:translate-y-[calc(-100%+330px)] motion-reduce:group-hover:translate-y-0`}
                  />
                </span>
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
