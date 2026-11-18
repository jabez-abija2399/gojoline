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
  invite: {
    nav: "ንግድ ይጋብዙ",
    title: "ንግድ ይጋብዙ",
    body: "ድረ-ገጽ የሚያስፈልገው ንግድ ያውቃሉ? ሊንክዎን ይላኩላቸው። የመጀመሪያ ክፍያቸውን ሲፈጽሙ ሁለታችሁም ለምስጋና {n} የAI ለውጦች (የአንድ ወር የስታርተር ለውጦች) ታገኛላችሁ።",
    linkLabel: "የግብዣ ሊንክዎ",
    copy: "ቅዳ",
    copied: "ተቀድቷል",
    copyWhat: "የግብዣ ሊንክ",
    shareTelegram: "በቴሌግራም ያጋሩ",
    shareText: "ድረ-ገጼን በጎጆላይን ሠራሁት፤ በአማርኛ ወይም በእንግሊዝኛ፣ በብር ይከፈላል። የእርስዎንም ይሥሩ፦",
    stats: "እስካሁን {invited} ተጋብዘዋል · {rewarded} ምስጋና ተሰጥቷል",
    statsNone: "እስካሁን በሊንክዎ የተቀላቀለ የለም።",
    rules: "በወር እስከ {cap} ምስጋናዎች። የራስዎ ሌሎች መለያዎች አይቆጠሩም።",
  },
  referralsAdmin: {
    tab: "ግብዣዎች",
    title: "ግብዣዎች",
    intro: "በሌላ ባለቤት ሊንክ የተቀላቀሉ ባለቤቶች። ሽልማቱ የሚሰጠው የተጋበዘው ባለቤት የመጀመሪያ ክፍያ ሲጸድቅ ነው።",
    empty: "እስካሁን ግብዣ የለም።",
    inviter: "የጋበዘው",
    invited: "አዲሱ ባለቤት",
    status: "ሁኔታ",
    joined: "የተቀላቀለበት",
    reward: "ምስጋና",
    statuses: { pending: "ክፍያ በመጠበቅ ላይ", rewarded: "ምስጋና ተሰጥቷል", blocked: "ታግዷል" },
    reasons: { same_user: "የራሱ ሊንክ", same_email: "ተመሳሳይ ኢሜይል", same_domain: "ተመሳሳይ የድርጅት ኢሜይል", same_phone: "ተመሳሳይ ስልክ" },
    rewardBoth: "ለእያንዳንዳቸው +{n}",
    rewardCapped: "ለአዲሱ ባለቤት +{n} (ጋባዡ የወሩ ገደብ ላይ ደርሷል)",
  },
};
