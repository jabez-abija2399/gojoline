import type { PresetId } from "@/lib/template/presets";
import type { TemplateCategory } from "./template-categories";

/**
 * What the templates pages say about each template beyond its pictures: its category, who it
 * suits ("Designed for") and the highlights it shows at a glance. Content, in both languages,
 * kept here as data so the components stay free of copy. Category and highlight *labels* are
 * UI strings and live in lib/i18n (landing.gallery.categories, landing.templatePreview.highlights).
 */

export { TEMPLATE_CATEGORIES, isTemplateCategory, type TemplateCategory } from "./template-categories";

/**
 * Things a template can show at a glance. Each one is checked against the template's real
 * sections (lib/landing/template-highlights.ts), so a chip never claims what the site lacks.
 */
export const HIGHLIGHT_KEYS = [
  "menu",
  "prices",
  "booking",
  "order",
  "registration",
  "contactForm",
  "gallery",
  "team",
  "cards",
  "times",
  "hours",
  "reviews",
  "faq",
  "map",
  "callTelegram",
  "whatsapp",
  "numbers",
  "steps",
  "timeline",
  "languages",
] as const;
export type HighlightKey = (typeof HIGHLIGHT_KEYS)[number];

export type Bilingual = { en: string; am: string };
export type BilingualList = { en: string[]; am: string[] };

/** A highlight by key (the standard label), or by key with wording that fits this template. */
export type HighlightPick = HighlightKey | { key: HighlightKey; label: Bilingual };

export interface TemplateInfo {
  category: TemplateCategory;
  /** Kinds of business it suits, most typical first. */
  designedFor: BilingualList;
  /** 4 to 7 highlights, most important first; each must be backed by the template's sections. */
  highlights: HighlightPick[];
}

