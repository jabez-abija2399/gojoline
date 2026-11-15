import { useSite } from "../lib/context";
import type { Image } from "../lib/types";

interface Props {
  image?: Image;
  className?: string;
  /** Set for the first, above-the-fold image only. */
  priority?: boolean;
  sizes?: string;
}

/**
 * A photo, or a tasteful placeholder in the theme colours when no photo exists yet.
 * Placeholders are decorative (no alt) so screen readers skip them.
 */
export function Picture({ image, className = "", priority = false, sizes = "100vw" }: Props) {
  const { text } = useSite();
  if (!image?.src) {
    return (
      <div aria-hidden="true" className={`placeholder relative overflow-hidden bg-primary-soft ${className}`}>
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
          <circle cx="320" cy="60" r="90" className="fill-accent opacity-15" />
          <circle cx="60" cy="260" r="120" className="fill-primary opacity-15" />
          <path d="M0 220 Q 100 170 200 210 T 400 190 V300 H0Z" className="fill-primary opacity-20" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={image.src}
      alt={text(image.alt)}
      width={image.width ?? 1200}
      height={image.height ?? 900}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      sizes={sizes}
      className={`object-cover ${className}`}
    />
  );
}
