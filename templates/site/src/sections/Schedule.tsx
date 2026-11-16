import { SectionHead } from "../components/SectionHead";
import { useSite } from "../lib/context";
import type { ScheduleSection } from "../lib/types";

/** Times and what happens then: services, prayers, classes, a programme. */
export function Schedule({ section }: { section: ScheduleSection }) {
  const { text } = useSite();
  const tiles = section.layout === "tiles";
  const n = section.items.length;
  return (
    <section id={section.id ?? "schedule"} className="section">
      <div className={`container-site ${tiles ? "flex flex-col gap-8 md:gap-10" : "grid gap-8 md:grid-cols-[1fr_1.4fr] md:gap-14"}`}>
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
        <div className="flex flex-col gap-4">
          {tiles ? (
            <ul className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${n >= 6 ? "lg:grid-cols-6" : n === 5 ? "lg:grid-cols-5" : n === 4 ? "lg:grid-cols-4" : ""}`}>
              {section.items.map((item, i) => (
                <li key={i} className="card reveal flex flex-col gap-1 p-4 text-center">
                  <span className="font-semibold">{text(item.title)}</span>
                  <span className="time-value">{text(item.time)}</span>
                  {item.note && <span className="text-sm text-muted">{text(item.note)}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="border-t border-line">
              {section.items.map((item, i) => (
                <li key={i} className="reveal grid grid-cols-[minmax(6.5rem,auto)_1fr] items-baseline gap-x-5 border-b border-line py-4">
                  <span className="time-value">{text(item.time)}</span>
                  <span className="flex flex-col">
                    <span className="text-lg font-semibold">{text(item.title)}</span>
                    {item.note && <span className="text-muted">{text(item.note)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {section.footnote && <p className="text-muted">{text(section.footnote)}</p>}
        </div>
      </div>
    </section>
  );
}
