import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { PaymentForm } from "@/components/billing/payment-form";
import { CreditHistory } from "@/components/billing/credit-history";
import { currentUser } from "@/lib/auth/session";
import Link from "next/link";
import { monthsFree, PLAN_IDS, PRODUCTS, productName, yearlySaving, type Product } from "@/lib/billing/plans";
import { REQUEST_SIZES } from "@/lib/billing/credits";
import { offerPrice } from "@/lib/billing/discounts";
import { offerBadgeText, offerName } from "@/lib/billing/offer-text";
import { formatBirr, PlanHighlights } from "@/components/pricing/plan-highlights";
import { OfferBadge, WasPrice } from "@/components/pricing/offer-price";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";
import { creditSettings, launchOffer, ownerAllowance, planFeatures } from "@/lib/app/shell-data";

export async function generateMetadata({ params }: PageProps<"/[lang]/billing">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).billing.metaTitle : undefined, robots: { index: false } };
}

/** Credit history rows per page (newest first). */
const HISTORY_PAGE = 25;
/** Older pages than this aren't offered (the full record stays in the database). */
const HISTORY_MAX_PAGES = 40;

export default async function BillingPage({ params, searchParams }: PageProps<"/[lang]/billing">) {
  const { lang } = await params;
  const sp = await searchParams;
  // From the pricing page's "Choose" buttons (?product=starter_year); anything else is ignored.
  const rawProduct = sp.product;
  const initialProduct = typeof rawProduct === "string" && Object.hasOwn(PRODUCTS, rawProduct) ? (rawProduct as Product) : undefined;
  const rawPage = typeof sp.history === "string" ? Number(sp.history) : 1;
  const historyPage = Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= HISTORY_MAX_PAGES ? rawPage : 1;
  if (!isLocale(lang)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/billing`);
  const t = getMessages(lang);
  const b = t.billing;
  const billing = services().billing;
  // Shared with the sidebar's meter (one read per request).
  const [allowance, history, settings, credits, features, offer, bought, ledger] = await Promise.all([
    ownerAllowance(user.id),
    billing.store().paymentsFor(user.id),
    billing.settings(),
    creditSettings(),
    planFeatures(),
    launchOffer(),
    billing.boughtLeft(user.id).catch(() => 0),
    // One row more than a page tells whether there is an older page.
    billing.store().ledger(user.id, HISTORY_PAGE + 1, (historyPage - 1) * HISTORY_PAGE).catch(() => []),
  ]);
  const plan = allowance?.plan ?? "free";
  const left = allowance?.credits ?? 0;
  const monthly = allowance?.monthly ?? features[plan].monthlyEdits;
  const dateFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium" });
  const payReady = !!(settings.telebirrNumber || settings.cbeAccount);
  const birr = (minor: number) => format(b.price, { price: formatBirr(minor) });
  const now = new Date();
  const offerText = offer ? offerBadgeText(offer, lang, b) : "";
  // What each product costs now (the launch offer included), for the payment form.
  const productPrices = Object.fromEntries(
    (Object.keys(PRODUCTS) as Product[]).map((p) => {
      const base = settings.prices[p];
      const offered = offerPrice(offer, p, base, now);
      return [p, { base, final: offered ?? base }];
    }),
  ) as Record<Product, { base: number; final: number }>;
  const topupName = (names: Record<Product, string>, p: Product) => productName(names, p, credits.topupCredits);
  const sizeCost = (n: number) => (n === 1 ? b.sizeCostOne : format(b.sizeCost, { n }));
  const rolls = (allowance?.rolloverMonths ?? 1) > 1;

  return (
    <AppShell locale={lang} t={t} user={user}>
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 sm:py-10">
        <section aria-labelledby="plan-title" className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
          <h1 id="plan-title" className="text-2xl font-semibold tracking-tight">{b.title}</h1>
          <p className="font-semibold">{format(b.currentPlan, { plan: b.plans[plan] })}</p>
          {allowance?.until && <p className="text-ink-muted">{format(b.until, { date: dateFmt.format(allowance.until) })}</p>}
          <section aria-labelledby="credits-title" className="flex flex-col gap-2 rounded-xl bg-paper p-4">
            <h2 id="credits-title" className="sr-only">{b.creditsTitle}</h2>
            <p className={`font-semibold ${left <= 3 ? "text-warning" : "text-ink"}`}>{format(b.creditsLeft, { n: left })}</p>
            <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-line">
              <span className={`block h-full rounded-full ${left <= 3 ? "bg-warning" : "bg-ink"}`} style={{ width: `${monthly > 0 ? Math.round(Math.max(0, Math.min(1, left / monthly)) * 100) : 0}%` }} />
            </span>
            <ul className="flex flex-col gap-1 text-sm text-ink-muted">
              {allowance && <li>{format(b.nextGrant, { n: monthly, date: dateFmt.format(allowance.nextGrant) })}</li>}
              <li>{rolls ? format(b.rollover, { max: allowance?.keptMax ?? monthly }) : format(b.noRollover, { n: monthly })}</li>
              {bought > 0 && <li>{format(b.bought, { n: bought })}</li>}
            </ul>
          </section>
          <a href="#pay-title" className="inline-flex min-h-11 w-fit items-center rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover lg:min-h-9">{b.payLink}</a>
        </section>

        <section aria-labelledby="sizes-title" className="flex flex-col gap-3">
          <h2 id="sizes-title" className="text-lg font-semibold">{b.sizesTitle}</h2>
          <dl className="grid gap-2 sm:grid-cols-3">
            {REQUEST_SIZES.map((s) => (
              <div key={s} className="flex flex-col gap-1 rounded-xl border border-line bg-white p-4">
                <dt className="text-sm text-ink-muted">{b.sizes[s]}</dt>
                <dd className="font-semibold tabular-nums">{sizeCost(credits.sizeCredits[s])}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-ink-muted">{b.sizesHint}</p>
        </section>

        <section aria-labelledby="plans-title" className="flex flex-col gap-4">
          <h2 id="plans-title" className="text-lg font-semibold">{t.plans.includes}</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {PLAN_IDS.map((p) => {
              const month = p === "free" ? 0 : settings.prices[`${p}_month`];
              const year = p === "free" ? 0 : settings.prices[`${p}_year`];
              const free = monthsFree(month, year);
              const monthOffer = p === "free" ? null : offerPrice(offer, `${p}_month`, month, now);
              const yearOffer = p === "free" ? null : offerPrice(offer, `${p}_year`, year, now);
              return (
                <li key={p} aria-current={p === plan ? "true" : undefined} className={`flex flex-col gap-3 rounded-xl border bg-white p-5 ${p === plan ? "border-ink ring-1 ring-ink" : "border-line"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold">{b.plans[p]}</h3>
                    {p === plan && <span className="rounded-full bg-sunken px-3 py-1 text-sm font-semibold text-ink">{b.currentBadge}</span>}
                  </div>
                  {p === "free" ? (
                    <p className="font-semibold">{b.freePrice}</p>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {(monthOffer !== null || yearOffer !== null) && <OfferBadge text={offerText} className="mb-1" />}
                      <p className="font-semibold">
                        {format(b.perMonth, { price: formatBirr(monthOffer ?? month) })}
                        {monthOffer !== null && <> <WasPrice price={birr(month)} was={b.was} className="font-normal" /></>}
                      </p>
                      <p className="text-ink-muted">
                        {format(b.perYear, { price: formatBirr(yearOffer ?? year) })}
                        {yearOffer !== null && <> <WasPrice price={birr(year)} was={b.was} /></>}
                      </p>
                      {free > 0 && <p className="text-sm font-medium text-ink">{format(t.plans.yearSaving, { amount: formatBirr(yearlySaving(month, year)), months: free })}</p>}
                    </div>
                  )}
                  <PlanHighlights plan={p} t={t.plans.hl} limit={4} className="text-sm" features={features} />
                </li>
              );
            })}
          </ul>
          <Link href={`/${lang}/pricing#compare`} className="inline-flex min-h-11 w-fit items-center font-medium text-ink underline underline-offset-4 lg:min-h-9">{t.plans.compareLink}</Link>
          <p className="rounded-xl bg-paper p-4 text-ink-muted">
            <strong className="text-ink">{b.topup}:</strong> {format(b.topupDesc, { n: credits.topupCredits, price: formatBirr(productPrices.topup.final) })}
            {productPrices.topup.final < productPrices.topup.base && <> <WasPrice price={birr(productPrices.topup.base)} was={b.was} /></>}
          </p>
        </section>

        <section aria-labelledby="pay-title" className="flex scroll-mt-6 flex-col gap-4 rounded-xl border border-line bg-white p-5">
          <h2 id="pay-title" className="scroll-mt-6 text-lg font-semibold">{b.payTitle}</h2>
          {payReady ? (
            <>
              <ol className="flex list-decimal flex-col gap-1 ps-6 text-ink-muted">
                {b.payHow.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <ul className="flex flex-col gap-1 rounded-lg bg-paper p-4 font-medium">
                {settings.telebirrNumber && <li>{format(b.payTelebirr, { number: settings.telebirrNumber })}</li>}
                {settings.cbeAccount && <li>{format(b.payCbe, { account: settings.cbeAccount })}</li>}
                {settings.accountName && <li>{format(b.payName, { name: settings.accountName })}</li>}
              </ul>
              <PaymentForm t={b} offerName={offer ? offerName(offer, lang, b.offerName) : b.offerName} prices={productPrices} topupCredits={credits.topupCredits} initialProduct={initialProduct} />
            </>
          ) : (
            <p className="text-ink-muted">{b.payNotReady}</p>
          )}
        </section>

        <CreditHistory
          t={b}
          locale={lang}
          rows={ledger.slice(0, HISTORY_PAGE)}
          page={historyPage}
          hasOlder={ledger.length > HISTORY_PAGE && historyPage < HISTORY_MAX_PAGES}
        />

        <section aria-labelledby="history-title" className="flex flex-col gap-3">
          <h2 id="history-title" className="text-lg font-semibold">{b.history}</h2>
          {history.length === 0 ? (
            <p className="text-ink-muted">{b.historyEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white p-3">
                  <span>
                    {topupName(b.productNames, p.product)} · {birr(p.amountMinor)}
                    {p.originalAmountMinor !== null && p.originalAmountMinor > p.amountMinor && <> <WasPrice price={birr(p.originalAmountMinor)} was={b.was} /></>}
                  </span>
                  <span className="text-ink-muted">{dateFmt.format(p.createdAt)}</span>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${p.status === "approved" ? "border border-lagoon bg-white text-lagoon" : p.status === "rejected" ? "bg-coral-soft text-destructive" : "bg-paper text-ink"}`}>{b.status[p.status]}</span>
                  {p.note && <span className="w-full text-ink-muted">{p.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}
