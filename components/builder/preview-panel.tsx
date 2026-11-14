"use client";

import { useState } from "react";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import type { Messages } from "@/lib/i18n";

interface Props {
  t: Messages["builder"];
  url: string | null;
  loading: boolean;
  reloadKey: number;
}

export function PreviewPanel({ t, url, loading, reloadKey }: Props) {
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const isHttp = !!url && url.startsWith("https://");
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-sand">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-white px-3 py-2">
        <div className="flex gap-1" role="group" aria-label={t.previewTitle}>
          {(["phone", "desktop"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={device === d}
              onClick={() => setDevice(d)}
              className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-ink-muted aria-pressed:bg-teal-soft aria-pressed:text-teal"
            >
              {d === "phone" ? <Smartphone aria-hidden="true" className="size-4" /> : <Monitor aria-hidden="true" className="size-4" />}
              {d === "phone" ? t.previewPhone : t.previewDesktop}
            </button>
          ))}
        </div>
        {isHttp && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 rounded-lg px-3 font-medium text-teal hover:bg-teal-soft">
            <ExternalLink aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">{t.previewOpen}</span>
            <span className="sr-only sm:hidden">{t.previewOpen}</span>
          </a>
        )}
      </div>
      <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-auto p-3">
        {url ? (
          <iframe
            key={`${url}-${reloadKey}`}
            src={url}
            title={t.previewTitle}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className={`h-full min-h-[480px] rounded-xl border border-line bg-white shadow-sm ${device === "phone" ? "w-[375px] max-w-full" : "w-full"}`}
          />
        ) : (
          <div className="flex w-full max-w-md flex-col items-center justify-center gap-3 p-6 text-center text-ink-muted" role={loading ? "status" : undefined}>
            {loading ? (
              <>
                <div aria-hidden="true" className="h-64 w-full animate-pulse rounded-xl bg-line" />
                <p>{t.previewLoading}</p>
              </>
            ) : (
              <p>{t.previewEmpty}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
