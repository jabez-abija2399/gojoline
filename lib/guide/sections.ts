/**
 * The guide's ten sections in order, and the screenshots each one shows (files in
 * public/guide/shots/, made by scripts/guide-assets.mts). No imports: the script reads this file.
 */
export const GUIDE_SECTIONS = ["start", "describe", "build", "look", "edit", "photos", "versions", "publish", "dashboard", "plan"] as const;
export type GuideSection = (typeof GUIDE_SECTIONS)[number];

/** Desktop shots are 1440 × 900, phone shots 390 × 844 (CSS pixels when they were taken). */
export const DESKTOP = { width: 1440, height: 900, widths: [720, 1440] } as const;
export const PHONE = { width: 390, height: 844, widths: [390] } as const;

export interface Shot {
  /** Desktop screenshot name (no extension). */
  desktop: string;
  /** The same moment on a phone; without one the shot shows on large screens only. */
  phone?: string;
}

/** One or two shots per section; each one's alt text is `sections.<id>.shots[i]` in the messages. */
export const GUIDE_SHOTS: Record<GuideSection, readonly Shot[]> = {
  start: [
    { desktop: "01-start", phone: "phone-01-start" },
    { desktop: "01-sign-in", phone: "phone-01-sign-in" },
  ],
  describe: [{ desktop: "02-describe", phone: "phone-02-describe" }],
  build: [
    { desktop: "03-building", phone: "phone-03-building" },
    { desktop: "03-site-ready", phone: "phone-03-site-ready" },
  ],
  look: [{ desktop: "04-computer-preview", phone: "phone-05-edit-applied" }],
  edit: [{ desktop: "05-edit-chat", phone: "phone-05-edit-chat" }, { desktop: "05-edit-colours" }],
  photos: [{ desktop: "06-photos", phone: "phone-06-photos" }, { desktop: "06-photo-used" }],
  versions: [{ desktop: "07-versions", phone: "phone-07-versions" }],
  publish: [
    { desktop: "08-publish-address", phone: "phone-08-publish-address" },
    { desktop: "08-publish", phone: "phone-08-publish" },
  ],
  dashboard: [
    { desktop: "09-dashboard-home", phone: "phone-09-dashboard-home" },
    { desktop: "09-dashboard-messages", phone: "phone-09-dashboard-messages" },
  ],
  plan: [
    { desktop: "10-plan", phone: "phone-10-plan" },
    { desktop: "10-plan-steps", phone: "phone-10-payment" },
  ],
};

/** Where a shot's file is served: /guide/shots/<name>-<width>.<format>. */
export function shotSrc(name: string, width: number, format: "avif" | "webp"): string {
  return `/guide/shots/${name}-${width}.${format}`;
}

/** A srcset for every width the script makes. */
export function shotSrcSet(name: string, widths: readonly number[], format: "avif" | "webp"): string {
  return widths.map((w) => `${shotSrc(name, w, format)} ${w}w`).join(", ");
}

export const VIDEO_FILE = "/guide/gojoline-guide-720.mp4";
export const POSTER_FILE = "/guide/gojoline-guide-poster.webp";
/** Captions and chapters: /guide/<kind>-<lang>.vtt */
export const trackSrc = (kind: "captions" | "chapters", lang: "en" | "am") => `/guide/${kind}-${lang}.vtt`;
