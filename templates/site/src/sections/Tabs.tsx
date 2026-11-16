import { useState } from "react";
import { Icon } from "../components/Icon";
import { Picture } from "../components/Picture";
import { SectionHead } from "../components/SectionHead";
import { ItemTitle } from "../components/SectionTitle";
import { useSite } from "../lib/context";
import type { TabsSection } from "../lib/types";

/** Topics as tabs that swap a picture and a short text. Without JavaScript the first one shows. */
export function Tabs({ section }: { section: TabsSection }) {
  const { text, href } = useSite();
  const [active, setActive] = useState(0);
  const base = section.id ?? "tabs";
  const item = section.items[active] ?? section.items[0]!;
  const move = (dir: 1 | -1) => {
    const next = (active + dir + section.items.length) % section.items.length;
    setActive(next);
    document.getElementById(`${base}-tab-${next}`)?.focus();
  };
  return (
    <section id={section.id ?? "tabs"} className="section">
      <div className="container-site flex flex-col gap-8 md:gap-10">
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
        <div role="tablist" aria-label={text(section.heading)} className="menu-tabs" onKeyDown={(e) => (e.key === "ArrowRight" ? move(1) : e.key === "ArrowLeft" ? move(-1) : undefined)}>
          {section.items.map((it, i) => (
            <button key={i} id={`${base}-tab-${i}`} type="button" role="tab" aria-selected={i === active} aria-controls={`${base}-panel`} tabIndex={i === active ? 0 : -1} onClick={() => setActive(i)} className="menu-tab">
              {text(it.label)}
            </button>
          ))}
        </div>
        <div key={active} id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`} className="tab-panel grid items-center gap-8 md:grid-cols-2 md:gap-14">
          <div className="zoom rounded-site">
            <Picture image={item.image} sizes="(min-width: 768px) 50vw, 160px" className="aspect-[4/3] w-full rounded-site" />
          </div>
          <div className="flex flex-col gap-4">
            {item.heading && <ItemTitle className="font-heading text-3xl leading-tight md:text-4xl">{text(item.heading)}</ItemTitle>}
            <p className="max-w-[60ch] whitespace-pre-line text-lg text-muted">{text(item.body)}</p>
            {item.points && item.points.length > 0 && (
              <ul className="flex flex-col gap-2.5">
                {item.points.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 flex-none items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Icon name="check" className="size-4" />
                    </span>
                    <span>{text(p)}</span>
                  </li>
                ))}
              </ul>
            )}
            {item.action && (
              <a href={href(item.action.href)} className="btn btn-primary mt-2 w-fit">
                {text(item.action.label)}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
