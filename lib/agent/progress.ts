/**
 * Section types of the site template (templates/site/src/lib/types.ts). Progress shows them by
 * name as the agent writes them, so only these are reported (form field types like "text" are not).
 */
export const SECTION_TYPES = [
  "hero",
  "about",
  "menu",
  "services",
  "gallery",
  "cards",
  "stats",
  "steps",
  "schedule",
  "tabs",
  "give",
  "marquee",
  "quote",
  "contact",
  "map",
  "testimonials",
  "form",
  "timeline",
  "faq",
  "cta",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

const KNOWN = new Set<string>(SECTION_TYPES);
/** `"type": "gallery"` in site.json, also when JSON-escaped inside a tool call's input. */
const TYPE_RE = /\\*"type\\*"\s*:\s*\\*"([a-z]+)\\*"/g;
/** Enough to hold a marker split across two streamed fragments. */
const TAIL = 48;

/**
 * Spots the site sections a streamed tool input is writing, in order, each once per tool
 * call. Fed the raw JSON fragments as they arrive; returns the sections first seen in them.
 */
export class SectionSpotter {
  private buffer = "";
  private seen = new Set<string>();

  reset() {
    this.buffer = "";
    this.seen.clear();
  }

  feed(fragment: string): SectionType[] {
    const text = this.buffer + fragment;
    const found: SectionType[] = [];
    let lastEnd = 0;
    for (const m of text.matchAll(TYPE_RE)) {
      lastEnd = m.index + m[0].length;
      const name = m[1]!;
      if (KNOWN.has(name) && !this.seen.has(name)) {
        this.seen.add(name);
        found.push(name as SectionType);
      }
    }
    // Keep only what could still be the start of a marker.
    this.buffer = text.slice(Math.max(lastEnd, text.length - TAIL));
    return found;
  }
}
