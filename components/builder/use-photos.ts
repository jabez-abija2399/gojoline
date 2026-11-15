"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface Photo {
  name: string;
  width: number;
  height: number;
}

export type UploadResult = { ok: true; photo: Photo } | { ok: false; error: string };

export const PHOTO_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif";

/** The owner's photos for one site, shared by the chat and the Photos tab; the list loads when first wanted. */
export function usePhotos(projectId: string, wanted: boolean) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!wanted) return;
    let cancelled = false;
    fetch(`/api/projects/${projectId}/assets`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d: { assets: Photo[] }) => !cancelled && setPhotos(d.assets))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [projectId, attempt, wanted]);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/assets`, { method: "POST", body: form }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      if (!res?.ok || !data.asset) return { ok: false, error: typeof data.error === "string" ? data.error : "failed" };
      const photo: Photo = data.asset;
      setPhotos((p) => [...(p ?? []), photo]);
      return { ok: true, photo };
    },
    [projectId],
  );

  const remove = useCallback(
    async (name: string): Promise<boolean> => {
      const res = await fetch(`/api/projects/${projectId}/assets/${encodeURIComponent(name)}`, { method: "DELETE" }).catch(() => null);
      if (!res?.ok) return false;
      setPhotos((p) => (p ?? []).filter((x) => x.name !== name));
      return true;
    },
    [projectId],
  );

  const retry = useCallback(() => {
    setLoadError(false);
    setAttempt((a) => a + 1);
  }, []);

  return useMemo(() => ({ photos, loadError, upload, remove, retry }), [photos, loadError, upload, remove, retry]);
}

export type Photos = ReturnType<typeof usePhotos>;
