"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { MAX_UPLOAD_BYTES } from "@/lib/posts/upload";

/**
 * Admin → Posts → Videos: puts a video the admin filmed on a post (MP4, up to 60 MB), with
 * progress, then shows it. The server checks it is a real video and strips its location data.
 */
export function VideoUpload({ postId, label, t }: { postId: string; label: string; t: { upload: string; uploading: string; uploaded: string; errors: Record<string, string> } }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const status = useId();
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function send(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) return setMessage({ ok: false, text: t.errors.too_big });
    setMessage(null);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/posts/${postId}/media`);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    // Progress in steps of 25%, so a screen reader hears it without a flood of numbers.
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.floor((e.loaded / e.total) * 4) * 25);
    xhr.onload = () => {
      setProgress(null);
      let code = "failed";
      try {
        code = xhr.status === 200 ? "ok" : ((JSON.parse(xhr.responseText) as { error?: string }).error ?? "failed");
      } catch {
        // Not JSON: a generic failure.
      }
      if (code === "ok") {
        setMessage({ ok: true, text: t.uploaded });
        router.refresh();
      } else setMessage({ ok: false, text: t.errors[code] ?? t.errors.failed });
    };
    xhr.onerror = () => {
      setProgress(null);
      setMessage({ ok: false, text: t.errors.failed });
    };
    xhr.send(file);
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={input}
        type="file"
        accept="video/mp4,.mp4"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) send(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        aria-describedby={status}
        aria-disabled={progress !== null}
        onClick={() => progress === null && input.current?.click()}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:border-faint aria-disabled:opacity-60 pointer-fine:min-h-9"
      >
        <Upload aria-hidden="true" className="size-4" />
        {progress === null ? t.upload : `${t.uploading} ${progress}%`}
        <span className="sr-only">: {label}</span>
      </button>
      <p id={status} role="status" className={`text-sm ${message?.ok === false ? "text-destructive" : "text-ink-muted"}`}>
        {progress !== null ? `${t.uploading} ${progress}%` : (message?.text ?? "")}
      </p>
    </div>
  );
}
