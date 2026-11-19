import { t, img, link, birr, save } from "./lib.mjs";

// Wedding photographer and studio. Art direction "cinematic" (docs/research/new-templates-design-plan.md):
// a full-screen photo, sections numbered as chapters, galleries in the dark, prints laid askew,
// packages side by side, a date-availability enquiry for couples at home and abroad.
const ask = link("Is my date free?", "ቀኔ ክፍት ነው?", "/book");
const work = link("See weddings", "ሠርጎችን ይመልከቱ", "/weddings");
const packages = link("Packages", "ፓኬጆች", "/packages");

const P = {
  bride: img("studio-hero-habesha-bride-cathedral", "A bride in a white embroidered habesha dress and her groom under a flower arch outside a cathedral", "ጥልፍ ያለው ነጭ የሀበሻ ቀሚስ የለበሰች ሙሽሪትና ሙሽራው ከካቴድራል ውጭ በአበባ ቅስት ሥር"),
  garden: img("studio-hero-couple-embrace-garden", "A couple embracing in a green garden", "በአረንጓዴ የአትክልት ቦታ ውስጥ የተቃቀፉ ጥንዶች"),
  photographer: img("studio-about-photographer-at-work", "A photographer looking through her camera at work", "ፎቶ አንሺ በካሜራዋ ስትሠራ"),
  dancing: img("studio-card-couple-dancing", "A bride and groom dancing at their reception", "ሙሽሪትና ሙሽራው በግብዣቸው ላይ ሲጨፍሩ"),
  addis: img("studio-card-couple-portrait-addis", "A young couple in white standing together in Addis Ababa", "ነጭ የለበሱ ወጣት ጥንዶች በአዲስ አበባ"),
  guests: img("studio-card-guests-celebrating", "Wedding guests celebrating at night", "ማታ የሚደሰቱ የሠርግ እንግዶች"),
  rings: img("studio-card-hands-wedding-rings", "A couple's hands with their wedding rings", "የጋብቻ ቀለበት ያደረጉ የጥንዶች እጆች"),
  decor: img("studio-card-reception-floral-decor", "A reception hall with round tables and pale flowers", "ክብ ጠረጴዛዎችና ነጣ ያሉ አበቦች ያሉት የግብዣ አዳራሽ"),
  ready: img("studio-gallery-bride-getting-ready", "A bride holding white flowers by a window", "ነጭ አበባ የያዘች ሙሽሪት በመስኮት አጠገብ"),
  table: img("studio-gallery-decorated-table", "A long decorated table with flowers and candles", "አበባና ሻማ ያጌጠ ረጅም ጠረጴዛ"),
};

const tiers = [
  { title: t("Melse", "መልስ"), subtitle: t("The day after", "ከሠርጉ ማግስት"), price: birr(25000), priceNote: t("from", "ጀምሮ"), meta: [t("4 hours, one photographer", "4 ሰዓት፣ አንድ ፎቶ አንሺ"), t("150 edited photos", "150 የተስተካከሉ ፎቶዎች"), t("Online gallery", "የመስመር ላይ ጋለሪ")], action: ask },
  { title: t("Wedding day", "የሠርጉ ዕለት"), subtitle: t("From getting ready to the last dance", "ከዝግጅት እስከ መጨረሻው ጭፈራ"), badge: t("Most chosen", "በብዛት የሚመረጥ"), price: birr(65000), priceNote: t("from", "ጀምሮ"), meta: [t("Two photographers", "ሁለት ፎቶ አንሺዎች"), t("Film of the day", "የዕለቱ ቪዲዮ"), t("400 edited photos", "400 የተስተካከሉ ፎቶዎች"), t("A printed album", "የታተመ አልበም")], action: ask },
  { title: t("The full story", "ሙሉ ታሪኩ"), subtitle: t("Wedding, melse and kelekel", "ሠርግ፣ መልስና ቅልቅል"), price: birr(110000), priceNote: t("from", "ጀምሮ"), meta: [t("Three days covered", "ሦስት ቀን"), t("Drone and film", "ድሮንና ቪዲዮ"), t("Two albums for the families", "ለቤተሰቦች ሁለት አልበም")], action: ask },
];

const bookForm = {
  type: "form",
  id: "date",
  kind: "booking",
  heading: t("Is my date free?", "ቀኔ ክፍት ነው?"),
  intro: t("We take one wedding a day. Tell us your date and we answer on Telegram the same day.", "በቀን አንድ ሠርግ ብቻ እንይዛለን። ቀናችሁን ንገሩን፤ በዕለቱ በቴሌግራም እንመልሳለን።"),
  fields: [
    { name: "names", label: t("Your names", "ስማችሁ"), type: "text", required: true },
    { name: "phone", label: t("Phone or Telegram", "ስልክ ወይም ቴሌግራም"), type: "tel", required: true },
    { name: "date", label: t("Wedding date", "የሠርጉ ቀን"), type: "date", required: true },
    { name: "place", label: t("Where", "የት"), type: "text" },
    { name: "package", label: t("Package", "ፓኬጅ"), type: "select", options: [t("Melse", "መልስ"), t("Wedding day", "የሠርጉ ዕለት"), t("The full story", "ሙሉ ታሪኩ"), t("Not sure yet", "ገና አልወሰንንም")] },
    { name: "country", label: t("Country, if you live abroad", "በውጭ የምትኖሩ ከሆነ አገር"), type: "text" },
  ],
  submitLabel: t("Ask about our date", "ስለ ቀናችን ጠይቅ"),
  successMessage: t("Thank you. We will tell you today if your date is free.", "እናመሰግናለን። ቀናችሁ ክፍት መሆኑን ዛሬ እንነግራችኋለን።"),
};

