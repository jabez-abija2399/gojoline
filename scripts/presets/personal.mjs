import { t, img, link, birr, save } from "./lib.mjs";

const start = link("Start a project", "ሥራ እንጀምር", "/#project");
const seeWork = link("See the work", "ሥራዎቹን ይመልከቱ", "/work");

// Kinds of work: on the work page two or more kinds give filter pills by themselves.
const kind = {
  brand: t("Brand", "ብራንድ"),
  web: t("Web", "ድረገጽ"),
  print: t("Print", "ኅትመት"),
  campaign: t("Campaign", "ዘመቻ"),
};
// On the home page each row of the work list leads to the full write-ups.
const more = link("Read about this project", "ስለዚህ ሥራ ያንብቡ", "/work");

// Selected work. Each card: project name, type and year in `meta`, one outcome line.
const work = {
  sefer: {
    badge: kind.web,
    image: img("personal-card-website-laptop", "A laptop on a desk showing a teal architecture website", "በጠረጴዛ ላይ ያለ ላፕቶፕ፤ አረንጓዴ-ሰማያዊ የአርክቴክቸር ድረገጽ ያሳያል"),
    subtitle: t("Web design", "የድረገጽ ዲዛይን"),
    title: t("Sefer Architects", "ሰፈር አርክቴክትስ"),
    meta: [t("Website", "ድረገጽ"), t("2026", "2026"), t("English + Amharic", "እንግሊዝኛ + አማርኛ")],
    description: t("A calm two-language site that puts the buildings first. Enquiries doubled in three months.", "ሕንጻዎቹን የሚያስቀድም፣ በሁለት ቋንቋ የተሠራ ረጋ ያለ ድረገጽ። በሦስት ወር ውስጥ የደንበኛ ጥያቄ በእጥፍ ጨመረ።"),
  },
  dib: {
    badge: kind.brand,
    image: img("personal-card-logo-tablet", "A hand with a stylus drawing a white bear-head logo on a black tablet", "በጥቁር ታብሌት ላይ ነጭ የድብ ራስ ሎጎ የሚሥል እጅ"),
    subtitle: t("Brand identity", "የብራንድ መለያ"),
    title: t("Dib Trek Gear", "ድብ የጉዞ ዕቃዎች"),
    meta: [t("Logo and identity", "ሎጎና መለያ"), t("2025", "2025"), t("6 weeks", "6 ሳምንት")],
    description: t("A bear mark that stays clear on a zip pull and on a shop sign. Now on every bag they sell.", "በዚፕ ጫፍም በሱቅ ሰሌዳም ላይ ጥርት ብሎ የሚታይ የድብ ምልክት። ዛሬ በሚሸጡት ቦርሳ ሁሉ ላይ አለ።"),
  },
  grafico: {
    badge: kind.print,
    image: img("personal-card-brochure-layout", "An open printed brochure with a pink layout and the large heading GRAFICO, on a wooden surface", "በእንጨት ላይ የተከፈተ የታተመ ብሮሸር፤ ሮዝ ገጽና ትልቅ GRAFICO የሚል ርእስ አለው"),
    subtitle: t("Editorial design", "የኅትመት ዲዛይን"),
    title: t("Grafico Magazine", "ግራፊኮ መጽሔት"),
    meta: [t("Print", "ኅትመት"), t("2024", "2024"), t("48 pages", "48 ገጽ")],
    description: t("Grid, type and cover for a design yearbook. The first print run sold out in two weeks.", "ለዓመታዊ የዲዛይን መጽሔት የገጽ አቀማመጥ፣ የፊደል ምርጫና ሽፋን። የመጀመሪያው ኅትመት በሁለት ሳምንት ተሸጦ አለቀ።"),
  },
  shema: {
    badge: kind.campaign,
    image: img("shop-card-woven-scarves", "Four folded hand-woven cotton scarves in blue, tan, pink and purple on a white surface", "በነጭ ገጽ ላይ የተጣጠፉ አራት በእጅ የተሸመኑ የጥጥ ሻርፖች፤ ሰማያዊ፣ ቡናማ፣ ሮዝና ወይን ጠጅ"),
    subtitle: t("Art direction", "የሥነ ጥበብ አመራር"),
    title: t("Shema Collective", "ሸማ ኮሌክቲቭ"),
    meta: [t("Product campaign", "የምርት ዘመቻ"), t("2025", "2025"), t("12 images", "12 ምስሎች")],
    description: t("One white table, four colours, nothing else. A launch shoot that filled the weavers' order book before opening day.", "አንድ ነጭ ጠረጴዛ፣ አራት ቀለም፣ ሌላ ምንም የለም። ሱቁ ከመከፈቱ በፊት የሸማኔዎቹን የትዕዛዝ ደብተር የሞላ የማስተዋወቂያ ፎቶ ሥራ።"),
  },
  buna: {
    badge: kind.brand,
    image: img("personal-gallery-lettering-sketches", "Hand-drawn logo and lettering sketches on loose paper and a sketchbook on a wooden desk", "በእንጨት ጠረጴዛ ላይ በወረቀትና በደብተር የተሣሉ የሎጎና የፊደል ንድፎች"),
    subtitle: t("Lettering", "የፊደል ጥበብ"),
    title: t("Buna Bet Lettering", "የቡና ቤት ፊደላት"),
    meta: [t("Hand lettering", "የእጅ ጽሑፍ"), t("2023", "2023"), t("Latin + Ge'ez", "ላቲን + ግዕዝ")],
    description: t("Forty sketches to find one word mark that reads as well in Ge'ez as in Latin.", "በግዕዝም በላቲንም እኩል የሚነበብ አንድ የስም ምልክት ለማግኘት የተሣሉ አርባ ንድፎች።"),
  },
  tibeb: {
    badge: kind.print,
    image: img("personal-gallery-pattern", "A geometric repeat pattern in orange, grey-blue and yellow", "በብርቱካናማ፣ በግራጫ-ሰማያዊና በቢጫ የተደጋገመ ጂኦሜትሪያዊ ጥለት"),
    subtitle: t("Pattern design", "የጥለት ዲዛይን"),
    title: t("Tibeb Tea Packaging", "ጥበብ ሻይ ማሸጊያ"),
    meta: [t("Packaging", "ማሸጊያ"), t("2023", "2023"), t("5 flavours", "5 ጣዕሞች")],
    description: t("A pattern family drawn from woven borders, one colourway for each flavour on the shelf.", "ከጥለት ጠርዞች የተቀዳ የጥለት ቤተሰብ፤ ለእያንዳንዱ ጣዕም የራሱ ቀለም።"),
  },
};

