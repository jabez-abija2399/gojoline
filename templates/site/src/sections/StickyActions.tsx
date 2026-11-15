import { Icon } from "../components/Icon";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { Site } from "../lib/types";

const digits = (v: string) => v.replace(/[^\d+]/g, "");

/** A number someone could really dial: at least 7 digits once everything else is removed. */
const dialable = (v: string | undefined) => (v && digits(v).replace(/\+/g, "").length >= 7 ? digits(v) : undefined);

/** True when the site has a phone, Telegram or WhatsApp to put in the bar. */
export function hasStickyActions(site: Site): boolean {
  const b = site.business;
  return Boolean(dialable(b.phone) || b.telegram || dialable(b.whatsapp));
}

/**
 * Phones only: a bar at the bottom with the two fastest ways to reach the business.
 * Most visitors of a local business site want to call or message; this keeps that one tap away.
 */
export function StickyActions() {
  const { site, lang } = useSite();
  const b = site.business;
  if (!hasStickyActions(site)) return null;
  const phone = dialable(b.phone);
  const whatsapp = dialable(b.whatsapp);
  const message = b.telegram
    ? { href: `https://t.me/${encodeURIComponent(b.telegram.replace(/^@/, ""))}`, label: uiText("telegramShort", lang) }
    : whatsapp
      ? { href: `https://wa.me/${whatsapp.replace(/\+/g, "")}`, label: uiText("whatsapp", lang) }
      : null;
  return (
    <nav aria-label={uiText("quickActions", lang)} className="sticky-actions">
      {phone && (
        <a href={`tel:${phone}`} className="btn btn-primary">
          <Icon name="phone" className="size-5" />
          {uiText("callShort", lang)}
        </a>
      )}
      {message && (
        <a href={message.href} className={`btn ${phone ? "btn-outline" : "btn-primary"}`}>
          {message.label}
        </a>
      )}
    </nav>
  );
}
