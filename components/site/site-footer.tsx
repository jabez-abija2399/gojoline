import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { format, type Messages } from "@/lib/i18n";
import { services } from "@/lib/server/services";
import { LanguageSwitch } from "./language-switch";

/**
 * The public pages' footer, on ink as the reference ends: the brand and where it's made, then
 * columns of links (product, help, legal), then a bar of what every site gets and the year.
 */
export function SiteFooter({ locale, t }: { locale: Locale; t: Messages }) {
  const f = t.footer;
  const other: Locale = locale === "en" ? "am" : "en";
  const bot = services().telegram?.username ?? "gojoline_bot";
  const columns: { id: string; title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
    {
      id: "product",
      title: f.product,
      links: [
        { href: `/${locale}/templates`, label: t.landing.nav.templates },
        { href: `/${locale}/pricing`, label: t.landing.nav.prices },
        { href: `/${locale}#how`, label: t.landing.nav.how },
      ],
    },
    {
      id: "help",
      title: f.help,
      links: [
        { href: `/${locale}#faq`, label: f.questions },
        { href: `https://t.me/${bot}`, label: f.telegramBot, external: true },
        { href: `/${locale}/report`, label: f.report },
      ],
    },
    {
      id: "legal",
      title: f.legal,
      links: [
        { href: `/${locale}/privacy`, label: f.privacy },
        { href: `/${locale}/terms`, label: f.terms },
      ],
    },
  ];
  const link = "inline-flex min-h-11 items-center text-sunken underline-offset-4 transition-colors hover:text-white hover:underline";
  return (
    <footer className="gojo-tone-light relative z-10 mt-auto bg-ink text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:py-16">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <Image src={locale === "am" ? "/brand/logo-am-reversed.svg" : "/brand/logo-reversed.svg"} alt={t.common.logoAlt} width={locale === "am" ? 118 : 141} height={36} className="h-9 w-auto self-start" />
          <p className="text-lg text-sunken">{f.tagline}</p>
          <p className="flex items-center gap-2 text-sunken">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-coral" />
            {f.madeIn}
          </p>
          <LanguageSwitch target={other} label={t.common.languageSwitch} ariaLabel={t.common.languageSwitchLabel} className="inline-flex min-h-11 w-fit items-center rounded-full border border-white/25 px-4 font-medium text-white transition-colors hover:bg-white/10" />
        </div>
        {columns.map((c) => (
          <nav key={c.id} aria-labelledby={`footer-${c.id}`} className="flex flex-col gap-1">
            <p id={`footer-${c.id}`} className="mb-1 text-sm font-semibold text-white">
              {c.title}
            </p>
            {c.links.map((l) =>
              l.external ? (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className={link}>
                  {l.label}
                  <span className="sr-only"> {t.dashboard.newTab}</span>
                </a>
              ) : (
                <Link key={l.href} href={l.href} className={link}>
                  {l.label}
                </Link>
              ),
            )}
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-sunken sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {f.trust.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check aria-hidden="true" className="size-4 text-lagoon" />
                {item}
              </li>
            ))}
          </ul>
          <p>{format(f.rights, { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
