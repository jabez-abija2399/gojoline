import { Lightbulb, Play } from "lucide-react";
import { DESKTOP, PHONE, shotSrc, shotSrcSet, type Shot } from "@/lib/guide/sections";

/** A real screenshot: the phone picture on phones, the computer one on wider screens, AVIF or WebP. */
export function GuideShot({ shot, alt, eager }: { shot: Shot; alt: string; eager: boolean }) {
  const phone = shot.phone;
  return (
    // Without a phone picture the shot is for large screens only (a computer screen shrunk to a phone is unreadable).
    <figure className={`m-0 ${phone ? "" : "max-md:hidden"}`}>
      <picture>
        {phone && <source media="(max-width: 767px)" type="image/avif" srcSet={shotSrcSet(phone, PHONE.widths, "avif")} sizes="16rem" width={PHONE.width} height={PHONE.height} />}
        {phone && <source media="(max-width: 767px)" type="image/webp" srcSet={shotSrcSet(phone, PHONE.widths, "webp")} sizes="16rem" width={PHONE.width} height={PHONE.height} />}
        <source type="image/avif" srcSet={shotSrcSet(shot.desktop, DESKTOP.widths, "avif")} sizes="(min-width: 1024px) 48rem, 100vw" width={DESKTOP.width} height={DESKTOP.height} />
        <source type="image/webp" srcSet={shotSrcSet(shot.desktop, DESKTOP.widths, "webp")} sizes="(min-width: 1024px) 48rem, 100vw" width={DESKTOP.width} height={DESKTOP.height} />
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-made AVIF/WebP files in public/guide, art-directed by screen size */}
        <img
          src={shotSrc(shot.desktop, DESKTOP.widths[0], "webp")}
          alt={alt}
          width={DESKTOP.width}
          height={DESKTOP.height}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="mx-auto h-auto w-full rounded-xl border border-line bg-white shadow-sm max-md:max-w-[16rem]"
        />
      </picture>
    </figure>
  );
}

export function GuideTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="note" className="flex gap-3 rounded-xl border border-line bg-sunken p-4">
      <Lightbulb aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink" />
      <p>
        <strong className="font-semibold">{label}: </strong>
        {children}
      </p>
    </div>
  );
}

/** Jumps the video to `seconds` and plays it (components/guide/guide-video.tsx); without JavaScript it scrolls to the video. */
export function SeekLink({ seconds, label, children, className = "" }: { seconds: number; label?: string; children: React.ReactNode; className?: string }) {
  return (
    <a href="#guide-video" data-seek={seconds} aria-label={label} className={`inline-flex items-center gap-1.5 ${className}`}>
      <Play aria-hidden="true" className="size-3.5 shrink-0 fill-current" />
      {children}
    </a>
  );
}

export function NumberedSteps({ steps, label }: { steps: readonly string[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white tabular-nums">
            {i + 1}
          </span>
          <span className="min-w-0 pt-0.5">{s}</span>
        </li>
      ))}
    </ol>
  );
}
