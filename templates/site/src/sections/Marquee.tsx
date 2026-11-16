import { useState } from "react";
import { PauseButton } from "../components/PauseButton";
import { useSite } from "../lib/context";
import type { MarqueeSection } from "../lib/types";

/** A ribbon of words moving slowly across the page; still and wrapped for visitors who ask for less motion. */
export function Marquee({ section }: { section: MarqueeSection }) {
  const { text } = useSite();
  const [paused, setPaused] = useState(false);
  const tone = section.tone ?? "dark";
  const cls = tone === "primary" ? "bg-primary text-on-primary" : tone === "light" ? "bg-primary-soft text-text" : "on-dark bg-accent text-on-accent";
  const list = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="marquee-track">
      {section.items.map((item, i) => (
        <li key={i}>{text(item)}</li>
      ))}
    </ul>
  );
  return (
    <section id={section.id} data-paused={paused || undefined} className={`marquee relative overflow-hidden py-5 md:py-7 ${cls}`}>
      <div className="marquee-row">
        {list(false)}
        {list(true)}
      </div>
      <PauseButton paused={paused} onToggle={() => setPaused((p) => !p)} className="absolute end-2 top-1/2 -translate-y-1/2" />
    </section>
  );
}
