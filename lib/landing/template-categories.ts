/** Plain groups of business, in the order the gallery shows them (labels: landing.gallery.categories). */
export const TEMPLATE_CATEGORIES = ["food", "travel", "health", "shops", "education", "faith", "events", "business"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export function isTemplateCategory(v: unknown): v is TemplateCategory {
  return typeof v === "string" && (TEMPLATE_CATEGORIES as readonly string[]).includes(v);
}
