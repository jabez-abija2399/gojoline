import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

export function FinalCta({ t, locale }: { t: Messages["landing"]["final"]; locale: Locale }) {
  return (
    <section aria-labelledby="final-title" className="px-4 pb-16 sm:px-6">
      <div className="reveal mx-auto flex max-w-6xl flex-col items-start gap-5 overflow-hidden rounded-3xl bg-teal px-6 py-12 text-white sm:px-12 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-[48ch] flex-col gap-3">
          <h2 id="final-title" className="text-3xl font-bold text-white sm:text-4xl">{t.title}</h2>
          <p className="text-lg text-teal-soft">{t.body}</p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <Link href={`/${locale}/sign-in?next=/${locale}/build`} className="group inline-flex min-h-12 items-center gap-2 rounded-lg bg-clay px-6 text-lg font-semibold text-white hover:bg-clay-hover">
            {t.cta}
            <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a href="#waitlist" className="inline-flex min-h-11 items-center text-white underline underline-offset-4 hover:text-teal-soft">{t.waitlist}</a>
        </div>
      </div>
    </section>
  );
}
