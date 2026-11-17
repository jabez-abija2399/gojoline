"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { Messages } from "@/lib/i18n";
import { saveFeedback, type FeedbackState } from "@/app/[lang]/admin/actions";
import { FEEDBACK_STATUSES, REPLY_MAX, type FeedbackStatus } from "@/lib/feedback/types";

type Text = Messages["feedback"]["admin"];

function Save({ t }: { t: Text }) {
  const { pending } = useFormStatus();
  return (
    <button aria-disabled={pending} className="min-h-11 pointer-fine:min-h-9 rounded-lg bg-ink px-4 font-medium text-white hover:bg-ink-hover aria-disabled:opacity-50 sm:w-fit">
      {pending ? t.saving : t.save}
    </button>
  );
}

/** Status and reply for one feedback item. Saving goes back to the same filters with the outcome on top. */
export function FeedbackReplyForm({ t, id, lang, status, reply, replyRead, filters }: { t: Text; id: string; lang: string; status: FeedbackStatus; reply: string | null; replyRead: boolean; filters: { status?: string; type?: string } }) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(saveFeedback, { status: "idle" });
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status !== "idle") errorRef.current?.focus();
  }, [state]);
  const message = state.status === "invalid" ? t.invalid : state.status === "not_found" ? t.notFound : state.status === "forbidden" ? t.forbidden : state.status === "failed" ? t.failed : null;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (pending) e.preventDefault();
      }}
      className="flex flex-col gap-3 border-t border-line pt-3"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="lang" value={lang} />
      {filters.status && <input type="hidden" name="fStatus" value={filters.status} />}
      {filters.type && <input type="hidden" name="fType" value={filters.type} />}
      <label className="flex flex-col gap-1 sm:max-w-xs">
        <span className="font-medium">{t.statusLabel}</span>
        <select name="status" defaultValue={status} className="min-h-11 pointer-fine:min-h-9 rounded-lg border border-input bg-white px-3 text-base pointer-fine:text-sm">
          {FEEDBACK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.status[s]}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-1">
        <label htmlFor={`fb-reply-${id}`} className="font-medium">{t.replyLabel}</label>
        <textarea id={`fb-reply-${id}`} name="reply" rows={3} maxLength={REPLY_MAX} defaultValue={reply ?? ""} aria-describedby={`fb-reply-hint-${id}`} className="rounded-lg border border-input bg-white px-3 py-2 text-base pointer-fine:text-sm" />
        <p id={`fb-reply-hint-${id}`} className="text-xs text-ink-muted">
          {t.replyHint}
          {reply && <> · {replyRead ? t.replyRead : t.replyUnread}</>}
        </p>
      </div>
      <Save t={t} />
      {message && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="text-destructive">
          {message}
        </p>
      )}
    </form>
  );
}
