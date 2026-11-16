import { Picture } from "../components/Picture";
import { useSite } from "../lib/context";
import type { Fact, HeroSection } from "../lib/types";

/** Phones are asked for a little less than their full width, so a 3x screen still takes the 800 px photo. */
const FULL = "(min-width: 768px) 100vw, 70vw";

export function Hero({ section, first }: { section: HeroSection; first: boolean }) {
  const { site, page, text, href } = useSite();
  // On the home page's hero: when they are open (or, without hours, the phone number).
  // Up to two lines, so a business open on other days at other times isn't made to look closed.
  const hours = (site.business.hours ?? []).slice(0, 2).map((h) => `${text(h.days)} · ${text(h.time)}`);
  const chip = first && page.path === "/" ? (hours.length ? hours : site.business.phone ? [site.business.phone] : undefined) : undefined;
  // A full-screen photo needs a photo: with only a drawing, the tinted banner reads better.
  const asked = section.variant ?? "split";
  const variant = asked === "immersive" && !section.image?.src ? "banner" : asked;
  const Heading = first ? "h1" : "h2";
  const facts = section.facts?.length ? section.facts : undefined;

  const actions = (outline = "btn-outline") => (
    <div className={`enter flex flex-col gap-3 sm:flex-row ${variant === "centered" ? "sm:justify-center" : ""}`} style={{ "--i": 3 } as React.CSSProperties}>
      {section.primaryAction && (
        <a href={href(section.primaryAction.href)} className="btn btn-primary">
          {text(section.primaryAction.label)}
        </a>
      )}
      {section.secondaryAction && (
        <a href={href(section.secondaryAction.href)} className={`btn ${outline}`}>
          {text(section.secondaryAction.label)}
        </a>
      )}
    </div>
  );

  if (variant === "immersive") {
    return (
      <section id={section.id} className="hero-immersive relative isolate overflow-hidden bg-black text-white">
        <Picture image={section.image} priority={first} sizes={FULL} className="absolute inset-0 -z-10 size-full" />
        <div aria-hidden="true" className="hero-shade absolute inset-0 -z-10" />
        <div className="container-site flex min-h-[min(46rem,88svh)] flex-col justify-end gap-5 pt-32 pb-10 md:pb-16">
          {section.eyebrow && <p className="eyebrow enter text-white!">{text(section.eyebrow)}</p>}
          <Heading className="headline max-w-4xl">{text(section.heading)}</Heading>
          {section.subheading && <p className="enter max-w-[56ch] text-lg" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions("btn-glass")}
          {facts && <Facts facts={facts} className="mt-4 border-t border-white/30 pt-5" />}
        </div>
      </section>
    );
  }

  if (variant === "banner") {
    const photo = Boolean(section.image?.src);
    return (
      <section id={section.id} className="relative isolate overflow-hidden bg-accent text-on-accent">
        <Picture image={section.image} priority={first} sizes={FULL} className={`absolute inset-0 -z-10 size-full ${photo ? "opacity-70" : "opacity-30"}`} />
        <div aria-hidden="true" className={`absolute inset-0 -z-10 bg-gradient-to-t ${photo ? "from-accent/95 via-accent/60 to-accent/35" : "from-accent via-accent/70 to-accent/20"}`} />
        <div className="container-site flex flex-col gap-5 py-24 md:py-36">
          {section.eyebrow && <p className="eyebrow enter text-on-accent!">{text(section.eyebrow)}</p>}
          <Heading className="headline max-w-4xl">{text(section.heading)}</Heading>
          {section.subheading && <p className="enter max-w-[60ch] text-lg" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions()}
          {facts && <Facts facts={facts} className="mt-4 border-t border-current/30 pt-5" />}
        </div>
      </section>
    );
  }

  if (variant === "centered") {
    return (
      <section id={section.id} className="section hero-glow md:py-24">
        <div className="container-site flex flex-col items-center gap-6 text-center">
          {section.eyebrow && <p className="hero-eyebrow enter">{text(section.eyebrow)}</p>}
          <Heading className="headline max-w-4xl">{text(section.heading)}</Heading>
          {section.subheading && <p className="enter max-w-[60ch] text-lg text-muted" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions()}
          {section.image && (
            <div className="zoom mt-8 w-full rounded-site shadow-2xl shadow-primary/10">
              <Picture image={section.image} priority={first} sizes={FULL} className="aspect-[4/3] w-full rounded-site sm:aspect-[16/9]" />
            </div>
          )}
          {facts && <Facts facts={facts} className="mt-2 w-full justify-center border-t border-line pt-6" />}
        </div>
      </section>
    );
  }

  if (variant === "portrait") {
    return (
      <section id={section.id} className="section hero-glow md:py-20">
        <div className="container-site grid items-end gap-10 md:grid-cols-[1.25fr_1fr] md:gap-14">
          <div className="flex flex-col gap-6 md:pb-6">
            {section.eyebrow && (
              <p className="hero-eyebrow enter flex items-center gap-2.5">
                <span aria-hidden="true" className="info-dot" />
                {text(section.eyebrow)}
              </p>
            )}
            <Heading className="headline headline-xl">{text(section.heading)}</Heading>
            {section.subheading && <p className="enter max-w-[52ch] text-lg text-muted" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
            {actions()}
            {facts && <Facts facts={facts} className="mt-2 border-t border-line pt-6" />}
          </div>
          <div className="zoom mx-auto w-full max-w-sm rounded-site md:max-w-none">
            <Picture image={section.image} priority={first} sizes="(min-width: 768px) 40vw, 70vw" className="aspect-[4/5] w-full rounded-site" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={section.id} className="section hero-glow md:py-24">
      <div className="container-site grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          {section.eyebrow && <p className="hero-eyebrow enter">{text(section.eyebrow)}</p>}
          <Heading className="headline">{text(section.heading)}</Heading>
          {section.subheading && <p className="enter max-w-[56ch] text-lg text-muted" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions()}
          {facts && <Facts facts={facts} className="mt-2 border-t border-line pt-6" />}
        </div>
        <div className="depth-frame me-3.5 mb-3.5">
          <div className="zoom rounded-site">
            <Picture image={section.image} priority={first} sizes="(min-width: 768px) 50vw, 70vw" className="aspect-[4/3] w-full rounded-site" />
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

/** Two to four short facts in a row: the proof a visitor looks for first. */
function Facts({ facts, className = "" }: { facts: Fact[]; className?: string }) {
  const { text } = useSite();
  return (
    <dl className={`enter flex flex-wrap gap-x-10 gap-y-4 ${className}`} style={{ "--i": 4 } as React.CSSProperties}>
      {facts.map((f, i) => (
        <div key={i} className="flex flex-col-reverse">
          <dt className="text-sm opacity-80">{text(f.label)}</dt>
          <dd className="fact-value">{text(f.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
