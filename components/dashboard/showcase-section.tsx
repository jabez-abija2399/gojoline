"use client";

import Link from "next/link";
import { useState } from "react";
import type { Messages } from "@/lib/i18n";

type T = Messages["growth"]["showcase"];

/** “Show my site in the Gojoline showcase”: off by default, saved as soon as it changes. */
export function ShowcaseSection({ t, locale, projectId, on }: { t: T; locale: string; projectId: string; on: boolean | null }) {
  const [checked, setChecked] = useState(Boolean(on));
  const [state, setState] = useState<"idle" | "busy" | "saved" | "failed">("idle");
  const save = async (next: boolean) => {
    setChecked(next);
    setState("busy");
    const res = await fetch(`/api/projects/${projectId}/showcase`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on: next }) }).catch(() => null);
    if (res?.ok) setState("saved");
    else {
      setChecked(!next);
      setState("failed");
    }
  };
  return (
    <section id="showcase" aria-labelledby="dash-showcase-title" className="flex scroll-mt-4 flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:p-6">
      <h2 id="dash-showcase-title" className="text-base font-semibold">{t.settingTitle}</h2>
      {on === null ? (
        <p className="text-ink-muted">{t.settingNeedsLive}</p>
      ) : (
        <>
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={checked}
              disabled={state === "busy"}
              aria-describedby="dash-showcase-hint"
              onChange={(e) => void save(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-[var(--color-ink)]"
            />
            <span className="font-medium">{t.settingLabel}</span>
          </label>
          <p id="dash-showcase-hint" className="text-sm text-ink-muted">{t.settingHint}</p>
          <p role={state === "failed" ? "alert" : "status"} className={`text-sm empty:hidden ${state === "failed" ? "text-danger" : "text-ink"}`}>
            {state === "saved" ? (checked ? t.saved : t.savedOff) : state === "failed" ? t.failed : ""}
          </p>
          <Link href={`/${locale}/showcase`} className="inline-flex min-h-11 w-fit items-center font-medium text-ink underline underline-offset-4 lg:min-h-9">{t.view}</Link>
        </>
      )}
    </section>
  );
}
