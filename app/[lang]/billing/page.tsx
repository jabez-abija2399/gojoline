import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BuilderHeader } from "@/components/builder/builder-header";
import { PaymentForm } from "@/components/billing/payment-form";
import { currentUser } from "@/lib/auth/session";
import { PRODUCTS } from "@/lib/billing/plans";
import { isLocale } from "@/lib/i18n/config";
import { format, getMessages } from "@/lib/i18n";
import { services } from "@/lib/server/services";

export async function generateMetadata({ params }: PageProps<"/[lang]/billing">): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getMessages(lang).billing.metaTitle : undefined, robots: { index: false } };
}

const amount = (minor: number) => new Intl.NumberFormat("en-US").format(minor / 100);

export default async function BillingPage({ params }: PageProps<"/[lang]/billing">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const user = await currentUser();
  if (!user) redirect(`/${lang}/sign-in?next=/${lang}/billing`);
  const t = getMessages(lang);
  const b = t.billing;
  const billing = services().billing;
  const [{ plan, until }, credits, history, settings] = await Promise.all([billing.plan(user.id), billing.creditsLeft(user.id), billing.store().paymentsFor(user.id), billing.settings()]);
  const dateFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { dateStyle: "medium" });
  const payReady = !!(settings.telebirrNumber || settings.cbeAccount);
  const birr = (minor: number) => format(b.price, { price: amount(minor) });
  const prices = Object.fromEntries(Object.entries(settings.prices).map(([k, v]) => [k, birr(v)])) as Record<keyof typeof PRODUCTS, string>;

  return (
    <>
      <BuilderHeader locale={lang} t={t} user={user} backHref={`/${lang}/build`} backLabel={t.builder.back} />
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8">
        <section aria-labelledby="plan-title" className="flex flex-col gap-2 rounded-xl border border-line bg-white p-5">
          <h1 id="plan-title" className="text-3xl font-bold">{b.title}</h1>
          <p className="text-lg font-semibold">{format(b.currentPlan, { plan: b.plans[plan] })}</p>
          {until && <p className="text-ink-muted">{format(b.until, { date: dateFmt.format(until) })}</p>}
          <p className="text-ink-muted">{format(b.creditsLeft, { n: credits })}</p>
        </section>

        <ul className="grid gap-4 md:grid-cols-3">
          {(["free", "starter", "business"] as const).map((p) => (
            <li key={p} aria-current={p === plan ? "true" : undefined} className={`flex flex-col gap-2 rounded-xl border bg-white p-5 ${p === plan ? "border-ink ring-1 ring-ink" : "border-line"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold">{b.plans[p]}</h2>
                {p === plan && <span className="rounded-full bg-sunken px-3 py-1 text-sm font-semibold text-ink">{b.currentBadge}</span>}
              </div>
              {p === "free" ? (
                <p className="font-semibold">{b.freePrice}</p>
              ) : (
                <>
                  <p className="font-semibold">{format(b.perMonth, { price: amount(settings.prices[`${p}_month`]) })}</p>
                  <p className="text-ink-muted">{format(b.perYear, { price: amount(settings.prices[`${p}_year`]) })}</p>
                </>
              )}
              <p className="text-ink-muted">{b.features[p]}</p>
            </li>
          ))}
        </ul>
        <p className="text-ink-muted">
          <strong className="text-ink">{b.topup}:</strong> {format(b.topupDesc, { price: amount(settings.prices.topup) })}
        </p>

        <section aria-labelledby="pay-title" className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
          <h2 id="pay-title" className="text-2xl font-bold">{b.payTitle}</h2>
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
          <h2 id="history-title" className="text-2xl font-bold">{b.history}</h2>
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
    </>
  );
}
