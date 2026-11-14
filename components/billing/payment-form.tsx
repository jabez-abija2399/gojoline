"use client";

import { useRef, useState } from "react";
import type { Messages } from "@/lib/i18n";

const PRODUCTS = ["starter_month", "starter_year", "business_month", "business_year", "topup"] as const;
const METHODS = ["telebirr", "cbe", "other"] as const;

export function PaymentForm({ t, prices }: { t: Messages["billing"]; prices: Record<(typeof PRODUCTS)[number], string> }) {
  const [state, setState] = useState<{ kind: "idle" | "sending" | "done" | "error"; message?: string }>({ kind: "idle" });
  const refRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    if (!/^[A-Za-z0-9-]{6,40}$/.test(String(data.get("reference") ?? "").trim())) {
      setState({ kind: "error", message: t.errors.reference });
      refRef.current?.focus();
      return;
    }
    setState({ kind: "sending" });
    const res = await fetch("/api/billing/payments", { method: "POST", body: data }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      form.reset();
      setState({ kind: "done", message: t.submitted });
      requestAnimationFrame(() => doneRef.current?.focus());
    } else {
      setState({ kind: "error", message: (t.errors as Record<string, string>)[d.error] ?? t.errors.failed });
      if (d.error === "reference" || d.error === "duplicate") refRef.current?.focus();
    }
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
          <label key={m} className="flex min-h-11 items-center gap-3">
            <input type="radio" name="method" value={m} defaultChecked={i === 0} className="size-5" />
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
          maxLength={40}
          aria-describedby="pay-ref-hint"
          aria-invalid={state.kind === "error" || undefined}
          className="min-h-11 rounded-lg border border-input px-3 text-base"
        />
        <p id="pay-ref-hint" className="text-ink-muted">{t.referenceHint}</p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="pay-receipt" className="font-medium">{t.receipt}</label>
        <input id="pay-receipt" name="receipt" type="file" accept="image/jpeg,image/png,image/webp,image/heic" className="min-h-11 text-base file:me-3 file:min-h-11 file:rounded-lg file:border file:border-line file:bg-white file:px-4" />
      </div>
      {state.kind === "error" && <p role="alert" className="rounded-lg bg-clay-soft px-4 py-3 text-destructive">{state.message}</p>}
      {state.kind === "done" && (
        <p ref={doneRef} tabIndex={-1} role="status" className="rounded-lg bg-teal-soft px-4 py-3 font-medium text-teal">{state.message}</p>
      )}
      <button type="submit" aria-disabled={state.kind === "sending"} className="min-h-12 rounded-lg bg-clay px-5 font-medium text-white hover:bg-clay-hover aria-disabled:opacity-50">
        {state.kind === "sending" ? t.submitting : t.submit}
      </button>
    </form>
  );
}