const services = [
  { icon: "palette", title: t("Brand identity", "የብራንድ መለያ"), description: t("Name, logo, colours, type and a short guide your printer can follow.", "ስም፣ ሎጎ፣ ቀለም፣ የፊደል ዓይነት እና አታሚዎ የሚከተለው አጭር መመሪያ።"), price: birr(45000) },
  { icon: "laptop", title: t("Websites", "ድረገጾች"), description: t("Designed for the phone first, in English and Amharic, ready to hand to your developer or built by me.", "መጀመሪያ ለስልክ የሚታሰብ፣ በእንግሊዝኛና በአማርኛ፤ ለገንቢዎ የሚሰጥ ወይም በእኔ የሚገነባ።"), price: birr(60000) },
  { icon: "book", title: t("Print and editorial", "ኅትመት"), description: t("Menus, magazines, reports and packaging, checked on paper before they go to press.", "ምናሌ፣ መጽሔት፣ ሪፖርትና ማሸጊያ፤ ወደ ማተሚያ ከመሄዱ በፊት በወረቀት ተፈትሾ።"), price: birr(25000) },
];

const experience = [
  { period: t("2022 to now", "ከ2022 እስከ አሁን"), title: t("Independent brand and web designer", "በግል የምሠራ የብራንድና የድረገጽ ዲዛይነር"), place: t("Addis Ababa", "አዲስ አበባ"), description: t("Identities and websites for cafés, studios, shops and start-ups. Around twelve projects a year.", "ለካፌዎች፣ ለስቱዲዮዎች፣ ለሱቆችና ለአዳዲስ ድርጅቶች መለያና ድረገጽ። በዓመት አሥራ ሁለት ያህል ሥራዎች።") },
  { period: t("2019 to 2022", "ከ2019 እስከ 2022"), title: t("Senior designer", "ከፍተኛ ዲዛይነር"), place: t("Brand agency, Bole", "የብራንድ ኤጀንሲ፣ ቦሌ"), description: t("Led identity work for banks, drinks and telecom launches with a team of four.", "ከአራት ሰው ቡድን ጋር ለባንኮች፣ ለመጠጥና ለቴሌኮም ምርቶች የመለያ ሥራ መርቻለሁ።") },
  { period: t("2016 to 2019", "ከ2016 እስከ 2019"), title: t("Junior designer", "ጀማሪ ዲዛይነር"), place: t("Design and print studio, Piassa", "የዲዛይንና ኅትመት ስቱዲዮ፣ ፒያሳ"), description: t("Posters, packaging and a lot of time beside the press, learning how ink behaves.", "ፖስተሮች፣ ማሸጊያዎች፣ እና ቀለም በወረቀት ላይ እንዴት እንደሚሆን ለመማር ከማተሚያው አጠገብ ያሳለፍኩት ረጅም ጊዜ።") },
];
const education = [
  { period: t("2012 to 2016", "ከ2012 እስከ 2016"), title: t("Degree in graphic design", "በግራፊክ ዲዛይን ዲግሪ"), place: t("School of fine arts and design, Addis Ababa", "የሥነ ጥበብና ዲዛይን ትምህርት ቤት፣ አዲስ አበባ") },
];

