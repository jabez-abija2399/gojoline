import { CountUp } from "../components/CountUp";
import { Picture } from "../components/Picture";
import { SplitWords } from "../components/SplitWords";
import { Stamp } from "../components/Stamp";
import { useSite } from "../lib/context";
import { uiText } from "../lib/i18n";
import type { Fact, HeroSection } from "../lib/types";

/** A hero photo on a phone: sized so that even a 3x screen takes the 800 px file. */
const FULL = "(min-width: 768px) 100vw, 225px";

export function Hero({ section, first }: { section: HeroSection; first: boolean }) {
  const { site, page, text, href, lang } = useSite();
  // On the home page's hero: when they are open (or, without hours, the phone number).
  // Up to two lines, so a business open on other days at other times isn't made to look closed.
  const hours = (site.business.hours ?? []).slice(0, 2).map((h) => `${text(h.days)} · ${text(h.time)}`);
  const chip = first && page.path === "/" && section.hours !== false ? (hours.length ? hours : site.business.phone ? [site.business.phone] : undefined) : undefined;
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
      <section id={section.id} className={`hero-immersive relative isolate overflow-hidden bg-black text-white ${section.frame ? "hero-frame" : ""}`}>
        {/* The photo settles in slowly and drifts as the page scrolls (motion.css). */}
        <div className="hero-parallax absolute inset-0 -z-10">
          <Picture image={section.image} priority={first} wide sizes={FULL} className="hero-photo size-full" />
        </div>
        <div aria-hidden="true" className="hero-shade absolute inset-0 -z-10" />
        <div className="container-site flex min-h-[min(46rem,88svh)] flex-col justify-end gap-5 pt-32 pb-10 md:pb-16">
          {section.eyebrow && <p className="eyebrow enter text-white!">{text(section.eyebrow)}</p>}
          <Heading className="headline split max-w-4xl">
            <SplitWords text={text(section.heading)} />
          </Heading>
          {section.subheading && <p className="enter max-w-[56ch] text-lg" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions("btn-glass")}
          {facts && <Facts facts={facts} className="mt-4 border-t border-white/30 pt-5" />}
        </div>
        {section.stamp && <Stamp text={text(section.stamp)} className="stamp-on-photo absolute end-4 top-24 md:end-10 md:top-28" />}
        {first && <span aria-hidden="true" className="scroll-cue" />}
      </section>
    );
  }

  if (variant === "poster") {
    // A magazine cover: the photo full width, the business name set very large across its lower
    // edge (decoration: the header already names the business), the eyebrow running up the side.
    return (
      <section id={section.id} className="hero-poster relative isolate">
        <div className="poster-photo relative overflow-hidden bg-accent">
          <div className="hero-parallax absolute inset-0">
            <Picture image={section.image} priority={first} wide sizes={FULL} className="hero-photo size-full" />
          </div>
          {section.eyebrow && <p className="poster-side">{text(section.eyebrow)}</p>}
        </div>
        <p aria-hidden="true" className="poster-name container-site" style={{ "--chars": Math.max(...text(site.name).split(/\s+/).map((w) => [...w].length), 4) } as React.CSSProperties}>
          {text(site.name)}
        </p>
        <div className="container-site flex flex-col gap-5 pb-14 md:pb-20">
          <Heading className="headline split max-w-3xl">
            <SplitWords text={text(section.heading)} />
          </Heading>
          {section.subheading && <p className="enter max-w-[56ch] text-lg text-muted" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions()}
          {facts && <Facts facts={facts} className="mt-2 border-t border-line pt-6" />}
        </div>
      </section>
    );
  }

  if (variant === "bento") {
    // The first screen as tiles: the heading on the photo, then hours, the two actions and the
    // facts each in a tile of their own. Every tile is something a visitor came to check.
    const hoursTile = chip ?? (hours.length ? hours : undefined);
    // Up to four small tiles fill the 2×2 beside the photo on wide screens; an odd last tile
    // spans the row so there is never a hole.
    const fixed = (hoursTile ? 1 : 0) + (section.primaryAction ? 1 : 0) + (section.secondaryAction ? 1 : 0);
    const bentoFacts = (facts ?? []).slice(0, Math.max(0, 4 - fixed));
    const small = fixed + bentoFacts.length;
    return (
      <section id={section.id} className="section hero-bento pt-6 md:pt-10">
        <div className={`container-site bento-grid ${small % 2 ? "bento-odd" : ""}`} style={{ "--rows": Math.max(1, Math.ceil(small / 2)) } as React.CSSProperties}>
          <div className="bento-main enter relative isolate flex flex-col justify-end gap-4 overflow-hidden rounded-site bg-accent p-6 text-white md:p-10">
            <Picture image={section.image} priority={first} wide sizes="(min-width: 1152px) 545px, (min-width: 768px) 47vw, 225px" className="hero-photo absolute inset-0 -z-10 size-full" />
            <div aria-hidden="true" className="hero-shade absolute inset-0 -z-10" />
            {section.eyebrow && <p className="eyebrow text-white!">{text(section.eyebrow)}</p>}
            <Heading className="headline split max-w-2xl">
              <SplitWords text={text(section.heading)} />
            </Heading>
            {section.subheading && <p className="max-w-[48ch] text-lg">{text(section.subheading)}</p>}
          </div>
          {hoursTile && (
            <p className="bento-tile bento-hours enter" style={{ "--i": 2 } as React.CSSProperties}>
              <span className="font-semibold">{uiText("hours", lang)}</span>
              {hoursTile.map((line) => (
                <span key={line} className="bento-line">
                  {line}
                </span>
              ))}
            </p>
          )}
          {section.primaryAction && (
            <a href={href(section.primaryAction.href)} className="bento-tile bento-primary enter" style={{ "--i": 3 } as React.CSSProperties}>
              <span className="fact-value arrow-link">{text(section.primaryAction.label)}</span>
            </a>
          )}
          {section.secondaryAction && (
            <a href={href(section.secondaryAction.href)} className="bento-tile bento-secondary enter" style={{ "--i": 4 } as React.CSSProperties}>
              <span className="fact-value arrow-link">{text(section.secondaryAction.label)}</span>
            </a>
          )}
          {bentoFacts.map((f, i) => (
            <div key={i} className="bento-tile enter flex flex-col-reverse justify-end" style={{ "--i": 5 + i } as React.CSSProperties}>
              <span className="small-label">{text(f.label)}</span>
              <span className="stat-value">
                <CountUp value={text(f.value)} />
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "banner") {
    const photo = Boolean(section.image?.src);
    return (
      <section id={section.id} className="relative isolate overflow-hidden bg-accent text-on-accent">
        <div className="hero-parallax absolute inset-0 -z-10">
          <Picture image={section.image} priority={first} wide sizes={FULL} className={`hero-photo size-full ${photo ? "opacity-70" : "opacity-30"}`} />
        </div>
        <div aria-hidden="true" className={`absolute inset-0 -z-10 bg-gradient-to-t ${photo ? "from-accent/95 via-accent/60 to-accent/35" : "from-accent via-accent/70 to-accent/20"}`} />
        <div className="container-site flex flex-col gap-5 py-24 md:py-36">
          {section.eyebrow && <p className="eyebrow enter text-on-accent!">{text(section.eyebrow)}</p>}
          <Heading className="headline split max-w-4xl">
            <SplitWords text={text(section.heading)} />
          </Heading>
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
          <Heading className="headline split max-w-4xl">
            <SplitWords text={text(section.heading)} />
          </Heading>
          {section.subheading && <p className="enter max-w-[60ch] text-lg text-muted" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions()}
          {section.image && (
            <div className="zoom mt-8 w-full rounded-site shadow-2xl shadow-primary/10">
              <Picture image={section.image} priority={first} wide sizes="(min-width: 1152px) 1104px, (min-width: 768px) 100vw, 225px" className="aspect-[4/3] w-full rounded-site sm:aspect-[16/9]" />
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
            <Heading className="headline headline-xl split">
              <SplitWords text={text(section.heading)} />
            </Heading>
            {section.subheading && <p className="enter max-w-[52ch] text-lg text-muted" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
            {actions()}
            {facts && <Facts facts={facts} className="mt-2 border-t border-line pt-6" />}
          </div>
          <div className="relative mx-auto w-full max-w-sm md:max-w-none">
            <div className="zoom rounded-site">
              <Picture image={section.image} priority={first} sizes="(min-width: 768px) 40vw, 225px" className="aspect-[4/5] w-full rounded-site" />
            </div>
            {section.stamp && <Stamp text={text(section.stamp)} className="absolute start-2 -bottom-8 size-28 md:-start-8 md:size-32" />}
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
          <Heading className="headline split">
            <SplitWords text={text(section.heading)} />
          </Heading>
          {section.subheading && <p className="enter max-w-[56ch] text-lg text-muted" style={{ "--i": 2 } as React.CSSProperties}>{text(section.subheading)}</p>}
          {actions()}
          {facts && <Facts facts={facts} className="mt-2 border-t border-line pt-6" />}
        </div>
        <div className="relative me-3.5 mb-3.5">
          <div className="depth-frame">
            <div className="zoom rounded-site">
              <Picture image={section.image} priority={first} sizes="(min-width: 768px) 50vw, 225px" className="aspect-[4/3] w-full rounded-site" />
            </div>
          </div>
          {section.stamp && <Stamp text={text(section.stamp)} className="absolute end-2 -top-8 size-24 md:-end-8 md:size-32" />}
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
          <dt className="small-label">{text(f.label)}</dt>
          <dd className="fact-value">
            <CountUp value={text(f.value)} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
