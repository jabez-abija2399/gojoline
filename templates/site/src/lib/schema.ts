import { z } from "zod";
import { contrast, parseHex, readableOn } from "./color.ts";

/** Runtime schema mirroring types.ts; the builder and `npm run check` validate site.ts with it. */
const text = z
  .object({ en: z.string().max(4000).optional(), am: z.string().max(4000).optional() })
  .strict()
  .refine((v) => (v.en ?? v.am ?? "").trim().length > 0, "Text needs at least one language");

const safeHref = z
  .string()
  .max(500)
  .refine(
    (h) => /^(#[\w-]*|\/[\w\-/#]*|tel:\+?[\d\s-]+|mailto:[^\s<>"]+|https:\/\/[^\s<>"]+)$/.test(h),
    "Links must be #anchor, /path, tel:, mailto: or https://",
  );

const image = z
  .object({
    src: z
      .string()
      .max(500)
      .refine((s) => /^(\/[\w\-/.]+|https:\/\/[^\s<>"]+)$/.test(s), "Image src must be /path or https URL")
      .optional(),
    art: z.enum(["coffee", "food", "hotel", "room", "clinic", "school", "fashion", "shopping", "church", "mosque", "event", "people", "home", "mountains", "portrait", "work"]).optional(),
    alt: text,
    width: z.number().int().positive().max(4000).optional(),
    height: z.number().int().positive().max(4000).optional(),
  })
  .strict();

/** A profile link shown under a fixed label ("Facebook"): https, on that service's own domain, nothing else. */
function socialUrl(hosts: string[]) {
  return z
    .string()
    .max(300)
    .refine((v) => {
      if (!/^https:\/\/[^\s<>"]+$/.test(v)) return false;
      try {
        const u = new URL(v);
        const host = u.hostname.toLowerCase().replace(/^(www|m|web)\./, "");
        return u.protocol === "https:" && !u.username && !u.password && hosts.includes(host);
      } catch {
        return false;
      }
    }, `Must be an https link on ${hosts.join(" or ")}`);
}

const link = z.object({ label: text, href: safeHref }).strict();
const fact = z.object({ value: text, label: text }).strict();
const price = z.object({ amountMinor: z.number().int().nonnegative().max(1_000_000_000_000), currency: z.enum(["ETB", "USD"]) }).strict();
const id = z.string().regex(/^[a-z][a-z0-9-]{0,40}$/).optional();
const icon = z.enum(["coffee", "utensils", "bed", "stethoscope", "school", "shopping-bag", "church", "calendar", "heart", "home", "map", "scissors", "car", "star", "phone", "check", "wifi", "clock", "users", "shield", "leaf", "award", "globe", "briefcase", "camera", "music", "book", "sparkles", "truck", "key", "building", "sun", "plane", "moon", "droplet", "mail", "message", "baby", "palette", "wrench", "chart", "graduation", "pill", "flask", "mountain", "tree", "gift", "ruler", "bath", "pin", "laptop", "handshake", "mic", "flower", "dumbbell", "bus"]);

export const formFieldSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-z0-9_]{0,30}$/, "Field name: lowercase letters, numbers, underscores"),
    label: text,
    type: z.enum(["text", "email", "tel", "date", "time", "number", "select", "textarea"]),
    required: z.boolean().optional(),
    options: z.array(text).min(1).max(30).optional(),
  })
  .strict()
  .refine((f) => f.type !== "select" || (f.options?.length ?? 0) > 0, "A select field needs options");

export const formSectionSchema = z
  .object({
    type: z.literal("form"),
    id: z.string().regex(/^[a-z][a-z0-9-]{1,40}$/, "Form id: lowercase letters, numbers, dashes"),
    kind: z.enum(["contact", "booking", "order", "registration"]),
    eyebrow: text.optional(),
    heading: text,
    intro: text.optional(),
    fields: z.array(formFieldSchema).min(1).max(15).refine((f) => new Set(f.map((x) => x.name)).size === f.length, "Field names must be unique"),
    submitLabel: text,
    successMessage: text,
  })
  .strict();

const section = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), id, variant: z.enum(["split", "centered", "banner", "immersive", "portrait"]).optional(), eyebrow: text.optional(), heading: text, subheading: text.optional(), image: image.optional(), primaryAction: link.optional(), secondaryAction: link.optional(), stamp: text.optional(), frame: z.boolean().optional(), facts: z.array(fact).max(4).optional() }).strict(),
  z.object({ type: z.literal("about"), id, eyebrow: text.optional(), heading: text, body: text, image: image.optional(), imageSide: z.enum(["start", "end"]).optional(), imageShape: z.enum(["arch"]).optional(), highlights: z.array(fact).max(6).optional(), points: z.array(text).max(8).optional(), action: link.optional() }).strict(),
  z.object({ type: z.literal("menu"), id, eyebrow: text.optional(), heading: text, intro: text.optional(), categories: z.array(z.object({ name: text, items: z.array(z.object({ name: text, description: text.optional(), price: price.optional(), tag: text.optional(), image: image.optional() }).strict()).min(1).max(80) }).strict()).min(1).max(20) }).strict(),
  z.object({ type: z.literal("services"), id, eyebrow: text.optional(), heading: text, intro: text.optional(), variant: z.enum(["bento", "list", "numbered"]).optional(), items: z.array(z.object({ title: text, description: text, price: price.optional(), icon: icon.optional() }).strict()).min(1).max(30) }).strict(),
  z.object({ type: z.literal("gallery"), id, eyebrow: text.optional(), heading: text, intro: text.optional(), layout: z.enum(["mosaic", "scroll", "wall"]).optional(), images: z.array(image).min(1).max(40) }).strict(),
  z.object({ type: z.literal("contact"), id, eyebrow: text.optional(), heading: text, intro: text.optional() }).strict(),
  z.object({ type: z.literal("map"), id, eyebrow: text.optional(), heading: text, query: z.string().max(200).optional() }).strict(),
  z.object({ type: z.literal("timeline"), id, eyebrow: text.optional(), heading: text, intro: text.optional(), items: z.array(z.object({ period: text, title: text, place: text.optional(), description: text.optional() }).strict()).min(1).max(30) }).strict(),
  z.object({ type: z.literal("testimonials"), id, eyebrow: text.optional(), heading: text, items: z.array(z.object({ quote: text, name: z.union([z.string().min(1).max(80), text]), role: text.optional() }).strict()).min(1).max(12) }).strict(),
  z.object({ type: z.literal("faq"), id, eyebrow: text.optional(), heading: text, intro: text.optional(), items: z.array(z.object({ question: text, answer: text }).strict()).min(1).max(20) }).strict(),
  z.object({ type: z.literal("cta"), id, heading: text, body: text.optional(), primaryAction: link, secondaryAction: link.optional(), image: image.optional() }).strict(),
  z.object({ type: z.literal("cards"), id, eyebrow: text.optional(), heading: text, intro: text.optional(), layout: z.enum(["grid", "feature", "scroll", "people", "stack", "index"]).optional(), imageShape: z.enum(["arch"]).optional(), filters: z.boolean().optional(), items: z.array(z.object({ image: image.optional(), title: text, subtitle: text.optional(), description: text.optional(), price: price.optional(), priceNote: text.optional(), badge: text.optional(), meta: z.array(text).max(5).optional(), action: link.optional() }).strict()).min(1).max(24), action: link.optional() }).strict(),
  z.object({ type: z.literal("stats"), id, heading: text.optional(), items: z.array(fact).min(2).max(4), tone: z.enum(["dark", "soft"]).optional() }).strict(),
  z.object({ type: z.literal("steps"), id, eyebrow: text.optional(), heading: text, intro: text.optional(), items: z.array(z.object({ title: text, description: text.optional() }).strict()).min(2).max(8), action: link.optional() }).strict(),
  z.object({ type: z.literal("schedule"), id, eyebrow: text.optional(), heading: text, intro: text.optional(), layout: z.enum(["list", "tiles"]).optional(), dates: z.array(z.enum(["gregorian", "ethiopian", "hijri"])).max(3).optional(), items: z.array(z.object({ time: text, title: text, note: text.optional(), at: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "at: a time like 05:25 or 18:10").optional() }).strict()).min(1).max(30), footnote: text.optional() }).strict(),
  z.object({ type: z.literal("tabs"), id, eyebrow: text.optional(), heading: text, intro: text.optional(), items: z.array(z.object({ label: text, heading: text.optional(), body: text, image: image.optional(), points: z.array(text).max(6).optional(), action: link.optional() }).strict()).min(2).max(6) }).strict(),
  z.object({ type: z.literal("give"), id, eyebrow: text.optional(), heading: text, intro: text.optional(), amounts: z.array(z.object({ price, impact: text.optional() }).strict()).min(2).max(6), monthly: z.boolean().optional(), action: link, goal: z.object({ raised: price, target: price, label: text.optional() }).strict().optional(), image: image.optional() }).strict(),
  z.object({ type: z.literal("marquee"), id, items: z.array(text).min(2).max(12), tone: z.enum(["dark", "primary", "light"]).optional() }).strict(),
  z.object({ type: z.literal("quote"), id, quote: text, name: text.optional(), role: text.optional(), image: image.optional() }).strict(),
  formSectionSchema,
]);

