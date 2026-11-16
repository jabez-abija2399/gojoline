import { format } from "@/lib/i18n/format";

/**
 * An old price struck through, read out as "was …" (strikethrough alone isn't announced).
 * `price` is already formatted with its unit.
 */
export function WasPrice({ price, was, className = "" }: { price: string; was: string; className?: string }) {
  return (
    <s className={`text-ink-muted no-underline decoration-1 ${className}`}>
      <span className="sr-only">{format(was, { price })}</span>
      <span aria-hidden="true" className="line-through">{price}</span>
    </s>
  );
}

/** "20% off until 31 Dec": a soft coral label beside an offer price (sun isn't used on public pages). */
export function OfferBadge({ text, className = "" }: { text: string; className?: string }) {
  return <span className={`inline-flex w-fit items-center rounded-full bg-coral-soft px-2.5 py-0.5 text-sm font-semibold text-ink ${className}`}>{text}</span>;
}
