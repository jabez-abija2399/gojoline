import { Check } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

/** Plan cards; monthly prices come from Admin → Settings. */
export function Pricing({ t, planNames, prices, locale }: { t: Messages["landing"]["pricing"]; planNames: Messages["billing"]["plans"]; prices: { starter: number; business: number }; locale: Locale }) {
  const birr = (minor: number) => `${new Intl.NumberFormat("en-US").format(minor / 100)} ${t.birr}`;
  const plans = [
    { id: "free" as const, price: t.free, popular: false },
    { id: "starter" as const, price: birr(prices.starter), popular: true },
    { id: "business" as const, price: birr(prices.business), popular: false },
  ];
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <h2 id="pricing-title" className="text-3xl font-bold sm:text-5xl">{t.title}</h2>
        <p className="mt-2 text-lg text-ink-muted">{t.intro}</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3 md:items-stretch">
          {plans.map((p) => (
            <li key={p.id} className={`reveal relative flex flex-col gap-4 rounded-3xl border p-6 ${p.popular ? "border-teal bg-sand shadow-lg ring-2 ring-teal" : "border-line bg-white"}`}>
              {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-teal px-3 py-1 font-semibold text-white">{t.popular}</span>}
              <h3 className="text-xl font-bold">{planNames[p.id]}</h3>
              <p>
                <span className="font-display text-4xl font-bold">{p.price}</span>
                {p.id !== "free" && <span className="text-ink-muted"> {t.perMonth}</span>}
              </p>
              <ul className="flex flex-1 flex-col gap-2">
                {t.plans[p.id].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-teal" />
                    {line}
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/sign-in?next=/${locale}/build`} className={`inline-flex min-h-12 items-center justify-center rounded-lg px-5 font-semibold ${p.popular ? "bg-teal text-white hover:bg-teal-deep" : "border border-line hover:border-teal-mid"}`}>
                {t.cta}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
