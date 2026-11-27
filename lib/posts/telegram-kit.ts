import type { Quiz } from "@/lib/telegram/client";

/**
 * The Telegram channel's first posts (2026-11-25): a fixed starter set the founder posts once,
 * in order, two a day. Admin → Posts → Telegram start shows each with its text, its media
 * (public/kit/telegram) and "Send to channel". English, like all posts. `{link}` becomes the
 * short channel link (/r/tg).
 */
export type KitMedia = { kind: "video" | "photo"; file: string };
export interface KitPost {
  id: string;
  /** 1-based day of the plan (two posts a day). */
  day: number;
  title: string;
  media: KitMedia[];
  text: string;
  quiz?: Quiz;
}

const v = (file: string): KitMedia => ({ kind: "video", file });
const p = (file: string): KitMedia => ({ kind: "photo", file });

export const TELEGRAM_KIT: KitPost[] = [
  {
    id: "welcome",
    day: 1,
    title: "Welcome (pin this)",
    media: [v("1-launch.mp4")],
    text: `👋 Welcome to Gojoline!

🏠 Your business website, built from ONE message.

How it works:
1️⃣ Describe your business: name, what you sell, where you are
2️⃣ Gojoline builds your website in about a minute
3️⃣ Want a change? Just ask in the chat
4️⃣ Publish and share your link

✅ English or Amharic
✅ No coding, no designer
✅ Free to start, pay in Birr (Telebirr or bank)

👉 Start free: {link}

Share this channel with a business owner you know 🙏`,
  },
  {
    id: "real-build",
    day: 1,
    title: "The real build",
    media: [1, 2, 3, 4, 5].map((i) => p(`2-real-build-${i}.jpg`)),
    text: `☕ A real café. A real website. 62 seconds.

Habesha Coffee in Bole typed ONE message:
"We are Habesha Coffee in Bole, Addis Ababa. Traditional buna, macchiato and breakfast. Open every day 7 am to 9 pm."

62 seconds later: home page, menu, map, phone number, in English AND Amharic.
Then: "Change the main colour to deep green". Done in 34 seconds 💚

Your business could be next 👇
{link}`,
  },
  {
    id: "how-to",
    day: 2,
    title: "How to build it",
    media: [v("3-how-to.mp4")],
    text: `📱 How to build your website, step by step

1. Open gojoline.afridea.et
2. Sign in with your phone or email
3. Tap "Start a new site"
4. Describe your business
5. Wait about a minute
6. Your site is ready ✨
7. Change anything by chatting
8. Publish and share your link

📌 Save this post for later.`,
  },
  {
    id: "quiz",
    day: 2,
    title: "Quiz",
    media: [],
    text: "A café typed one message into Gojoline. How long until its website was built?",
    quiz: {
      question: "A café typed one message into Gojoline. How long until its website was built?",
      options: ["2 weeks", "3 days", "About 1 minute", "5 hours"],
      correct: 2,
      explanation: "Real build: Habesha Coffee, Bole. About a minute.",
    },
  },
  {
    id: "prices",
    day: 3,
    title: "Prices",
    media: [p("5-prices.jpg")],
    text: `💰 How much does a website cost?

🆓 Free: 1 site, 10 AI changes a month
⭐ Starter: 499 Birr/month: your own domain, no badge, answers on Telegram
🚀 Business: 1,299 Birr/month: up to 3 sites, we connect your domain

Pay yearly: 2 months free.
Telebirr or bank transfer. No dollar card needed 🇪🇹

👉 {link}`,
  },
  {
    id: "designs",
    day: 3,
    title: "Ready designs",
    media: [1, 2, 3, 4].map((i) => p(`6-designs-${i}.jpg`)),
    text: `🎨 Which one is your business?

☕ Café · 💇🏾‍♀️ Salon · 🏥 Clinic · 🏨 Hotel · 🎓 School · 👗 Boutique, and more

Pick a design, then change anything by chatting.
💬 Tell us your business type in the comments!`,
  },
  {
    id: "menu-tip",
    day: 4,
    title: "Tip: one link for your menu",
    media: [v("7-menu-tip.mp4")],
    text: `📩 Stop sending menu photos one by one.

Send ONE link with your menu, prices, photos and map. Always up to date.

👉 Make yours free: {link}`,
  },
];

export const KIT_IDS = TELEGRAM_KIT.map((k) => k.id);
export const kitMediaUrl = (file: string) => `/kit/telegram/${file}`;
export const kitText = (k: KitPost, link: string) => k.text.replaceAll("{link}", link);
