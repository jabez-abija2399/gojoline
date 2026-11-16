"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Messages } from "@/lib/i18n";
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

/** Product checkboxes, at least one ticked (checked on the server too). */
function ProductChoice({ legend, names, selected, invalid, idPrefix }: { legend: string; names: ProductNames; selected: readonly string[]; invalid: boolean; idPrefix: string }) {
  return (
    <fieldset className={`flex flex-col gap-1 rounded-xl border p-3 ${invalid ? "border-destructive" : "border-line"}`}>
      <legend className="px-1 font-medium">{legend}</legend>
      {PRODUCTS.map((p) => (
        <label key={p} htmlFor={`${idPrefix}-${p}`} className="flex min-h-11 items-center gap-3 lg:min-h-9">
          <input id={`${idPrefix}-${p}`} type="checkbox" name="products" value={p} defaultChecked={selected.includes(p)} className="size-5 accent-ink" />
          {names[p]}
        </label>
      ))}
    </fieldset>
  );
}

function useMessage(state: DiscountState) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status !== "idle") ref.current?.focus();
  }, [state]);
  return ref;
}

/** The site-wide launch offer: on/off, percent, products, last day. */
export function OfferForm({ t, names, lang, value }: { t: Messages["admin"]; names: ProductNames; lang: string; value: LaunchOffer | null }) {
  const [state, action] = useActionState<DiscountState, FormData>(saveLaunchOffer, { status: "idle" });
  const ref = useMessage(state);
  const bad = (f: string) => state.status === "invalid" && state.field === f;
  return (
    <form action={action} aria-labelledby="offer-title" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
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
        <label className="flex flex-col gap-1">
          <span className="font-medium">{t.offerPercent}</span>
          <input name="percent" inputMode="numeric" maxLength={2} defaultValue={value?.percent ?? 20} aria-invalid={bad("percent") || undefined} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">{t.offerUntil}</span>
          <input name="until" type="date" defaultValue={value?.until ?? ""} aria-invalid={bad("until") || undefined} className={input} />
        </label>
      </div>
      <ProductChoice legend={t.offerProducts} names={names} selected={value?.products ?? []} invalid={bad("products")} idPrefix="offer" />
      {state.status !== "idle" && (
        <p ref={ref} tabIndex={-1} role={state.status === "ok" ? "status" : "alert"} className={state.status === "ok" ? "font-medium text-ink" : "text-destructive"}>
          {state.status === "ok" ? t.done : state.status === "invalid" ? t.offerInvalid : state.status === "forbidden" ? t.forbidden : t.failed}
        </p>
      )}
      <Submit label={t.offerSave} working={t.working} />
    </form>
  );
}

/** A new discount code. The form clears after a code is made. */
export function CodeForm({ t, names, lang }: { t: Messages["admin"]; names: ProductNames; lang: string }) {
  const [state, action] = useActionState<DiscountState, FormData>(createDiscountCode, { status: "idle" });
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const ref = useMessage(state);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "ok") formRef.current?.reset();
  }, [state]);
  const bad = (f: string) => (state.status === "invalid" || state.status === "exists") && state.field === f;
  return (
    <form ref={formRef} action={action} aria-labelledby="code-new-title" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <input type="hidden" name="lang" value={lang} />
      <h3 id="code-new-title" className="text-lg font-bold">{t.codeNew}</h3>
      <label className="flex flex-col gap-1">
        <span className="font-medium">{t.codeCode}</span>
        <input name="code" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={20} aria-invalid={bad("code") || undefined} className={`${input} font-mono uppercase`} />
      </label>
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
          <label className="flex flex-col gap-1">
            <span className="font-medium">{t.codePercent}</span>
            <input name="percent" inputMode="numeric" maxLength={2} aria-invalid={bad("percent") || undefined} className={input} />
          </label>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="font-medium">{t.codeAmount}</span>
            <input name="amount" inputMode="numeric" maxLength={7} aria-invalid={bad("amount") || undefined} className={input} />
          </label>
        )}
      </fieldset>
      <ProductChoice legend={t.codeProducts} names={names} selected={PRODUCTS} invalid={bad("products")} idPrefix="code" />
      <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
        <label className="flex flex-col gap-1">
          <span className="font-medium">{t.codeMaxUses}</span>
          <input name="maxUses" inputMode="numeric" maxLength={6} aria-invalid={bad("maxUses") || undefined} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">{t.codeExpires}</span>
          <input name="expires" type="date" aria-invalid={bad("expires") || undefined} className={input} />
        </label>
      </div>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="firstPaymentOnly" className="size-5 shrink-0 accent-ink" />
        {t.codeFirstOnly}
      </label>
      {state.status !== "idle" && (
        <p ref={ref} tabIndex={-1} role={state.status === "ok" ? "status" : "alert"} className={state.status === "ok" ? "font-medium text-ink" : "text-destructive"}>
          {state.status === "ok" ? t.codeCreated : state.status === "exists" ? t.codeExists : state.status === "invalid" ? t.codeInvalid : state.status === "forbidden" ? t.forbidden : t.failed}
        </p>
      )}
      <Submit label={t.codeCreate} working={t.working} />
    </form>
  );
}
