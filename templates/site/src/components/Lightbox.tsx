import { useEffect, useRef, type PointerEvent } from "react";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { Image } from "../lib/types";

/** Large view of one photo of a set: arrows, keyboard (← →, Esc) and swipe. Uses the browser's own dialog. */
export function Lightbox({ images, index, onChange, onClose }: { images: Image[]; index: number | null; onChange: (i: number) => void; onClose: () => void }) {
  const { text, lang } = useSite();
  const ref = useRef<HTMLDialogElement>(null);
  const startX = useRef<number | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);
  const n = images.length;
  const go = (dir: 1 | -1) => index !== null && onChange((index + dir + n) % n);
  const image = index !== null ? images[index] : undefined;
  const src = image?.src && /^\/stock\/[a-z0-9-]+-hero-[a-z0-9-]+\.webp$/.test(image.src) ? image.src.replace(/\.webp$/, "-1600.webp") : image?.src;
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onPointerDown={(e: PointerEvent) => (startX.current = e.clientX)}
      onPointerUp={(e: PointerEvent) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
      aria-label={image ? text(image.alt) : undefined}
      className="lightbox"
    >
      {image && (
        <figure className="flex h-full flex-col items-center justify-center gap-3 p-4">
          {src && <img src={src} alt={text(image.alt)} className="max-h-[78dvh] w-auto max-w-full rounded-site object-contain" />}
          <figcaption className="text-center">
            <span className="block">{text(image.alt)}</span>
            <span className="text-sm opacity-80">{uiText("photoOf", lang).replace("{i}", String(index! + 1)).replace("{n}", String(n))}</span>
          </figcaption>
        </figure>
      )}
      <button type="button" onClick={onClose} aria-label={uiText("close", lang)} className="lightbox-btn end-3 top-3">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label={uiText("previous", lang)} className="lightbox-btn start-3 top-1/2 -translate-y-1/2">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button type="button" onClick={() => go(1)} aria-label={uiText("next", lang)} className="lightbox-btn end-3 top-1/2 -translate-y-1/2">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}
    </dialog>
  );
}
