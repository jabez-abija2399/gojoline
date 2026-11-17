// When the "no changes left" dialog opens: pure, tiny and free of server code (the builder imports it).

/** "2026-11" in Addis Ababa time (UTC+3, no daylight saving): the month a dismissal counts for. */
export function upgradeMonth(now: Date): string {
  const addis = new Date(now.getTime() + 3 * 3_600_000);
  return `${addis.getUTCFullYear()}-${String(addis.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Why the dialog might open: a refused request, a send at 0, or a run that just used the last change. */
export type UpgradeTrigger = "refused" | "send" | "after_run";

/**
 * Whether the "no changes left" dialog opens. A refusal or a send at 0 always opens it (the owner
 * just asked for something we can't do); a run that took the balance to 0 opens it once a month,
 * so it never nags on every page load or every run.
 */
export function shouldOpenUpgrade(
  trigger: UpgradeTrigger,
  s: { before: number | null; after: number | null; hasSite: boolean; dismissedMonth: string | null; month: string },
): boolean {
  if (s.after === null || s.after > 0) return false;
  switch (trigger) {
    case "refused":
      return true;
    case "send":
      // A new site's first build is free even at 0: let it through.
      return s.hasSite;
    case "after_run":
      return s.before !== null && s.before > 0 && s.dismissedMonth !== s.month;
  }
}
