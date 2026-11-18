import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { BillingFlow } from "@/components/billing/billing-flow";
import { Collapsible } from "@/components/billing/collapsible";
import { CONTACT_URL } from "@/components/pricing/pricing-extras";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { CreditHistory } from "@/components/billing/credit-history";
import { currentUser } from "@/lib/auth/session";
import Link from "next/link";
import { PLAN_IDS, PRODUCTS, productName, type PlanId, type Product } from "@/lib/billing/plans";
import { REQUEST_SIZES } from "@/lib/billing/credits";
import { offerPrice } from "@/lib/billing/discounts";
import { offerBadgeText, offerName } from "@/lib/billing/offer-text";
import { formatBirr, PlanHighlights } from "@/components/pricing/plan-highlights";
import { WasPrice } from "@/components/pricing/offer-price";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";
import { creditSettings, launchOffer, ownerAllowance, planFeatures } from "@/lib/app/shell-data";
import { InviteCard } from "@/components/billing/invite-card";
import { REFERRAL_MONTHLY_CAP, referralLink } from "@/lib/growth/referral-rules";
import { reportError } from "@/lib/observability/report";

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
  const svc = services();
  const billing = svc.billing;
  const referrals = svc.growth.referrals.store;
  // Shared with the sidebar's meter (one read per request).
  const [allowance, history, settings, credits, features, offer, bought, ledger, invite] = await Promise.all([
    ownerAllowance(user.id),
    billing.store().paymentsFor(user.id),
    billing.settings(),
    creditSettings(),
    planFeatures(),
    launchOffer(),
    billing.boughtLeft(user.id).catch(() => 0),
    // One row more than a page tells whether there is an older page.
    billing.store().ledger(user.id, HISTORY_PAGE + 1, (historyPage - 1) * HISTORY_PAGE).catch(() => []),
    // The invite card is extra: without it the Plan page still opens.
    Promise.all([referrals.codeFor(user.id), referrals.summary(user.id)]).catch((e: unknown) => (reportError("invite link failed", e), null)),
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

  const pendingPayment = history.find((x) => x.status === "pending");
  const statusChip = {
    pending: { cls: "border border-line bg-paper text-ink", Icon: Clock },
    approved: { cls: "border border-lagoon bg-white text-lagoon", Icon: CheckCircle2 },
    rejected: { cls: "bg-coral-soft text-destructive", Icon: XCircle },
  } as const;

  return (
    <AppShell locale={lang} t={t} user={user}>
      <main id="main" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-6 sm:py-10">
        <section aria-labelledby="plan-title" className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-1">
            <h1 id="plan-title" className="text-2xl font-semibold tracking-tight">{b.title}</h1>
          </div>
          <section aria-labelledby="credits-title" className="flex flex-col gap-3 rounded-xl bg-paper p-4">
            <p className="font-display text-xl font-bold">{format(b.currentPlan, { plan: b.plans[plan] })}</p>
            {allowance?.until && <p className="-mt-2 text-sm text-ink-muted">{format(b.until, { date: dateFmt.format(allowance.until) })}</p>}
            <h2 id="credits-title" className={`font-semibold ${left <= 3 ? "text-warning" : "text-ink"}`}>{format(b.creditsLeft, { n: left })}</h2>
            <span aria-hidden="true" className="block h-2.5 overflow-hidden rounded-full bg-line">
              <span className={`block h-full rounded-full ${left <= 3 ? "bg-warning" : "bg-ink"}`} style={{ width: `${monthly > 0 ? Math.round(Math.max(0, Math.min(1, left / monthly)) * 100) : 0}%` }} />
            </span>
            <ul className="flex flex-col gap-1 text-sm text-ink-muted">
              {allowance && <li>{format(b.nextGrant, { n: monthly, date: dateFmt.format(allowance.nextGrant) })}</li>}
              <li>{rolls ? format(b.rollover, { max: allowance?.keptMax ?? monthly }) : format(b.noRollover, { n: monthly })}</li>
              {bought > 0 && <li>{format(b.bought, { n: bought })}</li>}
            </ul>
          </section>
          <a href="#choose-title" className="inline-flex min-h-11 w-fit items-center rounded-lg border border-ink px-4 text-sm font-medium text-ink hover:bg-sunken lg:min-h-9">{b.payLink}</a>
        </section>

        <BillingFlow
          t={b}
          yearSavingText={t.plans.yearSaving}
          plan={plan}
          prices={productPrices}
          offerText={(Object.values(productPrices) as { base: number; final: number }[]).some((x) => x.final < x.base) ? offerText : null}
          offerName={offer ? offerName(offer, lang, b.offerName) : b.offerName}
          highlights={Object.fromEntries(PLAN_IDS.map((p) => [p, <PlanHighlights key={p} plan={p} t={t.plans.hl} limit={4} className="text-sm" features={features} />])) as Record<PlanId, React.ReactNode>}
          topupCredits={credits.topupCredits}
          initialProduct={initialProduct ?? (plan === "free" ? "starter_month" : `${plan}_month`)}
          accounts={payReady ? { telebirrNumber: settings.telebirrNumber, cbeAccount: settings.cbeAccount, accountName: settings.accountName } : null}
          notReady={b.payNotReady}
          pending={pendingPayment ? { text: format(b.pay.pendingWhat, { product: topupName(b.productNames, pendingPayment.product), price: formatBirr(pendingPayment.amountMinor), date: dateFmt.format(pendingPayment.createdAt) }) } : null}
          supportUrl={CONTACT_URL}
        />
        <Link href={`/${lang}/pricing#compare`} className="-mt-4 inline-flex min-h-11 w-fit items-center font-medium text-ink underline underline-offset-4 lg:min-h-9">{t.plans.compareLink}</Link>

        <InviteCard
          t={t.growth.invite}
          invite={invite ? { link: referralLink(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", lang, invite[0]), stats: invite[1] } : null}
          credits={credits.monthly.starter}
          cap={REFERRAL_MONTHLY_CAP}
        />

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

        <Collapsible title={b.history} titleId="history-title" count={history.length > 0 ? `(${history.length})` : undefined} defaultOpen={!!pendingPayment}>
          {history.length === 0 ? (
            <p className="text-ink-muted">{b.historyEmpty}</p>
          ) : (
            <ul className="flex flex-col rounded-2xl border border-line bg-white">
              {history.map((p) => {
                const chip = statusChip[p.status];
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line p-4 first:border-0">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium">{topupName(b.productNames, p.product)}</span>
                      <span className="text-sm text-ink-muted tabular-nums">
                        {birr(p.amountMinor)}
                        {p.originalAmountMinor !== null && p.originalAmountMinor > p.amountMinor && <> <WasPrice price={birr(p.originalAmountMinor)} was={b.was} /></>}
                        {" · "}
                        {dateFmt.format(p.createdAt)}
                      </span>
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${chip.cls}`}>
                      <chip.Icon aria-hidden="true" className="size-4" />
                      {b.status[p.status]}
                    </span>
                    {p.note && <span className="w-full text-sm text-ink-muted">{p.status === "rejected" ? format(b.pay.reason, { note: p.note }) : p.note}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </Collapsible>

        <CreditHistory
          t={b}
          locale={lang}
          rows={ledger.slice(0, HISTORY_PAGE)}
          page={historyPage}
          hasOlder={ledger.length > HISTORY_PAGE && historyPage < HISTORY_MAX_PAGES}
        />
      </main>
    </AppShell>
  );
}
