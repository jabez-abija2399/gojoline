"use client";

import { useEffect, useId, useState } from "react";

/**
 * Right after publishing: the owner may let Gojoline show the site in its showcase and posts.
 * Off by default; the same choice as in the dashboard's settings. Shown only once its real
 * state is known (never a false "off").
 */
export function ShowcaseOptIn({ projectId, label, hint, saved, savedOff, failed }: { projectId: string; label: string; hint: string; saved: string; savedOff: string; failed: string }) {
  const [on, setOn] = useState<boolean | null | "error">(null);
  const [state, setState] = useState<"idle" | "busy" | "saved" | "failed">("idle");
  const hintId = useId();
  useEffect(() => {
    let live = true;
    fetch(`/api/projects/${projectId}/showcase`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { on?: boolean | null } | null) => live && setOn(typeof d?.on === "boolean" ? d.on : "error"))
      .catch(() => live && setOn("error"));
    return () => {
      live = false;
    };
  }, [projectId]);
  // Not known (no site yet, or it couldn't load): the dashboard's settings offer it instead.
  if (on === "error") return null;
  if (on === null) return <div aria-hidden="true" className="h-28 animate-pulse rounded-lg bg-line" />;
  const save = async (next: boolean) => {
    // Shown at once; put back if it couldn't be saved.
    setOn(next);
    setState("busy");
    const res = await fetch(`/api/projects/${projectId}/showcase`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on: next }) }).catch(() => null);
    if (res?.ok) setState("saved");
    else {
      setOn(!next);
      setState("failed");
    }
  };
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-line p-3">
      <label className="flex min-h-11 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={on}
          aria-disabled={state === "busy"}
          aria-describedby={hintId}
          onChange={(e) => state !== "busy" && void save(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-ink)] aria-disabled:opacity-60"
        />
        <span className="font-medium">{label}</span>
      </label>
      <p id={hintId} className="text-base text-ink-muted sm:text-sm">{hint}</p>
      <p role="status" className={`text-sm empty:hidden ${state === "failed" ? "text-danger" : ""}`}>
        {state === "saved" ? (on ? saved : savedOff) : state === "failed" ? failed : ""}
      </p>
    </div>
  );
}
