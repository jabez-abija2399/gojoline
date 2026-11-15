"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { Messages } from "@/lib/i18n";
import { saveBillingSettings, type SettingsState } from "@/app/[lang]/admin/actions";

const PRODUCTS = ["starter_month", "starter_year", "business_month", "business_year", "topup"] as const;

function Save({ t }: { t: Messages["admin"] }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" aria-disabled={pending} onClick={(e) => pending && e.preventDefault()} className="min-h-12 w-fit rounded-lg bg-ink px-5 font-medium text-white hover:bg-ink-hover aria-disabled:opacity-50">
      {pending ? t.working : t.settingsSave}
    </button>
  );
}

/** Prices (Birr) and the accounts customers pay into. */
export function SettingsForm({ t, tb, lang, values }: { t: Messages["admin"]; tb: Messages["billing"]; lang: string; values: { prices: Record<string, string>; telebirrNumber: string; cbeAccount: string; accountName: string } }) {
  const [state, action] = useActionState<SettingsState, FormData>(saveBillingSettings, { status: "idle" });
  const msgRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status !== "idle") msgRef.current?.focus();
  }, [state]);
  const bad = (name: string) => state.status === "invalid" && state.field === name;
  const field = (name: string, label: string, value: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label key={name} className="flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      <input name={name} defaultValue={value} aria-invalid={bad(name) || undefined} className="min-h-11 rounded-lg border border-input px-3 text-base aria-invalid:border-destructive" {...extra} />
    </label>
  );
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="lang" value={lang} />
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-semibold">{t.settingsPrices}</legend>
        {PRODUCTS.map((p) => field(`price_${p}`, `${tb.productNames[p]} (${t.settingsBirr})`, values.prices[p] ?? "", { inputMode: "decimal", maxLength: 12 }))}
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-2 text-lg font-semibold">{t.settingsAccounts}</legend>
        {field("telebirrNumber", tb.methods.telebirr, values.telebirrNumber, { inputMode: "tel", maxLength: 40 })}
        {field("cbeAccount", tb.methods.cbe, values.cbeAccount, { inputMode: "numeric", maxLength: 60 })}
        {field("accountName", t.settingsAccountName, values.accountName, { maxLength: 120 })}
        <p className="text-ink-muted">{t.settingsAccountsHint}</p>
      </fieldset>
      {state.status !== "idle" && (
        <p ref={msgRef} tabIndex={-1} role={state.status === "ok" ? "status" : "alert"} className={state.status === "ok" ? "font-medium text-ink" : "text-destructive"}>
          {state.status === "ok" ? t.done : state.status === "invalid" ? t.settingsInvalid : state.status === "forbidden" ? t.forbidden : t.failed}
        </p>
      )}
      <Save t={t} />
    </form>
  );
}
