"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ImagePlus, Landmark, Smartphone, Building2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { productName } from "@/lib/billing/plans";
import { CopyButton } from "./copy-button";

export const PAY_PRODUCTS = ["starter_month", "starter_year", "business_month", "business_year", "topup"] as const;
export type ProductId = (typeof PAY_PRODUCTS)[number];
type Method = "telebirr" | "cbe" | "other";
const MAX_RECEIPT_BYTES = 4_000_000;
const FIELD_ERRORS = new Set(["reference", "duplicate"]);
const RECEIPT_ERRORS = new Set(["receipt", "receipt_missing"]);
const METHOD_ICONS = { telebirr: Smartphone, cbe: Landmark, other: Building2 } as const;

type State = { kind: "idle" | "sending" } | { kind: "error"; code: string };
/** A code checked by the server: what it takes off, or why it can't be used. */
type CodeState = { kind: "none" } | { kind: "checking" } | { kind: "ok"; code: string; finalMinor: number; originalMinor: number; discountMinor: number; source: "code" | "offer" | null } | { kind: "error"; error: string };

const birr = (minor: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(minor / 100);

/** Where customers send money (Admin → Settings); an empty number hides that way to pay. */
export interface PayAccounts {
  telebirrNumber: string;
  cbeAccount: string;
  accountName: string;
}

/** A numbered step: its title is a heading, so screen-reader users can jump between steps. */
function Step({ n, label, title, children }: { n: number; label: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`pay-step-${n}`} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <h3 id={`pay-step-${n}`} className="flex items-center gap-3 text-base font-semibold">
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-paper">{n}</span>
        <span>
          <span className="sr-only">{label}: </span>
          {title}
        </span>
      </h3>
      {children}
    </section>
  );
}

