import { useNextTime } from "../components/NextUp";
import { SectionHead } from "../components/SectionHead";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { ScheduleSection } from "../lib/types";

/** Times and what happens then: services, prayers, classes, a programme. */
export function Schedule({ section }: { section: ScheduleSection }) {
  const { text, lang } = useSite();
  // With "at" times, the next one is marked, with how long until it (prayers, services, classes).
  const next = useNextTime(section.items.map((i) => i.at));
  const until = (m: number) => {
    const h = Math.floor(m / 60);
    const t = h ? `${h} ${uiText("hourShort", lang)} ${m % 60} ${uiText("minuteShort", lang)}` : `${m} ${uiText("minuteShort", lang)}`;
    return uiText("inTime", lang).replace("{t}", t);
  };
  const badge = (i: number) =>
    next?.index === i ? (
      <span className="next-badge">
        {uiText("nextUp", lang)} · {until(next.inMinutes)}
      </span>
    ) : null;
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
                <li key={i} aria-current={next?.index === i ? "time" : undefined} className="card reveal schedule-tile flex flex-col gap-1 p-4 text-center">
                  <span className="font-semibold">{text(item.title)}</span>
                  <span className="time-value">{text(item.time)}</span>
                  {item.note && <span className="small-label text-muted">{text(item.note)}</span>}
                  {badge(i)}
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
                    {badge(i)}
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
