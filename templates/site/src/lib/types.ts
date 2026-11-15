/**
 * Content model for a Gojoline site. The AI agent edits `src/site.ts`, which must satisfy `Site`.
 * Keep this file stable: the builder validates against it (scripts/validate.ts).
 */
export type Lang = "en" | "am";

/** Text in one or both languages. Missing languages fall back to the site's first language. */
export type Text = { en?: string; am?: string };

export interface Image {
  /** Path under /public (e.g. "/images/coffee.webp") or an https URL. Omit for a tasteful placeholder. */
  src?: string;
  alt: Text;
  width?: number;
  height?: number;
}

export interface Link {
  label: Text;
  /** "#contact", "/menu", "tel:+2519...", "https://t.me/name" */
  href: string;
}

/** Money is integer minor units (santim for ETB). 15000 = 150 Birr. */
export interface Price {
  amountMinor: number;
  currency: "ETB" | "USD";
}

export type IconName =
  | "coffee"
  | "utensils"
  | "bed"
  | "stethoscope"
  | "school"
  | "shopping-bag"
  | "church"
  | "calendar"
  | "heart"
  | "home"
  | "map"
  | "scissors"
  | "car"
  | "star"
  | "phone"
  | "check";

export interface HeroSection {
  type: "hero";
  id?: string;
  variant?: "split" | "centered" | "banner";
  eyebrow?: Text;
  heading: Text;
  subheading?: Text;
  image?: Image;
  primaryAction?: Link;
  secondaryAction?: Link;
}

export interface AboutSection {
  type: "about";
  id?: string;
  heading: Text;
  body: Text;
  image?: Image;
  highlights?: { value: Text; label: Text }[];
}

export interface MenuItem {
  name: Text;
  description?: Text;
  price?: Price;
  /** Short tag like "New", "Vegan", "Popular" */
  tag?: Text;
}

export interface MenuSection {
  type: "menu";
  id?: string;
  heading: Text;
  intro?: Text;
  categories: { name: Text; items: MenuItem[] }[];
}

export interface ServicesSection {
  type: "services";
  id?: string;
  heading: Text;
  intro?: Text;
  items: { title: Text; description: Text; price?: Price; icon?: IconName }[];
}

export interface GallerySection {
  type: "gallery";
  id?: string;
  heading: Text;
  images: Image[];
}

export interface ContactSection {
  type: "contact";
  id?: string;
  heading: Text;
  intro?: Text;
}

export interface MapSection {
  type: "map";
  id?: string;
  heading: Text;
  /** Place to show, e.g. "Bole, Addis Ababa". Defaults to the English business address. */
  query?: string;
}

export interface TestimonialsSection {
  type: "testimonials";
  id?: string;
  heading: Text;
  items: { quote: Text; name: string }[];
}

export interface FormField {
  /** Key for the answer: lowercase letters, numbers, underscores (e.g. "phone", "guests"). */
  name: string;
  label: Text;
  type: "text" | "email" | "tel" | "date" | "time" | "number" | "select" | "textarea";
  required?: boolean;
  /** For "select": the choices. */
  options?: Text[];
}

/** A form visitors fill in; answers go to the owner's dashboard and Telegram. */
export interface FormSection {
  type: "form";
  /** Unique form key on the site, e.g. "booking" (lowercase, dashes). Required. */
  id: string;
  kind: "contact" | "booking" | "order" | "registration";
  heading: Text;
  intro?: Text;
  fields: FormField[];
  submitLabel: Text;
  successMessage: Text;
}

export type Section =
  | HeroSection
  | AboutSection
  | MenuSection
  | ServicesSection
  | GallerySection
  | ContactSection
  | MapSection
  | TestimonialsSection
  | FormSection;

export interface Page {
  /** "/" for the home page, otherwise "/menu", "/about" (lowercase, no trailing slash) */
  path: string;
  title: Text;
  /** Label in the navigation. Omit to hide the page from the nav. */
  nav?: Text;
  description?: Text;
  sections: Section[];
}

export interface Theme {
  /** Main brand colour for buttons and links (hex). Needs 4.5:1 contrast with white. */
  primary: string;
  /** Accent for highlights and dark bands (hex). Needs 4.5:1 contrast with white. */
  accent: string;
  /** Page background (hex), usually a very light tint. */
  background: string;
  /** Body text (hex). Needs 4.5:1 contrast with the background. */
  text: string;
  font: "modern" | "classic" | "friendly";
  radius: "none" | "small" | "medium" | "large";
}

export interface Business {
  phone?: string;
  email?: string;
  /** Telegram username without @ */
  telegram?: string;
  whatsapp?: string;
  address?: Text;
  hours?: { days: Text; time: Text }[];
  social?: { facebook?: string; instagram?: string; tiktok?: string };
}

export interface Site {
  name: Text;
  tagline?: Text;
  /** First language is the default (served at "/"); the second is served under "/am" or "/en". */
  languages: Lang[];
  theme: Theme;
  business: Business;
  pages: Page[];
  /** Filled in by Gojoline at publish time. Do not edit. */
  meta?: { url?: string; siteId?: string; dataApiUrl?: string; reportUrl?: string; badge?: boolean };
}
