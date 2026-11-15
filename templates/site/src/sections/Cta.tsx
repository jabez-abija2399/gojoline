import { SectionTitle } from "../components/SectionTitle";
import { useSite } from "../lib/context";
import type { CtaSection } from "../lib/types";

/** One clear ask on a dark band, for the end of a page. */
export function Cta({ section }: { section: CtaSection }) {
  const { text, href } = useSite();
  return (
    <section id={section.id} className="section">
      <div className="container-site">
        <div className="reveal relative isolate flex flex-col items-start gap-6 overflow-hidden rounded-site bg-accent px-6 py-12 text-on-accent sm:px-12 md:flex-row md:items-center md:justify-between md:py-16">
          {/* Two soft circles in the brand colour: depth without a picture. */}
          <svg aria-hidden="true" viewBox="0 0 400 200" preserveAspectRatio="xMaxYMid slice" className="absolute inset-0 -z-10 size-full">
            <circle cx="360" cy="20" r="120" className="fill-primary opacity-40" />
            <circle cx="300" cy="210" r="90" className="fill-primary opacity-25" />
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
              <a href={href(section.secondaryAction.href)} className="btn btn-outline">
                {text(section.secondaryAction.label)}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