save("studio", {
  name: t("Meron Studio", "ሜሮን ስቱዲዮ"),
  tagline: t("Wedding photography and film in Addis Ababa and across Ethiopia", "የሠርግ ፎቶና ቪዲዮ በአዲስ አበባና በመላው ኢትዮጵያ"),
  languages: ["en", "am"],
  theme: { primary: "#8C5528", accent: "#14110F", background: "#F5F0E8", text: "#1A1714", highlight: "#B08D57", font: "editorial", radius: "none", style: "cinematic" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Kazanchis, 3rd floor, Addis Ababa", "ካዛንቺስ፣ 3ኛ ፎቅ፣ አዲስ አበባ"),
    hours: [{ days: t("Monday to Saturday", "ከሰኞ እስከ ቅዳሜ"), time: t("By appointment", "በቀጠሮ") }],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Wedding photography and film in Addis Ababa: the wedding day, melse and kelekel, with packages in Birr and dates for couples abroad.", "የሠርግ ፎቶና ቪዲዮ በአዲስ አበባ፦ የሠርግ ዕለት፣ መልስና ቅልቅል፤ ፓኬጆች በብር፤ በውጭ የሚኖሩ ጥንዶችም ቀን ማስያዝ ይችላሉ።"),
      sections: [
        {
          type: "hero",
          variant: "immersive",
          id: "top",
          eyebrow: t("Weddings in Addis Ababa and beyond", "ሠርጎች በአዲስ አበባና ከዚያም ባሻገር"),
          heading: t("Your day, told like a film", "ቀናችሁ፣ እንደ ፊልም"),
          subheading: t("Photography and film for the wedding, the melse and the kelekel.", "ለሠርግ፣ ለመልስና ለቅልቅል ፎቶና ቪዲዮ።"),
          image: P.bride,
          primaryAction: ask,
          secondaryAction: work,
        },
        {
          type: "gallery",
          id: "latest",
          layout: "prints",
          eyebrow: t("Latest weddings", "የቅርብ ሠርጎች"),
          heading: t("Hana and Yonas, Entoto", "ሐና እና ዮናስ፣ እንጦጦ"),
          images: [P.addis, P.rings, P.dancing, P.ready, P.decor, P.guests],
        },
        {
          type: "about",
          id: "us",
          eyebrow: t("Behind the camera", "ከካሜራው ጀርባ"),
          heading: t("We watch, and wait for the moment", "እንመለከታለን፣ ጊዜውን እንጠብቃለን"),
          body: t("We don't stage your day. We stay close, quiet and early, so the photos show how it felt: the laughter at the door, the songs, your mother's face.", "ቀናችሁን አናዘጋጅም። ቀርበን፣ በጸጥታና ቀድመን እንገኛለን፤ ፎቶዎቹ ስሜቱን እንዲያሳዩ፦ በሩ ላይ ያለውን ሳቅ፣ ዘፈኑን፣ የእናታችሁን ፊት።"),
          image: P.photographer,
          imageSide: "end",
        },
        {
          type: "cards",
          id: "packages",
          layout: "pricing",
          eyebrow: t("Packages", "ፓኬጆች"),
          heading: t("Choose how much of the story", "ከታሪኩ ምን ያህሉን ትፈልጋላችሁ?"),
          intro: t("Prices in Birr. Travel outside Addis is added at cost.", "ዋጋ በብር። ከአዲስ አበባ ውጭ ለሚደረግ ጉዞ ወጪው ይጨመራል።"),
          items: tiers,
        },
        {
          type: "steps",
          id: "how",
          eyebrow: t("How we work", "እንዴት እንሠራለን"),
          heading: t("From the first call to the album", "ከመጀመሪያው ጥሪ እስከ አልበሙ"),
          items: [
            { title: t("Ask about your date", "ስለ ቀናችሁ ጠይቁ"), description: t("We answer the same day.", "በዕለቱ እንመልሳለን።") },
            { title: t("Meet us, or call from abroad", "ተገናኙን፣ ወይም ከውጭ ደውሉ"), description: t("Coffee in Kazanchis or a video call.", "ቡና በካዛንቺስ ወይም የቪዲዮ ጥሪ።") },
            { title: t("Hold the date", "ቀኑን ያዙ"), description: t("Half when you book, by Telebirr or bank.", "ግማሹን ስትይዙ፣ በቴሌብር ወይም በባንክ።") },
            { title: t("Photos in three weeks", "ፎቶዎች በሦስት ሳምንት"), description: t("Online first, the album after.", "መጀመሪያ በመስመር ላይ፣ ከዚያ አልበሙ።") },
          ],
        },
        {
          type: "quote",
          id: "words",
          quote: t("They caught every moment of the kelekel, even the ones we missed.", "የቅልቅሉን እያንዳንዱን ጊዜ ያዙት፤ እኛ ያመለጡንንም ጭምር።"),
          name: t("Bethlehem and Samuel", "ቤተልሔምና ሳሙኤል"),
          role: t("Married in Addis, living in Toronto", "በአዲስ አበባ የተጋቡ፣ በቶሮንቶ የሚኖሩ"),
        },
        bookForm,
        {
          type: "cta",
          id: "end",
          heading: t("Weekends in January are filling", "የጥር ቅዳሜና እሑዶች እየሞሉ ነው"),
          body: t("We take one wedding a day.", "በቀን አንድ ሠርግ ብቻ እንይዛለን።"),
          image: P.garden,
          primaryAction: ask,
          secondaryAction: packages,
        },
      ],
    },
    {
      path: "/weddings",
      title: t("Weddings", "ሠርጎች"),
      nav: t("Weddings", "ሠርጎች"),
      description: t("Weddings photographed by Meron Studio in Addis Ababa and across Ethiopia.", "በሜሮን ስቱዲዮ በአዲስ አበባና በመላው ኢትዮጵያ የተነሱ ሠርጎች።"),
      sections: [
        { type: "gallery", id: "all", layout: "wall", eyebrow: t("Weddings", "ሠርጎች"), heading: t("Couples we have filmed", "ያነሳናቸው ጥንዶች"), images: [P.bride, P.addis, P.dancing, P.rings, P.ready, P.guests, P.table, P.decor] },
        { type: "cta", id: "ask", heading: t("Want this for your day?", "ለቀናችሁ ይህን ትፈልጋላችሁ?"), primaryAction: ask, secondaryAction: packages },
      ],
    },
    {
      path: "/packages",
      title: t("Packages", "ፓኬጆች"),
      nav: t("Packages", "ፓኬጆች"),
      description: t("Wedding photography packages from Meron Studio with prices in Birr: melse, wedding day and the full story.", "የሜሮን ስቱዲዮ የሠርግ ፎቶ ፓኬጆች ከዋጋ ጋር በብር፦ መልስ፣ የሠርግ ዕለትና ሙሉ ታሪኩ።"),
      sections: [
        { type: "cards", id: "plans", layout: "pricing", eyebrow: t("Packages", "ፓኬጆች"), heading: t("Every package, every price", "ሁሉም ፓኬጆች፣ ሁሉም ዋጋዎች"), items: tiers },
        {
          type: "faq",
          id: "questions",
          heading: t("Before you book", "ከመያዛችሁ በፊት"),
          items: [
            { question: t("We live abroad. Can we book?", "በውጭ እንኖራለን። መያዝ እንችላለን?"), answer: t("Yes. Most of our couples plan from abroad: we meet on video and family can pay in Birr.", "አዎ። አብዛኞቹ ጥንዶቻችን ከውጭ ሆነው ያቅዳሉ፤ በቪዲዮ እንገናኛለን፣ ቤተሰብም በብር ሊከፍል ይችላል።") },
            { question: t("Do you travel outside Addis?", "ከአዲስ አበባ ውጭ ትሄዳላችሁ?"), answer: t("Yes: Bahir Dar, Hawassa, Gondar and further. Travel is added at cost.", "አዎ፦ ባሕር ዳር፣ ሐዋሳ፣ ጎንደርና ከዚያም ባሻገር። የጉዞ ወጪ ይጨመራል።") },
            { question: t("When do we get the photos?", "ፎቶዎቹን መቼ እናገኛለን?"), answer: t("An online gallery in three weeks, the album about a month later.", "የመስመር ላይ ጋለሪ በሦስት ሳምንት፣ አልበሙ ከአንድ ወር ያህል በኋላ።") },
          ],
        },
      ],
    },
    {
      path: "/book",
      title: t("Book", "ቀጠሮ"),
      nav: t("Book", "ቀጠሮ"),
      description: t("Ask Meron Studio whether your wedding date is free.", "የሠርጋችሁ ቀን ክፍት መሆኑን ሜሮን ስቱዲዮን ጠይቁ።"),
      sections: [{ ...bookForm, id: "date-book" }, { type: "contact", id: "contact", heading: t("Or write to us", "ወይም ጻፉልን"), intro: t("Telegram is the quickest way to reach us.", "በፍጥነት የምታገኙን በቴሌግራም ነው።") }],
    },
  ],
});
