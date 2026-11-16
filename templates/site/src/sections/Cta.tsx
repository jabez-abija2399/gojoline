import { Picture } from "../components/Picture";
import { SectionTitle } from "../components/SectionTitle";
import { useSite } from "../lib/context";
import type { CtaSection } from "../lib/types";

/** One clear ask on a dark band, for the end of a page. */
export function Cta({ section }: { section: CtaSection }) {
  const { text, href } = useSite();
  const photo = Boolean(section.image?.src);
  return (
    <section id={section.id} className="section">
      <div className="container-site">
        <div className={`on-dark reveal relative isolate flex flex-col items-start gap-6 overflow-hidden rounded-site px-6 py-12 sm:px-12 md:flex-row md:items-center md:justify-between md:py-16 ${photo ? "bg-black text-white md:py-24" : "bg-accent text-on-accent"}`}>
          {/* Two faint circles in the band's own text colour: depth, and text over them stays readable in any theme. */}
          {photo && (
            <>
              <Picture image={section.image} sizes="(min-width: 768px) 100vw, 70vw" className="absolute inset-0 -z-10 size-full" />
              <span aria-hidden="true" className="absolute inset-0 -z-10 bg-black/60" />
            </>
          )}
          <svg aria-hidden="true" viewBox="0 0 400 200" preserveAspectRatio="xMaxYMid slice" className={`absolute inset-0 -z-10 size-full ${photo ? "hidden" : ""}`}>
            <circle cx="360" cy="20" r="120" className="fill-on-accent opacity-[0.07]" />
            <circle cx="300" cy="210" r="90" className="fill-on-accent opacity-[0.05]" />
          </svg>
          <div className="flex max-w-[46ch] flex-col gap-3">
            <SectionTitle className="font-heading text-3xl font-bold md:text-4xl">{text(section.heading)}</SectionTitle>
            {section.body && <p className="text-lg">{text(section.body)}</p>}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col lg:flex-row">
            <a href={href(section.primaryAction.href)} className="btn btn-primary">
              {text(section.primaryAction.label)}
            </a>
            {section.secondaryAction && (
              <a href={href(section.secondaryAction.href)} className={`btn ${photo ? "btn-glass" : "btn-outline"}`}>
                {text(section.secondaryAction.label)}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
