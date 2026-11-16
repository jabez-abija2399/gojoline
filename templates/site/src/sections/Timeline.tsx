import { SectionTitle } from "../components/SectionTitle";
import { useSite } from "../lib/context";
import type { TimelineSection } from "../lib/types";

/** A vertical line with dots: work, studies, milestones. */
export function Timeline({ section }: { section: TimelineSection }) {
  const { text } = useSite();
  return (
    <section id={section.id ?? "timeline"} className="section">
      <div className="container-site flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          {section.eyebrow && <p className="eyebrow">{text(section.eyebrow)}</p>}
          <SectionTitle>{text(section.heading)}</SectionTitle>
          {section.intro && <p className="max-w-[60ch] text-muted">{text(section.intro)}</p>}
        </div>
        <ol role="list" className="relative flex flex-col gap-6 border-s-2 border-line ps-8">
          {section.items.map((item, i) => (
            <li key={i} className="reveal relative">
              {/* -start = ps-8 (32px) + border-s-2 (2px) + half the 16px dot (8px) - 1px. */}
              <span aria-hidden="true" className="absolute top-2 -start-[41px] size-4 rounded-full border-4 border-background bg-primary" />
              <div className="card lift flex flex-col gap-1 p-5">
                <h3 className="text-xl font-bold">{text(item.title)}</h3>
                {/* After the heading in the markup (heading navigation hears it), shown above it. */}
                <p className="order-first text-sm font-semibold">{text(item.period)}</p>
                {item.place && <p className="text-muted">{text(item.place)}</p>}
                {item.description && <p className="mt-1 whitespace-pre-line">{text(item.description)}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
