import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { monthsFree, PLAN_IDS, yearlySaving, type PlanFeatures, type PlanId, type Product } from "@/lib/billing/plans";
import { offerPrice, offerUntilLabel, type LaunchOffer } from "@/lib/billing/discounts";
import { OfferBadge, WasPrice } from "@/components/pricing/offer-price";
import { BillingToggle, type BillingPeriod } from "@/components/pricing/billing-toggle";
import { formatBirr, PlanHighlights } from "@/components/pricing/plan-highlights";
import { looksSignedIn } from "@/lib/auth/signed-in";

/** Plan cards with a Monthly / Yearly switch; prices come from Admin → Settings. */
export async function Pricing({ t, locale, prices, period, features, offer = null }: { t: Messages; locale: Locale; prices: Record<Product, number>; period: BillingPeriod; features?: Record<PlanId, PlanFeatures>; offer?: LaunchOffer | null }) {
  const now = new Date();
  const tp = t.plans;
  // Signed in already: straight to Your sites or to the Plan page (the choice preselected), no sign-in hop.
  const signedIn = await looksSignedIn();
  const birr = (minor: number) => `${formatBirr(minor)} ${t.landing.pricing.birr}`;
  const free = Math.min(monthsFree(prices.starter_month, prices.starter_year), monthsFree(prices.business_month, prices.business_year));
  return (
    <section aria-labelledby="pricing-title">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-6 md:pt-20">
        <h1 id="pricing-title" className="text-center text-[2rem] display min-[400px]:text-4xl sm:text-6xl">{t.landing.pricing.title}</h1>
        <p className="mt-3 text-center text-lg text-ink-muted">{t.landing.pricing.intro}</p>
        <div className="mt-8">
          <BillingToggle t={tp} period={period} basePath={`/${locale}/pricing`} monthsFree={free} />
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-3 md:items-stretch">
          {PLAN_IDS.map((p) => {
            const popular = p === "starter";
            const month = p === "free" ? 0 : prices[`${p}_month`];
            const year = p === "free" ? 0 : prices[`${p}_year`];
            const shown = period === "year" ? year : month;
            // The launch offer on this card's price (as switched above), with the old price struck through.
            const offered = p === "free" ? null : offerPrice(offer, `${p}_${period}`, shown, now);
            return (
              <li key={p} className={`reveal relative flex flex-col gap-4 rounded-3xl border p-6 ${popular ? "pt-9 " : ""}${popular ? "border-ink bg-paper shadow-lg ring-2 ring-ink" : "border-line bg-white"}`}>
                {popular && <span className="absolute -top-4 start-6 rounded-full bg-ink px-3 py-1 font-semibold text-white">{t.landing.pricing.popular}</span>}
                <h2 className="text-xl font-bold">{t.billing.plans[p]}</h2>
                <div className="flex min-h-[5.5rem] flex-col gap-1">
                  {offered !== null && offer && <OfferBadge text={format(t.billing.offerBadge, { percent: offer.percent, date: offerUntilLabel(offer, locale) })} />}
                  {offered !== null && <WasPrice price={birr(shown)} was={t.billing.was} />}
                  <p>
                    {/* "0 Birr", so the card doesn't say "Free" twice (the plan is already named Free). */}
                    <span className="text-4xl display">{birr(p === "free" ? 0 : (offered ?? shown))}</span>
                    {p !== "free" && <span className="whitespace-nowrap text-ink-muted"> {period === "year" ? tp.perYear : tp.perMonth}</span>}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {p === "free"
                      ? tp.freeForever
                      : period === "year"
                        ? monthsFree(month, year) > 0 && format(tp.yearSaving, { amount: formatBirr(yearlySaving(month, year)), months: monthsFree(month, year) })
                        : format(monthsFree(month, year) > 0 ? tp.orYearly : tp.orYearlyPlain, { price: formatBirr(year), months: monthsFree(month, year) })}
                  </p>
                </div>
                <PlanHighlights plan={p} t={tp.hl} className="flex-1" features={features} />
                <Link
                  // Paid plans preselect what to pay for (month or year, as switched above) on the Plan page.
                  href={
                    p === "free"
                      ? signedIn ? `/${locale}/build` : `/${locale}/sign-in?next=/${locale}/build`
                      : signedIn ? `/${locale}/billing?product=${p}_${period}` : `/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/billing?product=${p}_${period}`)}`
                  }
                  className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-center font-semibold ${popular ? "bg-ink text-white hover:bg-ink-hover" : "border border-line hover:border-faint"}`}
                >
                  {p === "free" ? tp.ctaFree : format(tp.ctaPaid, { plan: t.billing.plans[p] })}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
