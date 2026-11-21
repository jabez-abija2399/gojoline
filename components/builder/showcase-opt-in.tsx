"use client";

import { useEffect, useState } from "react";

/**
 * Right after publishing: the owner may let Gojoline show the site in its showcase and posts.
 * Off by default; the same choice as in the dashboard's settings.
 */
export function ShowcaseOptIn({ projectId, label, hint, saved, failed }: { projectId: string; label: string; hint: string; saved: string; failed: string }) {
  const [on, setOn] = useState<boolean | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "saved" | "failed">("idle");
  useEffect(() => {
    let live = true;
    fetch(`/api/projects/${projectId}/showcase`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { on?: boolean | null } | null) => live && setOn(d?.on ?? false))
      .catch(() => live && setOn(false));
    return () => {
      live = false;
    };
  }, [projectId]);
  if (on === null) return null;
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
        <input type="checkbox" checked={on} aria-disabled={state === "busy"} aria-describedby="publish-showcase-hint" onChange={(e) => state !== "busy" && void save(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-ink)]" />
        <span className="font-medium">{label}</span>
      </label>
      <p id="publish-showcase-hint" className="text-sm text-ink-muted">{hint}</p>
      <p role="status" className="text-sm empty:hidden">{state === "saved" ? saved : state === "failed" ? failed : ""}</p>
    </div>
  );
}
