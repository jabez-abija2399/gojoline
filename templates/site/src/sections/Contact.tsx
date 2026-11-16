import { SectionTitle } from "../components/SectionTitle";
import { Icon } from "../components/Icon";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { ContactSection } from "../lib/types";

export function Contact({ section }: { section: ContactSection }) {
  const { site, text, lang } = useSite();
  const b = site.business;
  const tel = b.phone?.replace(/[^\d+]/g, "");
  return (
    <section id={section.id ?? "contact"} className="section">
      <div className="container-site grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {section.eyebrow && <p className="eyebrow">{text(section.eyebrow)}</p>}
          <SectionTitle>{text(section.heading)}</SectionTitle>
          {section.intro && <p className="max-w-[60ch] text-muted">{text(section.intro)}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            {tel && (
              <a href={`tel:${tel}`} className="btn btn-primary">
                <Icon name="phone" className="size-5" />
                {uiText("call", lang)}
              </a>
            )}
            {b.telegram && (
              <a href={`https://t.me/${encodeURIComponent(b.telegram.replace(/^@/, ""))}`} className="btn btn-outline">
                {uiText("telegram", lang)}
              </a>
            )}
          </div>
        </div>
        <dl className="flex flex-col gap-4 rounded-site border border-line bg-surface p-6">
          {b.phone && (
            <div>
              <dt className="font-semibold">{uiText("phone", lang)}</dt>
              <dd className="text-muted">
                <a href={`tel:${tel}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{b.phone}</a>
              </dd>
            </div>
          )}
          {b.email && (
            <div>
              <dt className="font-semibold">{uiText("email", lang)}</dt>
              <dd className="text-muted">
                <a href={`mailto:${b.email}`} className="inline-flex min-h-11 items-center underline underline-offset-4 break-all">{b.email}</a>
              </dd>
            </div>
          )}
          {b.address && (
            <div>
              <dt className="font-semibold">{uiText("address", lang)}</dt>
              <dd className="text-muted">{text(b.address)}</dd>
            </div>
          )}
          {b.hours && b.hours.length > 0 && (
            <div>
              <dt className="font-semibold">{uiText("hours", lang)}</dt>
              <dd>
                <ul className="text-muted">
                  {b.hours.map((h, i) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span>{text(h.days)}</span>
                      <span>{text(h.time)}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
