/**
 * Subjects for Gojoline's daily posts (English: every caption is reviewed by an admin before it
 * goes out). True statements only: the AI writes from these facts and may not add any.
 *
 * The mix follows what brings people to a tool like ours (2026-11-21 research): short demos of
 * the result, useful how-tos and tips for small businesses, myths people believe about websites,
 * questions that start conversations, the story behind Gojoline, and local moments.
 */
export interface LibraryItem {
  id: string;
  en: string;
}

export const TIPS: LibraryItem[] = [
  { id: "tip-photos", en: "Your own photos make the biggest difference to a website. Send them in the chat and say where they go." },
  { id: "tip-hours", en: "Put your opening hours and phone number on your website, so people can find you and call." },
  { id: "tip-telegram", en: "On the Starter and Business plans, link your Telegram and every booking or message from your website reaches your phone at once." },
  { id: "tip-languages", en: "Your website can be in Amharic, English or both. Customers choose with one tap." },
  { id: "tip-change", en: "Changing your website is one chat message, like \"make the title bigger\" or \"add a price list\"." },
  { id: "tip-versions", en: "Every change is saved as a version. Didn't like it? Bring the old one back in one tap." },
  { id: "tip-share", en: "Put your website's link in your Telegram bio, your WhatsApp status and on your business card." },
  { id: "tip-map", en: "Add a map, so customers find your door without calling for directions." },
  { id: "tip-prices", en: "Show your prices. People who already know the price are the ones who call." },
  { id: "tip-reviews", en: "Add what happy customers said about you. New customers trust other customers." },
];

export const FEATURES: LibraryItem[] = [
  { id: "feature-booking", en: "Booking and contact forms: answers arrive in your dashboard, and on Telegram with the Starter and Business plans." },
  { id: "feature-domain", en: "Use your own web address, like yourname.com (bought separately), on the Starter and Business plans." },
  { id: "feature-birr", en: "Pay in Birr with Telebirr or a bank transfer. No card needed." },
  { id: "feature-phone", en: "Every website is made for phones first, and loads fast even on a slow connection." },
  { id: "feature-visits", en: "See how many people visit your website each day, and where they come from." },
  { id: "feature-free", en: "Start free: build your website and publish it on a free Gojoline address." },
];

export const IDEAS: LibraryItem[] = [
  { id: "idea-cafe", en: "A café: your menu with prices, opening hours and a map." },
  { id: "idea-church", en: "A church: service times, events and a way to give." },
  { id: "idea-school", en: "A school: programmes, fees, news and an enquiry form for parents." },
  { id: "idea-portfolio", en: "A portfolio: your best work, your story and how to hire you." },
  { id: "idea-hotel", en: "A hotel or guest house: rooms, prices, photos and booking requests." },
  { id: "idea-event", en: "A wedding or event: the date, the place, the programme and RSVPs." },
  { id: "idea-clinic", en: "A clinic: services, doctors, hours and appointment requests." },
  { id: "idea-shop", en: "A shop: your products with photos and prices, and how to order." },
];

/** Things people believe about websites, and what is true with Gojoline. */
export const MYTHS: LibraryItem[] = [
  { id: "myth-developer", en: "Myth: you need to hire a developer to get a website. Fact: with Gojoline you describe your business in a chat message and get a working website you can check and publish yourself." },
  { id: "myth-expensive", en: "Myth: a website is expensive. Fact: you can build and publish your website free on a Gojoline address, and pay in Birr only if you want more." },
  { id: "myth-big-business", en: "Myth: websites are only for big companies. Fact: cafés, salons, churches, schools, photographers and small shops all use one so people can find them." },
  { id: "myth-english", en: "Myth: a website has to be in English. Fact: your website can be in Amharic, English or both." },
  { id: "myth-telegram", en: "Myth: a Telegram channel is enough. Fact: people can find a website on Google, and a customer can see your menu, prices and hours without joining anything." },
  { id: "myth-time", en: "Myth: making a website takes weeks. Fact: Gojoline builds the first version in about a minute; you change anything after by chatting." },
];

/** Questions that start conversations (people answer, and the post reaches more people). */
export const QUESTIONS: LibraryItem[] = [
  { id: "q-first-ask", en: "A website answers customers' first question before they ask it. What do your customers ask you first on Telegram: prices, location or opening hours?" },
  { id: "q-have-site", en: "Does your business have a website yet? Yes, no, or \"I'm planning one\"?" },
  { id: "q-find-you", en: "How do new customers find you today: friends, Telegram, TikTok, Google, or walking past?" },
  { id: "q-dream-site", en: "If your business had a website tomorrow, what is the one thing it should show?" },
  { id: "q-language", en: "Should a small business website be in Amharic, English, or both?" },
];

