import { DateLine } from "../components/DateLine";
import { useNextTime } from "../components/NextUp";
import { SectionHead } from "../components/SectionHead";
import { ItemTitle } from "../components/SectionTitle";
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
  if (section.layout === "week") {
    // Days in the order they first appear, each with its items: a column per day, swiped on phones.
    const days: { day: string; items: typeof section.items }[] = [];
    for (const item of section.items) {
      const day = item.day ? text(item.day) : "";
      const group = days.find((d) => d.day === day) ?? (days.push({ day, items: [] }), days[days.length - 1]!);
      group.items.push(item);
    }
    return (
      <section id={section.id ?? "schedule"} className="section">
        <div className="container-site flex flex-col gap-8 md:gap-10">
          <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
          {/* Scrolls sideways on phones: focusable and named, so keyboards can reach every day. */}
          <ul className="week-grid" tabIndex={0} aria-label={text(section.heading)} style={{ "--days": days.length } as React.CSSProperties}>
            {days.map((d, di) => (
              <li key={di} className="week-day reveal" style={{ "--i": di } as React.CSSProperties}>
                {d.day && <ItemTitle className="week-day-name">{d.day}</ItemTitle>}
                <ul className="flex flex-col gap-2">
                  {d.items.map((item, ii) => (
                    <li key={ii} className="week-slot">
                      <span className="time-value">{text(item.time)}</span>
                      <span className="font-semibold">{text(item.title)}</span>
                      {item.note && <span className="week-note">{text(item.note)}</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {section.footnote && <p className="text-muted">{text(section.footnote)}</p>}
        </div>
      </section>
    );
  }
  return (
    <section id={section.id ?? "schedule"} className="section">
      <div className={`container-site ${tiles ? "flex flex-col gap-8 md:gap-10" : "grid gap-8 md:grid-cols-[1fr_1.4fr] md:gap-14"}`}>
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro}>
          {section.dates && section.dates.length > 0 && <DateLine calendars={section.dates} />}
        </SectionHead>
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
            <ul className="schedule-list border-t border-line">
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
