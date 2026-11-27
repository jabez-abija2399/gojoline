import { t, img, link, save } from "./lib.mjs";

// A creative studio told like a poster: the "avant" art direction (black and white, one electric
// blue, huge grotesque words, a broken grid of work). Projects and clients are examples to replace.
const start = link("Start a project", "ፕሮጀክት እንጀምር", "/contact");

const work = [
  {
    image: img("personal-card-logo-tablet", "A hand with a stylus drawing a bear-head logo on a black tablet", "በጥቁር ታብሌት ላይ የድብ ራስ አርማ በብዕር የሚስል እጅ"),
    subtitle: t("Brand identity", "የብራንድ መለያ"),
    title: t("Gelada Outdoor", "ገላዳ አውትዶር"),
    meta: [t("2026", "2018 ዓ.ም."), t("Logo, type, signage", "አርማ፣ ፊደል፣ ምልክቶች")],
    description: t("A mark as stubborn as the mountains the brand climbs.", "ብራንዱ እንደሚወጣቸው ተራሮች ጽኑ የሆነ አርማ።"),
  },
  {
    image: img("personal-card-editorial-portrait", "A woman in a red hat and red patterned dress holding a woven bag", "ቀይ ባርኔጣና ቀይ ጥለት ያለው ቀሚስ የለበሰች፣ የተሸመነ ቦርሳ የያዘች ሴት"),
    subtitle: t("Campaign", "ዘመቻ"),
    title: t("Red Season", "ቀዩ ወቅት"),
    meta: [t("2026", "2018 ዓ.ም."), t("Photography, film", "ፎቶግራፍ፣ ፊልም")],
    description: t("One colour, one city, thirty days of posters.", "አንድ ቀለም፣ አንድ ከተማ፣ ሠላሳ ቀን ፖስተሮች።"),
  },
  {
    image: img("personal-card-brochure-layout", "An open printed brochure with a pink editorial layout on a wooden table", "በእንጨት ጠረጴዛ ላይ የተከፈተ ሮዝ ገጽታ ያለው የታተመ ብሮሸር"),
    subtitle: t("Editorial", "ኅትመት"),
    title: t("The Teff Paper", "ዘ ጤፍ ፔፐር"),
    meta: [t("2025", "2017 ዓ.ም."), t("Magazine, print", "መጽሔት፣ ኅትመት")],
    description: t("A food magazine that reads like a family recipe book.", "እንደ ቤተሰብ የምግብ አዘገጃጀት መጽሐፍ የሚነበብ የምግብ መጽሔት።"),
  },
  {
    image: img("personal-card-website-laptop", "A laptop on a desk showing a teal architecture website", "አረንጓዴ-ሰማያዊ የሥነ ሕንፃ ድረ-ገጽ የሚያሳይ ላፕቶፕ በጠረጴዛ ላይ"),
    subtitle: t("Website", "ድረ-ገጽ"),
    title: t("Bole Build Co.", "ቦሌ ቢልድ"),
    meta: [t("2025", "2017 ዓ.ም."), t("Web, 3D, copy", "ድረ-ገጽ፣ 3D፣ ጽሑፍ")],
    description: t("An architecture firm's work, finally as bold online as on site.", "የሥነ ሕንፃ ድርጅቱ ሥራ፣ በግንባታ ቦታው እንዳለው ሁሉ በመስመር ላይም ደማቅ።"),
  },
];

const more = [
  {
    image: img("fashion-card-man-gabi-orange-wall", "A young man wrapped in a white striped cotton shawl against an orange shutter", "በብርቱካናማ መዝጊያ ፊት ባለ ሸንተረር ነጭ ጋቢ የተጠቀለለ ወጣት"),
    subtitle: t("Campaign", "ዘመቻ"),
    title: t("Gabi Season", "የጋቢ ወቅት"),
    meta: [t("2024", "2016 ዓ.ም."), t("Photography", "ፎቶግራፍ")],
  },
  {
    image: img("personal-gallery-pattern", "A vintage geometric repeat pattern in orange, grey-blue and yellow", "በብርቱካናማ፣ ግራጫ-ሰማያዊና ቢጫ የተሠራ የድሮ ጂኦሜትሪክ ጥለት"),
    subtitle: t("Packaging", "ማሸጊያ"),
    title: t("Shema Textiles", "ሸማ ጨርቃጨርቅ"),
    meta: [t("2024", "2016 ዓ.ም."), t("Pattern, packaging", "ጥለት፣ ማሸጊያ")],
  },
];

