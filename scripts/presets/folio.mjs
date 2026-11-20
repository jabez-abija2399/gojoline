import { t, img, link, save } from "./lib.mjs";

// A creative developer's portfolio as a notebook: the "folio" art direction. The person, projects
// and clients are examples to replace (sample project names and facts block publishing).
const hello = link("Say hello", "ሰላም ይበሉ", "/contact");

const work = [
  {
    image: img("personal-card-website-laptop", "A laptop on a desk showing an architecture website", "የሥነ ሕንፃ ድረ-ገጽ የሚያሳይ ላፕቶፕ በጠረጴዛ ላይ"),
    title: t("Kuraz Studio site", "የኩራዝ ስቱዲዮ ድረ-ገጽ"),
    subtitle: t("Website and 3D", "ድረ-ገጽና 3D"),
    meta: [t("2026", "2018 ዓ.ም."), t("React, WebGL", "React፣ WebGL")],
    description: t("A portfolio site that loads in under a second on a 3G phone.", "በ3G ስልክ ከአንድ ሰከንድ ባነሰ ጊዜ የሚከፈት የሥራ ማሳያ ድረ-ገጽ።"),
  },
  {
    image: img("personal-card-logo-tablet", "A hand drawing a bear-head logo on a black tablet", "በጥቁር ታብሌት ላይ የድብ ራስ አርማ የሚስል እጅ"),
    title: t("Gebeta brand system", "የገበታ ብራንድ ሥርዓት"),
    subtitle: t("Identity and design system", "መለያና የዲዛይን ሥርዓት"),
    meta: [t("2025", "2017 ዓ.ም."), t("Figma, tokens", "Figma፣ ቶክኖች")],
    description: t("One set of design tokens for an app, a website and the shop window.", "ለመተግበሪያ፣ ለድረ-ገጽና ለሱቅ መስኮት አንድ የዲዛይን ቶክኖች ስብስብ።"),
  },
  {
    image: img("business-card-analytics", "A person in a navy blazer working on a laptop that shows pie and bar charts", "የፓይና የአሞሌ ሰንጠረዦች በሚያሳይ ላፕቶፕ ላይ የሚሠራ ሰው"),
    title: t("Mesob dashboard", "የመሶብ ዳሽቦርድ"),
    subtitle: t("Product design", "የምርት ዲዛይን"),
    meta: [t("2025", "2017 ዓ.ም."), t("TypeScript, D3", "TypeScript፣ D3")],
    description: t("Sales data for 300 shops, readable at a glance in Amharic or English.", "ለ300 ሱቆች የሽያጭ መረጃ፣ በአማርኛ ወይም በእንግሊዝኛ በአንድ እይታ የሚነበብ።"),
  },
  {
    image: img("personal-card-brochure-layout", "An open printed brochure with a pink editorial layout", "ሮዝ ገጽታ ያለው የተከፈተ የታተመ ብሮሸር"),
    title: t("Lomi annual report", "የሎሚ ዓመታዊ ሪፖርት"),
    subtitle: t("Print and web", "ኅትመትና ድረ-ገጽ"),
    meta: [t("2024", "2016 ዓ.ም."), t("InDesign, Astro", "InDesign፣ Astro")],
    description: t("A report people actually read, in print and as a scrolling story.", "ሰዎች በእርግጥ የሚያነቡት ሪፖርት፣ በኅትመትና እንደ ተሸብላይ ታሪክ።"),
  },
];

