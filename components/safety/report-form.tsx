"use client";

import { useEffect, useRef, useState } from "react";
import type { Messages } from "@/lib/i18n";

const REASONS = ["phishing", "scam", "impersonation", "adult", "illegal_goods", "violence_hate", "copyright", "other"] as const;
type State = { kind: "idle" | "sending" | "sent" } | { kind: "error"; code: string };

export function ReportForm({ t, site, home }: { t: Messages["safety"]; site: string; home: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const siteRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLFieldSetElement>(null);
  const sentRef = useRef<HTMLParagraphElement>(null);
  const code = state.kind === "error" ? state.code : null;
  const message = code ? ((t.errors as Record<string, string>)[code] ?? t.errors.failed) : null;

  useEffect(() => {
    if (state.kind === "sent") sentRef.current?.focus();
    if (code === "site") siteRef.current?.focus();
    if (code === "reason") reasonRef.current?.querySelector("input")?.focus();
  }, [state, code]);

  if (state.kind === "sent")
    return (
      <div className="flex flex-col items-start gap-4">
        <p ref={sentRef} tabIndex={-1} role="status" className="w-full rounded-lg border border-lagoon bg-white px-4 py-3 text-lg font-medium text-lagoon">
          {t.sent}
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setState({ kind: "idle" })} className="min-h-11 rounded-lg border border-line px-4 font-medium hover:border-faint">
            {t.reportAnother}
          </button>
          <a href={home} className="inline-flex min-h-11 items-center rounded-lg px-4 font-medium text-ink underline underline-offset-4">
            {t.backHome}
          </a>
        </div>
      </div>
    );

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (!data.site?.trim()) return setState({ kind: "error", code: "site" });
    if (!data.reason) return setState({ kind: "error", code: "reason" });
    setState({ kind: "sending" });
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setState(res?.ok ? { kind: "sent" } : { kind: "error", code: typeof d.error === "string" ? d.error : "failed" });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="report-site" className="font-medium">{t.siteLabel}</label>
        <input
          ref={siteRef}
          id="report-site"
          name="site"
          defaultValue={site}
          maxLength={300}
          autoComplete="off"
          aria-describedby={code === "site" ? "report-site-hint report-site-error" : "report-site-hint"}
          aria-invalid={code === "site" || undefined}
          className="min-h-11 rounded-lg border border-input px-3 text-base aria-invalid:border-destructive"
        />
        <p id="report-site-hint" className="text-ink-muted">{t.siteHint}</p>
        {code === "site" && <p id="report-site-error" role="alert" className="text-destructive">{message}</p>}
      </div>
      <fieldset ref={reasonRef} aria-describedby={code === "reason" ? "report-reason-error" : undefined} className="flex flex-col gap-1">
        <legend className="mb-1 font-medium">{t.reasonLabel}</legend>
        {REASONS.map((r) => (
          <label key={r} className="flex min-h-11 items-center gap-3">
            <input type="radio" name="reason" value={r} className="size-5 shrink-0 accent-ink" />
            {t.reasons[r]}
          </label>
        ))}
        {code === "reason" && <p id="report-reason-error" role="alert" className="text-destructive">{message}</p>}
      </fieldset>
      <div className="flex flex-col gap-1">
        <label htmlFor="report-details" className="font-medium">{t.detailsLabel}</label>
        <textarea id="report-details" name="details" rows={4} maxLength={2000} className="rounded-lg border border-input px-3 py-2 text-base" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="report-contact" className="font-medium">{t.contactLabel}</label>
        <input id="report-contact" name="contact" maxLength={200} autoComplete="email" className="min-h-11 rounded-lg border border-input px-3 text-base" />
      </div>
      {code && code !== "site" && code !== "reason" && <p role="alert" className="rounded-lg bg-coral-soft px-4 py-3 text-destructive">{message}</p>}
      <button type="submit" aria-disabled={state.kind === "sending"} className="min-h-12 rounded-lg bg-coral px-5 font-medium text-on-coral hover:bg-coral-hover aria-disabled:opacity-50">
        {state.kind === "sending" ? t.sending : t.submit}
      </button>
    </form>
  );
}
