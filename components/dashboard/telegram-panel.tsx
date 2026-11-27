"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/format";

type Status = { linked: boolean; username: string | null } | "error" | null;

/** What the owner's plan includes: alerts (telegramNotify) and bot edits (telegramEdits). */
export interface TelegramPlan {
  alerts: boolean;
  edits: boolean;
  /** The plans that include alerts, as words ("Starter and Business"). */
  plans: string;
  upgradeHref: string;
}

/**
 * Telegram alerts. On a plan without them (Free) the feature shows what it would do and an
 * Upgrade link instead of a Connect button; a link made earlier stays, so alerts start again
 * after an upgrade without reconnecting.
 */
export function TelegramPanel({ t, locale, bot, plan }: { t: Messages["dashboard"]; locale: Locale; bot: string; plan: TelegramPlan }) {
  const [status, setStatus] = useState<Status>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await fetch("/api/telegram/link")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .catch(() => "error" as const);
    setStatus(d);
    return d;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/telegram/link")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d) => !cancelled && setStatus(d))
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  // After the owner opens Telegram, check now and then until the link shows up.
  useEffect(() => {
    if (!url || (status && status !== "error" && status.linked)) return;
    const id = setInterval(() => void load(), 3000);
    return () => clearInterval(id);
  }, [url, status, load]);

  const connect = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/telegram/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale }) }).catch(() => null);
    const d = res?.ok ? await res.json() : null;
    setBusy(false);
    if (!d?.url) return setError(t.tgUnavailable);
    setUrl(d.url);
    window.open(d.url, "_blank", "noopener,noreferrer");
  };

  const disconnect = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/telegram/link", { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setError(t.tgDisconnectFailed);
    setUrl(null);
    await load();
  };

  const upgrade = (
    <Link href={plan.upgradeHref} className="inline-flex min-h-11 w-fit items-center rounded-lg bg-coral px-4 text-sm font-semibold text-on-coral hover:bg-coral-hover lg:min-h-9">
      {t.tgUpgrade}
    </Link>
  );

  if (status === null)
    return (
      <div role="status">
        <span className="sr-only">{t.loading}</span>
        <div aria-hidden="true" className="h-40 animate-pulse rounded-xl bg-line" />
      </div>
    );

  return (
    <section aria-labelledby="tg-title" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id="tg-title" className="text-base font-semibold">{t.tgTitle}</h2>
        {!plan.alerts && <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-semibold text-ink-muted">{format(t.tgPaidOnly, { plans: plan.plans })}</span>}
      </div>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {status === "error" ? (
        <>
          <p role="alert">{t.tgUnavailable}</p>
          <button type="button" onClick={() => void load()} className="min-h-11 w-fit rounded-lg border border-line px-4 font-medium hover:border-faint text-sm lg:min-h-9">{t.tgRetry}</button>
        </>
      ) : status.linked ? (
        <>
          <p role="status" className="font-medium text-ink">{format(t.tgConnected, { who: status.username ? ` (@${status.username})` : "" })}</p>
          {!plan.alerts && (
            <>
              <p className="text-ink-muted">{t.tgPaused}</p>
              {upgrade}
            </>
          )}
          <button type="button" onClick={disconnect} aria-disabled={busy} className="min-h-11 w-fit rounded-lg border border-line px-4 font-medium hover:border-faint aria-disabled:opacity-50 text-sm lg:min-h-9">{busy ? t.tgDisconnecting : t.tgDisconnect}</button>
        </>
      ) : !plan.alerts && !plan.edits ? (
        <>
          <p className="text-ink-muted">{format(t.tgFreeBody, { messages: t.tabMessages })}</p>
          {upgrade}
        </>
      ) : (
        <>
          <p className="text-ink-muted">
            {t.tgBody}
            {plan.edits && ` ${t.tgBodyEdits}`}
          </p>
          <button type="button" onClick={connect} aria-disabled={busy} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-ink px-4 font-medium text-white hover:bg-ink-hover aria-disabled:opacity-50 text-sm lg:min-h-9">
            <Send aria-hidden="true" className="size-4" /> {busy ? t.tgOpening : t.tgConnect}
          </button>
          {url && (
            <p role="status" className="text-ink-muted">
              {format(t.tgOpenHint, { bot })}{" "}
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4 lg:min-h-9">
                {t.tgOpenLink}
              </a>
            </p>
          )}
        </>
      )}
    </section>
  );
}
