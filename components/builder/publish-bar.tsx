"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Globe, Loader2, Rocket } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { DomainSection } from "./domain-section";

type Info = { slug: string; url: string | null; status: "pending" | "published" | "taken_down" | null; publishedVersion: number | null; prefix: string; suffix: string };
type Phase = { kind: "idle" } | { kind: "publishing" } | { kind: "done"; url: string } | { kind: "error"; code: string };

interface Props {
  t: Messages["builder"];
  projectId: string;
  hasVersion: boolean;
  disabled: boolean;
  /** Tells the builder the live address (shown in the preview's address bar), or null. */
  onLive?: (url: string | null) => void;
  /** Places the status line and the Publish button in the top bar. */
  children: (parts: { status: React.ReactNode; button: React.ReactNode }) => React.ReactNode;
}

export function PublishBar({ t, projectId, hasVersion, disabled, onLive, children }: Props) {
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  // Once the owner types an address, reloading the publish info must not replace it.
  const editedRef = useRef(false);

  const load = useCallback(async () => {
    const data: Info | null = await fetch(`/api/projects/${projectId}/publish`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    if (data) {
      setInfo(data);
      if (!editedRef.current) setSlug(data.slug);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/publish`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Info | null) => {
        if (!cancelled && data) {
          setInfo(data);
          if (!editedRef.current) setSlug(data.slug);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Keep keyboard and screen-reader users oriented after each outcome.
  useEffect(() => {
    if (phase.kind === "done") doneRef.current?.focus();
    if (phase.kind === "error") (phase.code.startsWith("slug") ? inputRef.current : alertRef.current)?.focus();
  }, [phase]);

  const open = () => {
    setPhase({ kind: "idle" });
    setCopied(false);
    dialogRef.current?.showModal();
    // Refresh in the background: the suggested address follows the site name.
    setLoading(true);
    void load().finally(() => setLoading(false));
  };
  const close = () => {
    if (phase.kind === "publishing") return;
    dialogRef.current?.close();
    openerRef.current?.focus();
  };

  const publish = async () => {
    if (phase.kind === "publishing" || disabled) return;
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

  const published = info?.status === "published" && info.url ? info.url : null;
  const errorText = phase.kind === "error" ? ((t.publishErrors as Record<string, string>)[phase.code] ?? t.publishErrors.failed) : null;
  const slugError = phase.kind === "error" && phase.code.startsWith("slug");
  const canOpen = hasVersion && !!info;
  const previewUrl = info ? `${info.prefix}${slug || "…"}${info.suffix}` : "";

  useEffect(() => {
    onLive?.(published);
  }, [onLive, published]);

  const status = published ? (
    <a href={published} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-1.5 text-sm text-ink-muted hover:text-teal">
      <span aria-hidden="true" className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-mid opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex size-2 rounded-full bg-teal" />
      </span>
      <span className="truncate">
        {t.liveAt} <span className="font-medium text-teal underline underline-offset-4">{published.replace(/^https:\/\//, "")}</span>
      </span>
    </a>
  ) : (
    <p className="flex min-w-0 items-center gap-1.5 text-sm text-ink-muted">
      <Globe aria-hidden="true" className="size-3.5 shrink-0 max-sm:hidden" />
      <span className="truncate">{t.notPublished}</span>
    </p>
  );
  const button = (
    <button
      ref={openerRef}
      type="button"
      onClick={open}
      disabled={!canOpen}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-teal px-3 font-medium text-white transition-colors hover:bg-teal-deep disabled:opacity-50 sm:px-4"
    >
      <Rocket aria-hidden="true" className="hidden size-4 sm:block" />
      {t.publish}
    </button>
  );

  return (
    <>
      {children({ status, button })}
      <dialog
        ref={dialogRef}
        aria-labelledby="publish-title"
        className="m-auto max-h-[90dvh] w-[min(94vw,30rem)] overflow-y-auto rounded-2xl border border-line bg-white p-0 text-ink shadow-2xl backdrop:bg-teal-deep/50 backdrop:backdrop-blur-sm open:animate-[pop-in_0.2s_ease-out]"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          {phase.kind === "done" ? (
            <div role="status" className="flex flex-col gap-3">
              <h2 id="publish-title" ref={doneRef} tabIndex={-1} className="flex items-center gap-2 text-2xl font-bold focus:outline-none">
                <CheckCircle2 aria-hidden="true" className="size-6 shrink-0 text-teal" /> {t.publishedTitle}
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
                    const ok = await navigator.clipboard?.writeText(phase.url).then(
                      () => true,
                      () => false,
                    );
                    setCopied(!!ok);
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
              {published ? (
                <p className="break-all rounded-lg bg-sand px-3 py-2 font-medium">{published}</p>
              ) : loading && !info ? (
                <div aria-hidden="true" className="h-24 animate-pulse rounded-lg bg-line" />
              ) : (
                <>
                  <p className="text-ink-muted">{t.publishBody}</p>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="publish-slug" className="font-medium">{t.publishAddressLabel}</label>
                    <input
                      ref={inputRef}
                      id="publish-slug"
                      value={slug}
                      onChange={(e) => {
                        editedRef.current = true;
                        setSlug(e.target.value.toLowerCase());
                      }}
                      maxLength={40}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-invalid={slugError || undefined}
                      aria-describedby={slugError ? "publish-error publish-slug-preview" : "publish-slug-hint publish-slug-preview"}
                      className="min-h-11 w-full rounded-lg border border-input bg-white px-3 text-base"
                    />
                    <p id="publish-slug-hint" className="text-ink-muted">{t.publishAddressHint}</p>
                    <p id="publish-slug-preview" aria-live="polite" className="break-all rounded-lg bg-sand px-3 py-2 font-medium">
                      {previewUrl}
                    </p>
                  </div>
                </>
              )}
              {errorText && (
                <p id="publish-error" ref={alertRef} tabIndex={-1} role="alert" className="rounded-lg bg-clay-soft px-4 py-3 text-destructive">
                  {errorText}
                </p>
              )}
              {phase.kind === "publishing" && (
                <p role="status" className="flex items-center gap-2 text-teal">
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" /> {t.publishing}
                </p>
              )}
              <button
                type="button"
                onClick={publish}
                aria-disabled={phase.kind === "publishing" || disabled}
                className="min-h-12 rounded-lg bg-teal px-5 font-medium text-white hover:bg-teal-deep aria-disabled:opacity-50"
              >
                {published ? t.publishUpdate : t.publishNow}
              </button>
            </>
          )}
          {(phase.kind === "done" || published) && phase.kind !== "publishing" && <DomainSection t={t} projectId={projectId} />}
          <button
            type="button"
            onClick={close}
            aria-disabled={phase.kind === "publishing"}
            className="min-h-11 self-end rounded-lg px-4 font-medium text-ink-muted hover:bg-sand aria-disabled:opacity-50"
          >
            {t.close}
          </button>
        </div>
      </dialog>
    </>
  );
}
