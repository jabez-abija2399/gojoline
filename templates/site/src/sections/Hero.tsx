import { Picture } from "../components/Picture";
import { useSite } from "../lib/context";
import type { HeroSection } from "../lib/types";

export function Hero({ section, first }: { section: HeroSection; first: boolean }) {
  const { site, text, href } = useSite();
  // On the home page's hero: when they are open (or, without hours, the phone number).
  // Up to two lines, so a business open on other days at other times isn't made to look closed.
  const hours = (site.business.hours ?? []).slice(0, 2).map((h) => `${text(h.days)} · ${text(h.time)}`);
  const chip = first ? (hours.length ? hours : site.business.phone ? [site.business.phone] : undefined) : undefined;
  const variant = section.variant ?? "split";
  const Heading = first ? "h1" : "h2";

  const actions = (
    <div className={`enter flex flex-col gap-3 sm:flex-row ${variant === "centered" ? "sm:justify-center" : ""}`} style={{ "--i": 3 } as React.CSSProperties}>
      {section.primaryAction && (
        <a href={href(section.primaryAction.href)} className="btn btn-primary">
          {text(section.primaryAction.label)}
        </a>
      )}
      {section.secondaryAction && (
        <a href={href(section.secondaryAction.href)} className="btn btn-outline">
          {text(section.secondaryAction.label)}
        </a>
      )}
    </div>
  );

  if (variant === "banner") {
    return (
      <section id={section.id} className="relative isolate overflow-hidden bg-accent text-on-accent">
        <Picture image={section.image} priority={first} className="absolute inset-0 -z-10 size-full opacity-30" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-accent via-accent/70 to-accent/20" />
        <div className="container-site flex flex-col gap-5 py-24 md:py-36">
          {section.eyebrow && <p className="enter font-semibold tracking-wide [&:lang(am)]:tracking-normal">{text(section.eyebrow)}</p>}
          <Heading className="headline max-w-4xl">{text(section.heading)}</Heading>
          {section.subheading && <p className="enter max-w-[60ch] text-lg" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions}
        </div>
      </section>
    );
  }

  if (variant === "centered") {
    return (
      <section id={section.id} className="section hero-glow md:py-24">
        <div className="container-site flex flex-col items-center gap-6 text-center">
          {section.eyebrow && <p className="enter rounded-full border border-line bg-surface/80 px-4 py-1 font-semibold">{text(section.eyebrow)}</p>}
          <Heading className="headline max-w-4xl">{text(section.heading)}</Heading>
          {section.subheading && <p className="enter max-w-[60ch] text-lg text-muted" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions}
          {section.image && (
            <div className="zoom mt-8 w-full rounded-site shadow-2xl shadow-primary/10">
              <Picture image={section.image} priority={first} className="aspect-[16/9] w-full rounded-site" />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id={section.id} className="section hero-glow md:py-24">
      <div className="container-site grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          {section.eyebrow && <p className="enter w-fit rounded-full border border-line bg-surface/80 px-4 py-1 font-semibold">{text(section.eyebrow)}</p>}
          <Heading className="headline">{text(section.heading)}</Heading>
          {section.subheading && <p className="enter max-w-[56ch] text-lg text-muted" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions}
        </div>
        <div className="depth-frame me-3.5 mb-3.5">
          <div className="zoom rounded-site">
            <Picture image={section.image} priority={first} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-site" />
          </div>
          {chip && (
            <p className="info-chip enter flex items-center gap-3 font-semibold" style={{ "--i": 5 } as React.CSSProperties}>
              <span aria-hidden="true" className="info-dot" />
              <span className="flex flex-col">
                {chip.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
