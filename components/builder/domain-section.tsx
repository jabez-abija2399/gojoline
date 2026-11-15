"use client";

import { useEffect, useState } from "react";
import type { Messages } from "@/lib/i18n";

type Status = { status: "active" | "pending"; records: { type: string; name: string; value: string }[] };

export function DomainSection({ t, projectId }: { t: Messages["builder"]; projectId: string }) {
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/domain`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("domain"))))
      .then((d: { entitled: boolean; domain?: string; status?: Status }) => {
        if (cancelled) return;
        setEntitled(d.entitled);
        if (d.domain) setDomain(d.domain);
        if (d.status) setStatus(d.status);
      })
      .catch(() => !cancelled && setLoadFailed(true));
    return () => {
      cancelled = true;
    };
  }, [projectId, attempt]);

  if (loadFailed) {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 border-t border-line pt-4 text-ink-muted">
        <p>{t.loadError}</p>
        <button type="button" onClick={() => { setLoadFailed(false); setAttempt((a) => a + 1); }} className="min-h-11 rounded-lg border border-line px-4 font-medium text-ink">
          {t.retry}
        </button>
      </div>
    );
  }
  if (entitled === null) return <div aria-hidden="true" className="h-12 animate-pulse rounded-lg bg-line" />;

  const submit = async (method: "GET" | "POST") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/domain`, method === "POST" ? { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain }) } : undefined);
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setError((t.domainErrors as Record<string, string>)[d.error] ?? t.domainErrors.failed);
      else if (d.status) setStatus(d.status);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="domain-title" className="flex flex-col gap-3 border-t border-line pt-4">
      <h3 id="domain-title" className="text-lg font-bold">{t.domainTitle}</h3>
      {!entitled ? (
        <p className="text-ink-muted">{t.domainPaid}</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label htmlFor="domain-input" className="font-medium">{t.domainLabel}</label>
              <input
                id="domain-input"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="selamcoffee.com"
                autoCapitalize="none"
                spellCheck={false}
                className="min-h-11 rounded-lg border border-input px-3 text-base"
              />
            </div>
            <button type="button" disabled={busy || !domain} onClick={() => submit("POST")} className="min-h-11 rounded-lg border border-line px-4 font-medium hover:border-teal-mid disabled:opacity-50">
              {busy ? t.domainChecking : t.domainConnect}
            </button>
          </div>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          {status && (
            <div role="status" className="flex flex-col gap-2">
              <p className={status.status === "active" ? "font-medium text-teal" : "text-ink-muted"}>{status.status === "active" ? t.domainActive : t.domainPending}</p>
              {status.status === "pending" && (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr><th className="py-1 pe-3">{t.domainRecordType}</th><th className="py-1 pe-3">{t.domainRecordName}</th><th className="py-1">{t.domainRecordValue}</th></tr>
                      </thead>
                      <tbody>
                        {status.records.map((r) => (
                          <tr key={`${r.type}-${r.name}`} className="border-t border-line">
                            <td className="py-1 pe-3 font-mono">{r.type}</td>
                            <td className="py-1 pe-3 font-mono break-all">{r.name}</td>
                            <td className="py-1 font-mono break-all">{r.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" disabled={busy} onClick={() => submit("GET")} className="min-h-11 self-start rounded-lg border border-line px-4 font-medium hover:border-teal-mid disabled:opacity-50">
                    {busy ? t.domainChecking : t.domainCheck}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
