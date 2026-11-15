import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

export function FinalCta({ t, locale }: { t: Messages["landing"]["final"]; locale: Locale }) {
  return (
    <section aria-labelledby="final-title" className="px-4 pb-16 sm:px-6 md:pb-24">
      <div className="reveal mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink text-white">
        <div className="flex flex-col items-start gap-6 px-6 py-12 sm:px-12 md:flex-row md:items-center md:justify-between md:py-16">
          <div className="flex max-w-[48ch] flex-col gap-3">
            <h2 id="final-title" className="text-3xl font-bold text-white sm:text-5xl">
              {t.title}
            </h2>
            <p className="text-lg text-sunken">{t.body}</p>
          </div>
          <Link href={`/${locale}/sign-in?next=/${locale}/build`} className="group inline-flex min-h-14 shrink-0 items-center gap-2 rounded-full bg-coral px-7 text-lg font-semibold text-on-coral transition hover:bg-coral-hover">
            {t.cta}
            <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
