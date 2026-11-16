import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { Mosaic } from "./mosaic";
import { looksSignedIn } from "@/lib/auth/signed-in";

export async function FinalCta({ t, locale }: { t: Messages["landing"]["final"]; locale: Locale }) {
  const signedIn = await looksSignedIn();
  return (
    <section aria-labelledby="final-title" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24 below-fold">
      <div className="reveal relative isolate w-full overflow-hidden rounded-[2rem] bg-coral">
        <Mosaic className="fill-white opacity-30" />
        <div className="relative flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-12 md:py-28">
          <h2 id="final-title" className="max-w-[18ch] text-4xl display text-ink sm:text-6xl">
            {t.title}
          </h2>
          <p className="max-w-[48ch] text-lg text-ink">{t.body}</p>
          <Link href={signedIn ? `/${locale}/build` : `/${locale}/sign-in?next=/${locale}/build`} className="group inline-flex min-h-14 shrink-0 items-center gap-2 rounded-full bg-ink px-7 text-lg font-semibold text-white transition hover:bg-ink-hover">
            {signedIn ? t.ctaSignedIn : t.cta}
            <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
