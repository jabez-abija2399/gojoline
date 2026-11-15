"use client";

import Image from "next/image";
import { ExternalLink, Globe, Lock, Monitor, RotateCw, Smartphone } from "lucide-react";
import type { Messages } from "@/lib/i18n";

export type Device = "phone" | "desktop";

interface ControlsProps {
  t: Messages["builder"];
  url: string | null;
  /** The published address, when the site is live. */
  liveUrl: string | null;
  onReload: () => void;
  /** Only where there is room for a computer-sized preview. */
  device?: { value: Device; onChange: (d: Device) => void };
  className?: string;
}

const iconButton = "flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-sand hover:text-teal aria-pressed:bg-teal-soft aria-pressed:text-teal disabled:opacity-40";

/** The preview's "browser bar": screen size, where the site lives, reload, open. */
export function PreviewControls({ t, url, liveUrl, onReload, device, className = "" }: ControlsProps) {
  const isHttp = !!url && url.startsWith("https://");
  return (
    <div className={`flex min-w-0 items-center gap-1 ${className}`}>
      {device && (
        <div className="flex shrink-0 gap-1" role="group" aria-label={t.previewTitle}>
          {(["phone", "desktop"] as const).map((d) => (
            <button key={d} type="button" aria-pressed={device.value === d} title={d === "phone" ? t.previewPhone : t.previewDesktop} onClick={() => device.onChange(d)} className={iconButton}>
              {d === "phone" ? <Smartphone aria-hidden="true" className="size-5" /> : <Monitor aria-hidden="true" className="size-5" />}
              <span className="sr-only">{d === "phone" ? t.previewPhone : t.previewDesktop}</span>
            </button>
          ))}
        </div>
      )}
      <p className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-sand px-3 text-sm text-ink-muted">
        {liveUrl ? <Globe aria-hidden="true" className="size-4 shrink-0 text-teal" /> : <Lock aria-hidden="true" className="size-4 shrink-0" />}
        <span className="truncate">{liveUrl ? liveUrl.replace(/^https:\/\//, "") : t.previewPrivate}</span>
      </p>
      <button type="button" onClick={onReload} disabled={!url} title={t.previewReload} className={iconButton}>
        <RotateCw aria-hidden="true" className="size-5" />
        <span className="sr-only">{t.previewReload}</span>
      </button>
      {isHttp && (
        <a href={url} target="_blank" rel="noopener noreferrer" title={t.previewOpen} className={iconButton}>
          <ExternalLink aria-hidden="true" className="size-5" />
          <span className="sr-only">{t.previewOpen}</span>
        </a>
      )}
    </div>
  );
}

interface Props {
  t: Messages["builder"];
  url: string | null;
  liveUrl: string | null;
  loading: boolean;
  /** The AI is working: a first build (no preview yet) or a change to the site on screen. */
  working: boolean;
  error: boolean;
  onRetry: () => void;
  onReload: () => void;
  reloadKey: number;
  device: Device;
}

export function PreviewPanel({ t, url, liveUrl, loading, working, error, onRetry, onReload, reloadKey, device }: Props) {
  // A phone-shaped frame on big screens; on a phone the preview simply fills the screen.
  const shell =
    device === "phone"
      ? "h-full w-[390px] max-w-full rounded-xl border border-line lg:my-auto lg:max-h-[844px] lg:rounded-[2.25rem] lg:border-[10px] lg:border-ink lg:shadow-2xl"
      : "h-full w-full rounded-xl border border-line shadow-lg";
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-sand">
      <PreviewControls t={t} url={url} liveUrl={liveUrl} onReload={onReload} className="border-b border-line bg-white px-2 py-1 lg:hidden" />
      <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-auto bg-[radial-gradient(var(--gojo-line)_1px,transparent_1px)] bg-[size:18px_18px] p-3 lg:p-6">
        {url ? (
          <div className={`relative flex min-h-[480px] flex-col overflow-hidden bg-white transition-[width,border-radius] duration-300 ${shell}`}>
            <iframe key={`${url}-${reloadKey}`} src={url} title={t.previewTitle} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" className="min-h-0 w-full flex-1 bg-white" />
            {working && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                <span className="block h-1 overflow-hidden bg-teal-soft">
                  <span className="progress-slide block h-full w-1/3 rounded-full bg-teal" />
                </span>
                <span className="mb-4 self-center rounded-full bg-teal px-4 py-2 text-sm font-medium text-white shadow-lg">{t.previewUpdating}</span>
              </div>
            )}
          </div>
        ) : loading ? (
          <div role="status" className="flex w-full max-w-[390px] flex-col items-center gap-4 self-center">
            <SiteSkeleton />
            <p className="text-center text-ink-muted">{working ? t.previewBuilding : t.previewLoading}</p>
          </div>
        ) : error ? (
          <div role="alert" className="flex max-w-md flex-col items-center gap-3 self-center rounded-2xl border border-line bg-white p-6 text-center text-ink-muted">
            <p>{t.previewError}</p>
            <button type="button" onClick={onRetry} className="min-h-11 rounded-lg border border-line bg-white px-4 font-medium text-ink hover:border-teal-mid">
              {t.retry}
            </button>
          </div>
        ) : (
          <div className="flex w-full max-w-[390px] flex-col items-center justify-center gap-4 self-center rounded-[2rem] border-2 border-dashed border-teal-soft bg-white/70 px-6 py-16 text-center">
            <Image src="/brand/mark.svg" alt="" width={56} height={56} className="size-14 opacity-80" />
            <p className="max-w-[28ch] text-ink-muted">{t.previewEmpty}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** The outline of a site (bar, headline, picture, cards) while the real one is on its way. */
function SiteSkeleton() {
  return (
    <div aria-hidden="true" className="flex w-full flex-col gap-4 rounded-[2rem] border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton size-8 rounded-lg" />
      </div>
      <div className="skeleton mt-2 h-7 w-4/5 rounded-lg" />
      <div className="skeleton h-7 w-3/5 rounded-lg" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="skeleton h-11 w-36 rounded-xl" />
      <div className="skeleton h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-20 rounded-xl" />
      </div>
    </div>
  );
}
