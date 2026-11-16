/** Pure helpers shared by the dashboard (client) and the public Data API: no validation library. */
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

type Text = { en?: string; am?: string };
type Lang = "en" | "am";
type Hours = Partial<Record<Weekday, { open: string; close: string } | null>>;

/** Words the public patch needs, in both languages (from the i18n catalogs). */
export interface InfoLabels {
  days: Record<Weekday, string>;
  closed: string;
  closedToday: string;
  closedForNow: string;
}

const both = (f: (lang: Lang) => string): Text => ({ en: f("en"), am: f("am") });

const CLOCKS = { en: new Intl.DateTimeFormat("en-US", { timeStyle: "short", timeZone: "UTC" }), am: new Intl.DateTimeFormat("am-ET", { timeStyle: "short", timeZone: "UTC" }) };

/** "07:30" as people read it in a language ("7:30 AM"), the way the time inputs show it. */
export function formatClock(hhmm: string, lang: Lang): string {
  const [h, m] = hhmm.split(":").map(Number);
  return CLOCKS[lang].format(Date.UTC(1970, 0, 1, h ?? 0, m ?? 0));
}

/** Weekday rows grouped where they match: "Mon–Fri · 08:00–18:00", "Sun · Closed". */
export function groupHours(hours: Hours, labels: Record<Lang, InfoLabels>): { days: Text; time: Text }[] {
  const out: { days: Text; time: Text }[] = [];
  const key = (d: Weekday) => {
    const h = hours[d];
    return h === undefined ? undefined : h === null ? "closed" : `${h.open}–${h.close}`;
  };
  let i = 0;
  while (i < WEEKDAYS.length) {
    const k = key(WEEKDAYS[i]!);
    if (k === undefined) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < WEEKDAYS.length && key(WEEKDAYS[j + 1]!) === k) j++;
    const first = WEEKDAYS[i]!;
    const last = WEEKDAYS[j]!;
    const h = hours[first];
    out.push({
      days: both((l) => (i === j ? labels[l].days[first] : `${labels[l].days[first]}–${labels[l].days[last]}`)),
      time: both((l) => (h ? `${formatClock(h.open, l)}–${formatClock(h.close, l)}` : labels[l].closed)),
    });
    i = j + 1;
  }
  return out;
}

/** A map search for the address (Google Maps opens the app on phones). */
export function mapLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
