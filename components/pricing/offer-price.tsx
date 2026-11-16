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

/** "20% off until 31 Dec": a highlighter label (sun fill, dark text in both themes) beside an offer price. */
export function OfferBadge({ text, className = "" }: { text: string; className?: string }) {
  return <span className={`inline-flex w-fit items-center rounded-full bg-sun px-2.5 py-0.5 text-sm font-semibold text-on-coral ${className}`}>{text}</span>;
}
