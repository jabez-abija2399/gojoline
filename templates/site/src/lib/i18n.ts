import { BASE } from "./base";
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
  const local = BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || "/" : pathname;
  const clean = local.replace(/\/index\.html$/, "").replace(/\/+$/, "") || "/";
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
    callShort: "Call",
    telegramShort: "Telegram",
    whatsapp: "WhatsApp",
    contact: "Contact",
    quickActions: "Contact us",
    telegram: "Message on Telegram",
    hours: "Opening hours",
    address: "Address",
    menu: "Menu",
    pages: "Pages",
    openMap: "Open in maps",
    skip: "Skip to content",
    report: "Report this site",
    madeWith: "Made with Gojoline",
    phone: "Phone",
    email: "Email",
    mapTitle: "Map",
    required: "required",
    sending: "Sending...",
    formError: "Something went wrong. Please try again or call us.",
    formPreview: "This form starts working when your site is published.",
    fieldRequired: "Please fill this in.",
    fieldEmail: "Please enter an email like name@example.com.",
    fieldPhone: "Please enter a phone number like 0911 234 567.",
    fieldNumber: "Please enter a number.",
    openPhoto: "Open photo",
    close: "Close",
    previous: "Previous",
    next: "Next",
    photoOf: "{i} of {n}",
    all: "All",
    nextUp: "Next",
    inTime: "in {t}",
    hourShort: "h",
    minuteShort: "min",
    pause: "Pause the moving text",
    play: "Play the moving text",
    pausePhotos: "Pause the moving photos",
    playPhotos: "Play the moving photos",
    photosOf: "Photos of {title}: {i} of {n}",
    howOften: "How often",
    once: "Once",
    monthly: "Monthly",
    perMonth: "a month",
    raised: "{raised} raised of {target}",
    today: "Today",
  },
  am: {
    call: "ይደውሉልን",
    callShort: "ይደውሉ",
    telegramShort: "ቴሌግራም",
    whatsapp: "ዋትስአፕ",
    contact: "ያግኙን",
    quickActions: "ያግኙን",
    telegram: "በቴሌግራም ይጻፉልን",
    hours: "የሥራ ሰዓት",
    address: "አድራሻ",
    menu: "ማውጫ",
    pages: "ገጾች",
    openMap: "በካርታ ይክፈቱ",
    skip: "ወደ ዋናው ይዘት ይሂዱ",
    report: "ይህን ገጽ ሪፖርት ያድርጉ",
    madeWith: "በጎጆላይን የተሠራ",
    phone: "ስልክ",
    email: "ኢሜይል",
    mapTitle: "ካርታ",
    required: "የግድ",
    sending: "በመላክ ላይ...",
    formError: "የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ ወይም ይደውሉልን።",
    formPreview: "ይህ ቅጽ ድረ-ገጽዎ ሲታተም መሥራት ይጀምራል።",
    fieldRequired: "እባክዎ ይህን ይሙሉ።",
    fieldEmail: "እባክዎ እንደ name@example.com ያለ ኢሜይል ያስገቡ።",
    fieldPhone: "እባክዎ እንደ 0911 234 567 ያለ ስልክ ቁጥር ያስገቡ።",
    fieldNumber: "እባክዎ ቁጥር ያስገቡ።",
    openPhoto: "ፎቶውን ይክፈቱ",
    close: "ይዝጉ",
    previous: "ቀዳሚ",
    next: "ቀጣይ",
    photoOf: "{i} ከ{n}",
    all: "ሁሉም",
    nextUp: "ቀጣይ",
    inTime: "በ{t} ውስጥ",
    hourShort: "ሰዓት",
    minuteShort: "ደቂቃ",
    pause: "የሚንቀሳቀሰውን ጽሑፍ ያቁሙ",
    play: "የሚንቀሳቀሰውን ጽሑፍ ያስጀምሩ",
    pausePhotos: "የሚንቀሳቀሱትን ፎቶዎች ያቁሙ",
    playPhotos: "የሚንቀሳቀሱትን ፎቶዎች ያስጀምሩ",
    photosOf: "የ{title} ፎቶዎች፦ {i} ከ{n}",
    howOften: "በምን ያህል ጊዜ",
    once: "አንድ ጊዜ",
    monthly: "በየወሩ",
    perMonth: "በወር",
    raised: "ከ{target} ውስጥ {raised} ተሰብስቧል",
    today: "ዛሬ",
  },
} as const;

export type UiKey = keyof (typeof ui)["en"];

export function uiText(key: UiKey, lang: Lang): string {
  return ui[lang][key];
}

export const languageNames: Record<Lang, string> = { en: "English", am: "አማርኛ" };

export function formatPrice(price: Price, lang: Lang): string {
  const major = price.amountMinor / 100;
  const digits = Number.isInteger(major) ? 0 : 2;
  if (price.currency === "ETB") {
    const amount = new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: 2 }).format(major);
    return lang === "am" ? `${amount} ብር` : `${amount} Birr`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency, minimumFractionDigits: digits }).format(major);
}
