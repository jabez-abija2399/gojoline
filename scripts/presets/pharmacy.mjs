import { t, img, link, birr, save } from "./lib.mjs";

// Community pharmacy. Art direction "calm" (docs/research/new-templates-design-plan.md): quiet,
// spacious, hairlines. Rules (Proclamation 1112/2019, Art. 59): no medicine names, brands or
// prices anywhere; the EFDA licence, outlet type and responsible pharmacist are shown;
// prescriptions go by Telegram, never stored on the site.
const ask = link("Ask if it's in stock", "መኖሩን ይጠይቁ", "/ask");
const call = link("Call the pharmacy", "ይደውሉልን", "tel:+251911000000");

const P = {
  counter: img("pharmacy-hero-pharmacist-counter-customer", "A pharmacist at the counter talking with a customer", "ፋርማሲስት በመደርደሪያው ከደንበኛ ጋር ሲነጋገር"),
  lagos: img("pharmacy-hero-lagos-pharmacy-customers", "Two people looking at a box together in a pharmacy", "በፋርማሲ ውስጥ አንድ ሳጥን አብረው የሚመለከቱ ሁለት ሰዎች"),
  pharmacist: img("pharmacy-about-smiling-pharmacist-white-coat", "A smiling woman in a white coat", "ነጭ ጋዋን የለበሰች ፈገግተኛ ሴት"),
  pressure: img("pharmacy-card-blood-pressure-check", "A health worker checking a woman's blood pressure", "የጤና ባለሙያ የአንዲት ሴትን የደም ግፊት ሲለካ"),
  sugar: img("pharmacy-card-blood-sugar-test", "A finger-prick blood sugar test with a small meter", "በትንሽ መለኪያ የሚደረግ የስኳር ምርመራ"),
  advice: img("pharmacy-card-pharmacist-advice", "A pharmacist explaining something to a customer", "ፋርማሲስት ለደንበኛ ሲያስረዳ"),
  courier: img("pharmacy-card-delivery-courier", "A courier carrying a paper bag", "የወረቀት ቦርሳ የያዘ መልእክተኛ"),
  shelves: img("pharmacy-gallery-shelves-soft-focus", "Pharmacy shelves, softly out of focus", "የፋርማሲ መደርደሪያዎች፣ ደብዘዝ ብለው"),
  interior: img("pharmacy-gallery-pharmacy-interior", "A quiet pharmacy interior with wooden cabinets", "የእንጨት ቁም ሣጥኖች ያሉት ጸጥ ያለ የፋርማሲ ውስጥ"),
};

