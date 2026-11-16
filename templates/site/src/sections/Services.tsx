import { Icon } from "../components/Icon";
import { Picture } from "../components/Picture";
import { SectionHead } from "../components/SectionHead";
import { ItemTitle } from "../components/SectionTitle";
import { formatPrice } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { ServicesSection } from "../lib/types";

export function Services({ section }: { section: ServicesSection }) {
  const { text, lang } = useSite();
  const variant = section.variant ?? "bento";
  const list = (
variant === "list" ? (
          // Compact rows: what a place has (amenities, departments), read at a glance.
          <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, i) => (
              <li key={i} style={{ "--i": i % 3 } as React.CSSProperties} className="reveal flex gap-4 border-t border-line py-5">
                <span className="flex size-11 flex-none items-center justify-center rounded-site bg-primary-soft text-primary">
                  <Icon name={item.icon ?? "check"} className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <ItemTitle className="text-lg">{text(item.title)}</ItemTitle>
                  <p className="whitespace-pre-line text-muted">{text(item.description)}</p>
                  {item.price && <p className="font-semibold">{formatPrice(item.price, lang)}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : variant === "numbered" ? (
          <ol className={`grid gap-x-10 gap-y-2 sm:grid-cols-2 ${section.items.length % 4 === 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {section.items.map((item, i) => (
              <li key={i} style={{ "--i": i % 3 } as React.CSSProperties} className="reveal flex flex-col gap-2 border-t-2 border-text py-6">
                <span aria-hidden="true" className="numeral">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <ItemTitle className="text-xl">{text(item.title)}</ItemTitle>
                <p className="whitespace-pre-line text-muted">{text(item.description)}</p>
                {item.price && <p className="mt-auto pt-2 font-semibold">{formatPrice(item.price, lang)}</p>}
              </li>
            ))}
          </ol>
        ) : (
          // Bento: with 4+ items the first one is a feature tile, sized so the grid has no holes.
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item, i) => (
              <li key={i} style={{ "--i": i % 3 } as React.CSSProperties} className={`card tilt reveal relative flex flex-col gap-3 overflow-hidden p-6 ${i === 0 ? featureClass(section.items.length) : ""}`}>
                {/* The large tile carries its icon again, big and faint, so it never looks empty. */}
                {i === 0 && section.items.length >= 4 && (
                  <span aria-hidden="true" className="pointer-events-none absolute -end-6 -top-6 hidden text-primary opacity-10 lg:block">
                    <Icon name={item.icon ?? "check"} className="size-48" />
                  </span>
                )}
                <span className="flex size-12 items-center justify-center rounded-site bg-primary-soft text-primary">
                  <Icon name={item.icon ?? "check"} />
                </span>
                <ItemTitle className="text-xl">{text(item.title)}</ItemTitle>
                <p className="whitespace-pre-line text-muted">{text(item.description)}</p>
                {item.price && <p className="mt-auto font-semibold">{formatPrice(item.price, lang)}</p>}
              </li>
            ))}
          </ul>
        )
  );
  return (
    <section id={section.id ?? "services"} className="section">
      <div className="container-site flex flex-col gap-8 md:gap-10">
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
        {section.image && variant !== "bento" ? (
          // A photo that stays in place beside the list while it scrolls (computers).
          <div className="grid gap-8 md:grid-cols-[2fr_3fr] md:gap-12">
            <div className="zoom wipe rounded-site md:sticky md:top-24 md:self-start">
              <Picture image={section.image} sizes="(min-width: 768px) 40vw, 160px" className="aspect-[4/5] w-full rounded-site max-md:aspect-[16/10]" />
            </div>
            <div className="pinned-list">{list}</div>
          </div>
        ) : (
          list
        )}
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
  return `${sm} ${lg} feature-tile lg:justify-end lg:border-primary/40 lg:p-8`.trim();
}
