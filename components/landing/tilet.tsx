import { useId } from "react";

/**
 * A woven border in the spirit of tilet (ጥለት), the patterned edge of Ethiopian cloth:
 * diamonds and small crosses between two threads. Decoration only, in brand colours.
 */
export function Tilet({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const id = useId();
  // On sand: clay diamonds, teal crosses. On teal: lighter threads of the same two colours.
  const c = tone === "dark" ? { main: "var(--gojo-clay-light)", second: "var(--gojo-teal-mid)", thread: "var(--gojo-teal-soft)" } : { main: "var(--gojo-clay)", second: "var(--gojo-teal)", thread: "var(--gojo-teal-mid)" };
  return (
    <svg aria-hidden="true" focusable="false" className={`block h-5 w-full ${className}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={id} width="40" height="20" patternUnits="userSpaceOnUse">
          <rect y="0.5" width="40" height="1.5" fill={c.thread} />
          <rect y="18" width="40" height="1.5" fill={c.thread} />
          <path d="M20 4 26 10 20 16 14 10Z" fill={c.main} />
          <path d="M20 7.5 22.5 10 20 12.5 17.5 10Z" fill={tone === "dark" ? "var(--gojo-teal)" : "var(--gojo-sand)"} />
          <path d="M-1.5 6.5h3v2h2v3h-2v2h-3v-2h-2v-3h2zM38.5 6.5h3v2h2v3h-2v2h-3v-2h-2v-3h2z" fill={c.second} />
          <path d="M8 9h3v2H8zM29 9h3v2h-3z" fill={c.main} opacity="0.55" />
        </pattern>
      </defs>
      <rect width="100%" height="20" fill={`url(#${id})`} />
    </svg>
  );
}
