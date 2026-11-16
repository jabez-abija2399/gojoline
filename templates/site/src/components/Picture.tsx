import { useSite } from "../lib/context";
import type { Image } from "../lib/types";
import { Art } from "./Art";

interface Props {
  image?: Image;
  className?: string;
  /** Set for the first, above-the-fold image only. */
  priority?: boolean;
  sizes?: string;
}

/** Library photos named "...-hero-..." also exist 1600 px wide, for full-width use on big screens. */
const WIDE = /^\/stock\/[\w-]*-hero-[\w-]*\.webp$/;

/**
 * A photo, or a drawing in the theme colours when no photo exists yet (`image.art` picks
 * which one). Drawings are decorative (no alt) so screen readers skip them.
 */
export function Picture({ image, className = "", priority = false, sizes = "100vw" }: Props) {
  const { text } = useSite();
  if (!image?.src) {
    return (
      <div aria-hidden="true" className={`placeholder relative overflow-hidden bg-primary-soft ${className}`}>
        <Art name={image?.art} seed={(image?.alt.en ?? image?.alt.am ?? "") + className} />
      </div>
    );
  }
  const wide = WIDE.test(image.src);
  return (
    <img
      src={image.src}
      srcSet={wide ? `${image.src} 800w, ${image.src.replace(/\.webp$/, "-1600.webp")} 1600w` : undefined}
      alt={text(image.alt)}
      width={image.width ?? 1200}
      height={image.height ?? 900}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      sizes={wide ? sizes : undefined}
      className={`object-cover object-[50%_32%] ${className}`}
    />
  );
}
