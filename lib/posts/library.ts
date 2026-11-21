/**
 * Ready-made subjects for the days that aren't about a template or a site: short, true things
 * about Gojoline, in English and Amharic. The captions the AI writes start from these facts.
 */
export interface LibraryItem {
  id: string;
  en: string;
  am: string;
}

export const TIPS: LibraryItem[] = [
  { id: "tip-photos", en: "Your own photos make the biggest difference. Send them in the chat and say where they go.", am: "የራስዎ ፎቶዎች ትልቁን ለውጥ ያመጣሉ። በውይይቱ ይላኩና የት እንደሚገቡ ይንገሩን።" },
  { id: "tip-hours", en: "Put your opening hours and phone number on your site, so people can find you and call.", am: "ሰዎች እንዲያገኙዎትና እንዲደውሉ የሥራ ሰዓትዎንና ስልክ ቁጥርዎን በድረ-ገጽዎ ላይ ያስቀምጡ።" },
  { id: "tip-telegram", en: "Link your Telegram, and every booking or message from your site reaches your phone at once.", am: "ቴሌግራምዎን ያገናኙ፤ ከድረ-ገጽዎ የሚመጣ ቦታ ማስያዝና መልእክት ወዲያው ስልክዎ ላይ ይደርሳል።" },
  { id: "tip-amharic", en: "Your site can be in Amharic, English or both. Customers choose with one tap.", am: "ድረ-ገጽዎ በአማርኛ፣ በእንግሊዝኛ ወይም በሁለቱም ሊሆን ይችላል። ደንበኞች በአንድ ንክኪ ይመርጣሉ።" },
  { id: "tip-change", en: "Changing your site is a chat message: \"make the title bigger\" or \"add a price list\".", am: "ድረ-ገጽዎን መቀየር አንድ መልእክት ነው፦ «ርዕሱን አትልቅ» ወይም «የዋጋ ዝርዝር ጨምር»።" },
  { id: "tip-versions", en: "Every change is saved as a version. Didn't like it? Bring the old one back in one tap.", am: "እያንዳንዱ ለውጥ እንደ ስሪት ይቀመጣል። አልወደዱትም? የቀደመውን በአንድ ንክኪ ይመልሱ።" },
  { id: "tip-share", en: "Share your site's link on Telegram, WhatsApp and on your business card.", am: "የድረ-ገጽዎን ሊንክ በቴሌግራም፣ በዋትስአፕና በቢዝነስ ካርድዎ ላይ ያጋሩ።" },
  { id: "tip-map", en: "Add a map, so customers find your door without calling for directions.", am: "ደንበኞች አቅጣጫ ለመጠየቅ ሳይደውሉ በርዎን እንዲያገኙ ካርታ ያክሉ።" },
];

export const FEATURES: LibraryItem[] = [
  { id: "feature-booking", en: "Booking and contact forms: answers arrive in your dashboard and on Telegram.", am: "የቦታ ማስያዣና የመገናኛ ቅጾች፦ መልሶች ወደ ዳሽቦርድዎና ቴሌግራም ይደርሳሉ።" },
  { id: "feature-domain", en: "Use your own web address, like yourname.com, on the Starter and Business plans.", am: "በስታርተርና በቢዝነስ ዕቅዶች እንደ yourname.com ያለ የራስዎን አድራሻ ይጠቀሙ።" },
  { id: "feature-birr", en: "Pay in Birr with Telebirr or a bank transfer. No card needed.", am: "በቴሌብር ወይም በባንክ ዝውውር በብር ይክፈሉ። ካርድ አያስፈልግም።" },
  { id: "feature-phone", en: "Every site is made for phones first, and loads fast even on a slow connection.", am: "እያንዳንዱ ድረ-ገጽ በመጀመሪያ ለስልክ ይሠራል፤ በዝግ ኢንተርኔትም በፍጥነት ይከፈታል።" },
  { id: "feature-visits", en: "See how many people visit your site each day, and where they come from.", am: "በየቀኑ ስንት ሰው ድረ-ገጽዎን እንደሚጎበኝና ከየት እንደሚመጡ ይመልከቱ።" },
  { id: "feature-free", en: "Start free: build your site and publish it on a free Gojoline address.", am: "በነጻ ይጀምሩ፦ ድረ-ገጽዎን ሠርተው በነጻ የጎጆላይን አድራሻ ያትሙት።" },
];

export const IDEAS: LibraryItem[] = [
  { id: "idea-cafe", en: "A café: your menu with prices, opening hours and a map.", am: "ካፌ፦ ምናሌዎ ከዋጋ ጋር፣ የሥራ ሰዓትና ካርታ።" },
  { id: "idea-church", en: "A church: service times, events and a way to give.", am: "ቤተ ክርስቲያን፦ የአገልግሎት ሰዓቶች፣ ዝግጅቶችና መስጫ መንገድ።" },
  { id: "idea-school", en: "A school: programmes, fees, news and an enquiry form for parents.", am: "ትምህርት ቤት፦ ፕሮግራሞች፣ ክፍያዎች፣ ዜናና ለወላጆች የመጠየቂያ ቅጽ።" },
  { id: "idea-portfolio", en: "A portfolio: your best work, your story and how to hire you.", am: "ፖርትፎሊዮ፦ ምርጥ ሥራዎችዎ፣ ታሪክዎና እንዴት እንደሚቀጠሩ።" },
  { id: "idea-hotel", en: "A hotel or guest house: rooms, prices, photos and booking requests.", am: "ሆቴል ወይም የእንግዳ ማረፊያ፦ ክፍሎች፣ ዋጋዎች፣ ፎቶዎችና የቦታ ማስያዝ ጥያቄዎች።" },
  { id: "idea-event", en: "A wedding or event: the date, the place, the programme and RSVPs.", am: "ሠርግ ወይም ዝግጅት፦ ቀኑ፣ ቦታው፣ ፕሮግራሙና የመገኘት ማረጋገጫ።" },
  { id: "idea-clinic", en: "A clinic: services, doctors, hours and appointment requests.", am: "ክሊኒክ፦ አገልግሎቶች፣ ሐኪሞች፣ ሰዓታትና የቀጠሮ ጥያቄዎች።" },
  { id: "idea-shop", en: "A shop: your products with photos and prices, and how to order.", am: "ሱቅ፦ ምርቶችዎ ከፎቶና ከዋጋ ጋር፣ እና እንዴት እንደሚታዘዝ።" },
];

export const LIBRARY: Record<"tip" | "feature" | "idea", LibraryItem[]> = { tip: TIPS, feature: FEATURES, idea: IDEAS };

export function libraryItem(id: string | null): LibraryItem | null {
  if (!id) return null;
  return [...TIPS, ...FEATURES, ...IDEAS].find((x) => x.id === id) ?? null;
}
