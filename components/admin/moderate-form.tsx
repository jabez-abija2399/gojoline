"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Messages } from "@/lib/i18n";
import { moderateSite, type ModerateState } from "@/app/[lang]/admin/actions";

type Op = "take_down" | "dismiss" | "restore";

/** Moderation buttons for one site. Taking down asks for confirmation and a reason. */
export function ModerateForm({ t, siteId, lang, ops }: { t: Messages["admin"]; siteId: string; lang: string; ops: Op[] }) {
  const [state, action, pending] = useActionState<ModerateState, FormData>(moderateSite, { status: "idle" });
  const statusRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);
  const message = state.status === "idle" ? null : state.status === "ok" ? t.done : state.status === "deploy_failed" ? t.deployFailed : state.status === "forbidden" ? t.forbidden : t.failed;
  const label: Record<Op, string> = { take_down: t.takeDown, dismiss: t.dismiss, restore: t.restore };

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="lang" value={lang} />
      {ops.includes("take_down") && (
        <label className="flex flex-col gap-1">
          <span className="font-medium">{t.takeDownReason}</span>
          <input name="reason" maxLength={300} className="min-h-11 rounded-lg border border-input px-3 text-base" />
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {ops.map((op) => (
          <button
            key={op}
            name="op"
            value={op}
            aria-disabled={pending}
            onClick={(e) => {
              if (pending || (op === "take_down" && !window.confirm(t.takeDownConfirm))) e.preventDefault();
            }}
            className={`min-h-11 rounded-lg px-4 font-medium aria-disabled:opacity-50 ${op === "take_down" ? "bg-destructive text-white hover:opacity-90" : "border border-line hover:border-teal-mid"}`}
          >
            {pending ? t.working : label[op]}
          </button>
        ))}
      </div>
      {message && (
        <p ref={statusRef} tabIndex={-1} role={state.status === "ok" ? "status" : "alert"} className={state.status === "ok" ? "font-medium text-teal" : "text-destructive"}>
          {message}
        </p>
      )}
    </form>
  );
}
