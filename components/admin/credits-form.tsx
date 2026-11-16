"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { Messages } from "@/lib/i18n";
import { saveCreditSettings, type CreditsState } from "@/app/[lang]/admin/actions";
import type { CreditSettings } from "@/lib/billing/credits";
import { format } from "@/lib/i18n/format";

const PLANS = ["free", "starter", "business"] as const;
const SIZES = ["small", "medium", "large"] as const;

function Save({ t }: { t: Messages["admin"] }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" aria-disabled={pending} onClick={(e) => pending && e.preventDefault()} className="min-h-12 w-fit rounded-lg bg-ink px-5 font-medium text-white hover:bg-ink-hover aria-disabled:opacity-50">
      {pending ? t.working : t.creditsSave}
    </button>
  );
}

/** Admin → Settings → Changes (credits): monthly changes, rollover, pack size, sizes, cost cap. */
export function CreditsForm({ t, planNames, lang, values }: { t: Messages["admin"]; planNames: Record<(typeof PLANS)[number], string>; lang: string; values: CreditSettings }) {
  const [state, action] = useActionState<CreditsState, FormData>(saveCreditSettings, { status: "idle" });
  const msgRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const bad = (name: string) => state.status === "invalid" && state.field === name;
  // A bad field gets focus (its own error is read with it); otherwise the message does.
  useEffect(() => {
    if (state.status === "idle") return;
    const field = state.status === "invalid" && state.field ? formRef.current?.querySelector<HTMLInputElement>(`[name="${state.field}"]`) : null;
    (field ?? msgRef.current)?.focus();
  }, [state]);
  const labels: Record<string, string> = {
    ...Object.fromEntries(PLANS.flatMap((p) => [[`monthly_${p}`, `${t.creditsMonthly}: ${planNames[p]}`], [`rollover_${p}`, `${t.creditsRollover}: ${planNames[p]}`]])),
    ...Object.fromEntries(SIZES.map((x) => [`size_${x}`, t.creditsSize[x]])),
    topupCredits: t.creditsTopup,
    capUsd: t.creditsCap,
  };
  const num = (name: string, label: string, value: number | string, extra: { min?: number; max?: number; hint?: string; decimal?: boolean } = {}) => (
    <label key={name} className="flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        defaultValue={String(value)}
        inputMode={extra.decimal ? "decimal" : "numeric"}
        maxLength={extra.decimal ? 6 : 5}
        aria-invalid={bad(name) || undefined}
        aria-describedby={[extra.hint ? `${name}-hint` : "", bad(name) ? `${name}-error` : ""].filter(Boolean).join(" ") || undefined}
        className="min-h-11 rounded-lg border border-input bg-white px-3 text-base tabular-nums aria-invalid:border-destructive"
      />
      {extra.hint && <span id={`${name}-hint`} className="text-sm text-ink-muted">{extra.hint}</span>}
      {bad(name) && <span id={`${name}-error`} className="text-sm font-medium text-destructive">{t.fieldInvalid}</span>}
    </label>
  );
  const cap = (values.capCentsPerCredit / 100).toFixed(2);
  return (
    <form ref={formRef} action={action} aria-labelledby="credits-form-title" className="flex flex-col gap-5">
      <input type="hidden" name="lang" value={lang} />
      <div className="flex flex-col gap-1">
        <h2 id="credits-form-title" className="text-2xl font-bold">{t.creditsTitle}</h2>
        <p className="text-ink-muted">{t.creditsHint}</p>
      </div>
      <fieldset className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-3 sm:items-start">
        <legend className="px-1 font-semibold">{t.creditsMonthly}</legend>
        {PLANS.map((p) => num(`monthly_${p}`, planNames[p], values.monthly[p]))}
      </fieldset>
      <fieldset className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-3 sm:items-start">
        <legend className="px-1 font-semibold">{t.creditsRollover}</legend>
        {PLANS.map((p) => num(`rollover_${p}`, planNames[p], values.rollover[p]))}
        <p className="text-sm text-ink-muted sm:col-span-3">{t.creditsRolloverHint}</p>
      </fieldset>
      <fieldset className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-3 sm:items-start">
        <legend className="px-1 font-semibold">{t.creditsSizes}</legend>
        {SIZES.map((s) => num(`size_${s}`, t.creditsSize[s], values.sizeCredits[s]))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
        {num("topupCredits", t.creditsTopup, values.topupCredits)}
        {num("capUsd", t.creditsCap, cap, { decimal: true, hint: t.creditsCapHint })}
      </div>
      {state.status !== "idle" && (
        <p ref={msgRef} tabIndex={-1} role={state.status === "ok" ? "status" : "alert"} className={state.status === "ok" ? "font-medium text-ink" : "text-destructive"}>
          {state.status === "ok" ? t.done : state.status === "invalid" ? `${state.field && labels[state.field] ? format(t.fieldInvalidNamed, { field: labels[state.field] }) + " " : ""}${t.creditsInvalid}` : state.status === "forbidden" ? t.forbidden : t.failed}
        </p>
      )}
      <Save t={t} />
    </form>
  );
}
