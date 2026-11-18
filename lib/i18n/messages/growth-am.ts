import type { growthEn } from "./growth-en";

type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };

/** Growth loops (2026-11-18), Amharic. */
export const growthAm: Shape<typeof growthEn> = {
  sources: {
    title: "አዲስ ተመዝጋቢዎች ከየት መጡ",
    intro: "የእያንዳንዱ አዲስ ባለቤት የመጀመሪያ ጉብኝት፦ የምልክት ሊንኮች፣ ግብዣዎች፣ የማኅበራዊ ሚዲያ ሊንኮችና QR ኮዶች።",
    source: "ምንጭ",
    days7: "7 ቀናት",
    days30: "30 ቀናት",
    total: "ጠቅላላ",
    names: {
      badge: "በድረ-ገጽ ላይ ያለ ምልክት",
      referral: "ከባለቤት የመጣ ግብዣ",
      telegram: "ቴሌግራም",
      tiktok: "ቲክቶክ",
      facebook: "ፌስቡክ",
      linkedin: "ሊንክድኢን",
      qr: "QR ኮድ",
      other: "ሌሎች ሊንኮች",
      direct: "በቀጥታ",
    },
  },
};
