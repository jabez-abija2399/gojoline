"use client";

import { memo, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Wand2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { PHOTO_TYPES, type Photos } from "./use-photos";

export type PhotoText = Pick<Messages["dashboard"], "photoAdded" | "photoRemoved" | "photoLabel" | "photoRemoveNamed" | "photoRemove" | "photoErrors" | "loading">;

interface Props {
  t: Messages["builder"];
  tp: PhotoText;
  projectId: string;
  photos: Photos;
  disabled: boolean;
  /** Puts "use my photo ..." in the chat box and shows the chat. */
  onUse: (name: string) => void;
}

/** Add, see and remove the site's photos; one tap hands a photo to the chat. */
export const PhotosPanel = memo(function PhotosPanel({ t, tp, projectId, photos, disabled, onUse }: Props) {
  const [progress, setProgress] = useState<{ n: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = progress !== null;

  const add = async (files: File[]) => {
    if (busy || files.length === 0) return;
    setError(null);
    setStatus(null);
    let added = 0;
    for (const [i, file] of files.entries()) {
      setProgress({ n: i + 1, total: files.length });
      const result = await photos.upload(file);
      if (result.ok) added += 1;
      else {
        setError((tp.photoErrors as Record<string, string>)[result.error] ?? tp.photoErrors.failed);
        // No point sending the rest once the site is full.
        if (result.error === "too_many_photos") break;
      }
    }
    if (added > 0) setStatus(tp.photoAdded);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = async (name: string) => {
    setError(null);
    setStatus(null);
    if (await photos.remove(name)) setStatus(tp.photoRemoved);
    else setError(tp.photoErrors.failed);
    // Keep keyboard users in place: back to the upload button.
    inputRef.current?.focus();
  };

  if (photos.loadError)
    return (
      <div role="alert" className="m-4 flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-6 text-center text-ink-muted">
        <p>{t.loadError}</p>
        <button type="button" onClick={photos.retry} className="min-h-11 rounded-lg border border-line px-4 font-medium text-ink hover:border-faint text-sm lg:min-h-9">
          {t.retry}
        </button>
      </div>
    );

  const list = photos.photos;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t.photosTitle}</h2>
          <p className="max-w-[65ch] text-ink-muted">{t.photosHint}</p>
        </div>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void add([...e.dataTransfer.files]);
          }}
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link ${
            over ? "border-ink bg-sunken" : "border-faint bg-white hover:bg-sunken/40"
          } ${busy ? "opacity-70" : ""}`}
        >
          <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-sunken text-ink">
            {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          </span>
          <span className="font-medium text-ink">{progress ? t.photosAdding.replace("{n}", String(progress.n)).replace("{total}", String(progress.total)) : t.photosDrop}</span>
          <span className="text-sm text-ink-muted">{t.photosDropHint}</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={PHOTO_TYPES}
            className="sr-only"
            aria-disabled={busy}
            onChange={(e) => void add([...(e.target.files ?? [])])}
          />
        </label>
        <p role="status" className="text-ink empty:hidden">
          {status}
        </p>
        {error && (
          <p role="alert" className="rounded-lg bg-coral-soft px-4 py-3 text-destructive">
            {error}
          </p>
        )}
        {list === null ? (
          <div role="status" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <span className="sr-only">{tp.loading}</span>
            {[0, 1, 2].map((i) => (
              <div key={i} aria-hidden="true" className="skeleton aspect-square rounded-2xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-6 text-center text-ink-muted">{t.photosEmpty}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {list.map((a, i) => {
              const label = tp.photoLabel.replace("{n}", String(i + 1));
              return (
                <li key={a.name} className="msg-in flex flex-col gap-2 rounded-2xl border border-line bg-white p-2 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element -- private, owner-only images from our API */}
                  <img src={`/api/projects/${projectId}/assets/${encodeURIComponent(a.name)}`} alt={label} width={a.width} height={a.height} loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
                  <span className="flex flex-col px-1">
                    <span className="font-medium">{label}</span>
                    <span className="truncate text-sm text-ink-muted">{a.name}</span>
                  </span>
                  <button
                    type="button"
                    aria-disabled={disabled}
                    onClick={() => !disabled && onUse(a.name)}
                    aria-label={`${t.photoUse}: ${label}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-2 font-medium text-white transition-colors hover:bg-ink-hover aria-disabled:opacity-50 text-sm lg:min-h-9"
                  >
                    <Wand2 aria-hidden="true" className="size-4 shrink-0 max-sm:hidden" /> {t.photoUse}
                  </button>
                  <button type="button" onClick={() => remove(a.name)} aria-label={tp.photoRemoveNamed.replace("{n}", String(i + 1))} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg font-medium text-destructive hover:bg-coral-soft text-sm lg:min-h-9">
                    <Trash2 aria-hidden="true" className="size-4" /> {tp.photoRemove}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
});
