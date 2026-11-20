"use client";

import { memo, useEffect, useId, useMemo, useState } from "react";
import type { Messages } from "@/lib/i18n";
import { highlight, type TokenKind } from "@/lib/builder/code-view";

/** Brand colours that read on the sunken well in light and dark mode. */
const TOKEN_CLASS: Record<TokenKind, string> = {
  key: "text-link",
  property: "text-link",
  string: "text-lagoon",
  number: "text-warning",
  literal: "text-warning",
  selector: "font-semibold text-ink",
  comment: "italic text-ink-muted",
  punct: "text-ink-muted",
  text: "",
};

/** View only: no copying, selecting, dragging, right-click menu or saving from the file view. */
const block = (e: React.SyntheticEvent) => e.preventDefault();
const blockKeys = (e: React.KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && /^[acsxp]$/i.test(e.key)) e.preventDefault();
};

/** Read-only view of the site's files (for the curious; edits happen through chat), formatted and coloured, view only. */
/** `src` answers { files }. Owners no longer see this (they change sites through the chat); Gojoline staff do, in Admin → Sites. */
export const CodePanel = memo(function CodePanel({ t, src, refreshKey = 0, viewOnly = true }: { t: Messages["builder"]; src: string; refreshKey?: number; viewOnly?: boolean }) {
  const [files, setFiles] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState("src/site.json");

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("files"))))
      .then((data: { files: Record<string, string> }) => !cancelled && setFiles(data.files))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [src, refreshKey, attempt]);

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
  return <FileView t={t} files={files} selected={selected} onSelect={setSelected} viewOnly={viewOnly} />;
});

function FileView({ t, files, selected, onSelect, viewOnly }: { t: Messages["builder"]; files: Record<string, string>; selected: string; onSelect: (path: string) => void; viewOnly: boolean }) {
  const paths = useMemo(() => Object.keys(files).sort(), [files]);
  const active = files[selected] !== undefined ? selected : paths[0];
  const lines = useMemo(() => (active ? highlight(active, files[active]!) : []), [active, files]);
  const selectId = useId();
  if (!active) return <p className="m-4 rounded-xl border border-dashed border-line bg-white p-6 text-center text-ink-muted">{t.codeEmpty}</p>;
  const friendly = (p: string) => (p.endsWith("site.json") ? t.codeFiles.content : p.endsWith("styles.css") ? t.codeFiles.styles : null);
  const name = (p: string) => p.split("/").pop() ?? p;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      {viewOnly && <p className="text-ink-muted">{t.codeHint}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={selectId} className="text-sm font-medium">{t.codeFile}</label>
        <select id={selectId} value={active} onChange={(e) => onSelect(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-lg border border-input bg-white px-3 lg:min-h-9">
          {paths.map((p) => (
            <option key={p} value={p}>{friendly(p) ? `${friendly(p)} (${name(p)})` : p}</option>
          ))}
        </select>
        <span className="text-sm text-ink-muted tabular-nums">{t.codeLines.replace("{n}", String(lines.length))}</span>
      </div>
      <pre
        tabIndex={0}
        aria-label={friendly(active) ?? name(active)}
        onCopy={viewOnly ? block : undefined}
        onCut={viewOnly ? block : undefined}
        onContextMenu={viewOnly ? block : undefined}
        onDragStart={viewOnly ? block : undefined}
        onKeyDown={viewOnly ? blockKeys : undefined}
        translate="no"
        className={`max-h-[70vh] min-h-0 flex-1 overflow-auto ${viewOnly ? "select-none" : ""} rounded-xl border border-line bg-sunken py-3 font-mono text-[13px] leading-6 text-ink [-webkit-touch-callout:none] print:hidden`}
      >
        <code className="grid grid-cols-[auto_1fr]">
          {lines.map((tokens, i) => (
            <span key={i} className="contents">
              <span aria-hidden="true" className="sticky start-0 border-e border-line bg-sunken px-3 text-end text-ink-muted tabular-nums">{i + 1}</span>
              <span className="whitespace-pre px-4">
                {tokens.length === 0 ? " " : tokens.map((tok, j) => (TOKEN_CLASS[tok.kind] ? <span key={j} className={TOKEN_CLASS[tok.kind]}>{tok.text}</span> : tok.text))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
