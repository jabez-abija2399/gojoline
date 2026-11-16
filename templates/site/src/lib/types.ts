/**
 * Content model for a Gojoline site. The AI agent edits `src/site.ts`, which must satisfy `Site`.
 * Keep this file stable: the builder validates against it (scripts/validate.ts).
 */
export type Lang = "en" | "am";

/** Text in one or both languages. Missing languages fall back to the site's first language. */
export type Text = { en?: string; am?: string };

/** Drawings shown where a photo will go, in the site's colours. */
export type ArtName =
  | "coffee"
  | "food"
  | "hotel"
  | "room"
  | "clinic"
  | "school"
  | "fashion"
  | "shopping"
  | "church"
  | "mosque"
  | "event"
  | "people"
  | "home"
  | "mountains"
  | "portrait"
  | "work";

export interface Image {
  /**
   * The owner's photo ("/images/<name>") or a sample photo from the library ("/stock/<name>.webp",
   * listed in TEMPLATE.md). Omit to show a drawing instead.
   */
  src?: string;
  /** Which drawing to show while there is no photo (ignored once `src` is set). */
  art?: ArtName;
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
  | "check"
  | "wifi"
  | "clock"
  | "users"
  | "shield"
  | "leaf"
  | "award"
  | "globe"
  | "briefcase"
  | "camera"
  | "music"
  | "book"
  | "sparkles"
  | "truck"
  | "key"
  | "building"
  | "sun"
  | "plane"
  | "moon"
  | "droplet"
  | "mail"
  | "message"
  | "baby"
  | "palette"
  | "wrench"
  | "chart"
  | "graduation"
  | "pill"
  | "flask"
  | "mountain"
  | "tree"
  | "gift"
  | "ruler"
  | "bath"
  | "pin"
  | "laptop"
  | "handshake"
  | "mic"
  | "flower"
  | "dumbbell"
  | "bus";

/** A number or short fact with its label: "12" + "rooms", "4.8" + "guest rating". */
export interface Fact {
  value: Text;
  label: Text;
}

export interface HeroSection {
  type: "hero";
  id?: string;
  /**
   * split: text beside a photo. centered: statement, photo below. banner: text on a tinted photo.
   * immersive: a full-screen photo with the text over it (needs a photo). portrait: a person's
   * name and statement beside a tall portrait.
   */
  variant?: "split" | "centered" | "banner" | "immersive" | "portrait";
  eyebrow?: Text;
  heading: Text;
  subheading?: Text;
  image?: Image;
  primaryAction?: Link;
  secondaryAction?: Link;
  /** Up to 4 short facts shown as a strip under the hero. */
  facts?: Fact[];
}

export interface AboutSection {
  type: "about";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  body: Text;
  image?: Image;
  /** Which side the picture sits on, on wide screens. Default "start". */
  imageSide?: "start" | "end";
  highlights?: Fact[];
  /** Short points shown as a ticked list under the text. */
  points?: Text[];
  action?: Link;
}

export interface MenuItem {
  name: Text;
  description?: Text;
  price?: Price;
  /** Short tag like "New", "Vegan", "Popular" */
  tag?: Text;
  /** A small photo of the dish, for the few signature items. */
  image?: Image;
}

export interface MenuSection {
  type: "menu";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  categories: { name: Text; items: MenuItem[] }[];
}

export interface ServicesSection {
  type: "services";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  /** bento: cards, the first one large. list: compact rows with icons. numbered: 01, 02, 03 columns. */
  variant?: "bento" | "list" | "numbered";
  items: { title: Text; description: Text; price?: Price; icon?: IconName }[];
}

export interface GallerySection {
  type: "gallery";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  /** mosaic: a grid, the first photo large. scroll: one row to swipe through. */
  layout?: "mosaic" | "scroll";
  images: Image[];
}

/** One card with a picture: a room, a property, a tour, a product, a person, a project. */
export interface CardItem {
  image?: Image;
  title: Text;
  /** A line under the title: a role, a place, a category. */
  subtitle?: Text;
  description?: Text;
  price?: Price;
  /** Words beside the price: "per night", "from", "per month". */
  priceNote?: Text;
  /** A small label on the picture: "For sale", "New", "Best seller". */
  badge?: Text;
  /** Up to 5 short facts: "2 guests", "King bed", "120 m²", "3 days". */
  meta?: Text[];
  action?: Link;
}

/** Cards with pictures: rooms, properties, tours, products, team, projects. */
export interface CardsSection {
  type: "cards";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  /**
   * grid: picture on top, three across. feature: large alternating rows (rooms, projects).
   * scroll: tall picture cards in a row to swipe (destinations, collections).
   * people: portraits with a name and role (doctors, team, stylists).
   */
  layout?: "grid" | "feature" | "scroll" | "people";
  items: CardItem[];
  /** A link under the cards: "See all rooms". */
  action?: Link;
}

/** A band of big numbers: years, guests, students, homes sold. Only real numbers. */
export interface StatsSection {
  type: "stats";
  id?: string;
  heading?: Text;
  items: Fact[];
  /** dark: on the accent colour. soft: on a light tint. Default "dark". */
  tone?: "dark" | "soft";
}

/** How it works, in order: booking, admissions, how we build. */
export interface StepsSection {
  type: "steps";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  items: { title: Text; description?: Text }[];
  action?: Link;
}

/** Times and what happens then: service times, prayer times, class times, an event programme. */
export interface ScheduleSection {
  type: "schedule";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  /** list: rows. tiles: a tile per time (prayer times, a few sessions). */
  layout?: "list" | "tiles";
  items: { time: Text; title: Text; note?: Text }[];
  footnote?: Text;
}

/** One strong sentence in large type: a mission, a verse, a founder's words. */
export interface QuoteSection {
  type: "quote";
  id?: string;
  quote: Text;
  name?: Text;
  role?: Text;
  image?: Image;
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
  eyebrow?: Text;
  heading: Text;
  /** `role` says who they are: "Parent, Grade 4", "Stayed in March". */
  items: { quote: Text; name: string; role?: Text }[];
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

/** Experience, education or milestones, newest first: CVs, portfolios, "our story". */
export interface TimelineSection {
  type: "timeline";
  id?: string;
  heading: Text;
  intro?: Text;
  items: { period: Text; title: Text; place?: Text; description?: Text }[];
}

/** Questions customers always ask, each with a short answer. */
export interface FaqSection {
  type: "faq";
  id?: string;
  heading: Text;
  intro?: Text;
  items: { question: Text; answer: Text }[];
}

/** A band that asks for one thing: book, call, order, visit. Good near the end of a page. */
export interface CtaSection {
  type: "cta";
  id?: string;
  heading: Text;
  body?: Text;
  primaryAction: Link;
  secondaryAction?: Link;
  /** A photo behind the band (darkened so the text stays readable). */
  image?: Image;
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
  | TimelineSection
  | FaqSection
  | CtaSection
  | FormSection
  | CardsSection
  | StatsSection
  | StepsSection
  | ScheduleSection
  | QuoteSection;

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
  font: "modern" | "classic" | "friendly" | "elegant" | "grotesk";
  radius: "none" | "small" | "medium" | "large";
  /**
   * The site's character. warm (default): soft cards, coloured accents. editorial: light serif
   * headlines, small capital labels, lots of air (hotels, weddings, fashion, property).
   * bold: very large heavy headlines, pill buttons (people, tours, causes, agencies).
   * clean: crisp and calm, soft shadows (clinics, schools, companies).
   */
  style?: "warm" | "editorial" | "bold" | "clean";
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
