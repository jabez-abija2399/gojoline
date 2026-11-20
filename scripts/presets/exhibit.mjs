import { t, img, link, birr, save } from "./lib.mjs";

// A contemporary art gallery told like a museum: the "museum" art direction. The exhibition,
// artists, works and prices are examples to replace (publishing is blocked while they stay).
const visit = link("Plan your visit", "ጉብኝትዎን ያቅዱ", "/visit");
const enquire = link("Ask about a work", "ስለ ሥራ ይጠይቁ", "/visit#enquire");

save("exhibit", {
  name: t("Gize Contemporary", "ጊዜ ዘመናዊ ጥበብ"),
  tagline: t("A gallery for contemporary Ethiopian art in Addis Ababa", "በአዲስ አበባ የዘመናዊ ኢትዮጵያ ጥበብ ማሳያ"),
  languages: ["en", "am"],
  theme: { primary: "#D2341F", accent: "#111111", background: "#FFFFFF", text: "#111111", font: "grotesk", radius: "none", style: "museum" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Kazanchis, Addis Ababa", "ካዛንቺስ፣ አዲስ አበባ"),
    hours: [
      { days: t("Tuesday to Sunday", "ከማክሰኞ እስከ እሑድ"), time: t("10:00 am to 7:00 pm", "ከጠዋቱ 4 እስከ ምሽቱ 1 ሰዓት") },
      { days: t("Monday", "ሰኞ"), time: t("Closed", "ዝግ") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Now showing", "አሁን የሚታየው"),
      description: t("Gize Contemporary: exhibitions of contemporary Ethiopian art in Addis Ababa. Free entry, Tuesday to Sunday.", "ጊዜ ዘመናዊ ጥበብ፦ በአዲስ አበባ የዘመናዊ ኢትዮጵያ ጥበብ ኤግዚቢሽኖች። መግቢያ ነጻ፣ ከማክሰኞ እስከ እሑድ።"),
      sections: [
        {
          type: "hero",
          id: "now",
          variant: "centered",
          eyebrow: t("Now showing · until 28 February", "አሁን የሚታይ · እስከ የካቲት 21"),
          heading: t("The colour of waiting", "የመጠበቅ ቀለም"),
          subheading: t("New paintings and sculpture by six artists from Addis Ababa, Gondar and Harar.", "ከአዲስ አበባ፣ ከጎንደርና ከሐረር የመጡ የስድስት ሠዓሊዎች አዳዲስ ሥዕሎችና ቅርጻ ቅርጾች።"),
          image: img("art-hero-spotlit-white-gallery", "A long white gallery with track spotlights, framed works and a red piece glowing at the far end", "የመብራት ረድፍ ያለው ረጅም ነጭ ማሳያ አዳራሽ፣ በፍሬም ያሉ ሥራዎችና በመጨረሻው የሚያበራ ቀይ ሥራ"),
          primaryAction: visit,
          secondaryAction: link("See the works", "ሥራዎቹን ይመልከቱ", "#works"),
          facts: [
            { value: t("Free", "ነጻ"), label: t("entry", "መግቢያ") },
            { value: t("6", "6"), label: t("artists", "ሠዓሊዎች") },
            { value: t("24", "24"), label: t("works", "ሥራዎች") },
          ],
        },
        {
          type: "cards",
          id: "works",
          layout: "grid",
          filters: false,
          eyebrow: t("In the exhibition", "በኤግዚቢሽኑ"),
          heading: t("Selected works", "የተመረጡ ሥራዎች"),
          intro: t("Most works are for sale. Ask us for the full list and prices.", "አብዛኞቹ ሥራዎች ለሽያጭ ናቸው። ሙሉ ዝርዝሩንና ዋጋዎቹን ይጠይቁን።"),
          items: [
            { image: img("art-card-abstract-orange-teal", "A thickly painted abstract canvas in ochre, orange, red and teal", "በወፍራም ቀለም የተሣለ ቡናማ ቢጫ፣ ብርቱካናማ፣ ቀይና ሰማያዊ አረንጓዴ ረቂቅ ሥዕል"), title: t("Dry season, Afar", "በጋ፣ አፋር"), subtitle: t("Selam Tadesse", "ሰላም ታደሰ"), meta: [t("Oil on canvas, 2025", "ዘይት ቀለም በሸራ ላይ፣ 2017"), t("120 × 90 cm", "120 × 90 ሳ.ሜ.")], price: birr(180000), action: enquire },
            { image: img("art-card-white-ring-sculpture", "A tall white sculpture shaped like an open ring on a wooden plinth", "በእንጨት መቆሚያ ላይ ያለ ክፍት ቀለበት ቅርጽ ያለው ረጅም ነጭ ቅርጽ"), title: t("Mesob", "መሶብ"), subtitle: t("Dawit Bekele", "ዳዊት በቀለ"), meta: [t("Plaster and resin, 2024", "ጀሶና ሙጫ፣ 2016"), t("Height 160 cm", "ቁመት 160 ሳ.ሜ.")], badge: t("Sold", "ተሸጧል") },
            { image: img("art-card-abstract-blue-violet", "An abstract painting in deep blue and violet with orange spots", "ብርቱካናማ ነጠብጣብ ያለው ጥቁር ሰማያዊና ወይን ጠጅ ረቂቅ ሥዕል"), title: t("Night bus to Harar", "ወደ ሐረር የሌሊት አውቶቡስ"), subtitle: t("Hanna Girma", "ሐና ግርማ"), meta: [t("Acrylic on canvas, 2025", "አክሪሊክ በሸራ ላይ፣ 2017"), t("100 × 140 cm", "100 × 140 ሳ.ሜ.")], price: birr(150000), action: enquire },
            { image: img("art-card-abstract-rainbow-impasto", "Bright streaks of pink, blue, green and yellow paint across woven canvas", "በሸራ ላይ የተጎተቱ ደማቅ ሮዝ፣ ሰማያዊ፣ አረንጓዴና ቢጫ የቀለም መስመሮች"), title: t("Meskel Square, dusk", "መስቀል አደባባይ፣ ምሽት"), subtitle: t("Yonas Alemu", "ዮናስ አለሙ"), meta: [t("Oil and sand on canvas, 2025", "ዘይት ቀለምና አሸዋ በሸራ ላይ፣ 2017"), t("80 × 60 cm", "80 × 60 ሳ.ሜ.")], price: birr(95000), action: enquire },
            { image: img("art-card-gold-figure-installation", "A tall gold figure on a white plinth in a skylit gallery", "በሰማይ ብርሃን በሚገባበት ማሳያ ውስጥ በነጭ መቆሚያ ላይ ያለ ረጅም የወርቅ ቀለም ምስል"), title: t("The one who waits", "የሚጠብቀው"), subtitle: t("Dawit Bekele", "ዳዊት በቀለ"), meta: [t("Bronze, gilded, 2025", "በወርቅ የተለበጠ ነሐስ፣ 2017"), t("Height 210 cm", "ቁመት 210 ሳ.ሜ.")], price: birr(420000), action: enquire },
            { image: img("art-card-abstract-pink-yellow", "Soft pink, yellow and red brushstrokes on an abstract canvas", "በረቂቅ ሥዕል ላይ ለስላሳ ሮዝ፣ ቢጫና ቀይ የብሩሽ ምቶች"), title: t("Morning, Entoto", "ጠዋት፣ እንጦጦ"), subtitle: t("Meron Assefa", "ሜሮን አሰፋ"), meta: [t("Oil on linen, 2025", "ዘይት ቀለም በበፍታ ላይ፣ 2017"), t("60 × 50 cm", "60 × 50 ሳ.ሜ.")], price: birr(70000), action: enquire },
          ],
        },
        {
          type: "quote",
          id: "statement",
          quote: t("We paint the hours between things: the queue, the bus, the coffee before the news.", "በነገሮች መካከል ያሉትን ሰዓቶች እንሥላለን፦ ሰልፉን፣ አውቶቡሱን፣ ከዜናው በፊት ያለውን ቡና።"),
          name: t("Selam Tadesse", "ሰላም ታደሰ"),
          role: t("Artist in the exhibition", "በኤግዚቢሽኑ ያለች ሠዓሊ"),
        },
        {
          type: "about",
          id: "gallery",
          eyebrow: t("The gallery", "ማሳያ ቤቱ"),
          heading: t("A white room for the artists of now", "ለዛሬ ሠዓሊዎች የተዘጋጀ ነጭ ክፍል"),
          body: t(
            "Gize Contemporary opened in 2019 in a former print works in Kazanchis. We show four exhibitions a year, each built with the artists over many months.\n\nEntry is always free. Most works are for sale, and part of every sale pays for studio space for young artists.",
            "ጊዜ ዘመናዊ ጥበብ በ2011 በካዛንቺስ በቀድሞ ማተሚያ ቤት ተከፈተ። በዓመት አራት ኤግዚቢሽኖችን እናሳያለን፤ እያንዳንዳቸውን ከሠዓሊዎቹ ጋር ለብዙ ወራት እናዘጋጃቸዋለን።\n\nመግቢያ ሁሌም ነጻ ነው። አብዛኞቹ ሥራዎች ለሽያጭ ሲሆኑ ከእያንዳንዱ ሽያጭ የተወሰነው ለወጣት ሠዓሊዎች የሥራ ቦታ ይውላል።",
          ),
          image: img("art-about-painter-at-easel", "A young painter in a white apron holds a palette and brush, studying a canvas on an easel", "ነጭ ሽርጥ የለበሰ ወጣት ሠዓሊ ቀለም መያዣና ብሩሽ ይዞ በመቆሚያ ላይ ያለውን ሸራ ሲመለከት"),
          imageSide: "end",
        },
        {
          type: "schedule",
          id: "events",
          layout: "list",
          eyebrow: t("Events", "ዝግጅቶች"),
          heading: t("Talks, tours and evenings", "ንግግሮች፣ ጉብኝቶችና ምሽቶች"),
          items: [
            { time: t("Thu 6 Feb · 6 pm", "ሐሙስ ጥር 29 · ምሽት 12 ሰዓት"), title: t("Artists' talk: painting the in-between", "የሠዓሊዎች ንግግር፦ መካከሉን መሣል"), note: t("Free, in Amharic and English", "ነጻ፣ በአማርኛና በእንግሊዝኛ") },
            { time: t("Every Saturday · 11 am", "በየቅዳሜው · ጠዋት 5 ሰዓት"), title: t("Guided tour of the exhibition", "የኤግዚቢሽኑ የተመራ ጉብኝት"), note: t("45 minutes, no booking needed", "45 ደቂቃ፣ ቀጠሮ አያስፈልግም") },
            { time: t("Sun 16 Feb · 2 pm", "እሑድ የካቲት 9 · ከሰዓት 8 ሰዓት"), title: t("Family afternoon: draw what you see", "የቤተሰብ ከሰዓት፦ የሚያዩትን ይሣሉ"), note: t("For children 6 to 12 with a grown-up", "ከ6 እስከ 12 ዓመት ለሆኑ ልጆች ከአዋቂ ጋር") },
          ],
        },
        {
          type: "gallery",
          id: "inside",
          layout: "mosaic",
          eyebrow: t("Inside", "ውስጥ"),
          heading: t("The rooms and the studio", "ክፍሎቹና የሥራ ቦታው"),
          images: [
            img("art-gallery-skylit-hall-paintings", "A skylit exhibition hall with a row of colourful paintings along a white wall", "በነጭ ግድግዳ ላይ የተደረደሩ ባለቀለም ሥዕሎች ያሉበት በሰማይ ብርሃን የሚበራ አዳራሽ"),
            img("art-gallery-visitor-curved-wall", "A visitor before a curved wall of large, brightly lit paintings", "በደማቅ ብርሃን የበሩ ትልልቅ ሥዕሎች ባሉበት ጠማማ ግድግዳ ፊት የቆመች ጎብኚ"),
            img("art-gallery-two-visitors-talking", "Two visitors talk in front of paintings at an exhibition", "በኤግዚቢሽን ላይ በሥዕሎች ፊት የሚያወሩ ሁለት ጎብኚዎች"),
            img("art-gallery-painter-studio-table", "A painter leans over a large table working on a canvas in a bright studio", "በብሩህ የሥራ ክፍል ውስጥ በትልቅ ጠረጴዛ ላይ ሸራ የሚሥል ሠዓሊ"),
          ],
        },
        {
          type: "cta",
          id: "visit",
          heading: t("Come and stand in front of it", "መጥተው ፊቱ ይቁሙ"),
          body: t("Free entry, Tuesday to Sunday, 10 am to 7 pm. Kazanchis, Addis Ababa.", "መግቢያ ነጻ፣ ከማክሰኞ እስከ እሑድ፣ ከጠዋቱ 4 እስከ ምሽቱ 1 ሰዓት። ካዛንቺስ፣ አዲስ አበባ።"),
          primaryAction: visit,
        },
      ],
    },
    {
      path: "/visit",
      title: t("Visit", "ጉብኝት"),
      nav: t("Visit", "ጉብኝት"),
      description: t("Visit Gize Contemporary in Kazanchis, Addis Ababa: hours, directions and enquiries about works.", "በካዛንቺስ፣ አዲስ አበባ የሚገኘውን ጊዜ ዘመናዊ ጥበብን ይጎብኙ፦ ሰዓቶች፣ አቅጣጫና ስለ ሥራዎች ጥያቄዎች።"),
      sections: [
        { type: "contact", id: "find", eyebrow: t("Visit", "ጉብኝት"), heading: t("Free entry, six days a week", "መግቢያ ነጻ፣ በሳምንት ስድስት ቀን") },
        {
          type: "form",
          id: "enquire",
          kind: "contact",
          eyebrow: t("Collect", "ይግዙ"),
          heading: t("Ask about a work", "ስለ ሥራ ይጠይቁ"),
          intro: t("Tell us which work you are interested in. We will send the price, the details and how to see it.", "የሚፈልጉትን ሥራ ይንገሩን። ዋጋውን፣ ዝርዝሩንና እንዴት ማየት እንደሚችሉ እንልክልዎታለን።"),
          fields: [
            { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
            { name: "phone", label: t("Phone or WhatsApp", "ስልክ ወይም ዋትስአፕ"), type: "tel", required: true },
            { name: "email", label: t("Email", "ኢሜይል"), type: "email" },
            { name: "work", label: t("Which work?", "የትኛው ሥራ?"), type: "text" },
            { name: "message", label: t("Anything else", "ሌላ ነገር"), type: "textarea" },
          ],
          submitLabel: t("Send", "ላክ"),
          successMessage: t("Thank you. We will reply within a day.", "እናመሰግናለን። በአንድ ቀን ውስጥ እንመልሳለን።"),
        },
      ],
    },
  ],
});
