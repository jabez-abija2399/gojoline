import { useSite } from "../lib/context";
import type { MarqueeSection } from "../lib/types";

/** A ribbon of words moving slowly across the page; still and wrapped for visitors who ask for less motion. */
export function Marquee({ section }: { section: MarqueeSection }) {
  const { text } = useSite();
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
    <section id={section.id} className={`marquee overflow-hidden py-5 md:py-7 ${cls}`}>
      <div className="marquee-row">
        {list(false)}
        {list(true)}
      </div>
    </section>
  );
}
