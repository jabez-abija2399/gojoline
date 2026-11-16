import { Picture } from "../components/Picture";
import { useSite } from "../lib/context";
import type { QuoteSection } from "../lib/types";

/** One strong sentence in large type. */
export function Quote({ section }: { section: QuoteSection }) {
  const { text } = useSite();
  const name = section.name ? text(section.name) : "";
  return (
    <section id={section.id} className="section bg-primary-soft">
      <figure className={`container-site reveal grid items-center gap-8 ${section.image ? "md:grid-cols-[1fr_2fr] md:gap-14" : ""}`}>
        {section.image && (
          <div className="zoom mx-auto w-full max-w-xs rounded-site md:max-w-none">
            <Picture image={section.image} sizes="(min-width: 768px) 33vw, 160px" className="aspect-[4/5] w-full rounded-site" />
          </div>
        )}
        <div className={`flex flex-col gap-5 ${section.image ? "" : "mx-auto max-w-4xl items-center text-center"}`}>
          <span aria-hidden="true" className="quote-mark">
            “
          </span>
          <blockquote className="pull-quote">{text(section.quote)}</blockquote>
          {name && (
            <figcaption>
              <span className="font-semibold">{name}</span>
              {section.role && <span className="text-muted"> · {text(section.role)}</span>}
            </figcaption>
          )}
        </div>
      </figure>
    </section>
  );
}