const askForm = {
  type: "form",
  id: "ask",
  kind: "contact",
  heading: t("Ask if it's in stock", "መኖሩን ይጠይቁ"),
  intro: t("Tell us what you are looking for. The pharmacist answers by phone or Telegram, usually within half an hour.", "የሚፈልጉትን ይንገሩን። ፋርማሲስቱ በስልክ ወይም በቴሌግራም ብዙ ጊዜ በግማሽ ሰዓት ውስጥ ይመልሳል።"),
  fields: [
    { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
    { name: "phone", label: t("Phone", "ስልክ"), type: "tel", required: true },
    { name: "need", label: t("What are you looking for?", "ምን ይፈልጋሉ?"), type: "textarea", required: true },
    { name: "delivery", label: t("Pick up or delivery?", "ይወስዳሉ ወይስ እናድርስ?"), type: "select", options: [t("I will pick it up", "እወስዳለሁ"), t("Please deliver", "እባክዎ ያድርሱ")] },
  ],
  submitLabel: t("Ask the pharmacist", "ፋርማሲስቱን ይጠይቁ"),
  successMessage: t("Thank you. The pharmacist will call you shortly.", "እናመሰግናለን። ፋርማሲስቱ በቅርቡ ይደውልልዎታል።"),
};

const licence = {
  type: "about",
  id: "licence",
  eyebrow: t("Licensed pharmacy", "ፈቃድ ያለው ፋርማሲ"),
  heading: t("Your pharmacist", "ፋርማሲስትዎ"),
  body: t("A registered pharmacist is here every hour we are open, to answer questions in private and help you choose. Ask us anything: there is a quiet corner for it.", "ክፍት በሆንንበት ሰዓት ሁሉ የተመዘገበ ፋርማሲስት አለ፤ ጥያቄዎችን በግል ይመልሳል፣ እንዲመርጡም ያግዛል። ማንኛውንም ይጠይቁን፤ ለዚህ የተዘጋጀ ጸጥ ያለ ቦታ አለ።"),
  image: P.pharmacist,
  imageSide: "end",
  points: [t("Responsible pharmacist: [name], B.Pharm", "ኃላፊ ፋርማሲስት፦ [ስም]፣ ቢ.ፋርም"), t("EFDA licence: [your licence number]", "የኢፍዳ ፈቃድ፦ [የፈቃድ ቁጥርዎ]"), t("Outlet type: retail pharmacy", "የተቋም ዓይነት፦ የችርቻሮ ፋርማሲ")],
};

save("pharmacy", {
  name: t("Kidist Pharmacy", "ቅድስት ፋርማሲ"),
  tagline: t("Your neighbourhood pharmacy in Gerji, Addis Ababa", "በገርጂ፣ አዲስ አበባ የሰፈርዎ ፋርማሲ"),
  languages: ["en", "am"],
  theme: { primary: "#12703B", accent: "#10201A", background: "#F6FAF7", text: "#10201A", highlight: "#F4B731", font: "modern", radius: "small", style: "calm" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Gerji, Mebrat Hail road, Addis Ababa", "ገርጂ፣ መብራት ኃይል መንገድ፣ አዲስ አበባ"),
    hours: [
      { days: t("Every day", "በየቀኑ"), time: t("7:00 am to 10:00 pm", "ከጠዋቱ 1 እስከ ምሽቱ 4 ሰዓት") },
      { days: t("Night duty", "የሌሊት ተረኛ"), time: t("Saturdays, all night", "ቅዳሜ፣ ሌሊቱን ሙሉ") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Kidist Pharmacy in Gerji, Addis Ababa: open every day, night duty on Saturdays, blood pressure and sugar checks, advice from a registered pharmacist and home delivery.", "ቅድስት ፋርማሲ በገርጂ፣ አዲስ አበባ፦ በየቀኑ ክፍት፣ ቅዳሜ የሌሊት ተረኛ፣ የደም ግፊትና የስኳር ምርመራ፣ የተመዘገበ ፋርማሲስት ምክርና እስከ ቤት ማድረስ።"),
      sections: [
        {
          type: "hero",
          variant: "split",
          id: "top",
          eyebrow: t("Gerji · open every day", "ገርጂ · በየቀኑ ክፍት"),
          heading: t("Your neighbourhood pharmacy", "የሰፈርዎ ፋርማሲ"),
          subheading: t("A registered pharmacist every hour we are open, simple health checks, and delivery to your door.", "ክፍት በሆንንበት ሰዓት ሁሉ የተመዘገበ ፋርማሲስት፣ ቀላል የጤና ምርመራዎችና እስከ በርዎ ማድረስ።"),
          image: P.counter,
          primaryAction: ask,
          secondaryAction: call,
        },
        {
          type: "services",
          id: "services",
          variant: "numbered",
          eyebrow: t("What we do", "የምንሠራው"),
          heading: t("Care without a queue", "ያለ ወረፋ እንክብካቤ"),
          image: P.pressure,
          items: [
            { title: t("Blood pressure check", "የደም ግፊት መለካት"), description: t("Five minutes, at the counter. Free.", "አምስት ደቂቃ፣ በመደርደሪያው። በነጻ።") },
            { title: t("Blood sugar test", "የስኳር ምርመራ"), description: t("Results in a minute, with advice on what they mean.", "ውጤት በአንድ ደቂቃ፣ ትርጉሙን ከሚያስረዳ ምክር ጋር።"), price: birr(100) },
            { title: t("Advice in private", "በግል ምክር"), description: t("Questions about your treatment, side effects or what to buy for a child.", "ስለ ሕክምናዎ፣ ስለ ጎንዮሽ ጉዳት ወይም ለልጅ ስለሚገዛው ጥያቄዎች።") },
            { title: t("Home delivery", "እስከ ቤት ማድረስ"), description: t("Gerji, Bole and CMC, within two hours.", "ገርጂ፣ ቦሌና ሲኤምሲ፣ በሁለት ሰዓት ውስጥ።"), price: birr(80) },
          ],
        },
        {
          type: "steps",
          id: "how",
          eyebrow: t("Prescriptions", "የሐኪም ማዘዣ"),
          heading: t("Ready before you arrive", "ከመድረስዎ በፊት ዝግጁ"),
          intro: t("Send a photo of your prescription on Telegram. It stays between you and the pharmacist: this website never stores it.", "የማዘዣዎን ፎቶ በቴሌግራም ይላኩ። በእርስዎና በፋርማሲስቱ መካከል ይቀራል፤ ይህ ድረ-ገጽ ፈጽሞ አያስቀምጠውም።"),
          items: [
            { title: t("Send a photo on Telegram", "ፎቶ በቴሌግራም ይላኩ"), description: t("Or bring the paper.", "ወይም ወረቀቱን ይዘው ይምጡ።") },
            { title: t("We prepare it", "እናዘጋጃለን"), description: t("And call if something is missing.", "የጎደለ ካለም እንደውላለን።") },
            { title: t("Pick up or we deliver", "ይውሰዱ ወይም እናድርስ"), description: t("The pharmacist explains how to take it.", "ፋርማሲስቱ አወሳሰዱን ያስረዳል።") },
          ],
        },
        licence,
        askForm,
        {
          type: "faq",
          id: "questions",
          heading: t("Good to know", "ማወቅ ያለብዎ"),
          items: [
            { question: t("Are you open at night?", "ማታ ክፍት ናችሁ?"), answer: t("Until 10 pm every day, and all night on Saturdays when we are on night duty.", "በየቀኑ እስከ ምሽቱ 4 ሰዓት፣ ቅዳሜ የሌሊት ተረኛ ስንሆን ሌሊቱን ሙሉ።") },
            { question: t("Can I pay by Telebirr?", "በቴሌብር መክፈል እችላለሁ?"), answer: t("Yes, and by bank transfer or cash.", "አዎ፣ በባንክ ዝውውርና በጥሬ ገንዘብም።") },
            { question: t("Is my prescription kept private?", "ማዘዣዬ በምስጢር ይያዛል?"), answer: t("Yes. Only the pharmacist sees it, and the website never stores it.", "አዎ። የሚያየው ፋርማሲስቱ ብቻ ነው፤ ድረ-ገጹም ፈጽሞ አያስቀምጠውም።") },
          ],
        },
        { type: "map", id: "map", heading: t("Find us in Gerji", "በገርጂ ያግኙን"), query: "Gerji, Addis Ababa" },
      ],
    },
    {
      path: "/services",
      title: t("Services", "አገልግሎቶች"),
      nav: t("Services", "አገልግሎቶች"),
      description: t("Health checks, advice and delivery at Kidist Pharmacy in Gerji.", "በገርጂ በቅድስት ፋርማሲ የጤና ምርመራ፣ ምክርና ማድረስ።"),
      sections: [
        {
          type: "cards",
          id: "all",
          layout: "grid",
          eyebrow: t("Services", "አገልግሎቶች"),
          heading: t("Here for your everyday health", "ለዕለታዊ ጤናዎ"),
          items: [
            { image: P.pressure, title: t("Blood pressure check", "የደም ግፊት መለካት"), description: t("Free, at the counter, with a card to track your readings.", "በነጻ፣ በመደርደሪያው፣ ውጤቱን የሚመዘግቡበት ካርድ ጋር።") },
            { image: P.sugar, title: t("Blood sugar test", "የስኳር ምርመራ"), description: t("Results in a minute.", "ውጤት በአንድ ደቂቃ።"), price: birr(100) },
            { image: P.advice, title: t("Advice from the pharmacist", "የፋርማሲስት ምክር"), description: t("In private, free.", "በግል፣ በነጻ።") },
            { image: P.courier, title: t("Home delivery", "እስከ ቤት ማድረስ"), description: t("Within two hours nearby.", "በአቅራቢያ በሁለት ሰዓት ውስጥ።"), price: birr(80) },
          ],
        },
        licence,
      ],
    },
    {
      path: "/ask",
      title: t("Ask us", "ይጠይቁን"),
      nav: t("Ask us", "ይጠይቁን"),
      description: t("Ask Kidist Pharmacy whether something is in stock, or send a prescription on Telegram.", "ቅድስት ፋርማሲን አንድ ነገር መኖሩን ይጠይቁ፤ ወይም ማዘዣ በቴሌግራም ይላኩ።"),
      sections: [{ ...askForm, id: "ask-page" }, { type: "contact", id: "contact", heading: t("Or call or write", "ወይም ይደውሉ ወይም ይጻፉ"), intro: t("Prescriptions: send a photo on Telegram.", "ማዘዣ፦ ፎቶውን በቴሌግራም ይላኩ።") }],
    },
    {
      path: "/visit",
      title: t("Visit", "ይጎብኙን"),
      nav: t("Visit", "ይጎብኙን"),
      description: t("Opening hours, night duty and directions to Kidist Pharmacy in Gerji.", "የቅድስት ፋርማሲ የሥራ ሰዓት፣ የሌሊት ተረኛና አቅጣጫ፣ ገርጂ።"),
      sections: [
        { type: "contact", id: "visit-contact", heading: t("Open every day", "በየቀኑ ክፍት"), intro: t("Night duty on Saturdays.", "ቅዳሜ የሌሊት ተረኛ።") },
        { type: "gallery", id: "inside", layout: "mosaic", heading: t("Inside the pharmacy", "በፋርማሲው ውስጥ"), images: [P.interior, P.shelves, P.lagos] },
        { type: "map", id: "visit-map", heading: t("Find us in Gerji", "በገርጂ ያግኙን"), query: "Gerji, Addis Ababa" },
      ],
    },
  ],
});
