import { SectionHead } from "../components/SectionHead";
import { useSite } from "../lib/context";
import type { StepsSection } from "../lib/types";

/** How it works, in order. */
export function Steps({ section }: { section: StepsSection }) {
  const { text, href } = useSite();
  const n = section.items.length;
  return (
    <section id={section.id ?? "steps"} className="section bg-surface">
      <div className="container-site flex flex-col gap-8 md:gap-12">
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
        <ol className={`steps grid gap-x-8 gap-y-8 sm:grid-cols-2 ${n === 3 ? "lg:grid-cols-3" : n >= 4 ? "lg:grid-cols-4" : ""}`}>
          {section.items.map((item, i) => (
            <li key={i} className="reveal flex gap-4 lg:flex-col">
              <span aria-hidden="true" className="step-number">
                {i + 1}
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xl font-bold">{text(item.title)}</h3>
                {item.description && <p className="text-muted">{text(item.description)}</p>}
              </div>
            </li>
          ))}
        </ol>
        {section.action && (
          <a href={href(section.action.href)} className="btn btn-primary w-fit">
            {text(section.action.label)}
          </a>
        )}
      </div>
    </section>
  );
}