save("folio", {
  name: t("Ruth Mekonnen", "ሩት መኮንን"),
  tagline: t("Creative developer in Addis Ababa: interfaces, websites and the systems behind them", "በአዲስ አበባ የፈጠራ ገንቢ፦ በይነገጾች፣ ድረ-ገጾችና ከኋላቸው ያሉ ሥርዓቶች"),
  languages: ["en", "am"],
  theme: { primary: "#141414", accent: "#141414", background: "#F5F3EE", text: "#141414", highlight: "#FF6B3D", font: "grotesk", radius: "small", style: "folio" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Addis Ababa, and remote", "አዲስ አበባ፣ እና በርቀት"),
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Index", "ማውጫ"),
      description: t("Ruth Mekonnen, creative developer in Addis Ababa. Selected work, case studies and how to reach her.", "ሩት መኮንን፣ በአዲስ አበባ የፈጠራ ገንቢ። የተመረጡ ሥራዎች፣ ዝርዝር ጥናቶችና እሷን የሚያገኙበት መንገድ።"),
      sections: [
        {
          type: "hero",
          id: "top",
          variant: "portrait",
          eyebrow: t("Available for work from March", "ከመጋቢት ጀምሮ ለሥራ ዝግጁ"),
          heading: t("I build interfaces people remember", "ሰዎች የሚያስታውሷቸውን በይነገጾች እገነባለሁ"),
          subheading: t("Creative developer in Addis Ababa. I design and build websites, products and the small details that make them feel alive.", "በአዲስ አበባ የፈጠራ ገንቢ። ድረ-ገጾችን፣ ምርቶችንና ሕያው የሚያደርጓቸውን ትናንሽ ዝርዝሮች እነድፋለሁ፣ እገነባለሁም።"),
          image: img("personal-hero-woman-orange-blazer", "A smiling young woman with natural hair in an orange blazer against a pale teal wall", "ብርቱካናማ ኮት የለበሰች፣ ፈገግ ያለች ወጣት ሴት በፈዛዛ አረንጓዴ-ሰማያዊ ግድግዳ ፊት"),
          stamp: t("Creative developer · Addis Ababa ·", "የፈጠራ ገንቢ · አዲስ አበባ ·"),
          primaryAction: link("See the work", "ሥራዎቹን ይመልከቱ", "#work"),
          secondaryAction: hello,
        },
        { type: "cards", id: "work", layout: "index", eyebrow: t("selected work", "የተመረጡ ሥራዎች"), heading: t("Work", "ሥራዎች"), items: work },
        {
          type: "cards",
          id: "cases",
          layout: "feature",
          eyebrow: t("case studies", "ዝርዝር ጥናቶች"),
          heading: t("Two projects, up close", "ሁለት ፕሮጀክቶች፣ በቅርበት"),
          items: [
            { ...work[0], image: img("real-estate-hero-modern-apartment-corner-sky", "The top corner of a black-and-white apartment block against a pale sky", "በፈዛዛ ሰማይ ፊት የጥቁርና ነጭ የመኖሪያ ሕንፃ የላይኛው ጥግ"), description: t("The brief: show heavy 3D work without a heavy page. I built a viewer that streams each model only when you reach it, and a fallback image for slow phones. The site went from 9 MB to 600 KB on first load.", "መመሪያው፦ ከባድ የ3D ሥራን ከባድ ባልሆነ ገጽ ማሳየት። እያንዳንዱን ሞዴል ሲደርሱበት ብቻ የሚያወርድ ማሳያና ለዝግተኛ ስልኮች ምትክ ምስል ሠራሁ። የመጀመሪያው ጭነት ከ9 MB ወደ 600 KB ወረደ።") },
            { ...work[2], image: img("business-hero-team-meeting", "Five people around a white table in a bright meeting room", "በብሩህ የስብሰባ ክፍል ውስጥ በነጭ ጠረጴዛ ዙሪያ ያሉ አምስት ሰዎች"), description: t("Shop owners checked sales in a notebook. I sat with six of them for a week, then designed a dashboard that answers their three real questions on one screen.", "የሱቅ ባለቤቶች ሽያጭን በደብተር ይከታተሉ ነበር። ከስድስቱ ጋር ለአንድ ሳምንት ተቀምጬ፣ ሦስቱን እውነተኛ ጥያቄዎቻቸውን በአንድ ስክሪን የሚመልስ ዳሽቦርድ ነደፍኩ።") },
          ],
        },
        {
          type: "services",
          id: "skills",
          variant: "numbered",
          eyebrow: t("what I do", "የምሠራው"),
          heading: t("Skills", "ክህሎቶች"),
          items: [
            { title: t("Interfaces", "በይነገጾች"), description: t("React, TypeScript, CSS that moves without hurting the page.", "React፣ TypeScript፣ ገጹን ሳይጎዳ የሚንቀሳቀስ CSS።") },
            { title: t("Design systems", "የዲዛይን ሥርዓቶች"), description: t("Tokens, components and documentation teams actually use.", "ቡድኖች በእርግጥ የሚጠቀሙባቸው ቶክኖች፣ ክፍሎችና ሰነዶች።") },
            { title: t("Motion", "እንቅስቃሴ"), description: t("Small, purposeful animation, and none for those who ask for less.", "ትንሽ፣ ዓላማ ያለው እንቅስቃሴ፣ ያነሰ ለሚፈልጉ ደግሞ ምንም።") },
            { title: t("Amharic on the web", "አማርኛ በድረ-ገጽ"), description: t("Ge'ez type that reads well on every screen.", "በሁሉም ስክሪን ላይ በደንብ የሚነበብ የግዕዝ ፊደል።") },
          ],
        },
        {
          type: "timeline",
          id: "experience",
          eyebrow: t("experience", "የሥራ ልምድ"),
          heading: t("Where I have been", "የሠራሁባቸው"),
          items: [
            { period: t("2023 – now", "2015 – አሁን"), title: t("Independent creative developer", "ራሱን የቻለ የፈጠራ ገንቢ"), place: t("Addis Ababa", "አዲስ አበባ") },
            { period: t("2020 – 2023", "2012 – 2015"), title: t("Front-end lead", "የፊት ገጽ መሪ"), place: t("A fintech start-up", "የፋይናንስ ቴክኖሎጂ ጀማሪ ድርጅት") },
            { period: t("2017 – 2020", "2009 – 2012"), title: t("Designer and developer", "ዲዛይነርና ገንቢ"), place: t("A creative agency", "የፈጠራ ኤጀንሲ") },
          ],
        },
        { type: "quote", id: "belief", quote: t("The best interface is the one nobody has to think about, and everybody remembers.", "ምርጡ በይነገጽ ማንም ሊያስብበት የማይገባው፣ ሁሉም ግን የሚያስታውሰው ነው።") },
        {
          type: "cta",
          id: "contact",
          heading: t("Have something to build?", "የሚገነባ ነገር አለዎት?"),
          body: t("Tell me about it. I take on a few projects at a time.", "ይንገሩኝ። በአንድ ጊዜ ጥቂት ፕሮጀክቶችን ብቻ እይዛለሁ።"),
          primaryAction: hello,
        },
      ],
    },
    {
      path: "/work",
      title: t("Work", "ሥራዎች"),
      nav: t("Work", "ሥራዎች"),
      description: t("Websites, products and design systems by Ruth Mekonnen.", "በሩት መኮንን የተሠሩ ድረ-ገጾች፣ ምርቶችና የዲዛይን ሥርዓቶች።"),
      sections: [{ type: "cards", id: "all", layout: "grid", eyebrow: t("all work", "ሁሉም ሥራዎች"), heading: t("Everything, newest first", "ሁሉም፣ አዲሱ በመጀመሪያ"), items: work }],
    },
    {
      path: "/contact",
      title: t("Contact", "አድራሻ"),
      nav: t("Contact", "አድራሻ"),
      description: t("Write to Ruth Mekonnen about a project.", "ስለ ፕሮጀክት ለሩት መኮንን ይጻፉ።"),
      sections: [
        {
          type: "form",
          id: "hello",
          kind: "contact",
          eyebrow: t("say hello", "ሰላም ይበሉ"),
          heading: t("Tell me about your project", "ስለ ፕሮጀክትዎ ይንገሩኝ"),
          fields: [
            { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
            { name: "email", label: t("Email", "ኢሜይል"), type: "email", required: true },
            { name: "message", label: t("What are you making?", "ምን እየሠሩ ነው?"), type: "textarea", required: true },
          ],
          submitLabel: t("Send", "ላክ"),
          successMessage: t("Thank you. I will write back.", "እናመሰግናለን። መልስ እጽፋለሁ።"),
        },
        { type: "contact", id: "elsewhere", eyebrow: t("elsewhere", "በሌላ መንገድ"), heading: t("Or call or message", "ወይም ይደውሉ ወይም መልእክት ይላኩ") },
      ],
    },
  ],
});
