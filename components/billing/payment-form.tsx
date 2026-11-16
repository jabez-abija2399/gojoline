"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";

const PRODUCTS = ["starter_month", "starter_year", "business_month", "business_year", "topup"] as const;
const METHODS = ["telebirr", "cbe", "other"] as const;
const MAX_RECEIPT_BYTES = 4_000_000;
const FIELD_ERRORS = new Set(["reference", "duplicate"]);
const RECEIPT_ERRORS = new Set(["receipt", "receipt_missing"]);

type State = { kind: "idle" | "sending" | "done" } | { kind: "error"; code: string };

export function PaymentForm({ t, prices }: { t: Messages["billing"]; prices: Record<(typeof PRODUCTS)[number], string> }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [fileName, setFileName] = useState<string | null>(null);
  const refRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.kind === "done") doneRef.current?.focus();
  }, [state.kind]);
  const errorText = state.kind === "error" ? ((t.errors as Record<string, string>)[state.code] ?? t.errors.failed) : null;
  const refError = state.kind === "error" && FIELD_ERRORS.has(state.code);
  const receiptError = state.kind === "error" && RECEIPT_ERRORS.has(state.code);

  const fail = (code: string) => {
    setState({ kind: "error", code });
    if (FIELD_ERRORS.has(code)) refRef.current?.focus();
    else if (RECEIPT_ERRORS.has(code)) fileRef.current?.focus();
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
      setState({ kind: "done" });
    } else fail(typeof d.error === "string" ? d.error : "failed");
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="pay-product" className="font-medium">{t.product}</label>
        <select id="pay-product" name="product" defaultValue="starter_month" className="min-h-11 rounded-lg border border-input bg-white px-3 text-base">
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>{`${t.productNames[p]} · ${prices[p]}`}</option>
          ))}
        </select>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">{t.method}</legend>
        {METHODS.map((m, i) => (
          <label key={m} className="flex min-h-11 items-center gap-3 text-sm lg:min-h-9">
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
