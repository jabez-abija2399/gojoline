import { SectionTitle } from "../components/SectionTitle";
import { formatPrice } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { MenuSection } from "../lib/types";

export function Menu({ section }: { section: MenuSection }) {
  const { text, lang } = useSite();
  return (
    <section id={section.id ?? "menu"} className="section">
      <div className="container-site flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <SectionTitle>{text(section.heading)}</SectionTitle>
          {section.intro && <p className="max-w-[60ch] text-muted">{text(section.intro)}</p>}
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {section.categories.map((cat, ci) => (
            <div key={ci} className="card reveal lift p-6">
              <h3 className="text-xl font-bold">{text(cat.name)}</h3>
              <ul className="mt-4 flex flex-col divide-y divide-line">
                {cat.items.map((item, ii) => (
                  <li key={ii} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="font-semibold">
                        {text(item.name)}
                        {item.tag && (
                          <span className="ms-2 rounded-full bg-primary-soft px-2 py-0.5 text-sm font-medium">{text(item.tag)}</span>
                        )}
                      </p>
                      {item.description && <p className="whitespace-pre-line text-muted">{text(item.description)}</p>}
                    </div>
                    {item.price && <p className="shrink-0 font-semibold whitespace-nowrap">{formatPrice(item.price, lang)}</p>}
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
