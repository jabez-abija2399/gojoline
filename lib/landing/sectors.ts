import type { PresetId } from "@/lib/template/presets";

/**
 * Sector landing pages (/[lang]/website-for/[sector], 2026-11-18): one page per kind of business
 * with its own headline, benefits and questions, mapped to the starter template that fits it.
 * Content, in both languages, kept here as data (like template-info.ts); the page's labels are
 * UI strings in lib/i18n (growth.sectors).
 */
export const SECTORS = ["cafe", "restaurant", "church", "mosque", "school", "salon", "shop", "hotel", "clinic", "wedding", "ngo", "portfolio"] as const;
export type Sector = (typeof SECTORS)[number];

export function isSector(v: unknown): v is Sector {
  return typeof v === "string" && (SECTORS as readonly string[]).includes(v);
}

type Lang = "en" | "am";
interface Copy {
  /** The h1 and the page title. */
  headline: string;
  /** One or two sentences under the headline (also the meta description). */
  intro: string;
  /** What this kind of business gets, most important first (exactly 3). */
  benefits: [Benefit, Benefit, Benefit];
  /** Questions this kind of owner asks (exactly 3). */
  faq: [Qa, Qa, Qa];
  /** Short name for links to this page ("Cafés"). */
  short: string;
}
interface Benefit {
  title: string;
  body: string;
}
interface Qa {
  q: string;
  a: string;
}

export interface SectorPage {
  template: PresetId;
  copy: Record<Lang, Copy>;
}

