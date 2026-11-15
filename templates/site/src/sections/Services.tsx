import { SectionTitle } from "../components/SectionTitle";
import { Icon } from "../components/Icon";
import { formatPrice } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { ServicesSection } from "../lib/types";

export function Services({ section }: { section: ServicesSection }) {
  const { text, lang } = useSite();
  return (
    <section id={section.id ?? "services"} className="section">
      <div className="container-site flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <SectionTitle>{text(section.heading)}</SectionTitle>
          {section.intro && <p className="max-w-[60ch] text-muted">{text(section.intro)}</p>}
        </div>
        {/* Bento: with 4+ items the first one is a feature tile, sized so the grid has no holes. */}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item, i) => (
            <li key={i} className={`card tilt reveal flex flex-col gap-3 p-6 ${i === 0 ? featureClass(section.items.length) : ""}`}>
              <span className="flex size-12 items-center justify-center rounded-site bg-primary-soft text-primary">
                <Icon name={item.icon ?? "check"} />
              </span>
              <h3 className="text-xl font-bold">{text(item.title)}</h3>
              <p className="whitespace-pre-line text-muted">{text(item.description)}</p>
              {item.price && <p className="mt-auto font-semibold">{formatPrice(item.price, lang)}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Grid classes for the first (feature) tile so every row is full at 2 and 3 columns. */
export function featureClass(count: number): string {
  if (count < 4) return "";
  const sm = count % 2 === 0 ? "" : "sm:col-span-2";
  const r = (count - 1) % 3;
  const lg = r === 0 ? "lg:col-span-3" : r === 1 ? "lg:col-span-2" : "lg:col-span-2 lg:row-span-2";
  return `${sm} ${lg} lg:justify-end lg:border-primary/40 lg:p-8`.trim();
}
