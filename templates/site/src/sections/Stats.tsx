import { CountUp } from "../components/CountUp";
import { SectionTitle } from "../components/SectionTitle";
import { useSite } from "../lib/context";
import type { StatsSection } from "../lib/types";

/** A band of big numbers. */
export function Stats({ section }: { section: StatsSection }) {
  const { text } = useSite();
  const dark = (section.tone ?? "dark") === "dark";
  return (
    <section id={section.id} className={`stats-band py-14 md:py-20 ${dark ? "bg-accent text-on-accent on-dark" : "bg-primary-soft"}`}>
      <div className="container-site flex flex-col gap-10">
        {section.heading && <SectionTitle className="section-title max-w-3xl">{text(section.heading)}</SectionTitle>}
        <dl className={`grid grid-cols-2 gap-x-6 gap-y-10 ${section.items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
          {section.items.map((item, i) => (
            <div key={i} style={{ "--i": i } as React.CSSProperties} className={`reveal flex flex-col-reverse gap-1 border-s-2 ps-4 ${dark ? "border-current/30" : "border-primary"}`}>
              <dt className="max-w-[22ch] opacity-90">{text(item.label)}</dt>
              <dd className="stat-value">
                <CountUp value={text(item.value)} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
