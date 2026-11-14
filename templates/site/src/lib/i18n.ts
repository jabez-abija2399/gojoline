import type { Lang, Price, Site, Text } from "./types";

type Langs = Pick<Site, "languages">;

export function t(text: Text | undefined, lang: Lang, site: Langs): string {
  if (!text) return "";
  return text[lang] ?? text[site.languages[0] ?? "en"] ?? text.en ?? text.am ?? "";
}

/** URL for a page path in a language: the default language has no prefix. */
export function localePath(path: string, lang: Lang, site: Langs): string {
  if (lang === site.languages[0]) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}

/** Splits "/am/menu" into { lang: "am", path: "/menu" } for this site. */
export function parsePath(pathname: string, site: Langs): { lang: Lang; path: string } {
  const clean = pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "") || "/";
  const parts = clean.split("/").filter(Boolean);
  const first = parts[0];
  const others: string[] = site.languages.slice(1);
  if (first && others.includes(first)) {
    const rest = parts.slice(1);
    return { lang: first as Lang, path: rest.length ? `/${rest.join("/")}` : "/" };
  }
  return { lang: site.languages[0] ?? "en", path: clean };
}

const ui = {
  en: {
    call: "Call us",
    telegram: "Message on Telegram",
    hours: "Opening hours",
    address: "Address",
    menu: "Menu",
    openMap: "Open in maps",
    skip: "Skip to content",
    report: "Report this site",
    madeWith: "Made with Gojoline",
    phone: "Phone",
    email: "Email",
    mapTitle: "Map",
  },
  am: {
    call: "ይደውሉልን",
    telegram: "በቴሌግራም ይጻፉልን",
    hours: "የሥራ ሰዓት",
    address: "አድራሻ",
    menu: "ማውጫ",
    openMap: "በካርታ ይክፈቱ",
    skip: "ወደ ዋናው ይዘት ይሂዱ",
    report: "ይህን ገጽ ሪፖርት ያድርጉ",
    madeWith: "በጎጆላይን የተሠራ",
    phone: "ስልክ",
    email: "ኢሜይል",
    mapTitle: "ካርታ",
  },
} as const;

export type UiKey = keyof (typeof ui)["en"];

export function uiText(key: UiKey, lang: Lang): string {
  return ui[lang][key];
}

export const languageNames: Record<Lang, string> = { en: "English", am: "አማርኛ" };

export function formatPrice(price: Price, lang: Lang): string {
  const major = price.amountMinor / 100;
  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
  if (price.currency === "ETB") return lang === "am" ? `${amount} ብር` : `${amount} Birr`;
  return `$${amount}`;
}
