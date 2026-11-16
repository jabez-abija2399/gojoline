import { useState } from "react";
import { useSite } from "../lib/context";
import { PauseButton } from "./PauseButton";

/** A thin strip above the menu with a few short lines moving slowly; still and wrapped for less motion. */
export function Announcement() {
  const { site, text } = useSite();
  const [paused, setPaused] = useState(false);
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
    <div data-paused={paused || undefined} className="announce marquee bg-accent text-on-accent">
      <div className="marquee-row announce-row">
        {list(false)}
        {list(true)}
      </div>
      <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} className="absolute end-1 top-1/2 -translate-y-1/2" />
    </div>
  );
}