const testimonials = [
  { quote: t("Hana asked more questions in one coffee than our last agency did in a year. The logo was right the first time.", "ሀና በአንድ ቡና ላይ የጠየቀችን ጥያቄ የቀድሞው ኤጀንሲያችን በአንድ ዓመት አልጠየቀንም። ሎጎው በመጀመሪያው ዙር ትክክል ነበር።"), name: "Yonas A.", role: t("Founder, outdoor gear shop", "መሥራች፣ የጉዞ ዕቃዎች ሱቅ") },
  { quote: t("Clients now call us after seeing the website. Before, we had to explain who we were.", "አሁን ደንበኞች ድረገጹን አይተው ራሳቸው ይደውሉልናል። ከዚህ በፊት ማን እንደሆንን ማስረዳት ነበረብን።"), name: "Meron G.", role: t("Partner, architecture studio", "አጋር፣ የአርክቴክቸር ስቱዲዮ") },
  { quote: t("On time, on budget, and the Amharic looks as good as the English. That is rare.", "በጊዜው፣ በበጀቱ፤ አማርኛውም እንደ እንግሊዝኛው ያምራል። ይህ ብዙ ጊዜ አይገኝም።"), name: "Selam T.", role: t("Editor, design magazine", "አዘጋጅ፣ የዲዛይን መጽሔት") },
];

