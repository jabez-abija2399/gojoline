"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, CornerUpLeft, Download, MessageCircle, MessageSquare, MoreHorizontal, Phone, RotateCcw, Send, Trash2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/format";
import { MESSAGE_STATUSES, nextStatus, type MessageStatus } from "@/lib/dashboard/message-status";
import { phoneLinks } from "@/lib/dashboard/phone";
import { Confirm } from "./dialog";

interface Message {
  id: string;
  formKey: string;
  data: Record<string, string>;
  status: MessageStatus;
  createdAt: string;
}
type Forms = Record<string, { heading: Record<string, string>; labels: Record<string, Record<string, string>> }>;
type Filter = MessageStatus | "all";

const chip = "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors lg:min-h-9";
const action = "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink hover:border-faint hover:bg-sunken";

/** Messages from the site's forms: New → Replied → Done, with one-tap ways to answer. */
export function MessagesPanel({ t, locale, projectId }: { t: Messages["dashboard"]; locale: Locale; projectId: string }) {
  const [rows, setRows] = useState<Message[] | null>(null);
  const [forms, setForms] = useState<Forms>({});
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [form, setForm] = useState("all");
  const [note, setNote] = useState<{ text: string; alert?: boolean } | null>(null);
  const [deleting, setDeleting] = useState<{ m: Message; list: Message[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/submissions`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d: { submissions: Message[]; forms?: Forms }) => {
        if (cancelled) return;
        setRows(d.submissions);
        setForms(d.forms ?? {});
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [projectId, attempt]);

  const heading = (key: string) => forms[key]?.heading[locale] || forms[key]?.heading.en || forms[key]?.heading.am || key;
  const label = (key: string, field: string) => forms[key]?.labels[field]?.[locale] || forms[key]?.labels[field]?.en || field;
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, new: 0, replied: 0, done: 0 };
    for (const r of rows ?? []) if (form === "all" || r.formKey === form) {
      c.all++;
      c[r.status]++;
    }
    return c;
  }, [rows, form]);
  const formKeys = useMemo(() => [...new Set((rows ?? []).map((r) => r.formKey))], [rows]);

  /** After a change, keyboard and screen-reader users land on the next message (or the list). */
  const focusAfter = (id: string, list: Message[]) => {
    const i = list.findIndex((r) => r.id === id);
    const next = list[i + 1] ?? null;
    requestAnimationFrame(() => (next ? document.getElementById(`msg-${next.id}`) : headingRef.current)?.focus());
  };

  const move = async (m: Message, status: MessageStatus, list: Message[]) => {
    setNote(null);
    const res = await fetch(`/api/projects/${projectId}/submissions`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [m.id], status }) }).catch(() => null);
    if (!res?.ok) return setNote({ text: t.statusFailed, alert: true });
    setRows((rs) => (rs ?? []).map((r) => (r.id === m.id ? { ...r, status } : r)));
    setNote({ text: format(t.statusSaved, { status: t.status[status] }) });
    focusAfter(m.id, list);
  };

  const remove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}/submissions`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleting.m.id }) }).catch(() => null);
    setBusy(false);
    setDeleting(null);
    if (!res?.ok) return setNote({ text: t.statusFailed, alert: true });
    setRows((rs) => (rs ?? []).filter((r) => r.id !== deleting.m.id));
    setNote({ text: t.deleted });
    focusAfter(deleting.m.id, deleting.list);
  };

  if (error)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-white p-6">
        <p>{t.loadError}</p>
        <button type="button" onClick={() => { setError(false); setAttempt((a) => a + 1); }} className={action}>{t.retry}</button>
      </div>
    );
  if (rows === null)
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">{t.loading}</span>
        {[0, 1, 2].map((i) => <div key={i} aria-hidden="true" className="h-32 animate-pulse rounded-2xl bg-line" />)}
      </div>
    );
  if (rows.length === 0)
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line bg-white p-6">
        <MessageSquare aria-hidden="true" className="size-8 text-faint" />
        <p className="text-ink-muted">{t.messagesEmpty}</p>
        <Link href={`/${locale}/dashboard/${projectId}?tab=home`} className={action}>{t.messagesShareCta}</Link>
      </div>
    );

  const fmt = new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const shown = rows.filter((r) => (filter === "all" || r.status === filter) && (form === "all" || r.formKey === form));

  return (
    <div className="flex flex-col gap-4">
      <h2 ref={headingRef} tabIndex={-1} className="sr-only">{t.messagesLabel}</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label={t.filterLabel} className="flex flex-wrap gap-2">
          {(["all", ...MESSAGE_STATUSES] as Filter[]).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`${chip} ${filter === f ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:bg-sunken"}`}>
              {f === "all" ? t.filterAll : t.status[f]}
              <span className="tabular-nums opacity-80">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {formKeys.length > 1 && (
            <label className="flex items-center gap-2 text-sm font-medium">
              {t.filterForm}
              <select value={form} onChange={(e) => setForm(e.target.value)} className="min-h-11 rounded-lg border border-line bg-white px-3 text-base lg:min-h-9 lg:text-sm">
                <option value="all">{t.allForms}</option>
                {formKeys.map((k) => <option key={k} value={k}>{heading(k)}</option>)}
              </select>
            </label>
          )}
          <a href={`/api/projects/${projectId}/submissions/export`} className={action}>
            <Download aria-hidden="true" className="size-4" />
            {t.answersExport}
          </a>
        </div>
      </div>
      <p role={note?.alert ? "alert" : "status"} className={note?.alert ? "text-danger" : "text-ink-muted"}>{note?.text}</p>
      {shown.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line bg-white p-6">
          <p className="text-ink-muted">{t.filterEmpty}</p>
          <button type="button" onClick={() => { setFilter("all"); setForm("all"); }} className={action}>{t.showAll}</button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((m) => {
            const name = Object.values(m.data).find((v) => v.trim() && !phoneLinks(v)) ?? heading(m.formKey);
            const next = nextStatus(m.status);
            const NextIcon = m.status === "new" ? CornerUpLeft : m.status === "replied" ? Check : RotateCcw;
            const phone = Object.values(m.data).map((v) => phoneLinks(v)).find(Boolean) ?? null;
            // Telegram by phone number often fails quietly (privacy settings): only a real username gets a button.
            const tgUser = Object.entries(m.data).map(([k, v]) => (/telegram/i.test(k) || /^@\w/.test(v.trim()) ? v.trim().replace(/^@|^https?:\/\/t\.me\//i, "") : "")).find((v) => /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v));
            return (
              <li key={m.id} className={`flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 ${m.status === "new" ? "border-s-4 border-s-coral" : ""}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 id={`msg-${m.id}`} tabIndex={-1} className="font-semibold focus:outline-none focus-visible:underline">{heading(m.formKey)}</h3>
                  <StatusBadge status={m.status} t={t} />
                  <time dateTime={m.createdAt} className="ms-auto text-sm text-ink-muted">{fmt.format(new Date(m.createdAt))}</time>
                  <details className="relative -me-2">
                    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink-muted hover:bg-sunken [&::-webkit-details-marker]:hidden">
                      <MoreHorizontal aria-hidden="true" className="size-4" />
                      {t.more}
                    </summary>
                    <div className="absolute end-0 z-10 mt-1 rounded-xl border border-line bg-white p-1 shadow-lg">
                      <button type="button" onClick={() => setDeleting({ m, list: shown })} aria-label={format(t.deleteNamed, { name })} className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium text-danger hover:bg-coral-soft">
                        <Trash2 aria-hidden="true" className="size-4" />
                        {t.delete}
                      </button>
                    </div>
                  </details>
                </div>
                <dl className="grid min-w-0 gap-x-4 gap-y-1 sm:grid-cols-[max-content_1fr]">
                  {Object.entries(m.data).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-sm font-medium text-ink-muted sm:text-base">{label(m.formKey, k)}</dt>
                      <dd className="min-w-0 [overflow-wrap:anywhere]">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div role="group" aria-label={format(t.replyTo, { name })} className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  {phone && (
                    <a href={phone.tel} className={action}>
                      <Phone aria-hidden="true" className="size-4" />
                      {t.call}
                    </a>
                  )}
                  <button type="button" onClick={() => void move(m, next, shown)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-hover">
                    <NextIcon aria-hidden="true" className="size-4" />
                    {m.status === "new" ? t.markReplied : m.status === "replied" ? t.markDone : t.reopen}
                  </button>
                  {(phone || tgUser) && (
                    <details className="group w-full">
                      <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-ink underline underline-offset-4">{t.otherWays}</summary>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {phone && <a href={phone.sms} className={action}><MessageSquare aria-hidden="true" className="size-4" />{t.sms}</a>}
                        {phone?.whatsapp && <a href={phone.whatsapp} target="_blank" rel="noopener noreferrer" className={action}><MessageCircle aria-hidden="true" className="size-4" />{t.whatsapp}<span className="sr-only">{t.newTab}</span></a>}
                        {tgUser && <a href={`https://t.me/${tgUser}`} target="_blank" rel="noopener noreferrer" className={action}><Send aria-hidden="true" className="size-4" />{t.telegram}<span className="sr-only">{t.newTab}</span></a>}
                      </div>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Confirm open={deleting !== null} onClose={() => setDeleting(null)} onConfirm={() => void remove()} title={t.deleteTitle} body={t.deleteBody} confirmLabel={t.deleteConfirm} cancelLabel={t.cancel} closeLabel={t.close} danger busy={busy} labelId="dash-delete-title" />
    </div>
  );
}

function StatusBadge({ status, t }: { status: MessageStatus; t: Messages["dashboard"] }) {
  const style = status === "new" ? "bg-coral-soft text-ink" : status === "replied" ? "border border-line bg-sunken text-ink" : "border border-line text-ink-muted";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>
      {status === "done" && <Check aria-hidden="true" className="size-3" />}
      {t.status[status]}
    </span>
  );
}
