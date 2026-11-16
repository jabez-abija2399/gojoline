"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { createDiscountCode, saveLaunchOffer, type DiscountState } from "@/app/[lang]/admin/actions";
import type { LaunchOffer } from "@/lib/billing/discounts";

const PRODUCTS = ["starter_month", "starter_year", "business_month", "business_year", "topup"] as const;
type ProductNames = Record<(typeof PRODUCTS)[number], string>;

function Submit({ label, working }: { label: string; working: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" aria-disabled={pending} onClick={(e) => pending && e.preventDefault()} className="min-h-12 w-fit rounded-lg bg-ink px-5 font-medium text-white hover:bg-ink-hover aria-disabled:opacity-50">
      {pending ? working : label}
    </button>
  );
}

const input = "min-h-11 rounded-lg border border-input bg-white px-3 text-base aria-invalid:border-destructive";

/** The error under a field: text, not only a red border (read out with the field). */
function FieldError({ id, text }: { id: string; text: string }) {
  return (
    <span id={id} className="text-sm font-medium text-destructive">
      {text}
    </span>
  );
}

/** A labelled text field that shows its own error when the server names it. */
function Field({ name, label, invalid, error, className = "", ...rest }: { name: string; label: string; invalid: boolean; error: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      <input name={name} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${name}-error` : undefined} className={`${input} ${className}`} {...rest} />
      {invalid && <FieldError id={`${name}-error`} text={error} />}
    </label>
  );
}

/** Product checkboxes, at least one ticked (checked on the server too). */
function ProductChoice({ legend, names, selected, invalid, error, idPrefix }: { legend: string; names: ProductNames; selected: readonly string[]; invalid: boolean; error: string; idPrefix: string }) {
  return (
    <fieldset aria-describedby={invalid ? `${idPrefix}-products-error` : undefined} className={`flex flex-col gap-1 rounded-xl border p-3 ${invalid ? "border-destructive" : "border-line"}`}>
      <legend className="px-1 font-medium">{legend}</legend>
      {PRODUCTS.map((p) => (
        <label key={p} htmlFor={`${idPrefix}-${p}`} className="flex min-h-11 items-center gap-3 lg:min-h-9">
          <input id={`${idPrefix}-${p}`} type="checkbox" name="products" value={p} defaultChecked={selected.includes(p)} className="size-5 accent-ink" />
          {names[p]}
        </label>
      ))}
      {invalid && <FieldError id={`${idPrefix}-products-error`} text={error} />}
    </fieldset>
  );
}

/** After a save: the first bad field gets focus (its error is read with it), otherwise the message. */
function useFocusAfter(state: DiscountState) {
  const formRef = useRef<HTMLFormElement>(null);
  const msgRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status === "idle") return;
    const field = state.field ? formRef.current?.querySelector<HTMLInputElement>(`[name="${state.field}"]`) : null;
    (state.status !== "ok" && field ? field : msgRef.current)?.focus();
  }, [state]);
  return { formRef, msgRef };
}

function Message({ state, refEl, ok, invalid, t, label }: { state: DiscountState; refEl: React.RefObject<HTMLParagraphElement | null>; ok: string; invalid: string; t: Messages["admin"]; label?: string }) {
  if (state.status === "idle") return null;
  const text = state.status === "ok" ? ok : state.status === "exists" ? t.codeExists : state.status === "invalid" ? (label ? `${format(t.fieldInvalidNamed, { field: label })} ${invalid}` : invalid) : state.status === "forbidden" ? t.forbidden : t.failed;
  return (
    <p ref={refEl} tabIndex={-1} role={state.status === "ok" ? "status" : "alert"} className={state.status === "ok" ? "font-medium text-ink" : "text-destructive"}>
      {text}
    </p>
  );
}

/** The site-wide launch offer: on/off, percent, products, last day. */
export function OfferForm({ t, names, lang, value }: { t: Messages["admin"]; names: ProductNames; lang: string; value: LaunchOffer | null }) {
  const [state, action] = useActionState<DiscountState, FormData>(saveLaunchOffer, { status: "idle" });
  const { formRef, msgRef } = useFocusAfter(state);
  const bad = (f: string) => state.status === "invalid" && state.field === f;
  const labels: Record<string, string> = { percent: t.offerPercent, until: t.offerUntil, products: t.offerProducts };
  return (
    <form ref={formRef} action={action} aria-labelledby="offer-title" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <input type="hidden" name="lang" value={lang} />
      <div className="flex flex-col gap-1">
        <h2 id="offer-title" className="text-xl font-bold">{t.offerTitle}</h2>
        <p className="text-ink-muted">{t.offerHint}</p>
      </div>
      <label className="flex min-h-11 items-center gap-3 font-medium">
        <input type="checkbox" name="active" defaultChecked={value?.active ?? false} className="size-5 accent-ink" />
        {t.offerOn}
      </label>
      <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
        <Field name="percent" label={t.offerPercent} invalid={bad("percent")} error={t.fieldInvalid} inputMode="numeric" maxLength={2} defaultValue={value?.percent ?? 20} />
        <Field name="until" label={t.offerUntil} invalid={bad("until")} error={t.fieldInvalid} type="date" defaultValue={value?.until ?? ""} />
      </div>
      <ProductChoice legend={t.offerProducts} names={names} selected={value?.products ?? []} invalid={bad("products")} error={t.chooseOne} idPrefix="offer" />
      <Message state={state} refEl={msgRef} ok={t.done} invalid={t.offerInvalid} t={t} label={state.field ? labels[state.field] : undefined} />
      <Submit label={t.offerSave} working={t.working} />
    </form>
  );
}

/** A new discount code. The form clears after a code is made. */
export function CodeForm({ t, names, lang }: { t: Messages["admin"]; names: ProductNames; lang: string }) {
  const [state, action] = useActionState<DiscountState, FormData>(createDiscountCode, { status: "idle" });
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const { formRef, msgRef } = useFocusAfter(state);
  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset();
  }, [state, formRef]);
  const bad = (f: string) => (state.status === "invalid" || state.status === "exists") && state.field === f;
  const labels: Record<string, string> = { code: t.codeCode, percent: t.codePercent, amount: t.codeAmount, products: t.codeProducts, maxUses: t.codeMaxUses, expires: t.codeExpires };
  return (
    <form ref={formRef} action={action} aria-labelledby="code-new-title" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <input type="hidden" name="lang" value={lang} />
      <h3 id="code-new-title" className="text-lg font-bold">{t.codeNew}</h3>
      <Field name="code" label={t.codeCode} invalid={bad("code")} error={state.status === "exists" ? t.codeExists : t.fieldInvalid} autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={20} className="font-mono uppercase" />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">{t.codeKind}</legend>
        <div className="flex flex-wrap gap-x-6">
          {(["percent", "amount"] as const).map((k) => (
            <label key={k} className="flex min-h-11 items-center gap-3 lg:min-h-9">
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="size-5 accent-ink" />
              {k === "percent" ? t.codeKindPercent : t.codeKindAmount}
            </label>
          ))}
        </div>
        {kind === "percent" ? (
          <Field key="percent" name="percent" label={t.codePercent} invalid={bad("percent")} error={t.fieldInvalid} inputMode="numeric" maxLength={2} />
        ) : (
          <Field key="amount" name="amount" label={t.codeAmount} invalid={bad("amount")} error={t.fieldInvalid} inputMode="numeric" maxLength={7} />
        )}
      </fieldset>
      <ProductChoice legend={t.codeProducts} names={names} selected={PRODUCTS} invalid={bad("products")} error={t.chooseOne} idPrefix="code" />
      <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
        <Field name="maxUses" label={t.codeMaxUses} invalid={bad("maxUses")} error={t.fieldInvalid} inputMode="numeric" maxLength={6} />
        <Field name="expires" label={t.codeExpires} invalid={bad("expires")} error={t.fieldInvalid} type="date" />
      </div>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="perCustomerOnce" defaultChecked className="size-5 shrink-0 accent-ink" />
        {t.codePerCustomer}
      </label>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="firstPaymentOnly" className="size-5 shrink-0 accent-ink" />
        {t.codeFirstOnly}
      </label>
      <Message state={state} refEl={msgRef} ok={t.codeCreated} invalid={t.codeInvalid} t={t} label={state.status === "invalid" && state.field ? labels[state.field] : undefined} />
      <Submit label={t.codeCreate} working={t.working} />
    </form>
  );
}