/** Short, practical how-tos in three steps. */
export const HOWTOS: LibraryItem[] = [
  { id: "how-first-site", en: "How to make your first website in three steps: 1) describe your business in one message, 2) check the website Gojoline builds, 3) press Publish." },
  { id: "how-change", en: "How to change your website: open it, type what you want in the chat (\"add our new menu\"), and the preview updates by itself." },
  { id: "how-photos", en: "How to add your own photos: send them in the chat, say where they go (\"use this one at the top\"), done." },
  { id: "how-share", en: "How to get your first visitors: share your website's link on Telegram, put it in your bio, and print it on your receipts." },
  { id: "how-bookings", en: "How to take bookings online: ask for a booking form in the chat, and each request arrives in your dashboard (and on your phone through Telegram on the Starter and Business plans)." },
];

/** The story behind Gojoline (true facts only). */
export const STORIES: LibraryItem[] = [
  { id: "story-name", en: "Why \"Gojoline\"? Gojo (ጎጆ) means home in Amharic: Gojoline is a home online for your business." },
  { id: "story-made", en: "Gojoline is built for businesses in Ethiopia first: Amharic built in, payments in Birr, and websites that load fast on a phone." },
  { id: "story-why", en: "With Gojoline, a website starts with a chat message: no designer, no code, and you can start free." },
];

export const LIBRARY = { tip: TIPS, feature: FEATURES, idea: IDEAS, myth: MYTHS, question: QUESTIONS, howto: HOWTOS, story: STORIES } as const;

/**
 * Days worth a post of their own (Gregorian dates in Ethiopia). A moment replaces that day's
 * planned post; the caption greets people and connects the day to their business, warmly.
 */
export const MOMENTS: (LibraryItem & { dates: string[] })[] = [
  { id: "moment-genna", dates: ["01-07"], en: "Melkam Genna! Greetings to everyone celebrating Ethiopian Christmas. A busy week for many businesses: a website lets customers see your holiday hours and send a request ahead." },
  { id: "moment-timket", dates: ["2027-01-19", "2028-01-20"], en: "Melkam Timket! Greetings to everyone celebrating Epiphany." },
  { id: "moment-adwa", dates: ["03-02"], en: "Adwa Victory Day: remembering the victory at Adwa in 1896 and those who won it. Proud to be Ethiopian." },
  { id: "moment-fasika", dates: ["2026-04-12", "2027-05-02", "2028-04-16"], en: "Melkam Fasika! Greetings to everyone celebrating Ethiopian Easter." },
  { id: "moment-new-year", dates: ["2026-09-11", "2027-09-12", "2028-09-11"], en: "Melkam Addis Amet! Happy Ethiopian New Year to everyone. A new year is a good time to start something new." },
  { id: "moment-meskel", dates: ["2026-09-27", "2027-09-28", "2028-09-27"], en: "Melkam Meskel! Greetings to everyone celebrating." },
  // Islamic holidays follow the moon: the admin checks the day before approving.
  { id: "moment-eid-fitr", dates: ["2027-03-10", "2028-02-27"], en: "Eid Mubarak! Greetings to everyone celebrating Eid al-Fitr." },
  { id: "moment-eid-adha", dates: ["2026-05-27", "2027-05-17", "2028-05-05"], en: "Eid Mubarak! Greetings to everyone celebrating Eid al-Adha (Arafa)." },
  { id: "moment-mawlid", dates: ["2026-08-26", "2027-08-15", "2028-08-04"], en: "Greetings to everyone celebrating Mawlid." },
  { id: "moment-new-year-greg", dates: ["01-01"], en: "Happy New Year! A good moment to give your business a home online." },
];

/** The moment on this day (YYYY-MM-DD), if any. */
export function momentOn(day: string): (LibraryItem & { dates: string[] }) | null {
  return MOMENTS.find((m) => m.dates.some((d) => (d.length === 5 ? day.slice(5) === d : day === d))) ?? null;
}

/** Example messages, like the ones on the home page, shown beside a template of that kind ("one message → a website like this"). */
export const DEMO_PROMPTS: Record<string, string> = {
  cafe: "We're a café in Bole: buna, macchiato and breakfast, open 7 am to 9 pm.",
  hotel: "A small hotel by Lake Tana with 20 rooms and airport pickup.",
  clinic: "A family clinic in Megenagna. People should be able to book a visit.",
  shop: "We sell habesha kemis in Merkato and take custom orders.",
  personal: "I'm a designer and photographer. I want a portfolio clients can contact me from.",
};

export function libraryItem(id: string | null): LibraryItem | null {
  if (!id) return null;
  return [...Object.values(LIBRARY).flat(), ...MOMENTS].find((x) => x.id === id) ?? null;
}
