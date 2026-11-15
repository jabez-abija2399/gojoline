"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { Messages } from "@/lib/i18n";
import { moderateSite, type ModerateState } from "@/app/[lang]/admin/actions";

type Op = "take_down" | "retry" | "dismiss" | "restore";

function Buttons({ t, ops }: { t: Messages["admin"]; ops: Op[] }) {
  const { pending, data } = useFormStatus();
  const sent = data?.get("op");
  const label: Record<Op, string> = { take_down: t.takeDown, retry: t.retryTakeDown, dismiss: t.dismiss, restore: t.restore };
  return (
    <div className="flex flex-wrap gap-2">
      {ops.map((op) => {
        const value = op === "retry" ? "take_down" : op;
        return (
          <button
            key={op}
            name="op"
            value={value}
            aria-disabled={pending}
            onClick={(e) => {
              if (pending || (op === "take_down" && !window.confirm(t.takeDownConfirm))) e.preventDefault();
            }}
            className={`min-h-11 rounded-lg px-4 font-medium aria-disabled:opacity-50 ${op === "take_down" ? "border border-destructive text-destructive hover:bg-coral-soft" : "border border-line hover:border-faint"}`}
          >
            {pending && sent === value ? t.working : label[op]}
          </button>
        );
      })}
    </div>
  );
}

/** Moderation buttons for one site. Taking down asks for confirmation and a reason. */
export function ModerateForm({ t, siteId, lang, tab, ops, reason }: { t: Messages["admin"]; siteId: string; lang: string; tab: "reports" | "sites"; ops: Op[]; reason?: string }) {
  const [state, action] = useActionState<ModerateState, FormData>(moderateSite, { status: "idle" });
  const reasonRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status === "reason_required") reasonRef.current?.focus();
    else if (state.status !== "idle") errorRef.current?.focus();
  }, [state]);
  const needsReason = ops.includes("take_down");
  const errorId = `reason-error-${siteId}`;

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="tab" value={tab} />
      {needsReason ? (
        <label className="flex flex-col gap-1">
          <span className="font-medium">{t.takeDownReason}</span>
          <input
            ref={reasonRef}
            name="reason"
            maxLength={300}
            aria-invalid={state.status === "reason_required" || undefined}
            aria-describedby={state.status === "reason_required" ? errorId : undefined}
            className="min-h-11 rounded-lg border border-input px-3 text-base aria-invalid:border-destructive"
          />
        </label>
      ) : (
        reason && <input type="hidden" name="reason" value={reason} />
      )}
      {state.status === "reason_required" && <p id={errorId} role="alert" className="text-destructive">{t.reasonRequired}</p>}
      <Buttons t={t} ops={ops} />
      {state.status !== "idle" && state.status !== "reason_required" && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="text-destructive">
          {state.status === "forbidden" ? t.forbidden : t.failed}
        </p>
      )}
    </form>
  );
}
