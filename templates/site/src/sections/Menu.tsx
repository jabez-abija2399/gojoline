import { useState } from "react";
import { Picture } from "../components/Picture";
import { SectionHead } from "../components/SectionHead";
import { ItemTitle } from "../components/SectionTitle";
import { formatPrice, uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { MenuSection } from "../lib/types";

export function Menu({ section }: { section: MenuSection }) {
  const { text, lang } = useSite();
  // With three or more categories, tabs show one at a time (all of them without JavaScript).
  const [active, setActive] = useState<number | null>(null);
  const tabs = section.categories.length >= 3;
  const shown = section.categories.map((cat, ci) => ({ cat, ci })).filter(({ ci }) => active === null || ci === active);
  return (
    <section id={section.id ?? "menu"} className="section">
      <div className="container-site flex flex-col gap-8 md:gap-10">
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
        {tabs && (
          <div role="group" aria-label={text(section.heading)} className="menu-tabs">
            {[null, ...section.categories.map((_, i) => i)].map((ci) => (
              <button key={ci ?? "all"} type="button" aria-pressed={active === ci} onClick={() => setActive(ci)} className="menu-tab">
                {ci === null ? uiText("all", lang) : text(section.categories[ci]!.name)}
              </button>
            ))}
          </div>
        )}
        <div className={`grid gap-8 ${shown.length > 1 ? "md:grid-cols-2" : "max-w-3xl"}`}>
          {shown.map(({ cat, ci }) => (
            <div key={ci} className="card menu-card reveal lift p-6">
              <ItemTitle className="border-b border-line pb-3 text-2xl">{text(cat.name)}</ItemTitle>
              <ul className="mt-2 flex flex-col">
                {cat.items.map((item, ii) => (
                  <li key={ii} className="flex items-center gap-4 py-3">
                    {item.image?.src && <Picture image={item.image} sizes="80px" className="size-16 flex-none rounded-site min-[400px]:size-20" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-end gap-x-3">
                        <p className="min-w-0 font-semibold [overflow-wrap:anywhere]">
                          {text(item.name)}
                          {item.tag && <span className="ms-2 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-sm font-medium whitespace-nowrap">{text(item.tag)}</span>}
                        </p>
                        {item.price && (
                          <>
                            <span aria-hidden="true" className="leader" />
                            <p className="shrink-0 font-heading text-lg font-bold whitespace-nowrap">{formatPrice(item.price, lang)}</p>
                          </>
                        )}
                      </div>
                      {item.description && <p className="max-w-[48ch] whitespace-pre-line text-muted">{text(item.description)}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
