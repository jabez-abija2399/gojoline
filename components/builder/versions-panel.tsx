"use client";

import { useState } from "react";
import type { Messages } from "@/lib/i18n";

export interface UiVersion {
  number: number;
  summary: string;
  createdAt: string;
}

interface Props {
  t: Messages["builder"];
  versions: UiVersion[];
  current: number | null;
  disabled: boolean;
  onRestore: (number: number) => Promise<boolean>;
}

export function VersionsPanel({ t, versions, current, disabled, onRestore }: Props) {
  const [busy, setBusy] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  if (versions.length === 0) {
    return <p className="m-4 rounded-xl border border-dashed border-line bg-white p-6 text-center text-ink-muted">{t.versionsEmpty}</p>;
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      {failed && <p role="alert" className="rounded-lg bg-clay-soft px-4 py-3 text-destructive">{t.versionRestoreFailed}</p>}
      <ol className="flex flex-col gap-3">
        {versions.map((v) => {
          const restoredFrom = /^restore:(\d+)$/.exec(v.summary)?.[1];
          const template = /^template:([a-z-]+)$/.exec(v.summary)?.[1];
          const templateName = template ? (t.templates as Record<string, string>)[template] : undefined;
          return (
            <li key={v.number} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
              <div className="min-w-0">
                <p className="font-semibold">{t.versionLabel.replace("{n}", String(v.number))}</p>
                <p className="truncate text-ink-muted">{restoredFrom ? t.versionRestoredFrom.replace("{n}", restoredFrom) : templateName ? t.versionFromTemplate.replace("{industry}", templateName) : v.summary}</p>
              </div>
              {v.number === current ? (
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
                  className="min-h-11 shrink-0 rounded-lg border border-line px-4 font-medium hover:border-teal-mid aria-disabled:opacity-50"
                >
                  {busy === v.number ? t.versionRestoring : t.versionRestore}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
