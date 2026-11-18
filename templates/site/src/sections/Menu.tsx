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
  const dark = section.tone === "dark";
  if (section.layout === "table") return <PriceTable section={section} dark={dark} />;
  return (
    <section id={section.id ?? "menu"} className={`section ${dark ? "bg-accent text-on-accent on-dark" : ""}`}>
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
                            <p className="shrink-0 font-heading text-lg font-bold whitespace-nowrap">
                              {formatPrice(item.price, lang)}
                              {item.unit && <span className="ms-1 font-body text-sm font-normal opacity-80">/ {text(item.unit)}</span>}
                            </p>
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

/**
 * One price table: what it is, the unit it is sold by, the price, and a short tag ("In stock").
 * Figures line up (tabular numbers) so a buyer can compare at a glance; each category is a group.
 */
function PriceTable({ section, dark }: { section: MenuSection; dark: boolean }) {
  const { text, lang } = useSite();
  return (
    <section id={section.id ?? "prices"} className={`section ${dark ? "bg-accent text-on-accent on-dark" : ""}`}>
      <div className="container-site flex flex-col gap-8 md:gap-10">
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
        <table className="price-table reveal w-full border-collapse">
          <thead className="sr-only">
            <tr>
              <th scope="col">{uiText("item", lang)}</th>
              <th scope="col">{uiText("unit", lang)}</th>
              <th scope="col">{uiText("price", lang)}</th>
            </tr>
          </thead>
          {section.categories.map((cat, ci) => (
            <tbody key={ci}>
              <tr>
                <th colSpan={3} scope="rowgroup" className="price-group">
                  {text(cat.name)}
                </th>
              </tr>
              {cat.items.map((item, ii) => (
                <tr key={ii} className="price-row">
                  <th scope="row" className="py-3 pe-3 text-start font-normal">
                    <span className="font-semibold">{text(item.name)}</span>
                    {item.description && <span className="block text-sm opacity-80">{text(item.description)}</span>}
                    {item.tag && <span className="price-tag">{text(item.tag)}</span>}
                  </th>
                  <td className="price-unit py-3 pe-3 text-sm">{item.unit ? text(item.unit) : ""}</td>
                  <td className="price-value py-3 text-end font-heading text-lg font-bold whitespace-nowrap">{item.price ? formatPrice(item.price, lang) : ""}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
