import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

export function FinalCta({ t, locale }: { t: Messages["landing"]["final"]; locale: Locale }) {
  return (
    <section aria-labelledby="final-title" className="px-4 pb-16 sm:px-6 md:pb-24">
      <div className="reveal mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink text-white">
        <div className="flex flex-col items-center gap-6 px-6 py-14 text-center sm:px-12 md:py-20">
          <h2 id="final-title" className="max-w-[18ch] text-3xl display text-white sm:text-5xl">
            {t.title}
          </h2>
          <p className="max-w-[48ch] text-lg text-sunken">{t.body}</p>
          <Link href={`/${locale}/sign-in?next=/${locale}/build`} className="group inline-flex min-h-14 shrink-0 items-center gap-2 rounded-full bg-coral px-7 text-lg font-semibold text-on-coral transition hover:bg-coral-hover">
            {t.cta}
            <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
