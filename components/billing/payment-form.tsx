"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { productName } from "@/lib/billing/plans";

const PRODUCTS = ["starter_month", "starter_year", "business_month", "business_year", "topup"] as const;
type ProductId = (typeof PRODUCTS)[number];
const METHODS = ["telebirr", "cbe", "other"] as const;
const MAX_RECEIPT_BYTES = 4_000_000;
const FIELD_ERRORS = new Set(["reference", "duplicate"]);
const RECEIPT_ERRORS = new Set(["receipt", "receipt_missing"]);

type State = { kind: "idle" | "sending" | "done" } | { kind: "error"; code: string };
/** A code checked by the server: what it takes off, or why it can't be used. */
type CodeState = { kind: "none" } | { kind: "checking" } | { kind: "ok"; code: string; finalMinor: number; originalMinor: number; discountMinor: number; source: "code" | "offer" | null } | { kind: "error"; error: string };

const birr = (minor: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(minor / 100);

export function PaymentForm({
  t,
  prices,
  topupCredits,
  initialProduct = "starter_month",
}: {
  t: Messages["billing"];
  /** Santim: the list price and the price now (launch offer included). */
  prices: Record<ProductId, { base: number; final: number }>;
  topupCredits: number;
  initialProduct?: ProductId;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [fileName, setFileName] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductId>(initialProduct);
  const [code, setCode] = useState<CodeState>({ kind: "none" });
  const refRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.kind === "done") doneRef.current?.focus();
  }, [state.kind]);
  const errorText = state.kind === "error" ? ((t.errors as Record<string, string>)[state.code] ?? (t.codeErrors as Record<string, string>)[state.code] ?? t.errors.failed) : null;
  const refError = state.kind === "error" && FIELD_ERRORS.has(state.code);
  const receiptError = state.kind === "error" && RECEIPT_ERRORS.has(state.code);
  const codeErrorText = code.kind === "error" ? ((t.codeErrors as Record<string, string>)[code.error] ?? (t.errors as Record<string, string>)[code.error] ?? t.errors.failed) : null;

  const fail = (failure: string) => {
    if (failure.startsWith("code_")) {
      setState({ kind: "idle" });
      setCode({ kind: "error", error: failure });
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
      form.reset();
      setFileName(null);
      setProduct(initialProduct);
      setCode({ kind: "none" });
      setState({ kind: "done" });
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
          ? t.offerBetter
          : null
      : discounted
        ? format(t.offerApplied, { amount: birr(price.base - price.final) })
        : null;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="pay-product" className="font-medium">{t.product}</label>
        <select
          id="pay-product"
          name="product"
          value={product}
          onChange={(e) => {
            const next = e.target.value as ProductId;
            setProduct(next);
            // An applied code is checked again for the new choice.
            if (code.kind === "ok" || code.kind === "error") void check(next);
          }}
          className="min-h-11 rounded-lg border border-input bg-white px-3 text-base"
        >
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>{`${productName(t.productNames, p, topupCredits)} · ${format(t.price, { price: birr(prices[p].final) })}`}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
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
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-input px-3 font-mono text-base uppercase aria-invalid:border-destructive"
          />
          <button type="button" onClick={() => code.kind !== "checking" && void check(product)} aria-disabled={code.kind === "checking"} className="min-h-11 shrink-0 rounded-lg border border-line bg-white px-4 text-sm font-medium hover:border-faint aria-disabled:opacity-50 lg:min-h-9">
            {code.kind === "checking" ? t.codeChecking : t.codeApply}
          </button>
        </div>
        <p id="pay-code-hint" className="text-sm text-ink-muted">{t.codeHint}</p>
        {codeErrorText && <p id="pay-code-error" role="alert" className="text-destructive">{codeErrorText}</p>}
      </div>
      <div role="status" aria-live="polite" className="flex flex-col gap-0.5 rounded-lg bg-paper px-4 py-3">
        <p className="font-semibold">
          {format(t.youPay, { price: birr(price.final) })}
          {discounted && <span className="font-normal text-ink-muted"> {format(t.youPayWas, { price: birr(price.base) })}</span>}
        </p>
        {codeNote && <p className="text-sm text-ink-muted">{codeNote}</p>}
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">{t.method}</legend>
        {METHODS.map((m, i) => (
          <label key={m} className="flex min-h-11 items-center gap-3 lg:min-h-9">
            <input type="radio" name="method" value={m} defaultChecked={i === 0} className="size-5 accent-ink" />
            {t.methods[m]}
          </label>
        ))}
      </fieldset>
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
          className="min-h-11 rounded-lg border border-input px-3 text-base aria-invalid:border-destructive"
        />
        <p id="pay-ref-hint" className="text-ink-muted">{t.referenceHint}</p>
        {refError && <p id="pay-ref-error" role="alert" className="text-destructive">{errorText}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <span id="pay-receipt-label" className="font-medium">{t.receipt}</span>
        <label className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 font-medium hover:border-faint has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-link text-sm lg:min-h-9">
          <ImagePlus aria-hidden="true" className="size-5 text-ink" />
          {t.chooseReceipt}
          <input
            ref={fileRef}
            type="file"
            name="receipt"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-labelledby="pay-receipt-label"
            aria-describedby={receiptError ? "pay-receipt-status pay-receipt-error" : "pay-receipt-status"}
            aria-invalid={receiptError || undefined}
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        <p id="pay-receipt-status" className="break-all text-ink-muted">{fileName ? format(t.receiptSelected, { name: fileName }) : t.noReceiptYet}</p>
        {receiptError && <p id="pay-receipt-error" role="alert" className="text-destructive">{errorText}</p>}
      </div>
      {state.kind === "error" && !refError && !receiptError && <p role="alert" className="rounded-lg bg-coral-soft px-4 py-3 text-destructive">{errorText}</p>}
      {state.kind === "done" && (
        <p ref={doneRef} tabIndex={-1} role="status" className="rounded-lg border border-lagoon bg-white px-4 py-3 font-medium text-lagoon">{t.submitted}</p>
      )}
      <button type="submit" aria-disabled={state.kind === "sending"} className="min-h-11 rounded-lg bg-coral px-5 font-medium text-on-coral hover:bg-coral-hover aria-disabled:opacity-50 text-sm lg:min-h-9">
        {state.kind === "sending" ? t.submitting : t.submit}
      </button>
    </form>
  );
}