export const SECTOR_PAGES: Record<Sector, SectorPage> = {
  cafe: {
    template: "cafe",
    copy: {
      en: {
        short: "Cafés",
        headline: "A website for your café in Ethiopia",
        intro: "Show your menu with prices in Birr, take table bookings and let customers call or message you on Telegram, in Amharic and English. You make it by chatting, and it is live in minutes.",
        benefits: [
          { title: "A menu that stays current", body: "Macchiato now 60 Birr? Tell Gojoline in one sentence and the menu on your site changes. Nothing to reprint." },
          { title: "Table bookings and cake orders", body: "Customers book a table or order a birthday cake from their phone. Every request lands in your dashboard, and on Telegram on paid plans." },
          { title: "Easy to find, easy to visit", body: "Opening hours, your address and a map, so someone looking for coffee near Bole or Piassa knows where you are and when you're open." },
        ],
        faq: [
          { q: "Can I show prices in Birr, in Amharic and English?", a: "Yes. Prices are in Birr, and the same menu can be read in Amharic and English: visitors switch with one tap." },
          { q: "I don't have good photos yet. Can I still start?", a: "Yes. The café template comes with sample photos. Replace them with pictures from your phone whenever you are ready; the site won't go live with someone else's people or reviews." },
          { q: "Can customers order a coffee ceremony or cakes for an event?", a: "Yes. Ask Gojoline for an order form: you receive the name, phone number, date and what they want, and you confirm with a call." },
        ],
      },
      am: {
        short: "ካፌዎች",
        headline: "በኢትዮጵያ ላለው ካፌዎ ድረ-ገጽ",
        intro: "ምናሌዎን ከብር ዋጋ ጋር ያሳዩ፣ የጠረጴዛ ቀጠሮ ይቀበሉ፣ ደንበኞችም እንዲደውሉልዎ ወይም በቴሌግራም እንዲጽፉልዎ ያድርጉ፤ በአማርኛና በእንግሊዝኛ። በውይይት ይሠሩታል፤ በደቂቃዎች ውስጥ ኦንላይን ይሆናል።",
        benefits: [
          { title: "ሁልጊዜ የተዘመነ ምናሌ", body: "ማኪያቶ 60 ብር ሆነ? ለጎጆላይን በአንድ ዓረፍተ ነገር ይንገሩ፤ በድረ-ገጽዎ ላይ ያለው ምናሌ ይቀየራል። እንደገና ማሳተም አያስፈልግም።" },
          { title: "የጠረጴዛ ቀጠሮና የኬክ ትዕዛዝ", body: "ደንበኞች ከስልካቸው ጠረጴዛ ይይዛሉ ወይም የልደት ኬክ ያዝዛሉ። እያንዳንዱ ጥያቄ ወደ ዳሽቦርድዎ፣ በክፍያ ዕቅዶች ደግሞ ወደ ቴሌግራምዎ ይደርሳል።" },
          { title: "በቀላሉ ይገኛሉ", body: "የሥራ ሰዓት፣ አድራሻና ካርታ፤ ቦሌ ወይም ፒያሳ አካባቢ ቡና የሚፈልግ ሰው የት እንዳሉና መቼ ክፍት እንደሆኑ ያውቃል።" },
        ],
        faq: [
          { q: "ዋጋዎችን በብር፣ በአማርኛና በእንግሊዝኛ ማሳየት እችላለሁ?", a: "አዎ። ዋጋዎቹ በብር ናቸው፤ ያው ምናሌ በአማርኛና በእንግሊዝኛ ይነበባል፤ ጎብኚዎች በአንድ ንክኪ ቋንቋ ይቀይራሉ።" },
          { q: "እስካሁን ጥሩ ፎቶዎች የሉኝም። መጀመር እችላለሁ?", a: "አዎ። የካፌው ቅጽ የናሙና ፎቶዎች አሉት። ሲዘጋጁ በስልክዎ ባነሷቸው ፎቶዎች ይተኩዋቸው፤ ድረ-ገጹ በሌሎች ሰዎች ፎቶ ወይም አስተያየት ኦንላይን አይሆንም።" },
          { q: "ደንበኞች ለዝግጅት የቡና ሥነ ሥርዓት ወይም ኬክ ማዘዝ ይችላሉ?", a: "አዎ። ከጎጆላይን የትዕዛዝ ቅጽ ይጠይቁ፤ ስም፣ ስልክ ቁጥር፣ ቀንና የሚፈልጉትን ይቀበላሉ፤ በስልክ ያረጋግጣሉ።" },
        ],
      },
    },
  },
  restaurant: {
    template: "cafe",
    copy: {
      en: {
        short: "Restaurants",
        headline: "A website for your restaurant in Ethiopia",
        intro: "Put your whole menu online, fasting and non-fasting dishes, with prices in Birr, and take reservations for families and groups. In Amharic and English, made by chatting.",
        benefits: [
          { title: "Fasting days covered", body: "List your fasting (ጾም) dishes in their own group, so guests find them on Wednesdays, Fridays and during Lent." },
          { title: "Group and holiday bookings", body: "Families book for Genna, Fasika or a graduation lunch through a short form. You see the date, the number of guests and a phone number to confirm." },
          { title: "Call and Telegram in one tap", body: "Big buttons to call you or message you on Telegram for takeaway and delivery, right from a phone." },
        ],
        faq: [
          { q: "Can I separate fasting and non-fasting dishes?", a: "Yes. Ask for a fasting group in your menu, or mark single dishes as fasting. Both languages are kept in step." },
          { q: "Can people order delivery through the site?", a: "They send an order request or call you; you agree payment and delivery with them directly. Gojoline doesn't take a cut of your orders." },
          { q: "How do I change today's special?", a: "Type it in the chat, for example “today's special is doro wat, 450 Birr”. The site updates in about a minute, using one of your monthly AI changes." },
        ],
      },
      am: {
        short: "ምግብ ቤቶች",
        headline: "በኢትዮጵያ ላለው ምግብ ቤትዎ ድረ-ገጽ",
        intro: "ሙሉ ምናሌዎን፣ የጾምና የፍስክ ምግቦችን፣ ከብር ዋጋ ጋር ኦንላይን ያድርጉ፤ ለቤተሰቦችና ለቡድኖችም ቦታ ማስያዣ ይቀበሉ። በአማርኛና በእንግሊዝኛ፣ በውይይት የሚሠራ።",
        benefits: [
          { title: "የጾም ቀናት ታሳቢ ተደርገዋል", body: "የጾም ምግቦችዎን ለብቻቸው ይዘርዝሩ፤ እንግዶች ረቡዕና ዓርብ፣ እንዲሁም በዐቢይ ጾም በቀላሉ ያገኟቸዋል።" },
          { title: "የቡድንና የበዓል ቦታ ማስያዣ", body: "ቤተሰቦች ለገና፣ ለፋሲካ ወይም ለምረቃ ምሳ በአጭር ቅጽ ቦታ ይይዛሉ። ቀኑን፣ የእንግዶችን ቁጥርና ለማረጋገጥ ስልክ ቁጥር ያያሉ።" },
          { title: "በአንድ ንክኪ ጥሪና ቴሌግራም", body: "ለመውሰጃና ለማድረስ ትዕዛዝ እንዲደውሉልዎ ወይም በቴሌግራም እንዲጽፉልዎ ትላልቅ ቁልፎች፣ በቀጥታ ከስልክ።" },
        ],
        faq: [
          { q: "የጾምና የፍስክ ምግቦችን መለየት እችላለሁ?", a: "አዎ። በምናሌዎ ውስጥ የጾም ክፍል እንዲኖር ይጠይቁ፣ ወይም ነጠላ ምግቦችን የጾም ብለው ምልክት ያድርጉ። ሁለቱም ቋንቋዎች አብረው ይዘመናሉ።" },
          { q: "ሰዎች በድረ-ገጹ በኩል ማድረስ ማዘዝ ይችላሉ?", a: "የትዕዛዝ ጥያቄ ይልካሉ ወይም ይደውሉልዎታል፤ ክፍያና ማድረሱን በቀጥታ ከእነሱ ጋር ይስማማሉ። ጎጆላይን ከትዕዛዞችዎ ድርሻ አይወስድም።" },
          { q: "የዛሬውን ልዩ ምግብ እንዴት እቀይራለሁ?", a: "በውይይቱ ውስጥ ይጻፉት፤ ለምሳሌ “የዛሬው ልዩ ምግብ ዶሮ ወጥ ነው፣ 450 ብር”። ድረ-ገጹ በአንድ ደቂቃ ገደማ ይዘመናል፤ ከወርሃዊ የAI ለውጦችዎ አንዱን ይጠቀማል።" },
        ],
      },
    },
  },
  church: {
    template: "worship",
    copy: {
      en: {
        short: "Churches",
        headline: "A website for your church in Ethiopia",
        intro: "Share service times, holy days and announcements with your congregation, at home and abroad, in Amharic and English. Anyone on the church committee can keep it up to date by chatting.",
        benefits: [
          { title: "Service and prayer times", body: "Kidase, Bible study and choir practice in one clear timetable, with the next service shown first." },
          { title: "Holy days and announcements", body: "Fasting seasons, Timket and Meskel celebrations, weddings, baptisms and memorials, posted where every member can find them." },
          { title: "Members abroad stay close", body: "Members in the diaspora follow the church's news and find how to support it, with the bank or Telebirr details you choose to share." },
        ],
        faq: [
          { q: "Does it suit Orthodox, Protestant and Catholic churches?", a: "Yes. The words, times and pictures are yours. Tell Gojoline about your church and it writes the site in your own terms, in Amharic and English." },
          { q: "Can members give through the site?", a: "The site shows how to give: your church's bank account or Telebirr number, and a goal if you want one. Money goes straight to your church, never through Gojoline." },
          { q: "Who can change the site?", a: "The person who signs in to your church's Gojoline account. Changes are made by chatting, for example “add the Hosanna service at 6 in the morning”." },
        ],
      },
      am: {
        short: "አብያተ ክርስቲያናት",
        headline: "በኢትዮጵያ ላለች ቤተ ክርስቲያንዎ ድረ-ገጽ",
        intro: "የአገልግሎት ሰዓቶችን፣ በዓላትንና ማስታወቂያዎችን በአገር ውስጥና በውጭ ላሉ ምእመናን ያጋሩ፤ በአማርኛና በእንግሊዝኛ። የሰበካ ጉባኤው አባል በውይይት ማዘመን ይችላል።",
        benefits: [
          { title: "የአገልግሎትና የጸሎት ሰዓቶች", body: "ቅዳሴ፣ የመጽሐፍ ቅዱስ ጥናትና የመዘምራን ልምምድ በአንድ ግልጽ መርሐ ግብር፤ ቀጣዩ አገልግሎት መጀመሪያ ይታያል።" },
          { title: "በዓላትና ማስታወቂያዎች", body: "የጾም ወቅቶች፣ የጥምቀትና የመስቀል በዓላት፣ ሠርግ፣ ክርስትናና መታሰቢያ፤ ሁሉም ምእመን በሚያገኘው ቦታ።" },
          { title: "በውጭ ያሉ ምእመናን ይቀርባሉ", body: "በዳያስፖራ ያሉ ምእመናን የቤተ ክርስቲያኗን ዜና ይከታተላሉ፤ እርስዎ ለማጋራት በመረጡት የባንክ ወይም የቴሌብር መረጃ እንዴት እንደሚደግፉም ያውቃሉ።" },
        ],
        faq: [
          { q: "ለኦርቶዶክስ፣ ለፕሮቴስታንትና ለካቶሊክ አብያተ ክርስቲያናት ይሆናል?", a: "አዎ። ቃላቱ፣ ሰዓቶቹና ፎቶዎቹ የእርስዎ ናቸው። ስለ ቤተ ክርስቲያንዎ ለጎጆላይን ይንገሩ፤ በራስዎ አገላለጽ፣ በአማርኛና በእንግሊዝኛ ድረ-ገጹን ይጽፋል።" },
          { q: "ምእመናን በድረ-ገጹ በኩል መስጠት ይችላሉ?", a: "ድረ-ገጹ እንዴት መስጠት እንደሚቻል ያሳያል፦ የቤተ ክርስቲያኗን የባንክ ሂሳብ ወይም የቴሌብር ቁጥር፣ ከፈለጉም ግብ። ገንዘቡ በቀጥታ ወደ ቤተ ክርስቲያኗ ይሄዳል፤ በጎጆላይን በኩል አያልፍም።" },
          { q: "ድረ-ገጹን ማን መቀየር ይችላል?", a: "በቤተ ክርስቲያኗ የጎጆላይን መለያ የሚገባው ሰው። ለውጦች በውይይት ይደረጋሉ፤ ለምሳሌ “የሆሳዕና አገልግሎት ጠዋት 12 ሰዓት ጨምር”።" },
        ],
      },
    },
  },
  mosque: {
    template: "mosque",
    copy: {
      en: {
        short: "Mosques",
        headline: "A website for your mosque in Ethiopia",
        intro: "Prayer and Jumu'ah times, Ramadan programmes and madrasa classes on one page your community can open from any phone, in Amharic and English.",
        benefits: [
          { title: "Prayer and Jumu'ah times", body: "The five daily prayers and Friday khutbah in a clear timetable you can update in a sentence when the times change." },
          { title: "Ramadan and Eid, announced", body: "Iftar programmes, taraweeh, and where and when Eid prayer will be, so no one has to ask around." },
          { title: "Madrasa and Quran classes", body: "Parents read about classes for children and adults and register through a form; you get the names and phone numbers." },
        ],
        faq: [
          { q: "Can I keep the prayer times up to date myself?", a: "Yes. Send the new times in the chat, for example “Fajr 5:10, Dhuhr 12:30”, and the timetable changes. It takes about a minute." },
          { q: "Can parents register children for madrasa online?", a: "Yes. The mosque template has a registration form: you see each child's name, age and a parent's phone number in your dashboard." },
          { q: "Can we collect donations for the mosque?", a: "The site can show your mosque's bank or Telebirr details and what the money is for. Donations go straight to your account; Gojoline never handles them." },
        ],
      },
      am: {
        short: "መስጊዶች",
        headline: "በኢትዮጵያ ላለው መስጊድዎ ድረ-ገጽ",
        intro: "የሶላትና የጁምዓ ሰዓቶች፣ የረመዳን መርሐ ግብሮችና የመድረሳ ትምህርቶች፤ ማኅበረሰብዎ ከማንኛውም ስልክ በሚከፍተው አንድ ገጽ፣ በአማርኛና በእንግሊዝኛ።",
        benefits: [
          { title: "የሶላትና የጁምዓ ሰዓቶች", body: "አምስቱ የዕለት ሶላቶችና የጁምዓ ኹጥባ በግልጽ መርሐ ግብር፤ ሰዓቶቹ ሲቀየሩ በአንድ ዓረፍተ ነገር ያዘምናሉ።" },
          { title: "ረመዳንና ዒድ በግልጽ ይታወቃሉ", body: "የኢፍጣር መርሐ ግብሮች፣ ተራዊሕ፣ የዒድ ሶላት የት እና መቼ እንደሚሆን፤ ማንም መጠያየቅ አያስፈልገውም።" },
          { title: "የመድረሳና የቁርአን ትምህርቶች", body: "ወላጆች ስለ ልጆችና ስለ አዋቂዎች ትምህርቶች ያነባሉ፣ በቅጽ ያስመዘግባሉ፤ ስሞችንና ስልክ ቁጥሮችን ይቀበላሉ።" },
        ],
        faq: [
          { q: "የሶላት ሰዓቶችን ራሴ ማዘመን እችላለሁ?", a: "አዎ። አዲሶቹን ሰዓቶች በውይይቱ ይላኩ፤ ለምሳሌ “ፈጅር 11:10፣ ዙህር 6:30”፤ መርሐ ግብሩ ይቀየራል። አንድ ደቂቃ ገደማ ይወስዳል።" },
          { q: "ወላጆች ልጆችን ለመድረሳ ኦንላይን ማስመዝገብ ይችላሉ?", a: "አዎ። የመስጊዱ ቅጽ የምዝገባ ቅጽ አለው፤ የእያንዳንዱን ልጅ ስም፣ ዕድሜና የወላጅ ስልክ ቁጥር በዳሽቦርድዎ ያያሉ።" },
          { q: "ለመስጊዱ መዋጮ መሰብሰብ እንችላለን?", a: "ድረ-ገጹ የመስጊዱን የባንክ ወይም የቴሌብር መረጃና ገንዘቡ ለምን እንደሚውል ማሳየት ይችላል። መዋጮዎች በቀጥታ ወደ ሂሳብዎ ይገባሉ፤ ጎጆላይን አይነካቸውም።" },
        ],
      },
    },
  },
  school: {
    template: "school",
    copy: {
      en: {
        short: "Schools",
        headline: "A website for your school in Ethiopia",
        intro: "Tell parents about your programmes, fees and term dates, and take admission enquiries online, in Amharic and English. Built by chatting, kept current in minutes.",
        benefits: [
          { title: "Admissions without queues", body: "Parents send an admission enquiry from their phone with the child's name, grade and a phone number. You call back the ones that fit." },
          { title: "Programmes and fees, clearly", body: "KG, primary and secondary programmes, fees in Birr and what they include, so parents compare before they visit." },
          { title: "Term dates and news", body: "Registration deadlines, exam weeks, parents' days and graduation, posted the day you decide them." },
        ],
        faq: [
          { q: "Can parents apply through the site?", a: "They send an admission enquiry through a form; you decide and contact them. Documents and payments stay with your school office." },
          { q: "Should we put our fees online?", a: "Many parents choose a school by its fees, so it helps. You can show a range, “from 2,500 Birr a month”, or leave fees out and ask parents to call." },
          { q: "Can we show pictures of students?", a: "Only with parents' permission. The school template comes with sample photos of classrooms and books you can use instead." },
        ],
      },
      am: {
        short: "ትምህርት ቤቶች",
        headline: "በኢትዮጵያ ላለው ትምህርት ቤትዎ ድረ-ገጽ",
        intro: "ስለ ፕሮግራሞችዎ፣ ክፍያዎችና የትምህርት ዘመን ቀናት ለወላጆች ይንገሩ፤ የምዝገባ ጥያቄዎችንም ኦንላይን ይቀበሉ፤ በአማርኛና በእንግሊዝኛ። በውይይት የሚሠራ፣ በደቂቃዎች የሚዘመን።",
        benefits: [
          { title: "ያለ ሰልፍ ምዝገባ", body: "ወላጆች የልጁን ስም፣ ክፍልና ስልክ ቁጥር ይዘው ከስልካቸው የምዝገባ ጥያቄ ይልካሉ። የሚስማሙትን መልሰው ይደውላሉ።" },
          { title: "ፕሮግራሞችና ክፍያዎች በግልጽ", body: "የመዋዕለ ሕፃናት፣ የአንደኛና የሁለተኛ ደረጃ ፕሮግራሞች፣ ክፍያዎች በብርና የሚያካትቱት፤ ወላጆች ከመጎብኘታቸው በፊት ያነጻጽራሉ።" },
          { title: "የትምህርት ዘመን ቀናትና ዜና", body: "የምዝገባ ማብቂያ፣ የፈተና ሳምንታት፣ የወላጆች ቀንና ምረቃ፤ በወሰኑበት ቀን ይለጠፋሉ።" },
        ],
        faq: [
          { q: "ወላጆች በድረ-ገጹ በኩል ማመልከት ይችላሉ?", a: "በቅጽ የምዝገባ ጥያቄ ይልካሉ፤ እርስዎ ወስነው ያገኟቸዋል። ሰነዶችና ክፍያዎች በትምህርት ቤትዎ ቢሮ ይቀራሉ።" },
          { q: "ክፍያዎቻችንን ኦንላይን ማስቀመጥ አለብን?", a: "ብዙ ወላጆች ትምህርት ቤት የሚመርጡት በክፍያው ስለሆነ ይረዳል። “በወር ከ2,500 ብር ጀምሮ” ብለው ክልል ማሳየት፣ ወይም ክፍያን ትተው ወላጆች እንዲደውሉ መጠየቅ ይችላሉ።" },
          { q: "የተማሪዎችን ፎቶ ማሳየት እንችላለን?", a: "በወላጆች ፈቃድ ብቻ። የትምህርት ቤቱ ቅጽ በምትኩ የሚጠቀሙባቸው የክፍልና የመጻሕፍት የናሙና ፎቶዎች አሉት።" },
        ],
      },
    },
  },
  salon: {
    template: "salon",
    copy: {
      en: {
        short: "Salons",
        headline: "A website for your beauty salon in Ethiopia",
        intro: "Show your services and prices, your best work and your opening hours, and let clients book a time from their phone. In Amharic and English, ready to share on TikTok and Instagram.",
        benefits: [
          { title: "Bookings while you work", body: "Clients pick a service and a time and send a booking request. You confirm by phone or Telegram between appointments." },
          { title: "Your work, in pictures", body: "Braids, bridal make-up, nails and cuts in a photo gallery, so new clients see your style before they come." },
          { title: "A link for your social pages", body: "Put your site's address in your TikTok and Instagram bio: prices, location and booking in one place." },
        ],
        faq: [
          { q: "Can clients choose a time slot?", a: "They send a booking request with the service, day and time they want, and you confirm. You stay in charge of your own diary." },
          { q: "Can I list prices for each service?", a: "Yes, in Birr, with a note like “from” for services that depend on hair length. Changing a price takes one message." },
          { q: "Can I add my own photos?", a: "Yes. Upload pictures from your phone and ask Gojoline to put them in the gallery. Use photos of your clients only with their permission." },
        ],
      },
      am: {
        short: "የውበት ሳሎኖች",
        headline: "በኢትዮጵያ ላለው የውበት ሳሎንዎ ድረ-ገጽ",
        intro: "አገልግሎቶችዎንና ዋጋዎቻቸውን፣ ምርጥ ሥራዎችዎንና የሥራ ሰዓትዎን ያሳዩ፤ ደንበኞችም ከስልካቸው ሰዓት እንዲይዙ ያድርጉ። በአማርኛና በእንግሊዝኛ፣ በቲክቶክና በኢንስታግራም ለማጋራት ዝግጁ።",
        benefits: [
          { title: "እየሠሩ ቀጠሮ ይቀበሉ", body: "ደንበኞች አገልግሎትና ሰዓት መርጠው የቀጠሮ ጥያቄ ይልካሉ። በቀጠሮዎች መካከል በስልክ ወይም በቴሌግራም ያረጋግጣሉ።" },
          { title: "ሥራዎ በፎቶ", body: "ሹሩባ፣ የሙሽራ ሜካፕ፣ ጥፍርና የፀጉር ቁርጥ በፎቶ ማዕከል፤ አዲስ ደንበኞች ከመምጣታቸው በፊት የእርስዎን ስልት ያያሉ።" },
          { title: "ለማኅበራዊ ገጾችዎ ሊንክ", body: "የድረ-ገጽዎን አድራሻ በቲክቶክና በኢንስታግራም መግለጫዎ ላይ ያስቀምጡ፦ ዋጋዎች፣ አድራሻና ቀጠሮ በአንድ ቦታ።" },
        ],
        faq: [
          { q: "ደንበኞች ሰዓት መምረጥ ይችላሉ?", a: "የሚፈልጉትን አገልግሎት፣ ቀንና ሰዓት ይዘው የቀጠሮ ጥያቄ ይልካሉ፤ እርስዎ ያረጋግጣሉ። ፕሮግራምዎን የሚቆጣጠሩት እርስዎ ነዎት።" },
          { q: "ለእያንዳንዱ አገልግሎት ዋጋ መዘርዘር እችላለሁ?", a: "አዎ፣ በብር፤ በፀጉር ርዝመት ለሚለያዩ አገልግሎቶች “ከ… ጀምሮ” ብለው። ዋጋ መቀየር አንድ መልዕክት ብቻ ነው።" },
          { q: "የራሴን ፎቶዎች መጨመር እችላለሁ?", a: "አዎ። ከስልክዎ ፎቶዎችን ይጫኑና ጎጆላይን በፎቶ ማዕከሉ እንዲያስቀምጣቸው ይጠይቁ። የደንበኞችዎን ፎቶ በፈቃዳቸው ብቻ ይጠቀሙ።" },
        ],
      },
    },
  },
  shop: {
    template: "shop",
    copy: {
      en: {
        short: "Shops",
        headline: "A website for your shop in Ethiopia",
        intro: "Show your products with prices in Birr and let customers order by phone or Telegram, in Amharic and English. A real address on the internet for your shop, made by chatting.",
        benefits: [
          { title: "Products with prices", body: "Clothes, phones, furniture or spices: show what you sell with photos and prices, grouped the way customers look for them." },
          { title: "Orders by phone and Telegram", body: "Customers tap to call or message you about a product, or send an order request with what they want and where they are." },
          { title: "More than a social page", body: "Your own address that shows up on Google, opens fast on a slow connection and doesn't depend on any app." },
        ],
        faq: [
          { q: "Can customers pay on the site?", a: "Not yet. Customers order by request, phone or Telegram, and pay you by Telebirr, bank transfer or cash, as you do today." },
          { q: "How many products can I show?", a: "Up to 24 products in a section, and several sections if you need them. Start with your best sellers; adding more is one message." },
          { q: "I already sell on Telegram and TikTok. Why a website?", a: "A website is easy to find on Google, looks trustworthy to new customers, and keeps your prices and address in one place you share everywhere." },
        ],
      },
      am: {
        short: "ሱቆች",
        headline: "በኢትዮጵያ ላለው ሱቅዎ ድረ-ገጽ",
        intro: "ዕቃዎችዎን ከብር ዋጋ ጋር ያሳዩ፤ ደንበኞችም በስልክ ወይም በቴሌግራም እንዲያዝዙ ያድርጉ፤ በአማርኛና በእንግሊዝኛ። ለሱቅዎ በኢንተርኔት ላይ እውነተኛ አድራሻ፣ በውይይት የሚሠራ።",
        benefits: [
          { title: "ዕቃዎች ከዋጋ ጋር", body: "ልብስ፣ ስልክ፣ የቤት ዕቃ ወይም ቅመማ ቅመም፤ የሚሸጡትን በፎቶና በዋጋ፣ ደንበኞች በሚፈልጉበት መንገድ ተደራጅቶ ያሳዩ።" },
          { title: "በስልክና በቴሌግራም ትዕዛዝ", body: "ደንበኞች ስለ አንድ ዕቃ ለመደወል ወይም ለመጻፍ ይነኩታል፣ ወይም የሚፈልጉትንና ያሉበትን ይዘው የትዕዛዝ ጥያቄ ይልካሉ።" },
          { title: "ከማኅበራዊ ገጽ በላይ", body: "በጉግል ላይ የሚገኝ፣ በዝግ ኢንተርኔትም ፈጥኖ የሚከፈት፣ በየትኛውም መተግበሪያ ላይ የማይመሠረት የራስዎ አድራሻ።" },
        ],
        faq: [
          { q: "ደንበኞች በድረ-ገጹ ላይ መክፈል ይችላሉ?", a: "ገና አይደለም። ደንበኞች በጥያቄ፣ በስልክ ወይም በቴሌግራም ያዝዛሉ፤ እንደ ዛሬው በቴሌብር፣ በባንክ ዝውውር ወይም በጥሬ ገንዘብ ይከፍሉዎታል።" },
          { q: "ስንት ዕቃዎችን ማሳየት እችላለሁ?", a: "በአንድ ክፍል እስከ 24 ዕቃዎች፣ ካስፈለገም ብዙ ክፍሎች። በብዛት በሚሸጡት ይጀምሩ፤ ተጨማሪ መጨመር አንድ መልዕክት ነው።" },
          { q: "አሁንም በቴሌግራምና በቲክቶክ እሸጣለሁ። ድረ-ገጽ ለምን?", a: "ድረ-ገጽ በጉግል በቀላሉ ይገኛል፣ ለአዲስ ደንበኞች ታማኝ ይመስላል፣ ዋጋዎችዎንና አድራሻዎን በየቦታው በሚያጋሩት አንድ ቦታ ያስቀምጣል።" },
        ],
      },
    },
  },
  hotel: {
    template: "hotel",
    copy: {
      en: {
        short: "Hotels",
        headline: "A website for your hotel or guest house in Ethiopia",
        intro: "Rooms with nightly prices, photos and booking requests, in English for international guests and Amharic for local ones. Take direct bookings instead of paying a commission on every one.",
        benefits: [
          { title: "Direct booking requests", body: "Guests choose a room and their dates and send a request. You confirm by phone, email or Telegram and keep the full price." },
          { title: "Rooms that sell themselves", body: "Each room with its photos, what's included and the price per night, in Birr or US dollars." },
          { title: "Everything a traveller asks", body: "Airport pick-up, breakfast, Wi-Fi, the restaurant menu and a map to find you, answered before they write." },
        ],
        faq: [
          { q: "Can I show prices in US dollars as well as Birr?", a: "Yes. Show Birr for local guests and dollars for foreign ones, or both. Each price is written the way you choose." },
          { q: "Does it replace Booking.com?", a: "It works next to it. Guests who find you through Google, Telegram or a friend can book you directly, with no commission." },
          { q: "Can guests see availability?", a: "They send a request with their dates and you reply with what's free. You never risk a double booking from a calendar out of date." },
        ],
      },
      am: {
        short: "ሆቴሎች",
        headline: "በኢትዮጵያ ላለው ሆቴልዎ ወይም የእንግዳ ማረፊያዎ ድረ-ገጽ",
        intro: "ክፍሎች ከአዳር ዋጋ፣ ከፎቶና ከቦታ ማስያዣ ጥያቄ ጋር፤ ለውጭ እንግዶች በእንግሊዝኛ፣ ለአገር ውስጥ እንግዶች በአማርኛ። በእያንዳንዱ ቦታ ማስያዣ ኮሚሽን ከመክፈል ይልቅ በቀጥታ ይቀበሉ።",
        benefits: [
          { title: "ቀጥታ የቦታ ማስያዣ ጥያቄዎች", body: "እንግዶች ክፍልና ቀናቸውን መርጠው ጥያቄ ይልካሉ። በስልክ፣ በኢሜይል ወይም በቴሌግራም ያረጋግጣሉ፤ ሙሉ ዋጋውንም ያገኛሉ።" },
          { title: "ራሳቸውን የሚሸጡ ክፍሎች", body: "እያንዳንዱ ክፍል ከፎቶዎቹ፣ ከሚያካትታቸውና ከአዳር ዋጋው ጋር፣ በብር ወይም በአሜሪካ ዶላር።" },
          { title: "ተጓዥ የሚጠይቀው ሁሉ", body: "ከአየር ማረፊያ መቀበል፣ ቁርስ፣ ዋይፋይ፣ የምግብ ቤቱ ምናሌና እርስዎን ለማግኘት ካርታ፤ ከመጻፋቸው በፊት ይመለሳሉ።" },
        ],
        faq: [
          { q: "ዋጋዎችን በብርና በአሜሪካ ዶላር ማሳየት እችላለሁ?", a: "አዎ። ለአገር ውስጥ እንግዶች በብር፣ ለውጭ እንግዶች በዶላር፣ ወይም ሁለቱንም ያሳዩ። እያንዳንዱ ዋጋ በመረጡት መንገድ ይጻፋል።" },
          { q: "Booking.comን ይተካል?", a: "ከጎኑ ይሠራል። በጉግል፣ በቴሌግራም ወይም በጓደኛ ያገኙዎት እንግዶች ያለ ኮሚሽን በቀጥታ ቦታ ይይዛሉ።" },
          { q: "እንግዶች ክፍት ክፍሎችን ማየት ይችላሉ?", a: "ቀናቸውን ይዘው ጥያቄ ይልካሉ፤ እርስዎ ክፍት ያለውን ይመልሳሉ። ባልተዘመነ የቀን መቁጠሪያ ምክንያት ድርብ ቦታ ማስያዝ አይደርስብዎትም።" },
        ],
      },
    },
  },
  clinic: {
    template: "clinic",
    copy: {
      en: {
        short: "Clinics",
        headline: "A website for your clinic in Ethiopia",
        intro: "Your services, doctors and opening hours, and appointment requests patients send from their phone, in Amharic and English. Calm, clear and trustworthy, made by chatting.",
        benefits: [
          { title: "Appointment requests", body: "Patients choose a service and a preferred day and leave a phone number. Your reception calls back to confirm a time." },
          { title: "Services and doctors, clearly", body: "General practice, dental, maternal care or lab tests, with your doctors' names and specialities, so patients know they are in the right place." },
          { title: "Hours, emergencies and directions", body: "Opening hours, an emergency number in large print and a map, readable at a glance from a phone." },
        ],
        faq: [
          { q: "Is it safe for patient information?", a: "The appointment form only asks for a name, phone number, service and day: no medical history. Answers are visible only to you in your dashboard." },
          { q: "Can I list our doctors?", a: "Yes, with their name, speciality and a photo if they agree. The template's sample doctors can never go live as yours." },
          { q: "Can we show prices for consultations?", a: "Yes, in Birr, or leave prices out and ask patients to call. Many clinics show prices for common tests and keep the rest by phone." },
        ],
      },
      am: {
        short: "ክሊኒኮች",
        headline: "በኢትዮጵያ ላለው ክሊኒክዎ ድረ-ገጽ",
        intro: "አገልግሎቶችዎ፣ ሐኪሞችዎና የሥራ ሰዓትዎ፣ እንዲሁም ታካሚዎች ከስልካቸው የሚልኩት የቀጠሮ ጥያቄ፤ በአማርኛና በእንግሊዝኛ። የተረጋጋ፣ ግልጽና ታማኝ፣ በውይይት የሚሠራ።",
        benefits: [
          { title: "የቀጠሮ ጥያቄዎች", body: "ታካሚዎች አገልግሎትና የሚመርጡትን ቀን መርጠው ስልክ ቁጥር ይተዋሉ። እንግዳ ተቀባይዎ መልሶ ደውሎ ሰዓቱን ያረጋግጣል።" },
          { title: "አገልግሎቶችና ሐኪሞች በግልጽ", body: "ጠቅላላ ሕክምና፣ የጥርስ ሕክምና፣ የእናቶች ክትትል ወይም የላብራቶሪ ምርመራ፣ ከሐኪሞችዎ ስምና ሙያ ጋር፤ ታካሚዎች ትክክለኛው ቦታ መሆናቸውን ያውቃሉ።" },
          { title: "ሰዓት፣ ድንገተኛና አቅጣጫ", body: "የሥራ ሰዓት፣ በትልቅ ፊደል የድንገተኛ ቁጥርና ካርታ፤ ከስልክ በአንድ እይታ የሚነበብ።" },
        ],
        faq: [
          { q: "ለታካሚዎች መረጃ ደኅንነቱ የተጠበቀ ነው?", a: "የቀጠሮ ቅጹ ስም፣ ስልክ ቁጥር፣ አገልግሎትና ቀን ብቻ ይጠይቃል፤ የሕክምና ታሪክ አይጠይቅም። መልሶቹን በዳሽቦርድዎ የሚያዩት እርስዎ ብቻ ነዎት።" },
          { q: "ሐኪሞቻችንን መዘርዘር እችላለሁ?", a: "አዎ፣ ከስማቸው፣ ከሙያቸውና ከተስማሙ ከፎቶአቸው ጋር። የቅጹ የናሙና ሐኪሞች እንደ እርስዎ ሐኪሞች ኦንላይን ሊሆኑ አይችሉም።" },
          { q: "የምክክር ዋጋ ማሳየት እንችላለን?", a: "አዎ፣ በብር፤ ወይም ዋጋን ትተው ታካሚዎች እንዲደውሉ ይጠይቁ። ብዙ ክሊኒኮች ለተለመዱ ምርመራዎች ዋጋ አሳይተው ሌላውን በስልክ ይመልሳሉ።" },
        ],
      },
    },
  },
  wedding: {
    template: "events",
    copy: {
      en: {
        short: "Weddings",
        headline: "A website for your wedding in Ethiopia",
        intro: "One link for every guest: the day's programme, the church and reception venues on a map, photos, and an RSVP, in Amharic and English for family at home and abroad.",
        benefits: [
          { title: "Every guest knows the plan", body: "Ceremony, photos in the park, the reception and the melse: times and places in one programme guests open from the invitation." },
          { title: "RSVP without the phone calls", body: "Guests reply with their name, how many are coming and a message. You see the count in your dashboard as it grows." },
          { title: "For family abroad too", body: "Relatives in the diaspora read it in English, see the photos and follow the day, even if they can't travel." },
        ],
        faq: [
          { q: "How long does the wedding site stay online?", a: "As long as you like. Many couples keep it after the wedding with their photos; you can also take it offline with one switch." },
          { q: "Can guests send gifts through the site?", a: "The site can show a bank or Telebirr account for gifts if you want. Money goes straight to you; Gojoline never handles it." },
          { q: "Can we share it on Telegram and in printed invitations?", a: "Yes. Share the link on Telegram, where it shows with your photo, and print the QR code from your dashboard on the invitation card." },
        ],
      },
      am: {
        short: "ሠርጎች",
        headline: "በኢትዮጵያ ለሚደረገው ሠርግዎ ድረ-ገጽ",
        intro: "ለእያንዳንዱ እንግዳ አንድ ሊንክ፦ የዕለቱ መርሐ ግብር፣ የቤተ ክርስቲያንና የግብዣ ቦታዎች በካርታ፣ ፎቶዎችና የመገኘት ማረጋገጫ፤ በአገር ውስጥና በውጭ ላሉ ቤተሰቦች በአማርኛና በእንግሊዝኛ።",
        benefits: [
          { title: "እያንዳንዱ እንግዳ ዕቅዱን ያውቃል", body: "ሥነ ሥርዓቱ፣ በፓርክ የፎቶ ጊዜ፣ ግብዣውና መልስ፤ እንግዶች ከጥሪ ካርዱ በሚከፍቱት አንድ መርሐ ግብር ሰዓቶችና ቦታዎች።" },
          { title: "ያለ ስልክ ጥሪ ማረጋገጫ", body: "እንግዶች ስማቸውን፣ ስንት እንደሚመጡና መልዕክታቸውን ይዘው ይመልሳሉ። ቁጥሩ እያደገ ሲሄድ በዳሽቦርድዎ ያያሉ።" },
          { title: "በውጭ ላሉ ቤተሰቦችም", body: "በዳያስፖራ ያሉ ዘመዶች በእንግሊዝኛ ያነባሉ፣ ፎቶዎቹን ያያሉ፣ መጓዝ ባይችሉም ዕለቱን ይከታተላሉ።" },
        ],
        faq: [
          { q: "የሠርጉ ድረ-ገጽ ለምን ያህል ጊዜ ኦንላይን ይቆያል?", a: "እስከፈለጉ ድረስ። ብዙ ጥንዶች ከሠርጉ በኋላ ከፎቶዎቻቸው ጋር ያቆዩታል፤ በአንድ ማብሪያ ማጥፊያም ኦንላይን እንዳይሆን ማድረግ ይችላሉ።" },
          { q: "እንግዶች በድረ-ገጹ በኩል ስጦታ መላክ ይችላሉ?", a: "ከፈለጉ ድረ-ገጹ ለስጦታ የባንክ ወይም የቴሌብር ሂሳብ ማሳየት ይችላል። ገንዘቡ በቀጥታ ወደ እርስዎ ይሄዳል፤ ጎጆላይን አይነካውም።" },
          { q: "በቴሌግራምና በታተሙ የጥሪ ካርዶች ላይ ማጋራት እንችላለን?", a: "አዎ። ሊንኩን በቴሌግራም ያጋሩ፤ ከፎቶዎ ጋር ይታያል፤ ከዳሽቦርድዎ የQR ኮዱን አትመው በጥሪ ካርዱ ላይ ያድርጉ።" },
        ],
      },
    },
  },
  ngo: {
    template: "ngo",
    copy: {
      en: {
        short: "NGOs and charities",
        headline: "A website for your NGO or charity in Ethiopia",
        intro: "Explain your mission, show your projects and results, and tell supporters how to give or volunteer, in Amharic and English for local partners and donors abroad.",
        benefits: [
          { title: "Your impact, in numbers", body: "Children in school, wells dug, women trained: the figures donors look for, with the stories and photos behind them." },
          { title: "Projects partners can follow", body: "Each programme with its region, what it does and who funds it, ready to link from a proposal or a report." },
          { title: "Give and volunteer", body: "Your bank and Telebirr details, a fundraising goal if you have one, and a volunteer form that reaches your team." },
        ],
        faq: [
          { q: "Can we receive donations from abroad?", a: "The site shows the accounts you choose to share, including bank details for international transfers. Money goes straight to your organisation; Gojoline never handles it." },
          { q: "Can we publish our annual reports?", a: "You can describe your results on the site and link to reports you host elsewhere. Uploading PDF files to the site isn't possible yet." },
          { q: "Is it suitable for a small community association?", a: "Yes. Edirs, youth groups and community associations use the same template: start with who you are, what you do and how to reach you." },
        ],
      },
      am: {
        short: "ግብረ ሰናይ ድርጅቶች",
        headline: "በኢትዮጵያ ላለው ግብረ ሰናይ ድርጅትዎ ወይም በጎ አድራጎት ድርጅትዎ ድረ-ገጽ",
        intro: "ተልዕኮዎን ያብራሩ፣ ፕሮጀክቶችዎንና ውጤቶችዎን ያሳዩ፣ ደጋፊዎች እንዴት መስጠት ወይም በበጎ ፈቃድ መሳተፍ እንደሚችሉ ይንገሩ፤ ለአገር ውስጥ አጋሮች በአማርኛ፣ በውጭ ላሉ ለጋሾች በእንግሊዝኛ።",
        benefits: [
          { title: "ተጽዕኖዎ በቁጥር", body: "ትምህርት ቤት የገቡ ልጆች፣ የተቆፈሩ ጉድጓዶች፣ የሠለጠኑ ሴቶች፤ ለጋሾች የሚፈልጓቸው ቁጥሮች፣ ከጀርባቸው ካሉ ታሪኮችና ፎቶዎች ጋር።" },
          { title: "አጋሮች የሚከታተሏቸው ፕሮጀክቶች", body: "እያንዳንዱ ፕሮግራም ከክልሉ፣ ከሚሠራውና ከሚደግፈው ጋር፤ ከፕሮፖዛል ወይም ከሪፖርት ሊንክ ለማድረግ ዝግጁ።" },
          { title: "ይስጡ፣ በበጎ ፈቃድ ይሳተፉ", body: "የባንክና የቴሌብር መረጃዎ፣ ካለዎት የገቢ ማሰባሰቢያ ግብ፣ እንዲሁም ወደ ቡድንዎ የሚደርስ የበጎ ፈቃደኞች ቅጽ።" },
        ],
        faq: [
          { q: "ከውጭ አገር ልገሳ መቀበል እንችላለን?", a: "ድረ-ገጹ ለማጋራት የመረጧቸውን ሂሳቦች፣ ለዓለም አቀፍ ዝውውር የባንክ መረጃን ጨምሮ ያሳያል። ገንዘቡ በቀጥታ ወደ ድርጅትዎ ይሄዳል፤ ጎጆላይን አይነካውም።" },
          { q: "ዓመታዊ ሪፖርቶቻችንን ማተም እንችላለን?", a: "ውጤቶችዎን በድረ-ገጹ ላይ መግለጽና ሌላ ቦታ ወዳስቀመጧቸው ሪፖርቶች ሊንክ ማድረግ ይችላሉ። የPDF ፋይሎችን ወደ ድረ-ገጹ መጫን ገና አይቻልም።" },
          { q: "ለአነስተኛ የማኅበረሰብ ማኅበር ይሆናል?", a: "አዎ። ዕድሮች፣ የወጣቶች ቡድኖችና የማኅበረሰብ ማኅበራት ያንኑ ቅጽ ይጠቀማሉ፦ ማን እንደሆኑ፣ ምን እንደሚሠሩና እንዴት እንደሚገኙ በማሳየት ይጀምሩ።" },
        ],
      },
    },
  },
  portfolio: {
    template: "personal",
    copy: {
      en: {
        short: "Portfolios",
        headline: "A portfolio website for professionals in Ethiopia",
        intro: "Your work, your experience and a way to hire you, on one page with your own address. For designers, photographers, consultants, tutors and anyone looking for clients or a job.",
        benefits: [
          { title: "Your best work first", body: "Projects with pictures and a line on what you did, so a client or employer sees your level in seconds." },
          { title: "A CV that's always current", body: "Experience, education and skills in English for international clients and Amharic for local ones, updated by chatting." },
          { title: "Easy to hire", body: "Phone, email, Telegram and LinkedIn in one place, plus a contact form for project enquiries." },
        ],
        faq: [
          { q: "Is a portfolio site better than a PDF CV?", a: "Use both. A link opens on any phone, can't get lost in an inbox, and shows your work in colour; your PDF stays for formal applications." },
          { q: "Can I use my own name as the address?", a: "Yes. Your free address can be your name, and on a paid plan you can connect a domain such as yourname.com." },
          { q: "I'm a student. Is it for me?", a: "Yes. Show your projects, internships and volunteer work. Free is enough to start: one site with a small Gojoline badge." },
        ],
      },
      am: {
        short: "የሥራ ማሳያዎች",
        headline: "በኢትዮጵያ ላሉ ባለሙያዎች የሥራ ማሳያ ድረ-ገጽ",
        intro: "ሥራዎ፣ ልምድዎና እርስዎን የሚቀጥሩበት መንገድ፣ በራስዎ አድራሻ በአንድ ገጽ። ለዲዛይነሮች፣ ለፎቶግራፈሮች፣ ለአማካሪዎች፣ ለአስጠኚዎችና ደንበኛ ወይም ሥራ ለሚፈልግ ሁሉ።",
        benefits: [
          { title: "ምርጥ ሥራዎ መጀመሪያ", body: "ፕሮጀክቶች ከፎቶና ምን እንደሠሩ ከሚገልጽ መስመር ጋር፤ ደንበኛ ወይም ቀጣሪ ደረጃዎን በሰከንዶች ያያል።" },
          { title: "ሁልጊዜ የተዘመነ የሥራ ታሪክ", body: "ልምድ፣ ትምህርትና ክህሎቶች፤ ለውጭ ደንበኞች በእንግሊዝኛ፣ ለአገር ውስጥ በአማርኛ፣ በውይይት የሚዘመን።" },
          { title: "በቀላሉ ይቀጠራሉ", body: "ስልክ፣ ኢሜይል፣ ቴሌግራምና ሊንክድኢን በአንድ ቦታ፣ ለፕሮጀክት ጥያቄዎች የመገናኛ ቅጽም ጭምር።" },
        ],
        faq: [
          { q: "የሥራ ማሳያ ድረ-ገጽ ከPDF የሥራ ታሪክ ይሻላል?", a: "ሁለቱንም ይጠቀሙ። ሊንክ በማንኛውም ስልክ ይከፈታል፣ በኢሜይል ውስጥ አይጠፋም፣ ሥራዎን በቀለም ያሳያል፤ PDFዎ ለመደበኛ ማመልከቻዎች ይቆያል።" },
          { q: "የራሴን ስም እንደ አድራሻ መጠቀም እችላለሁ?", a: "አዎ። ነጻ አድራሻዎ ስምዎ ሊሆን ይችላል፤ በክፍያ ዕቅድ ደግሞ እንደ yourname.com ያለ ዶሜይን ማገናኘት ይችላሉ።" },
          { q: "ተማሪ ነኝ። ለእኔ ይሆናል?", a: "አዎ። ፕሮጀክቶችዎን፣ የሥራ ልምምድዎንና የበጎ ፈቃድ ሥራዎን ያሳዩ። ለመጀመር ነጻው በቂ ነው፦ ትንሽ የጎጆላይን ምልክት ያለው አንድ ድረ-ገጽ።" },
        ],
      },
    },
  },
};
