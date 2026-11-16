import { useRef, useState } from "react";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { Image } from "../lib/types";
import { Picture } from "./Picture";

/** Several photos of one thing inside a card: swipe (or use the arrows on a computer), with a 1/4 counter. */
export function CardPhotos({ photos, sizes, title }: { photos: Image[]; sizes: string; title: string }) {
  const { lang } = useSite();
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const next = Math.max(0, Math.min(photos.length - 1, at + dir));
    el.scrollTo({ left: next * el.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <div className="card-photos relative">
      <div ref={ref} tabIndex={0} role="group" aria-label={uiText("photosOf", lang).replace("{title}", title).replace("{i}", String(at + 1)).replace("{n}", String(photos.length))} onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))} className="card-photos-strip">
        {photos.map((p, i) => (
          <Picture key={i} image={p} sizes={sizes} className="aspect-[4/3] w-full flex-none snap-start" />
        ))}
      </div>
      <span aria-hidden="true" className="card-photos-count">
        {at + 1}/{photos.length}
      </span>
      <button type="button" onClick={() => go(-1)} aria-disabled={at === 0} aria-label={uiText("previous", lang)} className="card-photos-arrow start-2">
        ‹
      </button>
      <button type="button" onClick={() => go(1)} aria-disabled={at === photos.length - 1} aria-label={uiText("next", lang)} className="card-photos-arrow end-2">
        ›
      </button>
    </div>
  );
}
