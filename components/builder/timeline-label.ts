import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import type { SectionType } from "@/lib/agent/progress";
import type { Timeline, TimelineKey } from "./build-timeline";

type T = Messages["builder"];

/** How many section names the writing step shows (the newest; earlier ones are counted). */
export const SHOWN_SECTIONS = 3;

/** "a", "a and b", "a, b and c" with the language's own separator and "and". */
export function listOf(t: T, items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(t.tlListSep)}${t.tlListAnd}${items.at(-1)}`;
}

/** "Writing your about, gallery and form sections" (newest three, then "and 2 more"). */
export function writingLabel(t: T, sections: SectionType[]): string {
  if (sections.length === 0) return t.tlWriting;
  const names = sections.slice(-SHOWN_SECTIONS).map((s) => (t.tlSectionLower ? t.tlSection[s].toLowerCase() : t.tlSection[s]));
  const more = sections.length - names.length;
  const items = more > 0 ? [...names, format(t.tlMoreSections, { n: more })] : names;
  return format(items.length === 1 ? t.tlWritingSection : t.tlWritingSections, { sections: listOf(t, items) });
}

/** What each step is called on screen (the writing step names its sections). */
export function stepLabels(t: T, timeline: Timeline): Record<TimelineKey, string> {
  return { understand: t.tlUnderstand, plan: t.tlPlan, write: writingLabel(t, timeline.sections), check: t.tlChecking, fix: t.tlFixing, finish: t.tlFinish, save: t.tlSave, ready: t.tlReady };
}

/** The step in progress (or the last one when all are done). */
export function currentStep(timeline: Timeline): TimelineKey | undefined {
  return (timeline.steps.findLast((s) => !s.done) ?? timeline.steps.at(-1))?.key;
}

/** What screen readers hear: the step only, never the changing section names. */
export function announcedStep(t: T, timeline: Timeline): string {
  const key = currentStep(timeline);
  if (!key) return "";
  return key === "write" ? t.tlWriting : stepLabels(t, timeline)[key];
}
