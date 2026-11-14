"use client";

import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type Status = { linked: boolean; username: string | null } | "error" | null;

export function TelegramPanel({ t, locale, bot }: { t: Messages["dashboard"]; locale: Locale; bot: string }) {
  const [status, setStatus] = useState<Status>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    const res = await fetch("/api/telegram/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale }) }).catch(() => null);
    const d = res?.ok ? await res.json() : null;
    setBusy(false);
    if (!d?.url) return setStatus("error");
    setUrl(d.url);
    window.open(d.url, "_blank", "noopener,noreferrer");
  };

  const disconnect = async () => {
    await fetch("/api/telegram/link", { method: "DELETE" }).catch(() => null);
    setUrl(null);
    await load();
  };

  if (status === "error") return <p role="alert" className="rounded-xl border border-line bg-white p-6">{t.tgUnavailable}</p>;
  if (status === null)
    return (
      <div role="status">
        <span className="sr-only">{t.loading}</span>
        <div aria-hidden="true" className="h-40 animate-pulse rounded-xl bg-line" />
      </div>
    );

  return (
    <section aria-labelledby="tg-title" className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4 sm:p-6">
      <h2 id="tg-title" className="text-xl font-bold">{t.tgTitle}</h2>
      {status.linked ? (
        <>
          <p role="status" className="font-medium text-teal">{t.tgConnected.replace("{who}", status.username ? ` (@${status.username})` : "")}</p>
          <button type="button" onClick={disconnect} className="min-h-11 w-fit rounded-lg border border-line px-4 font-medium hover:border-teal-mid">{t.tgDisconnect}</button>
        </>
      ) : (
        <>
          <p className="text-ink-muted">{t.tgBody}</p>
          <button type="button" onClick={connect} aria-disabled={busy} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-teal px-4 font-medium text-white hover:bg-teal-deep aria-disabled:opacity-50">
            <Send aria-hidden="true" className="size-4" /> {busy ? t.tgOpening : t.tgConnect}
          </button>
          {url && (
            <p role="status" className="text-ink-muted">
              {t.tgOpenHint.replace("{bot}", bot)}{" "}
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-medium text-teal underline underline-offset-4">
                {t.tgOpenLink}
              </a>
            </p>
          )}
        </>
      )}
    </section>
  );
}
