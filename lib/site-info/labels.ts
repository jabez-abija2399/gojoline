import { getMessages } from "@/lib/i18n";
import type { InfoLabels } from "./hours";

/** Day names and closed notes for the public patch, in both languages (from the catalogs). */
export function infoLabels(): Record<"en" | "am", InfoLabels> {
  const pick = (lang: "en" | "am"): InfoLabels => {
    const d = getMessages(lang).dashboard;
    return { days: d.info.days, closed: d.info.closed, closedToday: d.info.closedTodayNotice, closedForNow: d.info.closedForNowNotice };
  };
  return { en: pick("en"), am: pick("am") };
}
