"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";

interface Asset { name: string; width: number; height: number }

export function PhotosPanel({ t, projectId }: { t: Messages["dashboard"]; projectId: string }) {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/assets`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d: { assets: Asset[] }) => !cancelled && setAssets(d.assets))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [projectId, attempt]);

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    setStatus(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/projects/${projectId}/assets`, { method: "POST", body: form }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setAssets((a) => [...(a ?? []), d.asset]);
      setStatus(t.photoAdded);
    } else setError((t.photoErrors as Record<string, string>)[d.error] ?? t.photoErrors.failed);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = async (name: string) => {
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/assets/${name}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setError(t.photoErrors.failed);
    setAssets((a) => (a ?? []).filter((x) => x.name !== name));
    setStatus(t.photoRemoved);
    // Keep keyboard users in place: back to the upload button.
    inputRef.current?.focus();
  };

  if (loadError)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-line bg-white p-6">
        <p>{t.loadError}</p>
        <button type="button" onClick={() => { setLoadError(false); setAttempt((a) => a + 1); }} className="min-h-11 rounded-lg border border-line px-4 font-medium text-sm lg:min-h-9">{t.retry}</button>
      </div>
    );

  return (
    <section id="photos" aria-labelledby="photos-title" className="flex scroll-mt-4 flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-6">
      <h2 id="photos-title" className="text-lg font-semibold">{t.photosTitle}</h2>
      <p className="text-ink-muted">{t.photosHint}</p>
      <div className="flex flex-col gap-2">
        <label className={`inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-link lg:min-h-9 ${busy ? "opacity-60" : ""}`}>
          <ImagePlus aria-hidden="true" className="size-5" />
          {busy ? t.photoUploading : t.photoAdd}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif"
            className="sr-only"
            aria-disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && !busy) void upload(f);
            }}
          />
        </label>
        <p role="status" className="text-ink">{status}</p>
        {error && <p role="alert" className="text-destructive">{error}</p>}
      </div>
      {assets === null ? (
        <div role="status" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <span className="sr-only">{t.loading}</span>
          {[0, 1, 2].map((i) => <div key={i} aria-hidden="true" className="aspect-square animate-pulse rounded-xl bg-line" />)}
        </div>
      ) : assets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-ink-muted">{t.photosEmpty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {assets.map((a, i) => {
            const label = t.photoLabel.replace("{n}", String(i + 1));
            return (
              <li key={a.name} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, owner-only images from our API */}
                <img src={`/api/projects/${projectId}/assets/${a.name}`} alt={label} width={a.width} height={a.height} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                <span className="text-ink-muted">{label}</span>
                <button type="button" onClick={() => remove(a.name)} aria-label={t.photoRemoveNamed.replace("{n}", String(i + 1))} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg font-medium text-destructive hover:bg-coral-soft text-sm lg:min-h-9">
                  <Trash2 aria-hidden="true" className="size-4" /> {t.photoRemove}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
