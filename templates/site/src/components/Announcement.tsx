import { useSite } from "../lib/context";

/** A thin strip above the menu with a few short lines moving slowly; still and wrapped for less motion. */
export function Announcement() {
  const { site, text } = useSite();
  const lines = site.announcement ?? [];
  if (!lines.length) return null;
  const list = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="announce-track">
      {[...lines, ...lines, ...lines].map((l, i) => (
        <li key={i} aria-hidden={i >= lines.length || undefined}>
          {text(l)}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="announce marquee bg-accent text-on-accent">
      <div className="marquee-row announce-row">
        {list(false)}
        {list(true)}
      </div>
    </div>
  );
}
