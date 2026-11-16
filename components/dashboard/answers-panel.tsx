"use client";

import { useEffect, useState } from "react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

interface Answer {
  id: string;
  formKey: string;
  kind: string;
  data: Record<string, string>;
  readAt: string | null;
  createdAt: string;
}

export function AnswersPanel({ t, locale, projectId }: { t: Messages["dashboard"]; locale: Locale; projectId: string }) {
  const [rows, setRows] = useState<Answer[] | null>(null);
  const [forms, setForms] = useState<Record<string, { heading: Record<string, string>; labels: Record<string, Record<string, string>> }>>({});
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/submissions`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d: { submissions: Answer[]; forms?: typeof forms }) => {
        if (cancelled) return;
        setRows(d.submissions);
        setForms(d.forms ?? {});
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [projectId, attempt]);

  const markRead = async () => {
    const ids = (rows ?? []).filter((r) => !r.readAt).map((r) => r.id);
    if (!ids.length) return;
    const res = await fetch(`/api/projects/${projectId}/submissions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    if (res.ok) setRows((rs) => (rs ?? []).map((r) => ({ ...r, readAt: r.readAt ?? new Date().toISOString() })));
  };

  if (error)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-line bg-white p-6">
        <p>{t.loadError}</p>
        <button type="button" onClick={() => { setError(false); setAttempt((a) => a + 1); }} className="min-h-11 rounded-lg border border-line px-4 font-medium text-sm lg:min-h-9">{t.retry}</button>
      </div>
    );
  if (rows === null)
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">{t.loading}</span>
        {[0, 1, 2].map((i) => <div key={i} aria-hidden="true" className="h-24 animate-pulse rounded-xl bg-line" />)}
      </div>
    );
  if (rows.length === 0) return <p className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-ink-muted">{t.answersEmpty}</p>;

  const fmt = new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const unread = rows.filter((r) => !r.readAt).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        {unread > 0 && (
          <button type="button" onClick={markRead} className="min-h-11 rounded-lg border border-line bg-white px-4 font-medium hover:border-faint text-sm lg:min-h-9">{t.answersMarkRead}</button>
        )}
        <a href={`/api/projects/${projectId}/submissions/export`} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 font-medium hover:border-faint text-sm lg:min-h-9">
          {t.answersExport}
        </a>
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{forms[r.formKey]?.heading[locale] || forms[r.formKey]?.heading.en || forms[r.formKey]?.heading.am || r.formKey}</span>
              {!r.readAt && <span className="rounded-full bg-coral-soft px-2 py-0.5 font-medium text-ink">{t.answersNew}</span>}
              <span className="ms-auto text-ink-muted">{fmt.format(new Date(r.createdAt))}</span>
            </div>
            <dl className="mt-2 grid min-w-0 gap-x-4 gap-y-1 sm:grid-cols-[max-content_1fr]">
              {Object.entries(r.data).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-medium text-ink-muted">{forms[r.formKey]?.labels[k]?.[locale] || forms[r.formKey]?.labels[k]?.en || k}</dt>
                  <dd className="min-w-0 [overflow-wrap:anywhere]">
                    {/^[+\d][\d\s\-()]{5,20}$/.test(v) ? (
                      <a className="inline-flex min-h-11 items-center text-ink underline underline-offset-4 text-sm lg:min-h-9" href={`tel:${v.replace(/[^\d+]/g, "")}`}>{v}</a>
                    ) : (
                      v
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
