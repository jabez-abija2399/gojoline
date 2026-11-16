import { Info, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { TOPUP_CREDITS } from "@/lib/billing/plans";
import { formatBirr } from "./plan-highlights";

/** Where people reach us (the brand's Telegram bot; also on the legal pages). */
export const CONTACT_URL = "https://t.me/gojoline_bot";

/** "Good to know": the rules people ask about before paying. */
export function PricingNotes({ t }: { t: Messages["plans"]["notes"] }) {
  return (
    <section aria-labelledby="notes-title" className="rounded-3xl border border-line bg-white p-6 sm:p-8">
      <h2 id="notes-title" className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Info aria-hidden="true" className="size-6 shrink-0" /> {t.title}
      </h2>
      <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
        {t.items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Extra changes (price from settings) and done-for-you setup (ask us). */
export function PricingExtras({ t, locale, topupMinor, topupHref }: { t: Messages["plans"]["extras"]; locale: Locale; topupMinor: number; topupHref?: string }) {
  return (
    <section aria-labelledby="extras-title" className="flex flex-col gap-4">
      <h2 id="extras-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h2>
      <ul className="grid gap-4 md:grid-cols-2">
        <li className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles aria-hidden="true" className="size-5 shrink-0" /> {t.topupTitle}
          </h3>
          <p className="flex-1 text-ink-muted">{format(t.topupBody, { n: TOPUP_CREDITS, price: formatBirr(topupMinor) })}</p>
          <Link href={topupHref ?? `/${locale}/sign-in?next=/${locale}/billing`} className="inline-flex min-h-11 w-fit items-center rounded-full border border-line px-5 font-semibold hover:border-faint lg:min-h-9">
            {t.topupCta}
          </Link>
        </li>
        <li className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <MessageCircle aria-hidden="true" className="size-5 shrink-0" /> {t.setupTitle}
          </h3>
          <p className="flex-1 text-ink-muted">{t.setupBody}</p>
          <p className="font-semibold">{t.setupPrice}</p>
          <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-fit items-center rounded-full border border-line px-5 font-semibold hover:border-faint lg:min-h-9">
            {t.setupCta}
          </a>
        </li>
      </ul>
    </section>
  );
}
