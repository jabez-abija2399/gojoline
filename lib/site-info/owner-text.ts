import type { BusinessInfo } from "./business";
import type { SeoSettings } from "./seo";

/** The words in business details that go live as typed (checked before saving). */
export function businessTexts(b: BusinessInfo): string[] {
  return [b.address?.en, b.address?.am, b.announcement?.text.en, b.announcement?.text.am, b.telegram].filter((x): x is string => Boolean(x?.trim()));
}

/** The words in the Google and share preview. */
export function seoTexts(s: SeoSettings): string[] {
  return [s.title?.en, s.title?.am, s.description?.en, s.description?.am].filter((x): x is string => Boolean(x?.trim()));
}
