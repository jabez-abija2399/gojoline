import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { BillingFlow } from "@/components/billing/billing-flow";
import { Collapsible } from "@/components/billing/collapsible";
import { CONTACT_URL } from "@/components/pricing/pricing-extras";
import { CheckCircle2, ChevronDown, Clock, RotateCcw, XCircle } from "lucide-react";
import { CreditHistory } from "@/components/billing/credit-history";
import { currentUser } from "@/lib/auth/session";
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
  // The newest payment decides the banner: being checked, not approved (and why), or just approved.
  const latest = history[0];
  const DAY = 86_400_000;
  const banner = pendingPayment
    ? ("pending" as const)
    : latest?.status === "rejected"
      ? ("rejected" as const)
      : latest?.status === "approved" && latest.reviewedAt && now.getTime() - latest.reviewedAt.getTime() < 3 * DAY
        ? ("approved" as const)
        : null;
  const daysLeft = allowance?.until ? Math.max(0, Math.ceil((allowance.until.getTime() - now.getTime()) / DAY)) : null;
  const paymentLine = (x: (typeof history)[number]) => ({ product: topupName(b.productNames, x.product), price: formatBirr(x.amountMinor), date: dateFmt.format(x.createdAt) });
  const statusChip = {
    pending: { cls: "border border-line bg-paper text-ink", Icon: Clock },
    approved: { cls: "border border-lagoon bg-white text-lagoon", Icon: CheckCircle2 },
    rejected: { cls: "bg-coral-soft text-destructive", Icon: XCircle },
  } as const;

  return (
    <AppShell locale={lang} t={t} user={user}>
      <main id="main" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-6 sm:py-10">
        <h1 id="plan-title" className="text-2xl font-semibold tracking-tight">{b.title}</h1>

        {banner === "pending" && pendingPayment && (
          <a href="#pay-title" className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm hover:border-faint">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sunken text-ink">
              <Clock className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold">{b.pay.checkingTitle}</span>
              <span className="text-sm text-ink-muted">{format(b.pay.pendingWhat, paymentLine(pendingPayment))}</span>
            </span>
          </a>
        )}
        {banner === "rejected" && latest && (
          <div className="flex flex-col gap-3 rounded-2xl border border-coral bg-coral-soft p-4 sm:flex-row sm:items-center">
            <XCircle aria-hidden="true" className="size-6 shrink-0 text-destructive" />
            <div className="flex min-w-0 flex-1 flex-col">
              <h2 className="font-semibold">{b.pay.rejectedTitle}</h2>
              <p className="text-sm text-ink">{format(b.pay.rejectedBody, paymentLine(latest))}</p>
              {latest.note && <p className="text-sm text-ink">{format(b.pay.reason, { note: latest.note })}</p>}
            </div>
            <a href={`?product=${latest.product}#pay-title`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink-hover lg:min-h-10">
              <RotateCcw aria-hidden="true" className="size-4" />
              {b.pay.fixAgain}
            </a>
          </div>
        )}
        {banner === "approved" && latest && (
          <div role="status" className="flex items-start gap-3 rounded-2xl border border-lagoon bg-white p-4">
            <CheckCircle2 aria-hidden="true" className="size-6 shrink-0 text-lagoon" />
            <p className="flex flex-col">
              <span className="font-semibold">{b.pay.approvedTitle}</span>
              <span className="text-sm text-ink-muted">
                {latest.product === "topup" || !allowance?.until ? b.pay.approvedTopup : format(b.pay.approvedPlan, { plan: b.plans[plan], date: dateFmt.format(allowance.until) })}
              </span>
            </p>
          </div>
        )}

        <section aria-labelledby="credits-title" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-col">
              <p className="font-display text-xl font-bold">{format(b.currentPlan, { plan: b.plans[plan] })}</p>
              {allowance?.until && <p className="text-sm text-ink-muted">{format(b.until, { date: dateFmt.format(allowance.until) })}</p>}
            </div>
            {daysLeft !== null && (
              <span className={`rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${daysLeft <= 5 ? "bg-coral-soft text-ink" : "bg-sunken text-ink"}`}>
                {daysLeft === 1 ? b.pay.daysLeftOne : format(b.pay.daysLeft, { n: daysLeft })}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-paper p-4">
            <h2 id="credits-title" className={`font-semibold ${left <= 3 ? "text-warning" : "text-ink"}`}>{format(b.creditsLeft, { n: left })}</h2>
            <span aria-hidden="true" className="block h-2.5 overflow-hidden rounded-full bg-line">
              <span className={`block h-full rounded-full ${left <= 3 ? "bg-warning" : "bg-ink"}`} style={{ width: `${monthly > 0 ? Math.round(Math.max(0, Math.min(1, left / monthly)) * 100) : 0}%` }} />
            </span>
            <ul className="flex flex-col gap-1 text-sm text-ink-muted">
              {allowance && <li>{format(b.nextGrant, { n: monthly, date: dateFmt.format(allowance.nextGrant) })}</li>}
              <li>{rolls ? format(b.rollover, { max: allowance?.keptMax ?? monthly }) : format(b.noRollover, { n: monthly })}</li>
              {bought > 0 && <li>{format(b.bought, { n: bought })}</li>}
            </ul>
          </div>
          {/* How changes are counted: folded, it's reference, not the task. */}
          <details className="group rounded-xl border border-line">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 font-medium [&::-webkit-details-marker]:hidden">
              <span id="sizes-title">{b.sizesTitle}</span>
              <ChevronDown aria-hidden="true" className="size-5 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-3 px-4 pb-4">
              <dl className="grid gap-2 sm:grid-cols-3">
                {REQUEST_SIZES.map((s) => (
                  <div key={s} className="flex flex-col gap-1 rounded-xl bg-paper p-3">
                    <dt className="text-sm text-ink-muted">{b.sizes[s]}</dt>
                    <dd className="font-semibold tabular-nums">{sizeCost(credits.sizeCredits[s])}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-ink-muted">{b.sizesHint}</p>
            </div>
          </details>
          {!pendingPayment && (
            <a href="#choose-title" className="inline-flex min-h-11 w-fit items-center rounded-lg border border-ink px-4 text-sm font-medium text-ink hover:bg-sunken lg:min-h-9">{b.payLink}</a>
          )}
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
          compare={{ href: `/${lang}/pricing#compare`, text: t.plans.compareLink }}
        />

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
                    <span className="w-full text-sm text-ink-muted">{format(b.pay.methodRef, { method: b.methods[p.method], reference: p.reference })}</span>
                    {p.note && <span className="w-full text-sm text-ink-muted">{p.status === "rejected" ? format(b.pay.reason, { note: p.note }) : p.note}</span>}
                    {p.status === "rejected" && (
                      <a href={`?product=${p.product}#pay-title`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 lg:min-h-9">
                        <RotateCcw aria-hidden="true" className="size-4" />
                        {b.pay.sendAgain}
                        <span className="sr-only">: {topupName(b.productNames, p.product)}</span>
                      </a>
                    )}
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
        <InviteCard
          t={t.growth.invite}
          invite={invite ? { link: referralLink(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", lang, invite[0]), stats: invite[1] } : null}
          credits={credits.monthly.starter}
          cap={REFERRAL_MONTHLY_CAP}
        />
      </main>
    </AppShell>
  );
}
