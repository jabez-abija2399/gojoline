import { SectionTitle } from "../components/SectionTitle";
import { Icon } from "../components/Icon";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { MapSection } from "../lib/types";

/**
 * No third-party iframe or script (fast, private): a clear card that opens the place
 * in the visitor's maps app.
 */
export function MapEmbed({ section }: { section: MapSection }) {
  const { site, text, lang } = useSite();
  const query = section.query ?? site.business.address?.en ?? text(site.business.address);
  if (!query) return null;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return (
    <section id={section.id ?? "map"} className="section bg-surface">
      <div className="container-site flex flex-col gap-6">
        {section.eyebrow && <p className="eyebrow">{text(section.eyebrow)}</p>}
          <SectionTitle>{text(section.heading)}</SectionTitle>
        <a
          href={url}
          rel="noopener"
          target="_blank"
          className="group relative flex min-h-56 items-center justify-center overflow-hidden rounded-site border border-line bg-primary-soft p-6"
        >
          <svg aria-hidden="true" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full opacity-40">
            <path d="M0 140 L120 90 L220 130 L400 60" className="stroke-primary" strokeWidth="10" fill="none" />
            <path d="M60 0 L140 200 M300 0 L250 200" className="stroke-line" strokeWidth="14" fill="none" />
          </svg>
          <span className="relative flex flex-col items-center gap-2 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="map" />
            </span>
            <span className="font-semibold">{text(site.business.address) || query}</span>
            <span className="underline underline-offset-4">{uiText("openMap", lang)}</span>
          </span>
        </a>
      </div>
    </section>
  );
}