export const TEMPLATE_INFO = {
  cafe: {
    category: "food",
    designedFor: {
      en: ["Cafés and coffee houses", "Restaurants", "Juice bars", "Bakeries and pastry shops", "Coffee ceremony places"],
      am: ["ካፌዎችና ቡና ቤቶች", "ምግብ ቤቶች", "ጭማቂ ቤቶች", "ዳቦና ኬክ ቤቶች", "የቡና ሥነ ሥርዓት ቦታዎች"],
    },
    highlights: ["menu", { key: "booking", label: { en: "Table bookings", am: "የጠረጴዛ ቀጠሮ" } }, "gallery", "hours", "map", "callTelegram", "languages"],
  },
  hotel: {
    category: "travel",
    designedFor: {
      en: ["Hotels", "Guest houses and pensions", "Lodges and resorts", "Furnished apartments"],
      am: ["ሆቴሎች", "የእንግዳ ማረፊያዎችና ፔንሲዮኖች", "ሎጆችና ሪዞርቶች", "የተሟሉ የኪራይ አፓርትመንቶች"],
    },
    highlights: [
      { key: "prices", label: { en: "Rooms with nightly prices", am: "ክፍሎች ከአዳር ዋጋ ጋር" } },
      { key: "booking", label: { en: "Booking requests", am: "የቦታ ማስያዣ ጥያቄ" } },
      { key: "menu", label: { en: "Restaurant menu", am: "የምግብ ቤት ምናሌ" } },
      "gallery",
      "reviews",
      "map",
      "languages",
    ],
  },
  clinic: {
    category: "health",
    designedFor: {
      en: ["Clinics", "Dental clinics", "Specialist doctors", "Diagnostic labs", "Physiotherapy centres"],
      am: ["ክሊኒኮች", "የጥርስ ክሊኒኮች", "ልዩ ሐኪሞች", "የምርመራ ላቦራቶሪዎች", "የፊዚዮቴራፒ ማዕከላት"],
    },
    highlights: [
      { key: "booking", label: { en: "Appointment requests", am: "የቀጠሮ ጥያቄ" } },
      { key: "team", label: { en: "Doctors with photos", am: "ሐኪሞች ከፎቶ ጋር" } },
      { key: "times", label: { en: "Who is in, and when", am: "ማን መቼ እንደሚገኝ" } },
      { key: "prices", label: { en: "Price list", am: "የዋጋ ዝርዝር" } },
      "faq",
      "map",
      "languages",
    ],
  },
  school: {
    category: "education",
    designedFor: {
      en: ["Private schools", "Kindergartens", "Tutoring centres", "Language and computer training centres"],
      am: ["የግል ትምህርት ቤቶች", "መዋዕለ ሕፃናት", "የማጠናከሪያ ትምህርት ማዕከላት", "የቋንቋና የኮምፒውተር ማሠልጠኛዎች"],
    },
    highlights: [
      { key: "registration", label: { en: "Online registration", am: "በመስመር ላይ ምዝገባ" } },
      { key: "prices", label: { en: "School fees", am: "የትምህርት ቤት ክፍያ" } },
      { key: "times", label: { en: "Term dates and the school day", am: "የትምህርት ቀኖችና የዕለቱ ፕሮግራም" } },
      "gallery",
      "faq",
      "map",
      "languages",
    ],
  },
  shop: {
    category: "shops",
    designedFor: {
      en: ["Clothing and habesha dress shops", "Craft and gift shops", "Boutiques", "Tailors", "Shops that take orders on Telegram"],
      am: ["የልብስና የሀበሻ ቀሚስ ሱቆች", "የዕደ ጥበብና የስጦታ ሱቆች", "ቡቲኮች", "ልብስ ሰፊዎች", "በቴሌግራም ትዕዛዝ የሚቀበሉ ሱቆች"],
    },
    highlights: [
      { key: "prices", label: { en: "Products with prices", am: "ምርቶች ከዋጋ ጋር" } },
      "order",
      { key: "booking", label: { en: "Made-to-measure requests", am: "የልኬት ስፌት ጥያቄ" } },
      "callTelegram",
      "hours",
      "map",
      "languages",
    ],
  },
  worship: {
    category: "faith",
    designedFor: {
      en: ["Orthodox churches", "Protestant and evangelical churches", "Catholic parishes", "Monasteries", "Sunday schools"],
      am: ["የኦርቶዶክስ አብያተ ክርስቲያናት", "የፕሮቴስታንትና የወንጌላውያን አብያተ ክርስቲያናት", "የካቶሊክ ቁምስናዎች", "ገዳማት", "ሰንበት ትምህርት ቤቶች"],
    },
    highlights: [
      { key: "times", label: { en: "Service times and feasts", am: "የአገልግሎት ሰዓትና በዓላት" } },
      { key: "booking", label: { en: "Baptism and wedding requests", am: "የጥምቀትና የጋብቻ ጥያቄ" } },
      { key: "registration", label: { en: "Sunday school registration", am: "የሰንበት ትምህርት ቤት ምዝገባ" } },
      "faq",
      "map",
      "languages",
    ],
  },
  mosque: {
    category: "faith",
    designedFor: {
      en: ["Mosques", "Madrasas and Qur'an schools", "Islamic centres", "Zakat and charity committees"],
      am: ["መስጂዶች", "መድረሳዎችና የቁርኣን ትምህርት ቤቶች", "እስላማዊ ማዕከላት", "የዘካትና የበጎ አድራጎት ኮሚቴዎች"],
    },
    highlights: [
      { key: "times", label: { en: "Prayer times", am: "የሶላት ሰዓቶች" } },
      { key: "registration", label: { en: "Madrasa registration", am: "የመድረሳ ምዝገባ" } },
      { key: "booking", label: { en: "Nikah and other service requests", am: "የኒካሕና የሌሎች አገልግሎቶች ጥያቄ" } },
      "gallery",
      "map",
      "languages",
    ],
  },
  events: {
    category: "events",
    designedFor: {
      en: ["Wedding planners", "Event decorators", "Caterers", "Photographers and videographers", "Hall and tent rental"],
      am: ["የሠርግ አዘጋጆች", "የዝግጅት አስጌጮች", "የምግብ አቅራቢዎች", "ፎቶግራፈሮችና ቪዲዮ ቀራጮች", "የአዳራሽና የድንኳን ኪራይ"],
    },
    highlights: [
      { key: "prices", label: { en: "Packages and prices", am: "ፓኬጆችና ዋጋ" } },
      "gallery",
      { key: "booking", label: { en: "Date enquiries", am: "የቀን ጥያቄ" } },
      "reviews",
      "faq",
      "languages",
    ],
  },
  ngo: {
    category: "faith",
    designedFor: {
      en: ["Charities and NGOs", "Community associations", "Youth and women's groups", "Foundations"],
      am: ["የበጎ አድራጎትና መንግሥታዊ ያልሆኑ ድርጅቶች", "የማኅበረሰብ ማኅበራት", "የወጣቶችና የሴቶች ቡድኖች", "ፋውንዴሽኖች"],
    },
    highlights: [
      { key: "numbers", label: { en: "Impact in numbers", am: "የሥራ ውጤት በቁጥር" } },
      { key: "registration", label: { en: "Volunteer sign-up", am: "የበጎ ፈቃደኞች ምዝገባ" } },
      "timeline",
      "contactForm",
      "faq",
      "languages",
    ],
  },
  "real-estate": {
    category: "shops",
    designedFor: {
      en: ["Real estate agents and brokers", "Property developers", "Landlords with homes to rent", "Property managers"],
      am: ["የሪል እስቴት ወኪሎችና ደላሎች", "የቤት አልሚዎች", "ቤት የሚያከራዩ ባለንብረቶች", "የንብረት አስተዳዳሪዎች"],
    },
    highlights: [
      { key: "prices", label: { en: "Listings with prices", am: "ቤቶች ከዋጋ ጋር" } },
      { key: "booking", label: { en: "Viewing requests", am: "የጉብኝት ቀጠሮ ጥያቄ" } },
      "whatsapp",
      "reviews",
      "faq",
      "languages",
    ],
  },
  tours: {
    category: "travel",
    designedFor: {
      en: ["Tour operators", "Travel agents", "Local guides", "Car hire with a driver"],
      am: ["አስጎብኚ ድርጅቶች", "የጉዞ ወኪሎች", "የአካባቢ አስጎብኚዎች", "ሹፌር ያለው መኪና አከራዮች"],
    },
    highlights: [
      { key: "prices", label: { en: "Trips with prices", am: "ጉዞዎች ከዋጋ ጋር" } },
      { key: "times", label: { en: "Day-by-day plans", am: "የቀን በቀን ዕቅድ" } },
      { key: "booking", label: { en: "Trip enquiries", am: "የጉዞ ጥያቄ" } },
      "gallery",
      "whatsapp",
      "reviews",
      "languages",
    ],
  },
  personal: {
    category: "business",
    designedFor: {
      en: ["Designers and photographers", "Freelancers", "Consultants and coaches", "Job seekers with a CV", "Artists and writers"],
      am: ["ዲዛይነሮችና ፎቶግራፈሮች", "ፍሪላንሰሮች", "አማካሪዎችና አሠልጣኞች", "የሥራ ልምዳቸውን የሚያሳዩ ሥራ ፈላጊዎች", "ሠዓሊዎችና ጸሐፊዎች"],
    },
    highlights: [
      { key: "cards", label: { en: "Your work with photos", am: "ሥራዎችዎ ከፎቶ ጋር" } },
      { key: "timeline", label: { en: "Experience timeline", am: "የሥራ ልምድ በጊዜ ቅደም ተከተል" } },
      "reviews",
      "contactForm",
      "faq",
      "languages",
    ],
  },
  business: {
    category: "business",
    designedFor: {
      en: ["Consulting firms", "Accountants and auditors", "Law offices", "Construction and engineering firms", "Import and trading companies"],
      am: ["የማማከር ድርጅቶች", "የሒሳብ ባለሙያዎችና ኦዲተሮች", "የሕግ ቢሮዎች", "የግንባታና የምሕንድስና ድርጅቶች", "የአስመጪና የንግድ ድርጅቶች"],
    },
    highlights: [
      { key: "cards", label: { en: "Project case studies", am: "የፕሮጀክት ምሳሌዎች" } },
      "team",
      "numbers",
      "reviews",
      { key: "contactForm", label: { en: "Quote requests", am: "የዋጋ ጥያቄ" } },
      "map",
      "languages",
    ],
  },
  salon: {
    category: "health",
    designedFor: {
      en: ["Beauty salons", "Barbershops", "Nail and lash studios", "Spas and massage", "Bridal make-up artists"],
      am: ["የውበት ሳሎኖች", "የወንዶች ፀጉር ቤቶች", "የጥፍርና የሽፋሽፍት ስቱዲዮዎች", "ስፓና ማሳጅ", "የሙሽሮች ሜካፕ ባለሙያዎች"],
    },
    highlights: [
      { key: "menu", label: { en: "Price list", am: "የዋጋ ዝርዝር" } },
      { key: "booking", label: { en: "Appointment booking", am: "የቀጠሮ ማስያዣ" } },
      "gallery",
      { key: "team", label: { en: "Stylists with photos", am: "ባለሙያዎች ከፎቶ ጋር" } },
      "hours",
      "map",
      "languages",
    ],
  },
  fashion: {
    category: "shops",
    designedFor: {
      en: ["Habesha dress makers and boutiques", "Tailors and made-to-measure", "Small clothing brands", "Weavers and netela sellers"],
      am: ["የሀበሻ ቀሚስ ሰፊዎችና ቡቲኮች", "ልብስ ሰፊዎችና በልክ ሰፊዎች", "አነስተኛ የልብስ ብራንዶች", "ሸማኔዎችና ነጠላ ሻጮች"],
    },
    highlights: [
      { key: "prices", label: { en: "Collection with prices", am: "ስብስብ ከዋጋ ጋር" } },
      { key: "order", label: { en: "Made-to-measure orders", am: "በልክ የማሰፊያ ትዕዛዝ" } },
      { key: "steps", label: { en: "Ordering from abroad", am: "ከውጭ ማዘዝ" } },
      "gallery",
      "reviews",
      "languages",
    ],
  },
  construction: {
    category: "business",
    designedFor: {
      en: ["Building materials suppliers", "Hardware and finishing shops", "Aluminium and steel workshops", "Small contractors"],
      am: ["የግንባታ ዕቃ አቅራቢዎች", "የሃርድዌርና የማጠናቀቂያ ሱቆች", "የአሉሚኒየምና የብረት ወርክሾፖች", "አነስተኛ የሥራ ተቋራጮች"],
    },
    highlights: [
      { key: "menu", label: { en: "Today's prices with units", am: "የዛሬ ዋጋ ከመለኪያ ጋር" } },
      { key: "order", label: { en: "Quote requests", am: "የዋጋ ጥያቄ" } },
      "numbers",
      "steps",
      "map",
      "languages",
    ],
  },
  garage: {
    category: "business",
    designedFor: {
      en: ["Garages and car service", "Car rental with driver", "Tyre and alignment shops", "Car wash and detailing"],
      am: ["ጋራዦችና የመኪና አገልግሎት", "የመኪና ኪራይ ከሹፌር ጋር", "የጎማና የአላይንመንት ሱቆች", "የመኪና እጥበት"],
    },
    highlights: [
      { key: "menu", label: { en: "Fixed service prices", am: "ቋሚ የአገልግሎት ዋጋ" } },
      { key: "booking", label: { en: "Service and rental booking", am: "የአገልግሎትና የኪራይ ቀጠሮ" } },
      { key: "cards", label: { en: "Fleet with day rates", am: "መኪኖች ከቀን ዋጋ ጋር" } },
      "hours",
      "faq",
      "languages",
    ],
  },
  bakery: {
    category: "food",
    designedFor: {
      en: ["Bakeries and cake shops", "Home bakers taking orders", "Pastry and dessert shops", "Wedding cake makers"],
      am: ["ዳቦና ኬክ ቤቶች", "ትዕዛዝ የሚቀበሉ የቤት ጋጋሪዎች", "የፓስቲና የጣፋጭ ሱቆች", "የሠርግ ኬክ ሠሪዎች"],
    },
    highlights: [
      { key: "prices", label: { en: "Cakes with sizes and prices", am: "ኬኮች ከመጠንና ከዋጋ ጋር" } },
      { key: "menu", label: { en: "Daily bread and pastries", am: "የዕለቱ ዳቦና ፓስቲ" } },
      { key: "order", label: { en: "Cake orders, also from abroad", am: "የኬክ ትዕዛዝ፣ ከውጭም" } },
      "steps",
      "gallery",
      "languages",
    ],
  },
  studio: {
    category: "events",
    designedFor: {
      en: ["Wedding photographers", "Video and film studios", "Portrait studios", "Event photographers"],
      am: ["የሠርግ ፎቶ አንሺዎች", "የቪዲዮና የፊልም ስቱዲዮዎች", "የፎቶ ስቱዲዮዎች", "የዝግጅት ፎቶ አንሺዎች"],
    },
    highlights: [
      "gallery",
      { key: "prices", label: { en: "Packages side by side", am: "ፓኬጆች ጎን ለጎን" } },
      { key: "booking", label: { en: "Date enquiries", am: "የቀን ጥያቄ" } },
      "steps",
      "callTelegram",
      "languages",
    ],
  },
  training: {
    category: "education",
    designedFor: {
      en: ["Tutoring and exam prep centres", "Language schools", "Computer training centres", "Driving schools"],
      am: ["የማጠናከሪያና የፈተና ዝግጅት ማዕከላት", "የቋንቋ ትምህርት ቤቶች", "የኮምፒውተር ሥልጠና ማዕከላት", "የማሽከርከር ትምህርት ቤቶች"],
    },
    highlights: [
      { key: "cards", label: { en: "Courses with fees and intakes", am: "ኮርሶች ከክፍያና ከቅበላ ጋር" } },
      { key: "times", label: { en: "Weekly timetable", am: "ሳምንታዊ የጊዜ ሰሌዳ" } },
      "registration",
      "numbers",
      "faq",
      "languages",
    ],
  },
  pharmacy: {
    category: "health",
    designedFor: {
      en: ["Community pharmacies", "Drug stores", "Medical supply shops", "Optical shops"],
      am: ["የሰፈር ፋርማሲዎች", "መድኃኒት ቤቶች", "የሕክምና ዕቃ ሱቆች", "የመነጽር ሱቆች"],
    },
    highlights: [
      { key: "contactForm", label: { en: "Ask if it's in stock", am: "መኖሩን ይጠይቁ" } },
      { key: "callTelegram", label: { en: "Prescriptions on Telegram", am: "ማዘዣ በቴሌግራም" } },
      "hours",
      "steps",
      "map",
      "languages",
    ],
  },
  gym: {
    category: "health",
    designedFor: {
      en: ["Gyms and fitness centres", "Boxing and martial arts clubs", "Women-only fitness studios", "Personal trainers"],
      am: ["ጂሞችና የአካል ብቃት ማዕከላት", "የቦክስና የማርሻል አርት ክለቦች", "የሴቶች ብቻ የአካል ብቃት ስቱዲዮዎች", "የግል አሠልጣኞች"],
    },
    highlights: [
      { key: "prices", label: { en: "Memberships side by side", am: "አባልነት ጎን ለጎን" } },
      { key: "times", label: { en: "Class timetable", am: "የክፍሎች ሰሌዳ" } },
      { key: "booking", label: { en: "Free first visit", am: "ነጻ የመጀመሪያ ጉብኝት" } },
      "numbers",
      "reviews",
      "languages",
    ],
  },
  resort: {
    category: "travel",
    designedFor: {
      en: ["Luxury and boutique hotels", "Resorts and lodges", "Spa retreats", "Private villas"],
      am: ["ቅንጡና ልዩ ሆቴሎች", "ሪዞርቶችና ሎጆች", "የስፓ ማረፊያዎች", "የግል ቪላዎች"],
    },
    highlights: [
      { key: "prices", label: { en: "Suites with nightly rates", am: "ስዊቶች ከአዳር ዋጋ ጋር" } },
      { key: "booking", label: { en: "Private reservations", am: "የግል ቦታ ማስያዣ" } },
      { key: "cards", label: { en: "Journeys from the hotel", am: "ከሆቴሉ የሚደረጉ ጉዞዎች" } },
      "reviews",
      "faq",
      "languages",
    ],
  },
} satisfies Record<PresetId, TemplateInfo>;

export function templateInfo(id: PresetId): TemplateInfo {
  return TEMPLATE_INFO[id];
}
