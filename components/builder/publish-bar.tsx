"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Globe, Loader2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { DomainSection } from "./domain-section";

type Info = { slug: string; url: string | null; status: "published" | "taken_down" | null; publishedVersion: number | null; prefix: string; suffix: string };
type Phase = { kind: "idle" } | { kind: "publishing" } | { kind: "done"; url: string } | { kind: "error"; code: string };

interface Props {
  t: Messages["builder"];
  projectId: string;
  hasVersion: boolean;
  disabled: boolean;
}

export function PublishBar({ t, projectId, hasVersion, disabled }: Props) {
  const [info, setInfo] = useState<Info | null>(null);
  const [slug, setSlug] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    const data: Info | null = await fetch(`/api/projects/${projectId}/publish`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    if (data) {
      setInfo(data);
      setSlug(data.slug);
    }
    return data;
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/publish`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Info | null) => {
        if (cancelled || !data) return;
        setInfo(data);
        setSlug(data.slug);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const open = async () => {
    setPhase({ kind: "idle" });
    setCopied(false);
    // Refresh: the suggested address follows the site name, which the first change sets.
    await load();
    dialogRef.current?.showModal();
  };
  const close = () => {
    dialogRef.current?.close();
    openerRef.current?.focus();
  };

  const publish = async () => {
    setPhase({ kind: "publishing" });
    try {
      const res = await fetch(`/api/projects/${projectId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) return setPhase({ kind: "error", code: "too_many" });
      if (!res.ok) return setPhase({ kind: "error", code: typeof data.error === "string" ? data.error : "failed" });
      setInfo((i) => (i ? { ...i, url: data.url, slug: data.slug, status: "published", publishedVersion: data.publishedVersion } : i));
      setPhase({ kind: "done", url: data.url });
    } catch {
      setPhase({ kind: "error", code: "failed" });
    }
  };

  const published = info?.status === "published" && info.url;
  const errorText = phase.kind === "error" ? (t.publishErrors as Record<string, string>)[phase.code] ?? t.publishErrors.failed : null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-3 py-2">
      <p className="flex min-w-0 items-center gap-2 text-ink-muted">
        <Globe aria-hidden="true" className="size-4 shrink-0" />
        {published ? (
          <span className="truncate">
            {t.liveAt}{" "}
            <a href={info.url!} target="_blank" rel="noopener noreferrer" className="font-medium text-teal underline underline-offset-4">
              {info.url!.replace(/^https:\/\//, "")}
            </a>
          </span>
        ) : (
          <span>{t.notPublished}</span>
        )}
      </p>
      <button
        ref={openerRef}
        type="button"
        onClick={open}
        aria-disabled={!hasVersion || disabled || !info}
        disabled={!hasVersion || !info}
        className="min-h-11 shrink-0 rounded-lg bg-teal px-4 font-medium text-white hover:bg-teal-deep disabled:opacity-50"
      >
        {t.publish}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="publish-title"
        className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-line bg-white p-0 text-ink backdrop:bg-ink/40"
        onCancel={(e) => {
          if (phase.kind === "publishing") e.preventDefault();
        }}
      >
        <div className="flex flex-col gap-4 p-6">
          {phase.kind === "done" ? (
            <div role="status" className="flex flex-col gap-3">
              <h2 id="publish-title" className="flex items-center gap-2 text-2xl font-bold">
                <CheckCircle2 aria-hidden="true" className="size-6 text-teal" /> {t.publishedTitle}
              </h2>
              <p className="text-ink-muted">{t.publishedBody}</p>
              <p className="break-all rounded-lg bg-sand px-3 py-2 font-medium">{phase.url}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a href={phase.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal px-4 font-medium text-white hover:bg-teal-deep">
                  <ExternalLink aria-hidden="true" className="size-4" /> {t.publishedOpen}
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard?.writeText(phase.url).catch(() => undefined);
                    setCopied(true);
                  }}
                  className="min-h-11 rounded-lg border border-line px-4 font-medium hover:border-teal-mid"
                >
                  {copied ? t.publishedCopied : t.publishedCopy}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 id="publish-title" className="text-2xl font-bold">{t.publishTitle}</h2>
              {!published && <p className="text-ink-muted">{t.publishBody}</p>}
              <div className="flex flex-col gap-2">
                <label htmlFor="publish-slug" className="font-medium">{t.publishAddressLabel}</label>
                <div className="flex min-h-11 items-center overflow-hidden rounded-lg border border-input focus-within:ring-3 focus-within:ring-ring">
                  <span aria-hidden="true" className="hidden shrink-0 bg-sand px-2 py-2 text-ink-muted sm:inline">{info?.prefix.replace(/^https:\/\//, "")}</span>
                  <input
                    id="publish-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    readOnly={!!published}
                    maxLength={40}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-describedby="publish-slug-hint"
                    aria-invalid={phase.kind === "error" && phase.code.startsWith("slug") ? true : undefined}
                    className="min-w-0 flex-1 bg-white px-2 py-2 text-base outline-none read-only:bg-sand"
                  />
                  <span aria-hidden="true" className="shrink-0 bg-sand px-2 py-2 text-ink-muted">{info?.suffix}</span>
                </div>
                <p id="publish-slug-hint" className="text-ink-muted">{t.publishAddressHint}</p>
              </div>
              {errorText && <p role="alert" className="rounded-lg bg-clay-soft px-4 py-3 text-destructive">{errorText}</p>}
              {phase.kind === "publishing" && (
                <p role="status" className="flex items-center gap-2 text-teal">
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" /> {t.publishing}
                </p>
              )}
              <button
                type="button"
                onClick={publish}
                disabled={phase.kind === "publishing" || disabled}
                className="min-h-12 rounded-lg bg-teal px-5 font-medium text-white hover:bg-teal-deep disabled:opacity-50"
              >
                {published ? t.publishUpdate : t.publishNow}
              </button>
            </>
          )}
          {(phase.kind === "done" || published) && phase.kind !== "publishing" && <DomainSection t={t} projectId={projectId} />}
          <button
            type="button"
            onClick={close}
            disabled={phase.kind === "publishing"}
            className="min-h-11 self-end rounded-lg px-4 font-medium text-ink-muted hover:bg-sand disabled:opacity-50"
          >
            {t.close}
          </button>
        </div>
      </dialog>
    </div>
  );
}
