import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { looksSignedIn } from "@/lib/auth/signed-in";
import { Eyebrow } from "./eyebrow";
import { Mosaic } from "./mosaic";

/** The page's last word, on ink as the reference closes: the question, and the way in. */
export async function FinalCta({ t, locale, eyebrow, templates }: { t: Messages["landing"]["final"]; locale: Locale; eyebrow?: string; templates?: string }) {
  const signedIn = await looksSignedIn();
  return (
    <section aria-labelledby="final-title" className="below-fold [contain-intrinsic-size:auto_560px]! relative isolate overflow-hidden bg-ink text-white">
      <Mosaic className="fill-coral opacity-[0.22]" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(50%_70%_at_50%_100%,color-mix(in_oklab,var(--gojo-coral)_28%,transparent),transparent)]" />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 md:py-28">
        {eyebrow && <Eyebrow dark>{eyebrow}</Eyebrow>}
        <h2 id="final-title" className="reveal max-w-[16ch] text-4xl display text-white sm:text-6xl">
          {t.title}
        </h2>
        <p className="reveal max-w-[44ch] text-lg text-sunken">{t.body}</p>
        <div className="reveal flex flex-wrap items-center justify-center gap-3">
          <Link href={signedIn ? `/${locale}/build` : `/${locale}/sign-in?next=/${locale}/build`} className="group inline-flex min-h-14 shrink-0 items-center gap-2 rounded-full bg-coral px-7 text-lg font-semibold text-on-coral transition hover:bg-coral-hover">
            {signedIn ? t.ctaSignedIn : t.cta}
            <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
          {templates && (
            <Link href={`/${locale}/templates`} className="inline-flex min-h-14 items-center rounded-full border border-white/25 px-6 text-lg font-medium text-white transition-colors hover:bg-white/10">
              {templates}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
