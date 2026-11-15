"use client";

import { memo, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

export interface UiVersion {
  number: number;
  summary: string;
  createdAt: string;
}

interface Props {
  t: Messages["builder"];
  locale: Locale;
  versions: UiVersion[];
  current: number | null;
  disabled: boolean;
  onRestore: (number: number) => Promise<boolean>;
}

const DATE_FORMATS = {
  en: new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }),
  am: new Intl.DateTimeFormat("am-ET", { dateStyle: "medium", timeStyle: "short" }),
};

export const VersionsPanel = memo(function VersionsPanel({ t, locale, versions, current, disabled, onRestore }: Props) {
  const [busy, setBusy] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const dateFmt = DATE_FORMATS[locale];

  if (versions.length === 0) {
    return (
      <div className="m-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-white p-8 text-center text-ink-muted">
        <History aria-hidden="true" className="size-8 text-teal-mid" />
        <p>{t.versionsEmpty}</p>
      </div>
    );
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
      <p className="mx-auto w-full max-w-2xl text-ink-muted">{t.versionsHint}</p>
      {failed && <p role="alert" className="mx-auto w-full max-w-2xl rounded-lg bg-clay-soft px-4 py-3 text-destructive">{t.versionRestoreFailed}</p>}
      <ol className="mx-auto flex w-full max-w-2xl flex-col gap-3 border-s-2 border-teal-soft ps-4">
        {versions.map((v) => {
          const restoredFrom = /^restore:(\d+)$/.exec(v.summary)?.[1];
          const template = /^template:([a-z-]+)$/.exec(v.summary)?.[1];
          const templateName = template ? (t.templates as Record<string, string>)[template] : undefined;
          const isCurrent = v.number === current;
          return (
            <li key={v.number} className={`relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 transition-shadow ${isCurrent ? "border-teal shadow-md" : "border-line hover:shadow-sm"}`}>
              <span aria-hidden="true" className={`absolute -start-[1.6rem] top-6 size-3 rounded-full ring-4 ring-sand ${isCurrent ? "bg-teal" : "bg-teal-soft"}`} />
              <div className="min-w-0 flex-1 basis-40">
                <p className="font-semibold">{t.versionLabel.replace("{n}", String(v.number))}</p>
                <p className="truncate text-ink-muted">{restoredFrom ? t.versionRestoredFrom.replace("{n}", restoredFrom) : templateName ? t.versionFromTemplate.replace("{industry}", templateName) : v.summary}</p>
                <time dateTime={v.createdAt} suppressHydrationWarning className="text-sm text-ink-muted">
                  {dateFmt.format(new Date(v.createdAt))}
                </time>
              </div>
              {isCurrent ? (
                <span className="shrink-0 rounded-full bg-teal-soft px-3 py-1 font-medium text-teal">{t.versionCurrent}</span>
              ) : (
                <button
                  type="button"
                  aria-disabled={disabled || busy !== null}
                  onClick={async () => {
                    if (disabled || busy !== null) return;
                    setBusy(v.number);
                    setFailed(false);
                    const ok = await onRestore(v.number).catch(() => false);
                    setFailed(!ok);
                    setBusy(null);
                  }}
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-line px-4 font-medium transition-colors hover:border-teal-mid hover:bg-teal-soft aria-disabled:opacity-50"
                >
                  <RotateCcw aria-hidden="true" className={`size-4 ${busy === v.number ? "animate-spin" : ""}`} />
                  {busy === v.number ? t.versionRestoring : t.versionRestore}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
});