const projectFields = [
  { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
  { name: "phone", label: t("Phone or Telegram", "ስልክ ወይም ቴሌግራም"), type: "tel", required: true },
  { name: "need", label: t("What do you need?", "ምን ይፈልጋሉ?"), type: "select", required: true, options: [t("Brand identity", "የብራንድ መለያ"), t("Website", "ድረገጽ"), t("Print and editorial", "ኅትመት"), t("Not sure yet", "ገና አልወሰንኩም")] },
  { name: "budget", label: t("Budget", "በጀት"), type: "select", options: [t("Under 50,000 Birr", "ከ50,000 ብር በታች"), t("50,000 to 150,000 Birr", "ከ50,000 እስከ 150,000 ብር"), t("Over 150,000 Birr", "ከ150,000 ብር በላይ")] },
  { name: "about", label: t("A few words about the project", "ስለ ሥራው ጥቂት ቃላት"), type: "textarea", required: true },
];

save("personal", {
  name: t("Hana Bekele", "ሀና በቀለ"),
  tagline: t("Brand and web designer in Addis Ababa", "በአዲስ አበባ የምትሠራ የብራንድና የድረገጽ ዲዛይነር"),
  languages: ["en", "am"],
  theme: { primary: "#E8590C", accent: "#17130F", background: "#FAF6EF", text: "#1F1B16", font: "grotesk", radius: "medium", style: "bold" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Addis Ababa, Ethiopia", "አዲስ አበባ፣ ኢትዮጵያ"),
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Hana Bekele, an independent brand and web designer in Addis Ababa. Identities, websites and print for businesses that want to be remembered.", "ሀና በቀለ፣ በአዲስ አበባ በግሏ የምትሠራ የብራንድና የድረገጽ ዲዛይነር። መታወስ ለሚፈልጉ ንግዶች መለያ፣ ድረገጽና ኅትመት።"),
      sections: [
        {
          type: "hero",
          id: "top",
          variant: "portrait",
          // A short identity line on a slowly turning circle beside the portrait.
          stamp: t("Brand · Web · Print · Addis Ababa", "ብራንድ · ድረገጽ · ኅትመት · አዲስ አበባ"),
          eyebrow: t("Addis Ababa · Available for work", "አዲስ አበባ · ለአዲስ ሥራ ዝግጁ"),
          heading: t("Brand & web designer", "ብራንድና ድረገጽ ዲዛይነር"),
          subheading: t("I'm Hana. I give Ethiopian businesses a name, a face and a website people remember.", "ሀና እባላለሁ። ለኢትዮጵያ ንግዶች ሰው የማይረሳው ስም፣ ገጽታና ድረገጽ እሠራለሁ።"),
          image: img("personal-hero-woman-orange-blazer", "A young woman with natural hair, arms crossed, in an orange blazer against a pale teal wall", "ብርቱካናማ ኮት የለበሰች፣ እጆቿን ያጣመረች ወጣት ሴት በፈዛዛ አረንጓዴ-ሰማያዊ ግድግዳ ፊት"),
          primaryAction: start,
          secondaryAction: seeWork,
          facts: [
            { value: t("9 years", "9 ዓመት"), label: t("designing brands", "በብራንድ ዲዛይን") },
            { value: t("60+", "60+"), label: t("projects delivered", "የተጠናቀቁ ሥራዎች") },
            { value: t("2", "2"), label: t("languages, one voice", "ቋንቋ፣ አንድ ድምፅ") },
          ],
        },
        {
          // The centrepiece: a project list in big type; on a computer the picture follows the mouse.
          type: "cards",
          id: "work",
          layout: "index",
          eyebrow: t("Selected work", "የተመረጡ ሥራዎች"),
          heading: t("Six projects, 2023 to 2026", "ስድስት ሥራዎች፣ ከ2023 እስከ 2026"),
          items: [work.sefer, work.dib, work.grafico, work.shema, work.buna, work.tibeb].map(({ description, badge, ...x }) => ({ ...x, action: more })),
          action: link("See all work", "ሁሉንም ሥራዎች ይመልከቱ", "/work"),
        },
        {
          type: "services",
          variant: "numbered",
          id: "services",
          eyebrow: t("What I do", "የምሠራው"),
          heading: t("Three things, done well", "ሦስት ነገር፣ በጥራት"),
          intro: t("Prices are where projects start. You get a fixed quote before any work begins.", "ዋጋዎቹ መነሻ ናቸው። ሥራ ከመጀመሩ በፊት የማይለወጥ የዋጋ ዝርዝር ይደርስዎታል።"),
          items: services,
        },
        {
          type: "quote",
          id: "belief",
          quote: t("If it can't be painted on a wall in Merkato, it isn't finished.", "መርካቶ ውስጥ በግድግዳ ላይ ሊጻፍ ካልቻለ ገና አላለቀም።"),
          name: t("Hana Bekele", "ሀና በቀለ"),
          role: t("on what makes a good logo", "ጥሩ ሎጎ ምን እንደሆነ ስትናገር"),
        },
        {
          type: "about",
          id: "about",
          eyebrow: t("About", "ስለ እኔ"),
          heading: t("I start with coffee, not a computer", "ከኮምፒውተር በፊት ቡና"),
          body: t(
            "Nine years ago I was setting type beside a printing press in Piassa. Today I work on my own with founders who care how their business looks and sounds.\n\nI take one project at a time. You talk to me, not an account manager, and you see real work every week.",
            "ከዘጠኝ ዓመት በፊት ፒያሳ ውስጥ ከማተሚያ ማሽን አጠገብ ፊደል አስተካክል ነበር። ዛሬ ንግዳቸው እንዴት እንደሚታይና እንደሚሰማ ከሚጨነቁ መሥራቾች ጋር በግሌ እሠራለሁ።\n\nበአንድ ጊዜ አንድ ሥራ ብቻ እይዛለሁ። የሚያነጋግሩት እኔን ነው እንጂ ወኪል አይደለም፤ በየሳምንቱም የተሠራውን ያያሉ።",
          ),
          image: img("personal-about-woman-orange-blazer", "The same woman in the orange blazer standing beside a pale teal wall", "ያችው ብርቱካናማ ኮት የለበሰች ሴት በፈዛዛ አረንጓዴ-ሰማያዊ ግድግዳ አጠገብ ቆማ"),
          imageSide: "end",
          points: [t("One project at a time", "በአንድ ጊዜ አንድ ሥራ"), t("Amharic and English designed together", "አማርኛና እንግሊዝኛ አብረው ይነደፋሉ"), t("Files you own, ready for any printer", "የራስዎ የሆኑ፣ ለማንኛውም አታሚ ዝግጁ ፋይሎች")],
          action: start,
        },
        {
          type: "timeline",
          id: "experience",
          eyebrow: t("Since 2016", "ከ2016 ጀምሮ"),
          heading: t("Experience", "የሥራ ልምድ"),
          items: experience,
        },
        {
          type: "testimonials",
          id: "clients",
          eyebrow: t("Clients", "ደንበኞች"),
          heading: t("In their words", "በራሳቸው አንደበት"),
          items: testimonials,
        },
        {
          type: "form",
          id: "project",
          kind: "contact",
          heading: t("Start a project", "ሥራ እንጀምር"),
          intro: t("Tell me what you are building. I reply within two working days with questions, a date and a price.", "ምን እየገነቡ እንደሆነ ይንገሩኝ። በሁለት የሥራ ቀን ውስጥ ከጥያቄ፣ ከቀንና ከዋጋ ጋር እመልሳለሁ።"),
          fields: projectFields,
          submitLabel: t("Send", "ላክ"),
          successMessage: t("Thank you. I will write back within two working days.", "አመሰግናለሁ። በሁለት የሥራ ቀን ውስጥ እጽፍልዎታለሁ።"),
        },
      ],
    },
    {
      path: "/work",
      title: t("Work", "ሥራዎች"),
      nav: t("Work", "ሥራዎች"),
      description: t("Selected brand, web, print and lettering projects by Hana Bekele, 2023 to 2026.", "በሀና በቀለ የተሠሩ የተመረጡ የብራንድ፣ የድረገጽ፣ የኅትመትና የፊደል ሥራዎች፤ ከ2023 እስከ 2026።"),
      sections: [
        {
          type: "cards",
          layout: "grid",
          eyebrow: t("Work, 2023 to 2026", "ሥራዎች፣ ከ2023 እስከ 2026"),
          heading: t("Six projects I'm proud of", "የምኮራባቸው ስድስት ሥራዎች"),
          intro: t("Each one began with a conversation and ended with something a business uses every day.", "እያንዳንዱ በውይይት ጀምሮ ንግዱ በየቀኑ በሚጠቀምበት ነገር ተጠናቋል።"),
          items: [work.sefer, work.dib, work.shema, work.grafico, work.buna, work.tibeb],
        },
        {
          type: "stats",
          tone: "dark",
          items: [
            { value: t("60+", "60+"), label: t("projects delivered", "የተጠናቀቁ ሥራዎች") },
            { value: t("9", "9"), label: t("years of practice", "ዓመት ልምድ") },
            { value: t("7 in 10", "ከ10ሩ 7ቱ"), label: t("clients come back", "ደንበኞች ተመልሰው ይመጣሉ") },
          ],
        },
        {
          type: "steps",
          eyebrow: t("Process", "አሠራር"),
          heading: t("How a project runs", "አንድ ሥራ እንዴት ይሄዳል"),
          items: [
            { title: t("We talk", "እንነጋገራለን"), description: t("An hour over coffee or a call. I listen and take notes.", "አንድ ሰዓት በቡና ላይ ወይም በስልክ። አዳምጣለሁ፣ እጽፋለሁ።") },
            { title: t("I quote", "ዋጋ እሰጣለሁ"), description: t("A fixed price, a date and a clear list of what you get.", "የማይለወጥ ዋጋ፣ ቀን እና የሚረከቡት ነገር ግልጽ ዝርዝር።") },
            { title: t("I design", "እነድፋለሁ"), description: t("Two directions first, then one refined together, week by week.", "መጀመሪያ ሁለት አቅጣጫ፤ ከዚያ አንዱን በየሳምንቱ አብረን እናጠራዋለን።") },
            { title: t("You launch", "ይጀምራሉ"), description: t("Final files, a short guide and my help on the day it goes live.", "የመጨረሻ ፋይሎች፣ አጭር መመሪያ እና በመጀመሪያው ቀን የእኔ እገዛ።") },
          ],
          action: start,
        },
        {
          type: "cta",
          heading: t("Yours could be next", "ቀጣዩ የእርስዎ ሊሆን ይችላል"),
          body: t("I have room for two new projects this quarter.", "በዚህ ሩብ ዓመት ለሁለት አዲስ ሥራ ቦታ አለኝ።"),
          primaryAction: start,
          secondaryAction: link("Write on Telegram", "በቴሌግራም ይጻፉ", "https://t.me/yourbusiness"),
        },
      ],
    },
    {
      path: "/about",
      title: t("About", "ስለ እኔ"),
      nav: t("About", "ስለ እኔ"),
      description: t("About Hana Bekele: nine years of brand, print and web design in Addis Ababa.", "ስለ ሀና በቀለ፦ በአዲስ አበባ ዘጠኝ ዓመት የብራንድ፣ የኅትመትና የድረገጽ ዲዛይን።"),
      sections: [
        {
          type: "about",
          eyebrow: t("About Hana", "ስለ ሀና"),
          heading: t("Designer, printer's apprentice, Addis born", "ዲዛይነር፣ የማተሚያ ቤት ተማሪ፣ የአዲስ አበባ ልጅ"),
          body: t(
            "I grew up near Piassa, where every shop sign was painted by hand. I still think a good brand should be simple enough to paint on a wall.\n\nI learned the craft at a print studio, led identity work at an agency in Bole, and went independent in 2022. Since then I have worked with cafés, architects, makers and a magazine.\n\nGe'ez script is not an afterthought in my work. I draw and set Amharic first, so it never looks like a translation.",
            "ያደግሁት ፒያሳ አካባቢ ነው፤ የሱቅ ሰሌዳ ሁሉ በእጅ በሚጻፍበት። ዛሬም ጥሩ ብራንድ በግድግዳ ላይ በብሩሽ ሊጻፍ የሚችል ያህል ቀላል መሆን አለበት ብዬ አምናለሁ።\n\nሙያውን የተማርኩት በማተሚያ ስቱዲዮ ነው፤ ከዚያ ቦሌ በሚገኝ ኤጀንሲ የመለያ ሥራ መራሁ፤ በ2022 በግሌ መሥራት ጀመርኩ። ከዚያ ወዲህ ከካፌዎች፣ ከአርክቴክቶች፣ ከእጅ ባለሙያዎችና ከአንድ መጽሔት ጋር ሠርቻለሁ።\n\nበሥራዬ የግዕዝ ፊደል በኋላ የሚጨመር ነገር አይደለም። አማርኛውን አስቀድሜ ስለምነድፍ ትርጉም አይመስልም።",
          ),
          image: img("personal-about-creative-desk", "A wooden desk with pencils, brushes, books, rolled prints, a lamp and house plants", "እርሳሶች፣ ብሩሾች፣ መጻሕፍት፣ የተጠቀለሉ ኅትመቶች፣ መብራትና የቤት አትክልት ያሉበት የእንጨት ጠረጴዛ"),
          imageSide: "end",
          highlights: [
            { value: t("9", "9"), label: t("years", "ዓመት") },
            { value: t("60+", "60+"), label: t("projects", "ሥራዎች") },
            { value: t("12", "12"), label: t("a year, no more", "በዓመት፣ ከዚያ አይበልጥም") },
          ],
        },
        {
          type: "timeline",
          heading: t("Experience and education", "የሥራ ልምድና ትምህርት"),
          intro: t("Newest first.", "ከቅርቡ ጀምሮ።"),
          items: [...experience, ...education],
        },
        {
          type: "services",
          variant: "list",
          eyebrow: t("How I work", "የአሠራር መርሆች"),
          heading: t("What you can count on", "ሊተማመኑበት የሚችሉት"),
          items: [
            { icon: "users", title: t("You work with me", "ከእኔ ጋር ይሠራሉ"), description: t("No hand-offs. The person you brief is the person who designs.", "ሥራው ለሌላ አይተላለፍም። የሚያስረዱትም የሚነድፈውም አንድ ሰው ነው።") },
            { icon: "calendar", title: t("Dates are kept", "ቀን ይከበራል"), description: t("You get a calendar on day one and an update every Friday.", "በመጀመሪያው ቀን የጊዜ ሰሌዳ፣ በየዓርቡ ደግሞ የሥራ ሪፖርት ያገኛሉ።") },
            { icon: "globe", title: t("Two scripts, one brand", "ሁለት ፊደል፣ አንድ ብራንድ"), description: t("Ge'ez and Latin are drawn to sit together from the first sketch.", "ግዕዝና ላቲን ከመጀመሪያው ንድፍ ጀምሮ አብረው እንዲሄዱ ይሣላሉ።") },
            { icon: "key", title: t("You own the files", "ፋይሎቹ የእርስዎ ናቸው"), description: t("Every source file is handed over when the last invoice is paid.", "የመጨረሻው ክፍያ ሲፈጸም ሁሉም ዋና ፋይል ይረከባሉ።") },
            { icon: "ruler", title: t("Tested in real life", "በተግባር የተፈተነ"), description: t("Logos are printed small, sites are opened on a slow phone.", "ሎጎ በትንሹ ታትሞ፣ ድረገጽ በዘገምተኛ ስልክ ተከፍቶ ይፈተናል።") },
            { icon: "message", title: t("Plain words", "ግልጽ ቋንቋ"), description: t("No design jargon. I explain each choice in a sentence.", "የሙያ ቃል አላበዛም። እያንዳንዱን ምርጫ በአንድ ዓረፍተ ነገር አስረዳለሁ።") },
          ],
        },
        {
          type: "cta",
          heading: t("Let's make something clear", "ጥርት ያለ ነገር አብረን እንሥራ"),
          body: t("One conversation is enough to know if we fit.", "መስማማታችንን ለማወቅ አንድ ውይይት ይበቃል።"),
          primaryAction: start,
          secondaryAction: seeWork,
        },
      ],
    },
    {
      path: "/contact",
      title: t("Contact", "ያግኙኝ"),
      nav: t("Contact", "ያግኙኝ"),
      description: t("Call, write on Telegram or send a message to Hana Bekele about your project.", "ስለ ሥራዎ ለሀና በቀለ ይደውሉ፣ በቴሌግራም ይጻፉ ወይም መልእክት ይላኩ።"),
      sections: [
        {
          type: "contact",
          heading: t("Say hello", "ሰላም ይበሉኝ"),
          intro: t("Telegram is fastest. I answer calls on weekdays and meet by appointment anywhere in Addis.", "ፈጣኑ መንገድ ቴሌግራም ነው። በሥራ ቀናት ስልክ እመልሳለሁ፤ በቀጠሮ በአዲስ አበባ የትም እንገናኛለን።"),
        },
        {
          type: "form",
          id: "message",
          kind: "contact",
          heading: t("Send a message", "መልእክት ይላኩ"),
          intro: t("For a quick question, a talk invitation or anything that is not a project yet.", "ለአጭር ጥያቄ፣ ለንግግር ግብዣ ወይም ገና ሥራ ላልሆነ ማንኛውም ነገር።"),
          fields: [
            { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
            { name: "phone", label: t("Phone or Telegram", "ስልክ ወይም ቴሌግራም"), type: "tel", required: true },
            { name: "message", label: t("Message", "መልእክት"), type: "textarea", required: true },
          ],
          submitLabel: t("Send", "ላክ"),
          successMessage: t("Thank you. I will answer soon.", "አመሰግናለሁ። በቅርቡ እመልሳለሁ።"),
        },
        {
          type: "faq",
          heading: t("Before you write", "ከመጻፍዎ በፊት"),
          items: [
            { question: t("How long does a project take?", "አንድ ሥራ ምን ያህል ጊዜ ይወስዳል?"), answer: t("A brand identity takes four to six weeks, a website six to eight. You get the dates before we start.", "የብራንድ መለያ ከአራት እስከ ስድስት ሳምንት፣ ድረገጽ ከስድስት እስከ ስምንት ሳምንት ይወስዳል። ቀኖቹን ከመጀመራችን በፊት ያውቃሉ።") },
            { question: t("How do I pay?", "ክፍያ እንዴት ነው?"), answer: t("Half to start and half on delivery, by bank transfer or Telebirr, in Birr.", "ግማሹ ሲጀመር፣ ግማሹ ሲረከቡ፤ በባንክ ዝውውር ወይም በቴሌብር፣ በብር።") },
            { question: t("Can I ask for changes?", "ለውጥ መጠየቅ እችላለሁ?"), answer: t("Yes. Every stage includes two rounds of changes, and we agree on anything more together.", "አዎ። በእያንዳንዱ ደረጃ ሁለት ዙር ማስተካከያ ተካትቷል፤ ከዚያ በላይ ካስፈለገ አብረን እንስማማለን።") },
            { question: t("Do you work outside Addis Ababa?", "ከአዲስ አበባ ውጭ ይሠራሉ?"), answer: t("Yes. Most of the work happens on Telegram and video calls.", "አዎ። አብዛኛው ሥራ በቴሌግራምና በቪዲዮ ጥሪ ይከናወናል።") },
          ],
        },
        {
          type: "cta",
          heading: t("Ready when you are", "እርስዎ ሲዘጋጁ እኔ ዝግጁ ነኝ"),
          primaryAction: start,
          secondaryAction: link("Call me", "ይደውሉልኝ", "tel:+251911000000"),
        },
      ],
    },
  ],
});
