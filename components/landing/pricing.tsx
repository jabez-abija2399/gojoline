import { Check } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

/** Plan cards; monthly prices come from Admin → Settings. */
export function Pricing({ t, planNames, prices, locale }: { t: Messages["landing"]["pricing"]; planNames: Messages["billing"]["plans"]; prices: { starter: number; business: number }; locale: Locale }) {
  const birr = (minor: number) => `${new Intl.NumberFormat("en-US").format(minor / 100)} ${t.birr}`;
  const plans = [
    // "0 Birr", so the card doesn't say "Free" twice (the plan is already named Free).
    { id: "free" as const, price: birr(0), popular: false },
    { id: "starter" as const, price: birr(prices.starter), popular: true },
    { id: "business" as const, price: birr(prices.business), popular: false },
  ];
  return (
    <section aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:pt-20 md:pb-8">
        <h1 id="pricing-title" className="text-center text-[2rem] display min-[400px]:text-4xl sm:text-6xl">{t.title}</h1>
        <p className="mt-3 text-center text-lg text-ink-muted">{t.intro}</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3 md:items-stretch">
          {plans.map((p) => (
            <li key={p.id} className={`reveal relative flex flex-col gap-4 rounded-3xl border p-6 ${p.popular ? "border-ink bg-paper shadow-lg ring-2 ring-ink" : "border-line bg-white"}`}>
              {p.popular && <span className="absolute -top-4 left-6 rounded-full bg-ink px-3 py-1 font-semibold text-white">{t.popular}</span>}
              <h2 className="text-xl font-bold">{planNames[p.id]}</h2>
              <p>
                <span className="text-4xl display">{p.price}</span>
                {p.id !== "free" && <span className="whitespace-nowrap text-ink-muted"> {t.perMonth}</span>}
              </p>
              <ul className="flex flex-1 flex-col gap-2">
                {t.plans[p.id].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-ink" />
                    {line}
                  </li>
                ))}
              </ul>
              <Link href={`/${locale}/sign-in?next=/${locale}/build`} className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 font-semibold ${p.popular ? "bg-ink text-white hover:bg-ink-hover" : "border border-line hover:border-faint"}`}>
                {t.cta}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
