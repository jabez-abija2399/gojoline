"use client";

import { memo, useEffect, useState } from "react";
import type { Messages } from "@/lib/i18n";

/** Read-only view of the site's files (for the curious; edits happen through chat). */
export const CodePanel = memo(function CodePanel({ t, projectId, refreshKey }: { t: Messages["builder"]; projectId: string; refreshKey: number }) {
  const [files, setFiles] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState("src/site.json");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/files`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("files"))))
      .then((data: { files: Record<string, string> }) => !cancelled && setFiles(data.files))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [projectId, refreshKey, attempt]);

  if (error) {
    return (
      <div role="alert" className="m-4 flex flex-col items-center gap-3 rounded-xl border border-line bg-white p-6 text-center text-ink-muted">
        <p>{t.loadError}</p>
        <button type="button" onClick={() => {
            setError(false);
            setAttempt((a) => a + 1);
          }} className="min-h-11 rounded-lg border border-line px-4 font-medium text-ink hover:border-faint text-sm lg:min-h-9">
          {t.retry}
        </button>
      </div>
    );
  }

  if (files === null) {
    return (
      <div className="flex flex-col gap-3 p-4" role="status">
        <div aria-hidden="true" className="h-6 w-1/2 animate-pulse rounded bg-line" />
        <div aria-hidden="true" className="h-64 animate-pulse rounded-xl bg-line" />
      </div>
    );
  }
  const paths = Object.keys(files).sort();
  if (paths.length === 0) return <p className="m-4 rounded-xl border border-dashed border-line bg-white p-6 text-center text-ink-muted">{t.codeEmpty}</p>;
  const active = files[selected] !== undefined ? selected : paths[0]!;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <p className="text-ink-muted">{t.codeHint}</p>
      <label htmlFor="file-select" className="sr-only">{t.tabCode}</label>
      <select id="file-select" value={active} onChange={(e) => setSelected(e.target.value)} className="min-h-11 rounded-lg border border-input bg-white px-3">
        {paths.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <pre className="min-h-0 flex-1 overflow-auto rounded-xl bg-ink-hover p-4 text-sm leading-relaxed text-sunken" tabIndex={0}>
        <code>{files[active]}</code>
      </pre>
    </div>
  );
});
