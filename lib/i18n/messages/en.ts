import { errorMessages } from "./errors";

/**
 * English catalog: the source of truth for message keys.
 * `am.ts` must have exactly the same shape (enforced by the `Messages` type).
 */
export const en = {
  meta: {
    title: "Gojoline: your business online in minutes",
    description:
      "Describe your business in Amharic or English and get a real website with forms and Telegram alerts. Pay in Birr.",
  },
  common: {
    skipToContent: "Skip to content",
    languageSwitch: "አማርኛ",
    languageSwitchLabel: "Switch to Amharic",
    homeLink: "Gojoline home",
    logoAlt: "Gojoline",
  },
  landing: {
    hero: {
      eyebrow: "The website builder that speaks Amharic",
      title: "Describe your business. Get your home online.",
      subtitle:
        "Tell Gojoline about your café, shop, clinic or school, in Amharic or English. In minutes you have a real website with booking forms and Telegram alerts, paid in Birr.",
      cta: "Join the waitlist",
      secondary: "See how it works",
      chatUserLabel: "You",
      chatUser:
        "We are a small café in Bole. Coffee, breakfast and fresh juice, open 7 am to 9 pm.",
      chatBotLabel: "Gojoline",
      chatBot:
        "Your site is ready: menu, opening hours, map and a table booking form.",
    },
    steps: {
      title: "How it works",
      one: {
        title: "Tell us about your business",
        body: "Write or speak as you would to a friend. Gojoline asks two or three short questions.",
      },
      two: {
        title: "See your site appear",
        body: "A live preview builds in under a minute. Change anything by chatting: “make the header green”.",
      },
      three: {
        title: "Publish and get customers",
        body: "Go live on your own link. Bookings and orders arrive in your Telegram.",
      },
    },
    features: {
      title: "Everything a small business needs",
      language: {
        title: "Amharic and English",
        body: "Your site can speak both, with clear Ge'ez fonts and a language switch.",
      },
      forms: {
        title: "Forms that reach you",
        body: "Contact, booking and order forms. Every new entry pings your Telegram.",
      },
      edits: {
        title: "Edit by chatting",
        body: "Change prices, photos and text from the builder or straight from Telegram.",
      },
      birr: {
        title: "Pay in Birr",
        body: "Plans start free. Pay by Telebirr or bank transfer, no foreign card needed.",
      },
    },
    audience: {
      title: "Made for",
      list: "Cafés and restaurants · Hotels · Clinics · Schools · Shops · Churches and mosques · Events · NGOs · Real estate · Tour operators",
    },
    pricing: {
      title: "Start free",
      body: "Build and publish one site for free. Paid plans with your own domain start from 399 Birr a month.",
    },
  },
  waitlist: {
    title: "Be among the first",
    body: "We are opening Gojoline to a small group of businesses first. Leave your details and we will contact you.",
    nameLabel: "Your name",
    contactLabel: "Phone or email",
    contactHint: "For example 0911 234 567 or you@example.com",
    businessLabel: "Type of business (optional)",
    businessPlaceholder: "Café, shop, clinic...",
    submit: "Join the waitlist",
    submitting: "Sending...",
    successTitle: "You're on the list",
    successBody: "Thank you. We will reach out soon.",
    privacy: "We only use your details to contact you about Gojoline.",
    errors: {
      nameRequired: "Please enter your name.",
      contactInvalid:
        "Please enter a valid Ethiopian phone number or an email address.",
      businessTooLong: "Please keep this under 80 characters.",
      tooMany: "Too many tries. Please wait a minute and try again.",
      generic: "Something went wrong. Please try again.",
    },
  },
  builder: {
    metaTitle: "Your sites",
    title: "Your sites",
    newSite: "Start a new site",
    empty: "You have no sites yet. Start one: it takes a few minutes.",
    untitled: "New site",
    updated: "Last change {date}",
    back: "All sites",
    accessTitle: "Enter your access code",
    accessBody: "Gojoline is open to a small group of businesses first. Enter the code we sent you.",
    accessLabel: "Access code",
    accessSubmit: "Continue",
    accessWrong: "That code is not right. Please check it and try again.",
    unavailable: "The builder is resting right now. Please try again later.",
    chatLabel: "Your message",
    chatPlaceholder: "Describe your business, or the change you want",
    send: "Send",
    welcome:
      "Tell me about your business: its name, what you offer, where you are and how customers reach you. You can write in Amharic or English.",
    you: "You",
    assistant: "Gojoline",
    working: "Working on your site...",
    stepReading: "Looking at your site",
    stepEditing: "Updating your site",
    stepChecking: "Checking everything works",
    stepFixing: "Fixing a small problem",
    reverted: "I couldn't finish this change, so I kept your site as it was. Please try again or say it another way.",
    failed: "Something went wrong. Your site is unchanged. Please try again.",
    busy: "I'm still working on your last request. Please wait a moment.",
    tooMany: "You've sent many requests. Please wait a little and try again.",
    versionSaved: "Saved as version {n}",
    tabChat: "Chat",
    tabPreview: "Preview",
    tabVersions: "Versions",
    tabCode: "Files",
    previewTitle: "Preview of your site",
    previewLoading: "Opening your preview...",
    previewEmpty: "Your site will appear here after your first message.",
    previewPhone: "Phone",
    previewDesktop: "Computer",
    previewOpen: "Open in a new tab",
    versionsEmpty: "No versions yet. Each change you make is saved here.",
    versionLabel: "Version {n}",
    versionCurrent: "Showing now",
    versionRestore: "Bring back",
    versionRestoring: "Bringing back...",
    versionRestoredFrom: "Brought back version {n}",
    versionRestoreFailed: "We couldn't bring back that version. Please try again.",
    codeHint: "This is what your site is made of. Ask in the chat to change anything.",
    viewsLabel: "Site views",
    previewError: "We couldn't open your preview. Your site is safe.",
    loadError: "We couldn't load this. Please try again.",
    retry: "Try again",
    codeEmpty: "Nothing here yet.",
  },
  footer: {
    tagline: "Your home online.",
    madeIn: "Made in Addis Ababa",
    rights: "© {year} Gojoline",
  },
  errors: errorMessages.en,
};

type Stringify<T> = {
  [K in keyof T]: T[K] extends string ? string : Stringify<T[K]>;
};
export type Messages = Stringify<typeof en>;
