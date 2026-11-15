"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { Messages } from "@/lib/i18n";
import { reviewPayment, type ReviewState } from "@/app/[lang]/admin/actions";

function Buttons({ t }: { t: Messages["admin"] }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex gap-2">
      <button name="decision" value="approve" aria-disabled={pending} className="min-h-11 flex-1 rounded-lg bg-ink px-4 font-medium text-white hover:bg-ink-hover aria-disabled:opacity-50 sm:flex-none">
        {pending ? t.working : t.approve}
      </button>
      <button
        name="decision"
        value="reject"
        aria-disabled={pending}
        onClick={(e) => {
          if (pending || !window.confirm(t.rejectConfirm)) e.preventDefault();
        }}
        className="min-h-11 flex-1 rounded-lg border border-line px-4 font-medium text-destructive hover:bg-coral-soft aria-disabled:opacity-50 sm:flex-none"
      >
        {t.reject}
      </button>
    </div>
  );
}

export function ReviewForm({ t, id, lang }: { t: Messages["admin"]; id: string; lang: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(reviewPayment, { status: "idle" });
  const statusRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);
  const message =
    state.status === "ok" ? t.done : state.status === "already_reviewed" ? t.alreadyReviewed : state.status === "forbidden" ? t.forbidden : state.status === "idle" ? null : t.failed;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (pending) e.preventDefault();
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="lang" value={lang} />
      <label className="flex flex-1 flex-col gap-1">
        <span className="font-medium">{t.note}</span>
        <input name="note" maxLength={300} className="min-h-11 rounded-lg border border-input px-3 text-base" />
      </label>
      <Buttons t={t} />
      {message && (
        <p ref={statusRef} tabIndex={-1} role={state.status === "ok" ? "status" : "alert"} className={state.status === "ok" ? "font-medium text-ink" : "text-destructive"}>
          {message}
        </p>
      )}
    </form>
  );
}
