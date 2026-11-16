import { useState } from "react";
import { Picture } from "../components/Picture";
import { CardPhotos } from "../components/CardPhotos";
import { Rail } from "../components/Rail";
import { SectionHead } from "../components/SectionHead";
import { ItemTitle } from "../components/SectionTitle";
import { formatPrice, uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { CardItem, CardsSection } from "../lib/types";

/** Cards with pictures: rooms, properties, tours, products, people, projects. */
export function Cards({ section }: { section: CardsSection }) {
  const { text, href, lang } = useSite();
  const layout = section.layout ?? "grid";
  // Pills by badge ("For sale", "For rent", "Trek") when cards carry two or more kinds.
  const kinds = [...new Set(section.items.map((it) => (it.badge ? text(it.badge) : "")).filter(Boolean))];
  const filterable = section.filters !== false && kinds.length >= 2 && section.items.length >= 4 && layout !== "stack" && layout !== "index";
  const [kind, setKind] = useState<string | null>(null);
  const items = kind ? section.items.filter((it) => it.badge && text(it.badge) === kind) : section.items;
  const arch = section.imageShape === "arch" ? "arch" : "";
  const n = items.length;
  return (
    <section id={section.id ?? "cards"} className={`section ${layout === "scroll" ? "overflow-hidden" : ""}`}>
      <div className="container-site flex flex-col gap-8 md:gap-12">
        <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
        {filterable && (
          <div role="group" aria-label={text(section.heading)} className="menu-tabs">
            {[null, ...kinds].map((k) => (
              <button key={k ?? "all"} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className="menu-tab">
                {k ?? uiText("all", lang)}
              </button>
            ))}
          </div>
        )}
        {layout === "index" ? (
          // Big titles in rows. On a computer the picture follows the mouse; on a phone it sits beside the title.
          <ul
            className="index-list dim-others"
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty("--x", `${Math.round(e.clientX - r.left)}px`);
              e.currentTarget.style.setProperty("--y", `${Math.round(e.clientY - r.top)}px`);
            }}
          >
            {items.map((item, i) => {
              const row = (
                <>
                  <span className="index-thumb">
                    <Picture image={item.image} sizes="120px" className="aspect-square size-full rounded-site" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
                    <span className="index-title">{text(item.title)}</span>
                    {item.subtitle && <span className="text-muted">{text(item.subtitle)}</span>}
                    {item.description && <span className="text-muted md:hidden">{text(item.description)}</span>}
                  </span>
                  {item.meta && item.meta.length > 0 && <span className="shrink-0 text-muted max-sm:hidden">{item.meta.map((m) => text(m)).join(" · ")}</span>}
                  {item.image?.src && (
                    <span aria-hidden="true" className="index-preview">
                      <Picture image={item.image} sizes="320px" className="aspect-[4/3] w-full rounded-site" />
                    </span>
                  )}
                </>
              );
              return (
                <li key={section.items.indexOf(item)} className="index-row reveal" style={{ "--i": 0 } as React.CSSProperties}>
                  {item.action ? (
                    <a href={href(item.action.href)} className="index-inner">
                      {row}
                    </a>
                  ) : (
                    <div className="index-inner">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : layout === "stack" ? (
          // Cards that pile up as the page scrolls: each one pins a little lower than the last.
          <ul className="stack flex flex-col gap-6">
            {items.map((item, i) => (
              <li key={section.items.indexOf(item)} style={{ "--i": i } as React.CSSProperties} className="stack-card card grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
                <div className="relative">
                  <Picture image={item.image} sizes="(min-width: 768px) 50vw, 160px" className="aspect-[16/10] size-full md:aspect-auto md:min-h-[24rem]" />
                  <Badge item={item} />
                </div>
                <div className="flex flex-col justify-center gap-3 p-6 md:p-10">
                  <Body item={item} large quiet />
                </div>
              </li>
            ))}
          </ul>
        ) : layout === "feature" ? (
          <ul className="flex flex-col gap-12 md:gap-20">
            {items.map((item, i) => (
              <li key={section.items.indexOf(item)} className="reveal grid items-center gap-6 md:grid-cols-2 md:gap-14">
                <div className={`zoom wipe relative rounded-site ${arch} ${i % 2 === 1 ? "md:order-last" : ""}`}>
                  <Picture image={item.image} sizes="(min-width: 768px) 50vw, 160px" className="aspect-[4/3] w-full rounded-site" />
                  <Badge item={item} />
                </div>
                <div className="flex flex-col gap-3">
                  <Body item={item} large />
                </div>
              </li>
            ))}
          </ul>
        ) : layout === "scroll" ? (
          <Rail label={text(section.heading)}>
            {items.map((item, i) => {
              const inner = (
                <>
                  <Picture image={item.image} sizes="(min-width: 640px) 20rem, 160px" className="absolute inset-0 size-full" />
                  {item.image?.src && <span aria-hidden="true" className="card-shade absolute inset-0" />}
                  <Badge item={item} />
                  <span className={`absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 ${item.image?.src ? "text-white" : ""}`}>
                    <span className="font-heading text-2xl leading-tight font-bold">{text(item.title)}</span>
                    {item.subtitle && <span>{text(item.subtitle)}</span>}
                    <PriceLine item={item} />
                  </span>
                </>
              );
              const cls = `zoom relative isolate block h-[26rem] w-[72vw] flex-none snap-start overflow-hidden rounded-site sm:w-80 ${arch}`;
              return (
                <li key={section.items.indexOf(item)} className="flex-none">
                  {item.action ? (
                    <a href={href(item.action.href)} className={cls}>
                      {inner}
                      <span className="sr-only">{text(item.action.label)}</span>
                    </a>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </li>
              );
            })}
          </Rail>
        ) : layout === "people" ? (
          <ul className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 ${n >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            {items.map((item, i) => (
              <li key={section.items.indexOf(item)} style={{ "--i": i % 4 } as React.CSSProperties} className="reveal flex flex-col gap-3">
                <div className={`zoom rounded-site ${arch}`}>
                  <Picture image={item.image?.src ? item.image : { art: "portrait", alt: item.title }} sizes="(min-width: 768px) 25vw, 120px" className="aspect-[4/5] w-full rounded-site" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <ItemTitle className="text-lg leading-snug">{text(item.title)}</ItemTitle>
                  {item.subtitle && <p className="font-semibold">{text(item.subtitle)}</p>}
                  {item.description && <p className="text-muted">{text(item.description)}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className={`dim-others grid gap-6 sm:grid-cols-2 ${n === 2 || n === 4 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
            {items.map((item, i) => (
              <li key={section.items.indexOf(item)} style={{ "--i": i % 3 } as React.CSSProperties} className="card pcard reveal lift flex flex-col overflow-hidden">
                <div className="zoom relative">
                  {item.photos && item.photos.length > 0 && item.image ? (
                    <CardPhotos title={text(item.title)} photos={[item.image, ...item.photos]} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 160px" />
                  ) : (
                    <Picture image={item.image} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 160px" className="aspect-[4/3] w-full" />
                  )}
                  <Badge item={item} />
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-5">
                  <Body item={item} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {section.action && (
          <a href={href(section.action.href)} className="btn btn-outline w-fit self-center">
            {text(section.action.label)}
          </a>
        )}
      </div>
    </section>
  );
}

function Badge({ item }: { item: CardItem }) {
  const { text } = useSite();
  if (!item.badge) return null;
  return <span className="badge absolute start-3 top-3">{text(item.badge)}</span>;
}

function PriceLine({ item }: { item: CardItem }) {
  const { text, lang } = useSite();
  if (!item.price) return null;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span className="font-heading text-xl font-bold">{formatPrice(item.price, lang)}</span>
      {item.priceNote && <span className="small-label">{text(item.priceNote)}</span>}
    </span>
  );
}

function Body({ item, large = false, quiet = false }: { item: CardItem; large?: boolean; /** A link, not a filled button: for cards that repeat the page's main action. */ quiet?: boolean }) {
  const { text, href } = useSite();
  return (
    <>
      {item.subtitle && <p className="eyebrow">{text(item.subtitle)}</p>}
      <ItemTitle className={large ? "font-heading text-3xl leading-tight md:text-4xl" : "text-xl leading-snug"}>{text(item.title)}</ItemTitle>
      {item.meta && item.meta.length > 0 && (
        <ul className="meta flex flex-wrap gap-x-3 gap-y-1 text-muted">
          {item.meta.map((m, i) => (
            <li key={i} className="meta-item">
              {text(m)}
            </li>
          ))}
        </ul>
      )}
      {item.description && <p className={`whitespace-pre-line text-muted ${large ? "max-w-[52ch] text-lg" : ""}`}>{text(item.description)}</p>}
      {(item.price || item.action) && (
        <div className={`flex flex-wrap items-center justify-between gap-3 ${large ? "mt-3" : "mt-auto border-t border-line pt-3"}`}>
          <PriceLine item={item} />
          {item.action && (
            <a href={href(item.action.href)} className={large && !quiet ? "btn btn-primary" : "arrow-link"}>
              {text(item.action.label)}
            </a>
          )}
        </div>
      )}
    </>
  );
}
