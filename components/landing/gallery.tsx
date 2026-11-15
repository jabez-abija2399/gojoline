import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { ShowcaseSite } from "@/lib/landing/showcase";

/** Twelve real Gojoline sites side by side. On a mouse, resting on one scrolls through its page. */
export function Gallery({ t, sites, labels, locale }: { t: Messages["landing"]["gallery"]; sites: ShowcaseSite[]; labels: Record<string, string>; locale: Locale }) {
  const href = `/${locale}/sign-in?next=/${locale}/build`;
  return (
    <section id="examples" aria-labelledby="examples-title" className="scroll-mt-20 overflow-hidden pt-16 pb-10 md:pt-24 md:pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="examples-title" className="max-w-[18ch] text-3xl font-bold sm:text-5xl">
          {t.title}
        </h2>
        <p className="mt-3 max-w-[60ch] text-lg text-ink-muted">{t.intro}</p>
      </div>
      <ul aria-label={t.listLabel} tabIndex={0} className="chips-scroll mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 sm:px-6 scroll-px-4 sm:scroll-px-6 lg:scroll-px-[max(1.5rem,calc((100vw_-_72rem)_/_2_+_1.5rem))] lg:px-[max(1.5rem,calc((100vw_-_72rem)_/_2_+_1.5rem))]">
        {sites.map((s) => (
          <li key={s.id} className="w-[232px] shrink-0 snap-start">
            <Link href={href} className="group flex flex-col gap-3 rounded-2xl">
              <span className="block h-[412px] overflow-hidden rounded-[1.75rem] border-[6px] border-ink bg-white shadow-lg transition group-hover:-translate-y-1 group-hover:shadow-2xl">
                <Image
                  src={s.shot.src}
                  alt=""
                  width={s.shot.width}
                  height={s.shot.height}
                  sizes="232px"
                  loading="lazy"
                  className="h-auto w-full transition-transform duration-[9s] ease-linear motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-y-[calc(-100%+400px)] motion-reduce:[@media(hover:hover)]:group-hover:translate-y-0"
                />
              </span>
              <span className="flex flex-col px-1">
                <span className="font-display text-lg font-bold">{labels[s.id]}</span>
                <span className="truncate text-ink-muted">{s.name}</span>
                <span className="mt-1 inline-flex min-h-11 items-center gap-1 font-medium text-teal underline-offset-4 group-hover:underline">
                  {t.start}
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
