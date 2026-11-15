import { Icon } from "../components/Icon";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { Site } from "../lib/types";

const digits = (v: string) => v.replace(/[^\d+]/g, "");

/** True when the site has a phone, Telegram or WhatsApp to put in the bar. */
export function hasStickyActions(site: Site): boolean {
  const b = site.business;
  return Boolean(b.phone || b.telegram || b.whatsapp);
}

/**
 * Phones only: a bar at the bottom with the two fastest ways to reach the business.
 * Most visitors of a local business site want to call or message; this keeps that one tap away.
 */
export function StickyActions() {
  const { site, lang } = useSite();
  const b = site.business;
  if (!hasStickyActions(site)) return null;
  const message = b.telegram
    ? { href: `https://t.me/${encodeURIComponent(b.telegram.replace(/^@/, ""))}`, label: uiText("telegramShort", lang) }
    : b.whatsapp
      ? { href: `https://wa.me/${digits(b.whatsapp).replace(/^\+/, "")}`, label: uiText("whatsapp", lang) }
      : null;
  return (
    <nav aria-label={uiText("quickActions", lang)} className="sticky-actions">
      {b.phone && (
        <a href={`tel:${digits(b.phone)}`} className="btn btn-primary">
          <Icon name="phone" className="size-5" />
          {uiText("callShort", lang)}
        </a>
      )}
      {message && (
        <a href={message.href} className={`btn ${b.phone ? "btn-outline" : "btn-primary"}`}>
          {message.label}
        </a>
      )}
    </nav>
  );
}
