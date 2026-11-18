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
   * name and statement beside a tall portrait. poster: a full-width photo with the business name
   * set very large across its lower edge, like a magazine cover (fashion, studios).
   * bento: the first screen as a grid of tiles: the heading on the photo, then the facts, the
   * hours and the two actions as their own tiles (garages, services, rentals).
   */
  variant?: "split" | "centered" | "banner" | "immersive" | "portrait" | "poster" | "bento";
  eyebrow?: Text;
  heading: Text;
  subheading?: Text;
  image?: Image;
  primaryAction?: Link;
  secondaryAction?: Link;
  /** A few words set round a slowly turning circle on the picture: "Since 2014 · Addis Ababa". */
  stamp?: Text;
  /** split only: false hides the opening hours shown beside the picture (on by default when the business has hours). */
  hours?: boolean;
  /** immersive only: the photo starts inside a rounded frame and opens to the full width as the page scrolls. */
  frame?: boolean;
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
  /** arch: the picture's top is rounded like a doorway (hotels, weddings, worship). */
  imageShape?: "arch";
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
  /** What the price is for: "per quintal", "per m²", "per day". */
  unit?: Text;
}

export interface MenuSection {
  type: "menu";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  /** list (default): cards with dotted leaders (food, drinks). table: one price table with units and tags in columns (materials, parts, services). */
  layout?: "list" | "table";
  /** dark: the section sits on a dark band in the theme's accent colour. */
  tone?: "dark";
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
  /** With list or numbered: a photo that stays in place beside the list while it scrolls (computers). */
  image?: Image;
  items: { title: Text; description: Text; price?: Price; icon?: IconName }[];
}

export interface GallerySection {
  type: "gallery";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  /** mosaic: a grid, the first photo large. scroll: one row to swipe through. wall: columns of photos drifting slowly up and down (weddings, events; 6 or more photos). */
  layout?: "mosaic" | "scroll" | "wall";
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
  /** More photos of the same thing (a home, a room): swiped inside the card, with a 1/4 counter. Grid layout. */
  photos?: Image[];
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
   * stack: large cards that pile up on each other as the visitor scrolls (rooms, projects, programmes).
   * index: a list of big titles in rows; on a computer the picture follows the mouse (portfolios, projects, collections).
   */
  layout?: "grid" | "feature" | "scroll" | "people" | "stack" | "index";
  /** arch: pictures rounded at the top like a doorway (feature, scroll and people layouts). */
  imageShape?: "arch";
  /** With 4 or more cards carrying 2 or more different badges, pills above let visitors show one kind ("For sale", "For rent"). Default true. */
  filters?: boolean;
  items: CardItem[];
  /** A link under the cards: "See all rooms". */
  action?: Link;
  /** dark: the section sits on a dark band in the theme's accent colour. */
  tone?: "dark";
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
  /** Show today's date above the times in these calendars (for prayer and service times). */
  dates?: ("gregorian" | "ethiopian" | "hijri")[];
  /** `at`: the time as "HH:MM" (24 hours, Addis Ababa time). With it, the next one is highlighted with a countdown. */
  items: { time: Text; title: Text; note?: Text; at?: string }[];
  footnote?: Text;
}

/** Topics as tabs: each tab swaps a picture and a short text (programmes, departments, service days). */
export interface TabsSection {
  type: "tabs";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  items: { label: Text; heading?: Text; body: Text; image?: Image; points?: Text[]; action?: Link }[];
}

/** A giving box: amount buttons, once or monthly, what each amount does, a goal bar. The button fills in the giving form. */
export interface GiveSection {
  type: "give";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  amounts: { price: Price; impact?: Text }[];
  /** Offer "monthly" next to "once". */
  monthly?: boolean;
  /** Where the button goes, usually the giving form ("#give"). The amount follows its label, or goes where the label says "{amount}" ("{amount} ይለግሱ"). */
  action: Link;
  /** A campaign goal: how much has come in so far. */
  goal?: { raised: Price; target: Price; label?: Text };
  image?: Image;
}

/** A ribbon of short words that moves slowly across the page: what you offer, places, promises. */
export interface MarqueeSection {
  type: "marquee";
  id?: string;
  items: Text[];
  /** dark: on the accent colour. primary: on the brand colour. light: on a soft tint. Default "dark". */
  tone?: "dark" | "primary" | "light";
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
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
}

export interface MapSection {
  type: "map";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  /** Place to show, e.g. "Bole, Addis Ababa". Defaults to the English business address. */
  query?: string;
}

export interface TestimonialsSection {
  type: "testimonials";
  id?: string;
  eyebrow?: Text;
  heading: Text;
  /** `name` may be plain text or given per language. `role` says who they are: "Parent, Grade 4", "Stayed in March". */
  items: { quote: Text; name: string | Text; role?: Text }[];
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
  eyebrow?: Text;
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
  eyebrow?: Text;
  heading: Text;
  intro?: Text;
  items: { period: Text; title: Text; place?: Text; description?: Text }[];
}

/** Questions customers always ask, each with a short answer. */
export interface FaqSection {
  type: "faq";
  id?: string;
  eyebrow?: Text;
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
  | QuoteSection
  | MarqueeSection
  | TabsSection
  | GiveSection;

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
  /**
   * A bright fill (hex) for stripes, stickers, badges and marker swipes: safety yellow, Meskel
   * yellow, tibeb gold. Never used for text; text on it is black or white, whichever reads.
   */
  highlight?: string;
  /** condensed: tall narrow heavy headings (construction, garages, gyms). editorial: a light magazine serif (weddings, studios). */
  font: "modern" | "classic" | "friendly" | "elegant" | "grotesk" | "condensed" | "editorial";
  radius: "none" | "small" | "medium" | "large";
  /**
   * The site's character. warm (default): soft cards, coloured accents. editorial: light serif
   * headlines, small capital labels, lots of air (hotels, weddings, fashion, property).
   * bold: very large heavy headlines, pill buttons (people, tours, causes, agencies).
   * clean: crisp and calm, soft shadows (clinics, schools, companies).
   * luxe: high-fashion editorial: hairline rules, tracked capitals, no card boxes, a woven
   * border under the hero (fashion, tailors). swiss: a strict grid, numbered sections, square
   * corners, tabular figures and a hazard stripe (building materials, contractors, industry).
   * bento: everything in rounded tiles, tight gaps, bold numbers (garages, rentals, services).
   */
  style?: "warm" | "editorial" | "bold" | "clean" | "luxe" | "swiss" | "bento";
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
  /** Short lines in a thin moving strip above the menu: "Order on Telegram", "Pay on delivery". */
  announcement?: Text[];
  /** First language is the default (served at "/"); the second is served under "/am" or "/en". */
  languages: Lang[];
  theme: Theme;
  business: Business;
  pages: Page[];
  /** Filled in by Gojoline at publish time. Do not edit. */
  meta?: { url?: string; siteId?: string; dataApiUrl?: string; reportUrl?: string; badge?: boolean };
}
