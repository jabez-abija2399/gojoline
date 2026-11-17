"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Plus, Send } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { monthsFree, yearlySaving, type PaidPlan, type PlanId } from "@/lib/billing/plans";
import { OfferBadge, WasPrice } from "@/components/pricing/offer-price";
import { PaymentForm, type PayAccounts, type ProductId } from "./payment-form";

const birr = (minor: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(minor / 100);
const PAID: PaidPlan[] = ["starter", "business"];
type Period = "month" | "year";

/** A payment waiting for an admin, as the owner sees it. */
export interface PendingPayment {
  text: string;
}

interface Props {
  t: Messages["billing"];
  yearSavingText: string;
  plan: PlanId;
  prices: Record<ProductId, { base: number; final: number }>;
  /** "Launch offer: 20% off until 31 Dec" when an offer applies to something, else null. */
  offerText: string | null;
  offerName: string;
  /** Short "what's included" lists per plan, rendered on the server. */
  highlights: Record<PlanId, ReactNode>;
  topupCredits: number;
  initialProduct: ProductId;
  /** Null: payment details aren't set up yet. */
  accounts: PayAccounts | null;
  notReady: string;
  /** The newest payment still being checked, if any. */
  pending: PendingPayment | null;
  supportUrl: string;
}

/** Plan choice, top-up and the three payment steps, sharing one "what are you paying for". */
export function BillingFlow({ t, yearSavingText, plan, prices, offerText, offerName, highlights, topupCredits, initialProduct, accounts, notReady, pending, supportUrl }: Props) {
  const p = t.pay;
  const router = useRouter();
  const [product, setProduct] = useState<ProductId>(initialProduct);
  const [period, setPeriod] = useState<Period>(initialProduct.endsWith("_year") ? "year" : "month");
  // Shown after sending, or while an earlier payment is being checked; "Send another" goes back.
  const [checking, setChecking] = useState<"none" | "pending" | "sent">(pending ? "pending" : "none");
  const statusRef = useRef<HTMLDivElement>(null);
  const payRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (checking === "sent") statusRef.current?.focus();
  }, [checking]);

  const choose = (next: ProductId) => {
    setProduct(next);
    setChecking("none");
    // The link still works without JavaScript; with it, the page doesn't reload.
    history.replaceState(null, "", `?product=${next}#pay-title`);
    payRef.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    document.getElementById("pay-product")?.focus({ preventScroll: true });
  };
  const maxFree = Math.max(...PAID.map((x) => monthsFree(prices[`${x}_month`].base, prices[`${x}_year`].base)));
  // Coral is kept for "Send for checking"; the plan most owners pick gets the filled ink button.
  const featured: PaidPlan | null = plan === "free" ? "starter" : null;
  const actionClass = "mt-auto inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold lg:min-h-10";

  return (
    <>
      <section aria-labelledby="choose-title" className="flex scroll-mt-6 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="choose-title" className="text-lg font-semibold">{p.chooseTitle}</h2>
          <div role="group" aria-label={p.period} className="inline-flex rounded-full border border-line bg-white p-1">
            {(["month", "year"] as const).map((x) => (
              <button
                key={x}
                type="button"
                aria-pressed={period === x}
                onClick={() => setPeriod(x)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-ink-muted aria-pressed:bg-ink aria-pressed:text-paper lg:min-h-9"
              >
                {x === "month" ? p.monthly : p.yearly}
                {x === "year" && maxFree > 0 && <span className="text-xs font-medium opacity-90">· {format(p.yearlyHint, { months: maxFree })}</span>}
              </button>
            ))}
          </div>
        </div>
        {offerText && <OfferBadge text={offerText} />}
        <ul className="grid gap-3 md:grid-cols-3">
          {(["free", ...PAID] as const).map((x) => {
            const current = x === plan;
            const id: ProductId | null = x === "free" ? null : `${x}_${period}`;
            const price = id ? prices[id] : null;
            const saving = x !== "free" && period === "year" ? yearlySaving(prices[`${x}_month`].base, prices[`${x}_year`].base) : 0;
            const months = x !== "free" ? monthsFree(prices[`${x}_month`].base, prices[`${x}_year`].base) : 0;
            return (
              // Phones: the plans to move to come first, the Free plan you're on last (payment sits higher).
              <li key={x} aria-current={current ? "true" : undefined} className={`flex flex-col gap-3 rounded-2xl border bg-white p-5 ${current ? "border-ink ring-1 ring-ink" : "border-line"} ${current && x === "free" ? "max-md:order-last" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-bold">{t.plans[x]}</h3>
                  {current ? (
                    <span className="rounded-full bg-sunken px-3 py-1 text-sm font-semibold text-ink">{t.currentBadge}</span>
                  ) : (
                    featured === x && <span className="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-paper">{p.mostChosen}</span>
                  )}
                </div>
                {!price ? (
                  <p className="font-display text-2xl font-bold">{t.freePrice}</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <p className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="font-display text-2xl font-bold tabular-nums">{format(t.price, { price: birr(price.final) })}</span>
                      <span className="text-ink-muted">{period === "month" ? p.perMonthShort : p.perYearShort}</span>
                    </p>
                    {price.final < price.base && <WasPrice price={format(t.price, { price: birr(price.base) })} was={t.was} className="text-sm" />}
                    {saving > 0 && <p className="text-sm font-medium text-ink">{format(yearSavingText, { amount: birr(saving), months })}</p>}
                  </div>
                )}
                {highlights[x]}
                {id && (
                  <a href={`?product=${id}#pay-title`} onClick={(e) => (e.preventDefault(), choose(id))} className={`${actionClass} ${featured === x ? "bg-ink text-paper hover:bg-ink-hover" : "border border-ink bg-white text-ink hover:bg-sunken"}`}>
                    {format(current ? p.renewPlan : p.choosePlan, { plan: t.plans[x] })}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-coral-soft text-ink">
            <Plus className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="font-semibold">{t.topup}</h3>
            <p className="text-ink-muted">{format(p.topupBody, { n: topupCredits })}</p>
          </div>
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-display text-xl font-bold tabular-nums">{format(t.price, { price: birr(prices.topup.final) })}</span>
            {prices.topup.final < prices.topup.base && <WasPrice price={format(t.price, { price: birr(prices.topup.base) })} was={t.was} className="text-sm" />}
          </p>
          <a href="?product=topup#pay-title" onClick={(e) => (e.preventDefault(), choose("topup"))} className={`${actionClass} mt-0 border border-ink bg-white text-ink hover:bg-sunken`}>
            {format(p.buyTopup, { n: topupCredits })}
          </a>
        </div>
      </section>

      <section ref={payRef} aria-labelledby="pay-title" className="flex scroll-mt-6 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="pay-title" className="scroll-mt-6 text-lg font-semibold">{p.stepsTitle}</h2>
          <p className="text-ink-muted">{t.payTitle}</p>
        </div>
        {!accounts ? (
          <p className="rounded-2xl border border-line bg-white p-5 text-ink-muted">{notReady}</p>
        ) : checking !== "none" ? (
          <div ref={statusRef} tabIndex={-1} role="status" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sunken text-ink">
                <Clock className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-display text-lg font-bold">{checking === "sent" ? t.submitted : p.checkingTitle}</p>
                {checking === "pending" && pending && <p className="text-ink-muted">{pending.text}</p>}
              </div>
            </div>
            <ol aria-label={p.timeline} className="grid grid-cols-3 gap-2">
              {[p.tlSent, p.tlChecking, p.tlApproved].map((label, i) => (
                <li key={label} aria-current={i === 1 ? "step" : undefined} className="flex flex-col gap-2">
                  <span aria-hidden="true" className={`h-1.5 rounded-full ${i === 0 ? "bg-ink" : i === 1 ? "animate-pulse bg-ink/60" : "bg-line"}`} />
                  <span className={`flex items-center gap-1 text-sm ${i < 2 ? "font-semibold text-ink" : "text-ink-muted"}`}>
                    {i === 0 && <Check aria-hidden="true" className="size-4" />}
                    {label}
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-ink-muted">{p.checkingTime}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <a href={supportUrl} className="inline-flex min-h-11 items-center gap-2 font-medium text-ink underline underline-offset-4 lg:min-h-9">
                <Send aria-hidden="true" className="size-4" />
                {p.support}
              </a>
              <button type="button" onClick={() => setChecking("none")} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:border-faint hover:bg-sunken sm:ms-auto lg:min-h-9">
                {p.another}
              </button>
            </div>
          </div>
        ) : (
          <PaymentForm
            t={t}
            offerName={offerName}
            prices={prices}
            topupCredits={topupCredits}
            product={product}
            onProduct={setProduct}
            accounts={accounts}
            onSent={() => {
              setChecking("sent");
              // The payment list below shows it as "Being checked".
              router.refresh();
            }}
          />
        )}
      </section>
    </>
  );
}