save("agency", {
  name: t("Kebero Studio", "ከበሮ ስቱዲዮ"),
  tagline: t("A creative studio in Addis Ababa for brands that refuse to whisper", "ለማያንሾካሹኩ ብራንዶች፣ በአዲስ አበባ የሚገኝ የፈጠራ ስቱዲዮ"),
  languages: ["en", "am"],
  theme: { primary: "#2B2BEE", accent: "#0B0B0B", background: "#F4F4F0", text: "#0B0B0B", highlight: "#2B2BEE", font: "grotesk", radius: "none", style: "avant" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Bole, Addis Ababa", "ቦሌ፣ አዲስ አበባ"),
    hours: [{ days: t("Monday to Friday", "ከሰኞ እስከ ዓርብ"), time: t("9:00 am to 6:00 pm", "ከጠዋቱ 3 እስከ ምሽቱ 12 ሰዓት") }],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Studio", "ስቱዲዮ"),
      description: t("Kebero Studio: brand identity, campaigns, websites and film for brands that refuse to whisper. Addis Ababa.", "ከበሮ ስቱዲዮ፦ ለማያንሾካሹኩ ብራንዶች የብራንድ መለያ፣ ዘመቻ፣ ድረ-ገጽና ፊልም። አዲስ አበባ።"),
      sections: [
        {
          type: "hero",
          id: "top",
          variant: "centered",
          eyebrow: t("Creative studio · Addis Ababa", "የፈጠራ ስቱዲዮ · አዲስ አበባ"),
          heading: t("We build loud, unforgettable brands", "ደማቅና የማይረሱ ብራንዶችን እንገነባለን"),
          subheading: t("Identity, campaigns, websites and film for people who would rather be remembered than liked.", "ከመወደድ ይልቅ መታወስን ለሚመርጡ፦ መለያ፣ ዘመቻ፣ ድረ-ገጽና ፊልም።"),
          primaryAction: start,
          secondaryAction: link("See the work", "ሥራዎቹን ይመልከቱ", "#work"),
        },
        {
          type: "about",
          id: "studio",
          eyebrow: t("The studio", "ስቱዲዮው"),
          heading: t("Small team. Big voice.", "ትንሽ ቡድን። ትልቅ ድምፅ።"),
          body: t(
            "We are designers, writers and filmmakers who think a brand should have an opinion.\n\nWe work with a few clients at a time, from the first sketch to the last frame, and we tell you the truth about your ideas.",
            "ብራንድ የራሱ አቋም ሊኖረው ይገባል ብለን የምናምን ዲዛይነሮች፣ ጸሐፊዎችና ፊልም ሠሪዎች ነን።\n\nበአንድ ጊዜ ከጥቂት ደንበኞች ጋር ብቻ፣ ከመጀመሪያው ንድፍ እስከ መጨረሻው ምስል እንሠራለን፤ ስለ ሐሳቦችዎም እውነቱን እንነግርዎታለን።",
          ),
          image: img("personal-gallery-lettering-sketches", "Hand-drawn logo and lettering sketches spread across a wooden desk", "በእጅ የተሳሉ የአርማና የፊደል ንድፎች በእንጨት ጠረጴዛ ላይ ተበትነው"),
          imageSide: "start",
        },
        {
          type: "cards",
          id: "work",
          layout: "grid",
          eyebrow: t("Selected work", "የተመረጡ ሥራዎች"),
          heading: t("Work that talks back", "መልስ የሚሰጡ ሥራዎች"),
          items: work,
          action: link("All projects", "ሁሉም ፕሮጀክቶች", "/work"),
        },
        {
          type: "services",
          id: "services",
          variant: "numbered",
          eyebrow: t("What we do", "የምንሠራው"),
          heading: t("Four ways to get noticed", "ለመታየት አራት መንገዶች"),
          items: [
            { title: t("Brand identity", "የብራንድ መለያ"), description: t("Names, logos, type and the rules that hold them together.", "ስሞች፣ አርማዎች፣ ፊደሎችና አንድ ላይ የሚያቆሟቸው ደንቦች።") },
            { title: t("Campaigns", "ዘመቻዎች"), description: t("Ideas big enough for a billboard and sharp enough for a phone.", "ለትልቅ ማስታወቂያ ሰሌዳ የሚበቁ፣ ለስልክ ስክሪን የሚስማሙ ሐሳቦች።") },
            { title: t("Websites", "ድረ-ገጾች"), description: t("Sites that move, load fast and still work on a cheap phone.", "የሚንቀሳቀሱ፣ ፈጥነው የሚከፈቱ፣ በርካሽ ስልክም የሚሠሩ ድረ-ገጾች።") },
            { title: t("Motion & film", "እንቅስቃሴና ፊልም"), description: t("Short films, animated logos and everything that plays.", "አጫጭር ፊልሞች፣ የሚንቀሳቀሱ አርማዎችና የሚጫወት ሁሉ።") },
          ],
        },
        {
          type: "marquee",
          tone: "primary",
          items: [t("Identity", "መለያ"), t("Campaigns", "ዘመቻ"), t("Web", "ድረ-ገጽ"), t("Motion", "እንቅስቃሴ"), t("Type", "ፊደል"), t("Film", "ፊልም")],
        },
        {
          type: "cards",
          id: "featured",
          layout: "feature",
          eyebrow: t("In focus", "በትኩረት"),
          heading: t("Featured projects", "ጎላ ያሉ ፕሮጀክቶች"),
          items: [
            {
              image: img("cafe-hero-coffee-ceremony-pour", "A woman in a white habesha dress pouring coffee from a black clay jebena into rows of small cups", "ነጭ የሀበሻ ቀሚስ የለበሰች ሴት ከጥቁር ሸክላ ጀበና በተደረደሩ ትናንሽ ስኒዎች ቡና ስትቀዳ"),
              subtitle: t("Rebrand · 2026", "አዲስ መለያ · 2018 ዓ.ም."),
              title: t("Abol Roasters", "አቦል ቆይዎች"),
              description: t("A coffee roaster that sounded like everyone else. We gave it the voice of the ceremony itself: slow, warm and impossible to rush. New name, new packs, new shop.", "እንደ ሌሎቹ ይሰማ የነበረ የቡና ቆይ። የሥነ ሥርዓቱን ራሱ ድምፅ ሰጠነው፦ ቀስ ያለ፣ ሞቅ ያለ፣ የማይቸኮል። አዲስ ስም፣ አዲስ ማሸጊያ፣ አዲስ ሱቅ።"),
              meta: [t("Identity", "መለያ"), t("Packaging", "ማሸጊያ"), t("Interior", "የውስጥ ዲዛይን")],
              action: link("Start something similar", "ተመሳሳይ ነገር እንጀምር", "/contact"),
            },
            {
              image: img("fashion-gallery-loom-striped-threads", "A wooden handloom with brightly coloured striped threads stretched across it under a blue sky", "በሰማያዊ ሰማይ ሥር ደማቅ ቀለም ያላቸው ሸንተረር ክሮች የተወጠሩበት የእንጨት ሽመና"),
              subtitle: t("Campaign · 2025", "ዘመቻ · 2017 ዓ.ም."),
              title: t("Tibeb Atelier", "ጥበብ አቴሊየር"),
              description: t("A weaving house going abroad for the first time. One loom, one thread colour a week, and a film shot entirely at hand height.", "ለመጀመሪያ ጊዜ ወደ ውጭ የሚወጣ የሽመና ቤት። አንድ ሽመና፣ በሳምንት አንድ የክር ቀለም፣ እና ሙሉ በሙሉ በእጅ ከፍታ የተቀረጸ ፊልም።"),
              meta: [t("Campaign", "ዘመቻ"), t("Film", "ፊልም"), t("Online shop", "የመስመር ላይ ሱቅ")],
              action: link("Start something similar", "ተመሳሳይ ነገር እንጀምር", "/contact"),
            },
          ],
        },
        {
          type: "quote",
          id: "philosophy",
          quote: t("Good work makes you feel something before you understand why.", "ጥሩ ሥራ ለምን እንደሆነ ከመረዳትዎ በፊት አንድ ነገር እንዲሰማዎ ያደርጋል።"),
        },
        {
          type: "testimonials",
          id: "clients",
          eyebrow: t("Clients", "ደንበኞች"),
          heading: t("Who we've made noise with", "አብረን ድምፅ ያሰማናቸው"),
          items: [
            { quote: t("They threw out our brief in the first meeting and gave us something far better. Sales doubled in a season.", "በመጀመሪያው ስብሰባ የሰጠናቸውን መመሪያ ትተው እጅግ የተሻለ ነገር ሰጡን። በአንድ ወቅት ሽያጫችን እጥፍ ሆነ።"), name: "Meron A.", role: t("Founder, coffee roaster", "መሥራች፣ የቡና ቆይ ድርጅት") },
            { quote: t("Honest, fast and never boring.", "ታማኝ፣ ፈጣን፣ ፈጽሞ አሰልቺ ያልሆኑ።"), name: "Daniel G.", role: t("Marketing lead, outdoor brand", "የገበያ ኃላፊ፣ የውጪ ስፖርት ብራንድ") },
            { quote: t("Our site finally looks like the buildings we make.", "ድረ-ገጻችን በመጨረሻ የምንሠራቸውን ሕንፃዎች መሰለ።"), name: "Hiwot B.", role: t("Partner, architecture firm", "አጋር፣ የሥነ ሕንፃ ድርጅት") },
          ],
        },
        {
          type: "cta",
          id: "contact",
          heading: t("Got something to say? Let's make it loud.", "የሚሉት ነገር አለዎት? ድምፁን እናጉላው።"),
          primaryAction: start,
          secondaryAction: link("Call the studio", "ወደ ስቱዲዮው ይደውሉ", "tel:+251911000000"),
        },
      ],
    },
    {
      path: "/work",
      title: t("Work", "ሥራዎች"),
      nav: t("Work", "ሥራዎች"),
      description: t("Projects by Kebero Studio: identities, campaigns, magazines, websites and packaging.", "የከበሮ ስቱዲዮ ፕሮጀክቶች፦ መለያዎች፣ ዘመቻዎች፣ መጽሔቶች፣ ድረ-ገጾችና ማሸጊያዎች።"),
      sections: [
        { type: "cards", id: "projects", layout: "index", eyebrow: t("Index", "ማውጫ"), heading: t("Every project", "ሁሉም ፕሮጀክቶች"), items: [...work, ...more] },
        { type: "cta", id: "next", heading: t("Yours could be next.", "የእርስዎ ቀጣዩ ሊሆን ይችላል።"), primaryAction: start },
      ],
    },
    {
      path: "/contact",
      title: t("Contact", "አድራሻ"),
      nav: t("Contact", "አድራሻ"),
      description: t("Start a project with Kebero Studio in Addis Ababa. We answer within two working days.", "በአዲስ አበባ ከከበሮ ስቱዲዮ ጋር ፕሮጀክት ይጀምሩ። በሁለት የሥራ ቀናት ውስጥ እንመልሳለን።"),
      sections: [
        {
          type: "form",
          id: "project",
          kind: "contact",
          eyebrow: t("New project", "አዲስ ፕሮጀክት"),
          heading: t("Tell us what you're making", "ምን እየሠሩ እንደሆነ ይንገሩን"),
          intro: t("A few lines are enough. We answer within two working days, with questions or a first idea.", "ጥቂት መስመሮች ይበቃሉ። በሁለት የሥራ ቀናት ውስጥ በጥያቄ ወይም በመጀመሪያ ሐሳብ እንመልሳለን።"),
          fields: [
            { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
            { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true },
            { name: "company", label: t("Company or project", "ድርጅት ወይም ፕሮጀክት"), type: "text" },
            { name: "need", label: t("What do you need?", "ምን ያስፈልግዎታል?"), type: "select", options: [t("Brand identity", "የብራንድ መለያ"), t("Campaign", "ዘመቻ"), t("Website", "ድረ-ገጽ"), t("Motion or film", "እንቅስቃሴ ወይም ፊልም"), t("Not sure yet", "ገና እርግጠኛ አይደለሁም")] },
            { name: "message", label: t("Tell us more", "ተጨማሪ ይንገሩን"), type: "textarea", required: true },
          ],
          submitLabel: t("Send it", "ላክ"),
          successMessage: t("Got it. We'll be in touch within two working days.", "ደርሶናል። በሁለት የሥራ ቀናት ውስጥ እናገኝዎታለን።"),
        },
        { type: "contact", id: "studio", eyebrow: t("The studio", "ስቱዲዮው"), heading: t("Or just come by", "ወይም ዝም ብለው ይምጡ"), intro: t("Call or write on Telegram. Coffee is always on.", "ይደውሉ ወይም በቴሌግራም ይጻፉ። ቡና ሁሌም አለ።") },
      ],
    },
  ],
});
