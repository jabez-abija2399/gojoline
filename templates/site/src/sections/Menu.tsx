import { Picture } from "../components/Picture";
import { SectionHead } from "../components/SectionHead";
import { formatPrice } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { MenuSection } from "../lib/types";

export function Menu({ section }: { section: MenuSection }) {
  const { text, lang } = useSite();
  return (
    <section id={section.id ?? "menu"} className="section">
      <div className="container-site flex flex-col gap-8 md:gap-10">
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
        <div className="grid gap-8 md:grid-cols-2">
          {section.categories.map((cat, ci) => (
            <div key={ci} className="card menu-card reveal lift p-6">
              <h3 className="border-b border-line pb-3 text-2xl font-bold">{text(cat.name)}</h3>
              <ul className="mt-2 flex flex-col">
                {cat.items.map((item, ii) => (
                  <li key={ii} className="flex items-center gap-4 py-3">
                    {item.image?.src && <Picture image={item.image} sizes="80px" className="size-20 flex-none rounded-site" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-end gap-3">
                        <p className="font-semibold">
                          {text(item.name)}
                          {item.tag && <span className="ms-2 rounded-full bg-primary-soft px-2 py-0.5 text-sm font-medium">{text(item.tag)}</span>}
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
