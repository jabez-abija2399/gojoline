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
    <button aria-disabled={pending} className="min-h-11 pointer-fine:min-h-8 rounded-lg bg-ink px-3 text-sm font-medium text-white hover:bg-ink-hover aria-disabled:opacity-50">
      {pending ? t.saving : t.save}
    </button>
  );
}

const tone: Record<FeedbackStatus, string> = {
  new: "bg-coral-soft text-ink",
  seen: "border border-line bg-paper text-ink-muted",
  planned: "bg-ink text-white",
  done: "border border-lagoon bg-white text-lagoon",
  wont_do: "border border-line bg-paper text-ink-muted",
};

/**
 * One feedback card in the admin, dense: type, status badge, the status select and Save in one row;
 * the message and details (server-rendered, `children`); the reply folded in a <details>. After a
 * save that kept the card in the list, its status line says Saved (or Nothing changed) and has focus.
 */
export function FeedbackReplyForm({
  t,
  id,
  lang,
  status,
  reply,
  replyRead,
  filters,
  heading,
  date,
  justSaved,
  children,
}: {
  t: Text;
  id: string;
  lang: string;
  status: FeedbackStatus;
  reply: string | null;
  replyRead: boolean;
  filters: { status?: string; type?: string };
  heading: React.ReactNode;
  date: string;
  justSaved: "saved" | "unchanged" | null;
  children: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(saveFeedback, { status: "idle" });
  const errorRef = useRef<HTMLParagraphElement>(null);
  const savedRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status !== "idle") errorRef.current?.focus();
  }, [state]);
  useEffect(() => {
    if (justSaved) savedRef.current?.focus();
  }, [justSaved]);
  const message = state.status === "invalid" ? t.invalid : state.status === "not_found" ? t.notFound : state.status === "forbidden" ? t.forbidden : state.status === "failed" ? t.failed : null;
  const selectId = `fb-status-${id}`;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (pending) e.preventDefault();
      }}
      className="flex flex-col gap-1.5"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="lang" value={lang} />
      {filters.status && <input type="hidden" name="fStatus" value={filters.status} />}
      {filters.type && <input type="hidden" name="fType" value={filters.type} />}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {heading}
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone[status]}`}>{t.status[status]}</span>
        <label htmlFor={selectId} className="sr-only">
          {t.statusLabel}
        </label>
        <select id={selectId} name="status" defaultValue={status} className="min-h-11 pointer-fine:min-h-8 rounded-lg border border-input bg-white px-2 text-base pointer-fine:text-sm">
          {FEEDBACK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.status[s]}
            </option>
          ))}
        </select>
        <Save t={t} />
        {justSaved && (
          <p ref={savedRef} tabIndex={-1} role="status" className="text-sm font-medium text-lagoon">
            {justSaved === "saved" ? t.saved : t.unchanged}
          </p>
        )}
        <span className="ms-auto text-xs text-ink-muted tabular-nums">{date}</span>
      </div>
      {children}
      <details open={!!reply || status === "new"} className="group">
        <summary className="flex min-h-11 pointer-fine:min-h-7 w-fit cursor-pointer items-center gap-2 text-sm font-medium">
          {reply ? t.replySent : t.replyLabel}
          {reply && <span className="text-xs font-normal text-ink-muted">· {replyRead ? t.replyRead : t.replyUnread}</span>}
        </summary>
        <div className="flex flex-col gap-1 pt-0.5">
          <label htmlFor={`fb-reply-${id}`} className="sr-only">
            {t.replyLabel}
          </label>
          <textarea id={`fb-reply-${id}`} name="reply" rows={2} maxLength={REPLY_MAX} defaultValue={reply ?? ""} aria-describedby={`fb-reply-hint-${id}`} className="rounded-lg border border-input bg-white px-3 py-1.5 text-base pointer-fine:text-sm" />
          <p id={`fb-reply-hint-${id}`} className="sr-only">
            {t.replyHint}
          </p>
        </div>
      </details>
      {message && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="text-destructive">
          {message}
        </p>
      )}
    </form>
  );
}
