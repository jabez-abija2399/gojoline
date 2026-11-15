import { Picture } from "../components/Picture";
import { useSite } from "../lib/context";
import type { HeroSection } from "../lib/types";

export function Hero({ section, first }: { section: HeroSection; first: boolean }) {
  const { text, href } = useSite();
  const variant = section.variant ?? "split";
  const Heading = first ? "h1" : "h2";

  const actions = (
    <div className={`flex flex-col gap-3 sm:flex-row ${variant === "centered" ? "sm:justify-center" : ""}`}>
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
        <div className="container-site flex flex-col gap-5 py-20 md:py-28">
          {section.eyebrow && <p className="font-semibold">{text(section.eyebrow)}</p>}
          <Heading className="max-w-3xl text-4xl font-bold sm:text-5xl">{text(section.heading)}</Heading>
          {section.subheading && <p className="max-w-[60ch] text-lg">{text(section.subheading)}</p>}
          {actions}
        </div>
      </section>
    );
  }

  if (variant === "centered") {
    return (
      <section id={section.id} className="section">
        <div className="container-site flex flex-col items-center gap-5 text-center">
          {section.eyebrow && <p className="rounded-full bg-primary-soft px-3 py-1 font-semibold">{text(section.eyebrow)}</p>}
          <Heading className="max-w-3xl text-4xl font-bold sm:text-5xl">{text(section.heading)}</Heading>
          {section.subheading && <p className="max-w-[60ch] text-lg text-muted">{text(section.subheading)}</p>}
          {actions}
          {section.image && <Picture image={section.image} priority={first} className="mt-6 aspect-[16/9] w-full rounded-site" />}
        </div>
      </section>
    );
  }

  return (
    <section id={section.id} className="section">
      <div className="container-site grid items-center gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          {section.eyebrow && <p className="w-fit rounded-full bg-primary-soft px-3 py-1 font-semibold">{text(section.eyebrow)}</p>}
          <Heading className="text-4xl font-bold sm:text-5xl">{text(section.heading)}</Heading>
          {section.subheading && <p className="max-w-[60ch] text-lg text-muted">{text(section.subheading)}</p>}
          {actions}
        </div>
        <Picture image={section.image} priority={first} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-site" />
      </div>
    </section>
  );
}
