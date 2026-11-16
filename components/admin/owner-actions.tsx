"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { Messages } from "@/lib/i18n";
import { grantCredits, setOwnerPlan, type UserActionState } from "@/app/[lang]/admin/actions";

const PLAN_CHOICES = ["starter_month", "starter_year", "business_month", "business_year", "free"] as const;

function Submit({ label, t }: { label: string; t: Messages["admin"] }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" aria-disabled={pending} onClick={(e) => pending && e.preventDefault()} className="min-h-11 w-fit rounded-lg bg-ink px-4 font-medium text-white hover:bg-ink-hover aria-disabled:opacity-50 lg:min-h-9">
      {pending ? t.working : label}
    </button>
  );
}

function useResult(state: UserActionState, t: Messages["admin"], done: string) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status !== "idle") ref.current?.focus();
  }, [state]);
  const text =
    state.status === "ok" ? done
    : state.status === "reason_required" ? t.reasonTooShort
    : state.status === "invalid" ? t.ownerInvalid
    : state.status === "not_found" ? t.ownerNotFound
    : state.status === "forbidden" ? t.forbidden
    : state.status === "failed" ? t.failed
    : null;
  const node = text && (
    <p ref={ref} tabIndex={-1} role={state.status === "ok" ? "status" : "alert"} className={state.status === "ok" ? "font-medium text-lagoon" : "text-destructive"}>
      {text}
    </p>
  );
  return node;
}

const field = "min-h-11 rounded-lg border border-input bg-white px-3 text-base aria-invalid:border-destructive";

/** Two admin actions on one owner: extra changes, and a plan change for comps or corrections. */
export function OwnerActions({ t, userId, lang }: { t: Messages["admin"]; userId: string; lang: string }) {
  const [grant, grantAction] = useActionState<UserActionState, FormData>(grantCredits, { status: "idle" });
  const [plan, planAction] = useActionState<UserActionState, FormData>(setOwnerPlan, { status: "idle" });
  // One-time key per grant: a double submit or retried request grants once; a new key after each success.
  // A new key after every answer; while a grant is in flight the key stays the same.
  const grantKey = useMemo(() => (grant, crypto.randomUUID()), [grant]);
  const grantMsg = useResult(grant, t, t.grantDone);
  const planMsg = useResult(plan, t, t.planDone);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form action={grantAction} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line p-4">
        <h4 className="font-semibold">{t.grantTitle}</h4>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="key" value={grantKey} />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t.grantN}</span>
          <input name="n" type="number" inputMode="numeric" min={1} max={500} step={1} required defaultValue={10} aria-invalid={grant.status === "invalid" || undefined} className={`${field} w-32`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t.grantReason}</span>
          <input name="reason" required minLength={3} maxLength={200} aria-invalid={grant.status === "reason_required" || undefined} className={field} />
        </label>
        {grantMsg}
        <Submit label={t.grantSubmit} t={t} />
      </form>
      <form
        action={planAction}
        onSubmit={(e) => {
          const choice = new FormData(e.currentTarget).get("plan");
          if (choice === "free" && !window.confirm(t.planFreeConfirm)) e.preventDefault();
        }}
        className="flex min-w-0 flex-col gap-3 rounded-xl border border-line p-4"
      >
        <h4 className="font-semibold">{t.planTitle}</h4>
        <p className="text-sm text-ink-muted">{t.planHint}</p>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="lang" value={lang} />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t.planChoice}</span>
          <select name="plan" defaultValue="starter_month" className={`${field} w-full min-w-0`}>
            {PLAN_CHOICES.map((p) => (
              <option key={p} value={p}>{t.planOptions[p]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t.planReason}</span>
          <input name="reason" required minLength={3} maxLength={200} aria-invalid={plan.status === "reason_required" || undefined} className={field} />
        </label>
        {planMsg}
        <Submit label={t.planSubmit} t={t} />
      </form>
    </div>
  );
}