const hex = z.string().refine((v) => parseHex(v) !== null, "Colour must be a hex value like #8A4B24");

export const siteSchema = z
  .object({
    name: text,
    tagline: text.optional(),
    languages: z.array(z.enum(["en", "am"])).min(1).max(2).refine((l) => new Set(l).size === l.length, "Languages must be unique"),
    theme: z.object({ primary: hex, accent: hex, background: hex, text: hex, font: z.enum(["modern", "classic", "friendly", "elegant", "grotesk"]), radius: z.enum(["none", "small", "medium", "large"]), style: z.enum(["warm", "editorial", "bold", "clean"]).optional() }).strict(),
    business: z
      .object({
        phone: z.string().max(40).optional(),
        email: z.email().optional(),
        telegram: z.string().regex(/^@?[A-Za-z0-9_]{4,32}$/).optional(),
        whatsapp: z.string().max(40).optional(),
        address: text.optional(),
        hours: z.array(z.object({ days: text, time: text }).strict()).max(14).optional(),
        social: z.object({ facebook: socialUrl(["facebook.com", "fb.com"]).optional(), instagram: socialUrl(["instagram.com"]).optional(), tiktok: socialUrl(["tiktok.com"]).optional() }).strict().optional(),
      })
      .strict(),
    pages: z
      .array(
        z.object({
          path: z.string().regex(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/, 'Page path must be "/" or like "/menu"'),
          title: text,
          nav: text.optional(),
          description: text.optional(),
          sections: z.array(section).min(1).max(30),
        }).strict(),
      )
      .min(1)
      .max(12),
    meta: z.object({ url: z.string().optional(), siteId: z.string().optional(), dataApiUrl: z.string().optional(), reportUrl: z.string().optional(), badge: z.boolean().optional() }).strict().optional(),
  })
  .strict()
  .superRefine((site, ctx) => {
    const paths = site.pages.map((p) => p.path);
    if (!paths.includes("/")) ctx.addIssue({ code: "custom", message: 'There must be a home page with path "/"', path: ["pages"] });
    if (new Set(paths).size !== paths.length) ctx.addIssue({ code: "custom", message: "Page paths must be unique", path: ["pages"] });
    const formIds = site.pages.flatMap((p) => p.sections.flatMap((s) => (s.type === "form" ? [s.id] : [])));
    if (new Set(formIds).size !== formIds.length) ctx.addIssue({ code: "custom", message: "Form ids must be unique across the site", path: ["pages"] });
    for (const p of paths) {
      if (site.languages.some((l) => p === `/${l}` || p.startsWith(`/${l}/`))) {
        ctx.addIssue({ code: "custom", message: `Page path ${p} clashes with a language prefix`, path: ["pages"] });
      }
    }
  });

/** Contrast problems a visitor would notice. Returned as readable messages for the agent. */
export function themeWarnings(theme: { primary: string; accent: string; background: string; text: string }): string[] {
  const out: string[] = [];
  const check = (a: string, b: string, label: string, min = 4.5) => {
    const ratio = contrast(a, b);
    if (ratio < min) out.push(`${label} contrast is ${ratio.toFixed(2)}:1, needs ${min}:1`);
  };
  check(theme.text, theme.background, "theme.text on theme.background");
  check(theme.text, "#ffffff", "theme.text on white cards");
  // Buttons use white or near-black text automatically; links use primary on the background.
  check(theme.primary, theme.background, "theme.primary (links, icons) on theme.background", 3);
  // The accent fills the footer and banners; their text is white or near-black, whichever reads best.
  check(readableOn(theme.accent), theme.accent, "text on theme.accent (footer, banners)");
  return out;
}
