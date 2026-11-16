"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { birrToMinor, monthsFree, productName, yearlySaving } from "@/lib/billing/plans";
import { saveBillingSettings, type SettingsState } from "@/app/[lang]/admin/actions";

/** Price fields grouped the way customers see them: each plan's month and year, then extras. */
const GROUPS = [
  { plan: "starter", fields: ["starter_month", "starter_year"] },
  { plan: "business", fields: ["business_month", "business_year"] },
  { plan: null, fields: ["topup"] },
] as const;

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
  // The yearly saving follows what the admin types (prices as typed, before saving).
  const [typed, setTyped] = useState(values.prices);
  const saving = (plan: "starter" | "business") => {
    const [m, y] = [birrToMinor(typed[`${plan}_month`] ?? ""), birrToMinor(typed[`${plan}_year`] ?? "")];
    if (m === null || y === null) return "";
    const months = monthsFree(m, y);
    const amount = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(yearlySaving(m, y) / 100);
    return months > 0 ? format(t.settingsYearSaving, { amount, months }) : t.settingsYearNoSaving;
  };
  const [state, action] = useActionState<SettingsState, FormData>(saveBillingSettings, { status: "idle" });
  const msgRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status !== "idle") msgRef.current?.focus();
  }, [state]);
  const bad = (name: string) => state.status === "invalid" && state.field === name;
  const field = (name: string, label: string, value: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string) => (
    <label key={name} className="flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      <input name={name} defaultValue={value} aria-invalid={bad(name) || undefined} aria-describedby={hint ? `${name}-hint` : undefined} className="min-h-11 rounded-lg border border-input bg-white px-3 text-base aria-invalid:border-destructive" {...extra} />
      {hint !== undefined && <span id={`${name}-hint`} className="min-h-5 text-sm font-medium text-ink">{hint}</span>}
    </label>
  );
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="lang" value={lang} />
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-lg font-semibold">{t.settingsPrices}</legend>
        {GROUPS.map((g) => (
          <fieldset key={g.plan ?? "extras"} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2 sm:items-start">
            <legend className="px-1 font-semibold">{g.plan ? tb.plans[g.plan] : tb.topup}</legend>
            {g.fields.map((p) =>
              field(
                `price_${p}`,
                `${productName(tb.productNames, p)} (${t.settingsBirr})`,
                values.prices[p] ?? "",
                { inputMode: "decimal", maxLength: 12, onChange: (e) => setTyped((x) => ({ ...x, [p]: e.target.value })) },
                g.plan && p.endsWith("_year") ? saving(g.plan) : undefined,
              ),
            )}
          </fieldset>
        ))}
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