export function PaymentForm({
  t,
  offerName = t.offerName,
  prices,
  topupCredits,
  product,
  onProduct,
  accounts,
  onSent,
}: {
  t: Messages["billing"];
  /** What the offer is called for customers ("Launch offer" unless an admin renamed it). */
  offerName?: string;
  /** Santim: the list price and the price now (launch offer included). */
  prices: Record<ProductId, { base: number; final: number }>;
  topupCredits: number;
  /** What is being paid for (the plan cards above choose it too). */
  product: ProductId;
  onProduct: (p: ProductId) => void;
  accounts: PayAccounts;
  /** The payment was received for checking. */
  onSent: () => void;
}) {
  const p = t.pay;
  const methods: Method[] = [...(accounts.telebirrNumber ? (["telebirr"] as const) : []), ...(accounts.cbeAccount ? (["cbe", "other"] as const) : [])];
  const [method, setMethod] = useState<Method>(methods[0] ?? "telebirr");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [receipt, setReceipt] = useState<{ name: string; url: string } | null>(null);
  const [code, setCode] = useState<CodeState>({ kind: "none" });
  const [codeOpen, setCodeOpen] = useState(false);
  const refRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  // The preview is a local object URL: freed when replaced or when the form goes away.
  useEffect(() => () => {
    if (receipt) URL.revokeObjectURL(receipt.url);
  }, [receipt]);
  useEffect(() => {
    if (codeOpen) codeRef.current?.focus();
  }, [codeOpen]);
  const errorText = state.kind === "error" ? ((t.errors as Record<string, string>)[state.code] ?? (t.codeErrors as Record<string, string>)[state.code] ?? t.errors.failed) : null;
  const refError = state.kind === "error" && FIELD_ERRORS.has(state.code);
  const receiptError = state.kind === "error" && RECEIPT_ERRORS.has(state.code);
  const codeErrorText = code.kind === "error" ? ((t.codeErrors as Record<string, string>)[code.error] ?? (t.errors as Record<string, string>)[code.error] ?? t.errors.failed) : null;

  const fail = (failure: string) => {
    if (failure.startsWith("code_")) {
      setState({ kind: "idle" });
      setCode({ kind: "error", error: failure });
      setCodeOpen(true);
      codeRef.current?.focus();
      return;
    }
    setState({ kind: "error", code: failure });
    if (FIELD_ERRORS.has(failure)) refRef.current?.focus();
    else if (RECEIPT_ERRORS.has(failure)) fileRef.current?.focus();
  };

  /** Asks the server what the code takes off this product (it checks the code again on sending). */
  const check = async (forProduct: ProductId) => {
    const typed = codeRef.current?.value.trim() ?? "";
    if (!typed) return setCode({ kind: "none" });
    setCode({ kind: "checking" });
    const res = await fetch("/api/billing/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product: forProduct, code: typed }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && d.quote) setCode({ kind: "ok", code: typed.toUpperCase(), ...d.quote });
    else setCode({ kind: "error", error: typeof d.error === "string" ? d.error : "failed" });
  };

  // A plan card above changed the product: an applied code is checked again for it.
  const checkedFor = useRef(product);
  useEffect(() => {
    if (checkedFor.current === product) return;
    checkedFor.current = product;
    if (code.kind === "ok" || code.kind === "error") void check(product);
    // Only when the product changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const reference = String(data.get("reference") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (reference.length < 6 || reference.length > 40) return fail("reference");
    const file = data.get("receipt");
    if (!(file instanceof File) || file.size === 0) return fail("receipt_missing");
    if (file.size > MAX_RECEIPT_BYTES) return fail("receipt");
    setState({ kind: "sending" });
    const res = await fetch("/api/billing/payments", { method: "POST", body: data }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setState({ kind: "idle" });
      onSent();
    } else fail(typeof d.error === "string" ? d.error : "failed");
  };

  // What the customer pays: the server's quote with a code, otherwise the price now (offer included).
  const price = code.kind === "ok" ? { base: code.originalMinor, final: code.finalMinor } : prices[product];
  const discounted = price.final < price.base;
  const codeNote =
    code.kind === "ok"
      ? code.source === "code"
        ? format(t.codeApplied, { code: code.code, amount: birr(code.discountMinor) })
        : code.source === "offer"
          ? format(t.offerBetter, { name: offerName })
          : null
      : discounted
        ? format(t.offerApplied, { name: offerName, amount: birr(price.base - price.final) })
        : null;
  const amount = format(t.price, { price: birr(price.final) });
  const account = method === "telebirr" ? { label: p.telebirrNumber, value: accounts.telebirrNumber } : { label: p.accountNumber, value: accounts.cbeAccount };
  const hint = { telebirr: p.telebirrHint, cbe: p.cbeHint, other: p.otherHint }[method];
  const big = "font-display text-2xl font-bold tracking-wide tabular-nums break-all";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Step n={1} label={format(p.step, { n: 1 })} title={p.step1}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pay-product" className="font-medium">{t.product}</label>
          <div className="relative">
            <select
              id="pay-product"
              name="product"
              value={product}
              onChange={(e) => onProduct(e.target.value as ProductId)}
              className="min-h-12 w-full appearance-none rounded-xl border border-input bg-white ps-4 pe-10 text-base font-medium"
            >
              {PAY_PRODUCTS.map((x) => (
                <option key={x} value={x}>{`${productName(t.productNames, x, topupCredits)} · ${format(t.price, { price: birr(prices[x].final) })}`}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={codeOpen}
            aria-controls="pay-code-box"
            onClick={() => setCodeOpen((o) => !o)}
            className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 lg:min-h-9"
          >
            {p.haveCode}
            <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${codeOpen ? "rotate-180" : ""}`} />
          </button>
          <div id="pay-code-box" hidden={!codeOpen} className="flex flex-col gap-1">
            <label htmlFor="pay-code" className="font-medium">{t.codeLabel}</label>
            <div className="flex gap-2">
              <input
                ref={codeRef}
                id="pay-code"
                name="code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={20}
                aria-describedby={codeErrorText ? "pay-code-hint pay-code-error" : "pay-code-hint"}
                aria-invalid={!!codeErrorText || undefined}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (code.kind !== "checking") void check(product);
                  }
                }}
                onChange={() => code.kind !== "none" && code.kind !== "checking" && setCode({ kind: "none" })}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-input bg-white px-3 font-mono text-base uppercase aria-invalid:border-destructive"
              />
              <button type="button" onClick={() => code.kind !== "checking" && void check(product)} aria-disabled={code.kind === "checking"} className="min-h-11 shrink-0 rounded-lg border border-line bg-white px-4 text-sm font-medium hover:border-faint aria-disabled:opacity-50 lg:min-h-9">
                {code.kind === "checking" ? t.codeChecking : t.codeApply}
              </button>
            </div>
            <p id="pay-code-hint" className="text-sm text-ink-muted">{t.codeHint}</p>
            {codeErrorText && <p id="pay-code-error" role="alert" className="text-destructive">{codeErrorText}</p>}
          </div>
        </div>
        <div role="status" aria-live="polite" className="flex flex-col gap-1 rounded-xl bg-paper px-4 py-3">
          {discounted && (
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-ink-muted">
              <dt>{p.price}</dt>
              <dd className="text-end tabular-nums">{format(t.price, { price: birr(price.base) })}</dd>
              <dt>{p.discount}</dt>
              <dd className="text-end tabular-nums">−{format(t.price, { price: birr(price.base - price.final) })}</dd>
            </dl>
          )}
          <p className="text-lg font-semibold">{format(t.youPay, { price: birr(price.final) })}</p>
          {codeNote && <p className="text-sm text-ink-muted">{codeNote}</p>}
        </div>
      </Step>

      <Step n={2} label={format(p.step, { n: 2 })} title={p.step2}>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-medium">{p.methodLegend}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {methods.map((m) => {
              const Icon = METHOD_ICONS[m];
              return (
                <label
                  key={m}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-3 py-2 transition-colors hover:border-faint has-checked:border-ink has-checked:bg-paper has-checked:ring-1 has-checked:ring-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-link"
                >
                  <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />
                  <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sunken text-ink">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-medium">{t.methods[m]}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4">
          <p className="text-sm text-ink-muted">{hint}</p>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium text-ink-muted">{account.label}</span>
              <span className={big}>{account.value}</span>
            </div>
            <CopyButton value={account.value.replace(/\s+/g, "")} what={account.label} copy={p.copy} copied={p.copied} />
          </div>
          {accounts.accountName && (
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium text-ink-muted">{p.holder}</span>
              <span className="text-lg font-semibold break-words">{accounts.accountName}</span>
            </div>
          )}
          <div className="flex flex-wrap items-end justify-between gap-2 border-t border-line pt-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium text-ink-muted">{p.amount}</span>
              <span className={big}>{amount}</span>
            </div>
            <CopyButton value={(price.final / 100).toString()} what={p.amount} copy={p.copy} copied={p.copied} />
          </div>
        </div>
      </Step>

      <Step n={3} label={format(p.step, { n: 3 })} title={p.step3}>
        <div className="flex flex-col gap-1">
          <label htmlFor="pay-ref" className="font-medium">{t.reference}</label>
          <input
            ref={refRef}
            id="pay-ref"
            name="reference"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={50}
            aria-describedby={refError ? "pay-ref-hint pay-ref-error" : "pay-ref-hint"}
            aria-invalid={refError || undefined}
            className="min-h-12 rounded-xl border border-input bg-white px-4 font-mono text-base uppercase aria-invalid:border-destructive"
          />
          <p id="pay-ref-hint" className="text-sm text-ink-muted">{t.referenceHint}</p>
          {refError && <p id="pay-ref-error" role="alert" className="text-destructive">{errorText}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <span id="pay-receipt-label" className="font-medium">{t.receipt}</span>
          <div className="flex flex-wrap items-center gap-3">
            {receipt && (
              // eslint-disable-next-line @next/next/no-img-element -- a local preview (object URL), never served
              <img src={receipt.url} alt={p.preview} width={64} height={64} className="size-16 rounded-lg border border-line object-cover" />
            )}
            <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium hover:border-faint has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-link lg:min-h-9">
              <ImagePlus aria-hidden="true" className="size-5 text-ink" />
              {receipt ? p.changePhoto : t.chooseReceipt}
              <input
                ref={fileRef}
                type="file"
                name="receipt"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-labelledby="pay-receipt-label"
                aria-describedby={receiptError ? "pay-receipt-status pay-receipt-error" : "pay-receipt-status"}
                aria-invalid={receiptError || undefined}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setReceipt(f ? { name: f.name, url: URL.createObjectURL(f) } : null);
                }}
              />
            </label>
          </div>
          <p id="pay-receipt-status" className="text-sm break-all text-ink-muted">{receipt ? format(t.receiptSelected, { name: receipt.name }) : t.noReceiptYet}</p>
          {receiptError && <p id="pay-receipt-error" role="alert" className="text-destructive">{errorText}</p>}
        </div>
        {state.kind === "error" && !refError && !receiptError && <p role="alert" className="rounded-lg bg-coral-soft px-4 py-3 text-destructive">{errorText}</p>}
        <button type="submit" aria-disabled={state.kind === "sending"} className="min-h-12 rounded-xl bg-coral px-5 text-base font-semibold text-on-coral hover:bg-coral-hover aria-disabled:opacity-50">
          {state.kind === "sending" ? t.submitting : t.submit}
        </button>
      </Step>
    </form>
  );
}
