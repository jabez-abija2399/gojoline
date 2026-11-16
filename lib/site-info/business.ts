import { z } from "zod";
import { normalizePhone } from "@/lib/dashboard/phone";
import { addisDay } from "@/lib/dashboard/stats";

/**
 * Business details the owner edits in the dashboard without AI or a rebuild. The published
 * site reads them at runtime (GET /api/public/sites/:id/info) and shows them instead of the
 * built-in ones; when the API can't be reached it keeps its built-in details.
 */

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const text = (max: number) => z.string().trim().max(max);
const phone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v === "" || normalizePhone(v) !== null, { message: "phone" });
const bilingual = (max: number) => z.object({ en: text(max).optional(), am: text(max).optional() }).strict();

/** One weekday: open from/to (24-hour), or null for closed. Overnight (18:00–02:00) is allowed. */
const day = z
  .object({ open: time, close: time })
  .strict()
  .refine((d) => d.open !== d.close, { message: "hours" })
  .nullable();

export const businessInfo = z
  .object({
    phone: phone.optional(),
    /** Telegram username without @ (5–32 letters, digits, underscores). */
    telegram: z
      .string()
      .trim()
      .transform((v) => v.replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, ""))
      .pipe(z.string().regex(/^$|^[A-Za-z][A-Za-z0-9_]{4,31}$/, { message: "telegram" }))
      .optional(),
    whatsapp: phone.optional(),
    address: bilingual(160).optional(),
    /** Weekdays left out have no hours set (the site keeps its own). */
    hours: z.partialRecord(z.enum(WEEKDAYS), day).optional(),
    /** The Addis Ababa day (YYYY-MM-DD) the owner marked "closed today". */
    closedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    /** Closed until the owner says otherwise. */
    closedForNow: z.boolean().optional(),
    announcement: z.object({ on: z.boolean(), text: bilingual(120) }).strict().optional(),
  })
  .strict();

export type BusinessInfo = z.infer<typeof businessInfo>;

type Text = { en?: string; am?: string };
type Lang = "en" | "am";

/** Words the public patch needs, in both languages (from the i18n catalogs). */
export interface InfoLabels {
  days: Record<Weekday, string>;
  closed: string;
  closedToday: string;
  closedForNow: string;
}

/** What the published site merges over its built-in content (the template's own shapes). */
export interface PublicPatch {
  business?: { phone?: string; telegram?: string; whatsapp?: string; address?: Text; hours?: { days: Text; time: Text }[] };
  /** Lines for the thin strip above the menu: the closed notice first, then the owner's line. */
  announcement?: Text[];
}

const both = (f: (lang: Lang) => string): Text => ({ en: f("en"), am: f("am") });
const filled = (t: Text | undefined): Text | undefined => {
  if (!t) return undefined;
  const out: Text = {};
  if (t.en?.trim()) out.en = t.en.trim();
  if (t.am?.trim()) out.am = t.am.trim();
  return out.en || out.am ? out : undefined;
};

/** Weekday rows grouped where they match: "Mon–Fri · 08:00–18:00", "Sun · Closed". */
export function groupHours(hours: NonNullable<BusinessInfo["hours"]>, labels: Record<Lang, InfoLabels>): { days: Text; time: Text }[] {
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
    out.push({
      days: both((l) => (i === j ? labels[l].days[first] : `${labels[l].days[first]}–${labels[l].days[last]}`)),
      time: k === "closed" ? both((l) => labels[l].closed) : { en: k, am: k },
    });
    i = j + 1;
  }
  return out;
}

/** The public, read-only patch for the site (only what the owner chose to show; nothing private). */
export function publicPatch(info: BusinessInfo | null, labels: Record<Lang, InfoLabels>, now = Date.now()): PublicPatch {
  if (!info) return {};
  const business: NonNullable<PublicPatch["business"]> = {};
  const phone = info.phone && normalizePhone(info.phone);
  if (info.phone && phone) business.phone = info.phone.trim();
  if (info.telegram) business.telegram = info.telegram;
  const wa = info.whatsapp && normalizePhone(info.whatsapp);
  if (wa) business.whatsapp = wa.e164.slice(1);
  const address = filled(info.address);
  if (address) business.address = address;
  const hours = info.hours ? groupHours(info.hours, labels) : [];
  if (hours.length) business.hours = hours;

  const announcement: Text[] = [];
  if (info.closedForNow) announcement.push(both((l) => labels[l].closedForNow));
  else if (info.closedOn && info.closedOn === addisDay(now)) announcement.push(both((l) => labels[l].closedToday));
  const line = info.announcement?.on ? filled(info.announcement.text) : undefined;
  if (line) announcement.push(line);

  return { ...(Object.keys(business).length ? { business } : {}), ...(announcement.length ? { announcement } : {}) };
}

/** A map search for the address (Google Maps opens the app on phones). */
export function mapLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
