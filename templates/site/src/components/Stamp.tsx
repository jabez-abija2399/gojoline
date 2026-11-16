import { useId } from "react";

/** A few words round a circle that turns slowly (motion.css). Decorative: the words are said elsewhere on the page. */
export function Stamp({ text, className = "" }: { text: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const words = `${text} · ${text} · `;
  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" className={`stamp ${className}`}>
      <defs>
        <path id={`stamp-${id}`} d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
      </defs>
      <circle cx="60" cy="60" r="58" className="stamp-disc" />
      <text className="stamp-text">
        <textPath href={`#stamp-${id}`} textLength="276" lengthAdjust="spacingAndGlyphs">
          {words}
        </textPath>
      </text>
      <path d="M60 50l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" className="stamp-star" />
    </svg>
  );
}
