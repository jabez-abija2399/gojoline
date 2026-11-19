"use client";

import { useEffect, useRef } from "react";

interface Track {
  kind: "captions" | "chapters";
  src: string;
  srcLang: "en" | "am";
  label: string;
  /** Shown from the start: the captions in the page's language. */
  isDefault?: boolean;
}

/**
 * The guide video: nothing loads until it is played (preload none, a small poster). Any link on
 * the page with `data-seek="<seconds>"` (the contents and each section's "Watch this part") jumps
 * the video there and plays it; without JavaScript those links just scroll up to the video. It also
 * folds the phone contents after a jump and moves focus to the section's heading.
 */
export function GuideVideo({ src, poster, label, tracks, fallback, download }: { src: string; poster: string; label: string; tracks: Track[]; fallback: string; download: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      // The contents on phones fold away after a jump, and the reader lands on the section's heading.
      const toc = target?.closest<HTMLDetailsElement>("details[data-toc]");
      if (toc && target?.closest("a")) toc.open = false;
      const section = target?.closest<HTMLAnchorElement>('a[href^="#guide-"]');
      if (section) requestAnimationFrame(() => document.getElementById(`${section.hash.slice(1)}-title`)?.focus({ preventScroll: true }));
      const link = target?.closest<HTMLElement>("[data-seek]");
      const video = ref.current;
      if (!link || !video || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = Number(link.dataset.seek);
      if (!Number.isFinite(t) || t < 0) return;
      e.preventDefault();
      // Before the video has loaded, the browser keeps this as the time to start from.
      video.currentTime = t;
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      video.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
      video.focus({ preventScroll: true });
      void video.play().catch(() => undefined);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <video
      ref={ref}
      id="guide-video"
      aria-label={label}
      controls
      playsInline
      preload="none"
      poster={poster}
      width={1280}
      height={720}
      className="aspect-video h-auto w-full scroll-mt-24 rounded-2xl border border-line bg-ink shadow-sm"
    >
      <source src={src} type="video/mp4" />
      {tracks.map((t) => (
        <track key={`${t.kind}-${t.srcLang}`} kind={t.kind} src={t.src} srcLang={t.srcLang} label={t.label} default={t.isDefault} />
      ))}
      <a href={src} download>
        {fallback} {download}
      </a>
    </video>
  );
}
