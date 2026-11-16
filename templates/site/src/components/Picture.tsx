import { withBase } from "../lib/base";
import { useSite } from "../lib/context";
import type { Image } from "../lib/types";
import { Art } from "./Art";

interface Props {
  image?: Image;
  className?: string;
  /** Set for the first, above-the-fold image only. */
  priority?: boolean;
  /**
   * How wide the picture is shown. On phones the hints are deliberately smaller than the real
   * width, so a 3x screen takes the 480 px (cards) or 800 px (hero) file instead of the next
   * one up: the difference is hard to see and saves most of the download on a slow connection.
   */
  sizes?: string;
  /** The picture runs the full width of the page: big screens may take the 1600 px file. */
  wide?: boolean;
}

/** Library photos: every one exists 480 and 800 px wide; "-hero-" ones also 1600 px wide. */
const STOCK = /^\/stock\/[a-z0-9-]+\.webp$/;
const HERO = /-hero-/;

/**
 * A photo, or a drawing in the theme colours when no photo exists yet (`image.art` picks
 * which one). Drawings are decorative (no alt) so screen readers skip them.
 */
export function Picture({ image, className = "", priority = false, sizes = "(min-width: 768px) 50vw, 160px", wide = false }: Props) {
  const { text } = useSite();
  if (!image?.src) {
    return (
      <div aria-hidden="true" className={`placeholder relative overflow-hidden bg-primary-soft ${className}`}>
        <Art name={image?.art} seed={(image?.alt.en ?? image?.alt.am ?? "") + className} />
      </div>
    );
  }
  const stock = STOCK.test(image.src);
  const src = withBase(image.src);
  const base = src.replace(/\.webp$/, "");
  const srcSet = stock ? `${base}-480.webp 480w, ${src} 800w${wide && HERO.test(image.src) ? `, ${base}-1600.webp 1600w` : ""}` : undefined;
  return (
    <img
      src={src}
      srcSet={srcSet}
      alt={text(image.alt)}
      width={image.width ?? 1200}
      height={image.height ?? 900}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      sizes={stock ? sizes : undefined}
      className={`object-cover object-[50%_32%] ${className}`}
    />
  );
}
