import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { PaymentForm } from "@/components/billing/payment-form";
import { currentUser } from "@/lib/auth/session";
import { monthsFree, PLAN_FEATURES, PLAN_IDS, PRODUCTS, TOPUP_CREDITS, yearlySaving } from "@/lib/billing/plans";
import { formatBirr, PlanHighlights } from "@/components/pricing/plan-highlights";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";
import { ownerAllowance } from "@/lib/app/shell-data";

export async function generateMetadata({ params }: PageProps<"/[lang]/billing">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).billing.metaTitle : undefined, robots: { index: false } };
}


export default async function BillingPage({ params }: PageProps<"/[lang]/billing">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/billing`);
  const t = getMessages(lang);
  const b = t.billing;
  const billing = services().billing;
  // Shared with the sidebar's meter (one read per request).
  const [allowance, history, settings] = await Promise.all([ownerAllowance(user.id), billing.store().paymentsFor(user.id), billing.settings()]);
  const { plan, until, credits } = allowance ?? { plan: "free" as const, until: null, credits: 0 };
  const dateFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium" });
  const payReady = !!(settings.telebirrNumber || settings.cbeAccount);
  const birr = (minor: number) => format(b.price, { price: formatBirr(minor) });
  const prices = Object.fromEntries(Object.entries(settings.prices).map(([k, v]) => [k, birr(v)])) as Record<keyof typeof PRODUCTS, string>;

  return (
    <AppShell locale={lang} t={t} user={user}>
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 sm:py-10">
        <section aria-labelledby="plan-title" className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
          <h1 id="plan-title" className="text-2xl font-semibold tracking-tight">{b.title}</h1>
          <p className="font-semibold">{format(b.currentPlan, { plan: b.plans[plan] })}</p>
          {until && <p className="text-ink-muted">{format(b.until, { date: dateFmt.format(until) })}</p>}
          <div className="flex flex-col gap-2 rounded-xl bg-paper p-4">
            <p className={`font-semibold ${credits <= 3 ? "text-warning" : "text-ink"}`}>{format(b.creditsLeft, { n: credits })}</p>
            <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-line">
              <span className={`block h-full rounded-full ${credits <= 3 ? "bg-warning" : "bg-ink"}`} style={{ width: `${Math.round(Math.max(0, Math.min(1, credits / PLAN_FEATURES[plan].monthlyEdits)) * 100)}%` }} />
            </span>
            <p className="text-sm text-ink-muted">{format(t.app.creditsHint, { total: PLAN_FEATURES[plan].monthlyEdits })}</p>
          </div>
        </section>

        <section aria-labelledby="plans-title" className="flex flex-col gap-4">
          <h2 id="plans-title" className="text-lg font-semibold">{t.plans.includes}</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {PLAN_IDS.map((p) => {
              const month = p === "free" ? 0 : settings.prices[`${p}_month`];
              const year = p === "free" ? 0 : settings.prices[`${p}_year`];
              const free = monthsFree(month, year);
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
                      <p className="font-semibold">{format(b.perMonth, { price: formatBirr(month) })}</p>
                      <p className="text-ink-muted">{format(b.perYear, { price: formatBirr(year) })}</p>
                      {free > 0 && <p className="text-sm font-medium text-lagoon">{format(t.plans.yearSaving, { amount: formatBirr(yearlySaving(month, year)), months: free })}</p>}
                    </div>
                  )}
                  <PlanHighlights plan={p} t={t.plans.hl} className="text-sm" />
                </li>
              );
            })}
          </ul>
          <p className="rounded-xl bg-paper p-4 text-ink-muted">
            <strong className="text-ink">{b.topup}:</strong> {format(b.topupDesc, { n: TOPUP_CREDITS, price: formatBirr(settings.prices.topup) })}
          </p>
        </section>

        <section aria-labelledby="pay-title" className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
          <h2 id="pay-title" className="text-lg font-semibold">{b.payTitle}</h2>
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
              <PaymentForm t={b} prices={prices} />
            </>
          ) : (
            <p className="text-ink-muted">{b.payNotReady}</p>
          )}
        </section>

        <section aria-labelledby="history-title" className="flex flex-col gap-3">
          <h2 id="history-title" className="text-lg font-semibold">{b.history}</h2>
          {history.length === 0 ? (
            <p className="text-ink-muted">{b.historyEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white p-3">
                  <span>{b.productNames[p.product]} · {prices[p.product]}</span>
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
