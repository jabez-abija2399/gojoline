import { t, img, link, birr, save } from "./lib.mjs";

// Bakery and cake shop. Art direction "organic" (docs/research/new-templates-design-plan.md):
// round shapes, pill labels on Meskel yellow, scalloped edges, a turning stamp, cakes with sizes
// and prices, holiday order-by dates, ordering for family from abroad.
const order = link("Order a cake", "ኬክ ይዘዙ", "/order");
const cakes = link("See our cakes", "ኬኮቻችንን ይመልከቱ", "/cakes");

const P = {
  layered: img("bakery-hero-layered-flower-cake", "A tall layered cake with cream between the layers and fresh flowers on top", "በንብርብሮቹ መካከል ክሬም ያለውና በላዩ ትኩስ አበባ የተደረገበት ረጅም ኬክ"),
  counter: img("bakery-hero-bakery-counter-cakes", "A bakery counter with whole cakes on glass stands", "ሙሉ ኬኮች በመስታወት መቆሚያዎች ላይ ያሉበት የዳቦ ቤት መደርደሪያ"),
  baker: img("bakery-about-baker-shaping-dough", "A baker's hands shaping balls of dough on a floured table", "ዱቄት በተነሰነሰበት ጠረጴዛ ላይ ሊጥ የሚያድቦለቡሉ የጋጋሪ እጆች"),
  birthday: img("bakery-card-birthday-cake-sparkler", "A chocolate layer cake with a sparkler on top", "በላዩ ብልጭታ ያለው የቸኮሌት ንብርብር ኬክ"),
  forest: img("bakery-card-black-forest-cake", "A black forest cake topped with cherries and chocolate", "በቼሪና በቸኮሌት ያጌጠ ብላክ ፎረስት ኬክ"),
  croissants: img("bakery-card-croissants", "Golden croissants cooling on a wire rack", "በሽቦ መደርደሪያ ላይ የሚቀዘቅዙ ወርቃማ ክሮሳንቶች"),
  bread: img("bakery-card-fresh-bread-loaves", "Round loaves of fresh bread in a basket", "በቅርጫት ውስጥ ያሉ ክብ ትኩስ ዳቦዎች"),
  wedding: img("bakery-card-white-tiered-wedding-cake", "A white three-tier wedding cake with sugar flowers", "የስኳር አበቦች ያሉት ባለ ሦስት ደረጃ ነጭ የሠርግ ኬክ"),
  slice: img("bakery-gallery-cake-slice", "A slice of vanilla cake on a white plate", "በነጭ ሳህን ላይ ያለ የቫኒላ ኬክ ቁራጭ"),
  cupcakes: img("bakery-gallery-cupcakes", "Cupcakes with swirls of cream and chocolate on a wooden board", "በእንጨት ሳንቃ ላይ ክሬምና ቸኮሌት ያላቸው ካፕኬኮች"),
};

const cakeCards = [
  { image: P.forest, title: t("Black forest", "ብላክ ፎረስት"), subtitle: t("Our best seller", "በብዛት የሚሸጠው"), meta: [t("20 cm · 12 people", "20 ሳ.ሜ · 12 ሰው"), t("26 cm · 20 people", "26 ሳ.ሜ · 20 ሰው")], price: birr(1800), priceNote: t("from", "ጀምሮ"), action: order },
  { image: P.birthday, title: t("Chocolate birthday cake", "የቸኮሌት የልደት ኬክ"), subtitle: t("Your message on top", "መልእክትዎ በላዩ ላይ"), meta: [t("20 cm · 12 people", "20 ሳ.ሜ · 12 ሰው"), t("Name and age", "ስምና ዕድሜ")], price: birr(1600), priceNote: t("from", "ጀምሮ"), action: order },
  { image: P.wedding, title: t("Wedding cake, three tiers", "ባለ ሦስት ደረጃ የሠርግ ኬክ"), subtitle: t("For 80 to 150 guests", "ከ80 እስከ 150 እንግዶች"), meta: [t("Tasting first", "መጀመሪያ ቅምሻ"), t("Order 2 weeks ahead", "ከ2 ሳምንት በፊት ይዘዙ")], price: birr(12000), priceNote: t("from", "ጀምሮ"), action: order },
];

const orderForm = {
  type: "form",
  id: "order",
  kind: "order",
  heading: t("Order a cake", "ኬክ ይዘዙ"),
  intro: t("Pick a date at least two days ahead. We confirm the price on Telegram within the hour.", "ቢያንስ ከሁለት ቀን በፊት ቀን ይምረጡ። ዋጋውን በአንድ ሰዓት ውስጥ በቴሌግራም እናረጋግጣለን።"),
  fields: [
    { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
    { name: "phone", label: t("Phone or Telegram", "ስልክ ወይም ቴሌግራም"), type: "tel", required: true },
    { name: "cake", label: t("Which cake?", "የትኛው ኬክ?"), type: "select", required: true, options: [t("Black forest", "ብላክ ፎረስት"), t("Chocolate birthday cake", "የቸኮሌት የልደት ኬክ"), t("Wedding cake", "የሠርግ ኬክ"), t("Something else", "ሌላ")] },
    { name: "size", label: t("For how many people?", "ለስንት ሰው?"), type: "number" },
    { name: "date", label: t("Date", "ቀን"), type: "date", required: true },
    { name: "message", label: t("Message on the cake", "በኬኩ ላይ የሚጻፈው"), type: "text" },
  ],
  submitLabel: t("Send my order", "ትዕዛዜን ላክ"),
  successMessage: t("Thank you. We will confirm your cake on Telegram shortly.", "እናመሰግናለን። ኬክዎን በቅርቡ በቴሌግራም እናረጋግጣለን።"),
};

save("bakery", {
  name: t("Lidya Cakes", "ሊዲያ ኬክ"),
  tagline: t("Cakes for every celebration and bread every morning, in Bole, Addis Ababa", "ለየበዓሉ ኬክና በየማለዳው ዳቦ፣ ቦሌ፣ አዲስ አበባ"),
  languages: ["en", "am"],
  theme: { primary: "#A3324B", accent: "#2E1D17", background: "#FFF8F0", text: "#2E1D17", highlight: "#F2C14E", font: "classic", radius: "large", style: "organic" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Bole Medhanialem, behind the church, Addis Ababa", "ቦሌ መድኃኔዓለም፣ ከቤተ ክርስቲያኑ ጀርባ፣ አዲስ አበባ"),
    hours: [{ days: t("Every day", "በየቀኑ"), time: t("6:30 am to 9:00 pm", "ከጠዋቱ 12:30 እስከ ምሽቱ 3 ሰዓት") }],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Celebration cakes made to order and fresh bread every morning in Bole, Addis Ababa. Order for a date, collect or have it delivered.", "በቦሌ፣ አዲስ አበባ በትዕዛዝ የሚሠሩ የበዓል ኬኮችና በየማለዳው ትኩስ ዳቦ። ለአንድ ቀን ይዘዙ፤ ይውሰዱ ወይም እናድርስ።"),
      sections: [
        {
          type: "hero",
          variant: "split",
          id: "top",
          eyebrow: t("Baked fresh in Bole", "በቦሌ ትኩስ የተጋገረ"),
          heading: t("Cakes for every celebration", "ለየበዓሉ የሚሆን ኬክ"),
          subheading: t("Birthdays, weddings and holidays, made to order. Fresh bread and pastries every morning from half past six.", "ልደት፣ ሠርግና በዓል፣ በትዕዛዝ። ትኩስ ዳቦና ኬክ በየማለዳው ከ12:30 ጀምሮ።"),
          image: P.layered,
          stamp: t("Order two days ahead · Bole · ", "ከሁለት ቀን በፊት ይዘዙ · ቦሌ · "),
          primaryAction: order,
          secondaryAction: cakes,
        },
        {
          type: "marquee",
          id: "holidays",
          tone: "primary",
          items: [t("Genna", "ገና"), t("Timkat", "ጥምቀት"), t("Fasika", "ፋሲካ"), t("Eid", "ዒድ"), t("Enkutatash", "እንቁጣጣሽ"), t("Birthdays", "ልደት"), t("Weddings", "ሠርግ")],
        },
        {
          type: "cards",
          id: "cakes",
          layout: "grid",
          eyebrow: t("Celebration cakes", "የበዓል ኬኮች"),
          heading: t("Pick your cake", "ኬክዎን ይምረጡ"),
          intro: t("Sizes and prices in Birr. Every cake can carry your message.", "መጠንና ዋጋ በብር። ሁሉም ኬክ መልእክትዎን ይይዛል።"),
          items: cakeCards,
          action: cakes,
        },
        {
          type: "menu",
          id: "today",
          eyebrow: t("From six thirty", "ከ12:30 ጀምሮ"),
          heading: t("Fresh every morning", "በየማለዳው ትኩስ"),
          categories: [
            {
              name: t("Bread and pastries", "ዳቦና ኬክ"),
              items: [
                { name: t("Croissant", "ክሮሳንት"), price: birr(70), image: P.croissants, tag: t("Warm at 7", "1 ሰዓት ላይ ትኩስ") },
                { name: t("Round loaf", "ክብ ዳቦ"), price: birr(90), image: P.bread },
                { name: t("Cupcake", "ካፕኬክ"), price: birr(80), image: P.cupcakes },
                { name: t("Slice of cake", "ቁራጭ ኬክ"), price: birr(150), image: P.slice },
              ],
            },
          ],
        },
        {
          type: "steps",
          id: "how",
          eyebrow: t("How to order", "እንዴት ይታዘዛል"),
          heading: t("Your cake in four steps", "ኬክዎ በአራት ደረጃ"),
          items: [
            { title: t("Pick a cake and a date", "ኬክና ቀን ይምረጡ"), description: t("At least two days ahead; two weeks for weddings.", "ቢያንስ ከሁለት ቀን በፊት፤ ለሠርግ ከሁለት ሳምንት በፊት።") },
            { title: t("We confirm on Telegram", "በቴሌግራም እናረጋግጣለን"), description: t("With the price, within the hour.", "ከዋጋው ጋር፣ በአንድ ሰዓት ውስጥ።") },
            { title: t("Pay half to hold it", "ለማስያዝ ግማሹን ይክፈሉ"), description: t("Telebirr or bank transfer.", "በቴሌብር ወይም በባንክ።") },
            { title: t("Collect or delivered", "ይውሰዱ ወይም እናድርስ"), description: t("Anywhere in Addis Ababa.", "በአዲስ አበባ ውስጥ የትም።") },
          ],
          action: order,
        },
        {
          type: "about",
          id: "abroad",
          eyebrow: t("For family far away", "ከሩቅ ላሉ ቤተሰቦች"),
          heading: t("Send a cake home from abroad", "ከውጭ ሆነው ወደ ቤት ኬክ ይላኩ"),
          body: t("Order here from anywhere, and we deliver to your family in Addis with a photo when it arrives. Many of our birthday cakes are ordered from Washington, Dubai and London.", "ከየትም ሆነው እዚህ ይዘዙ፤ ለቤተሰብዎ አዲስ አበባ ውስጥ እናደርሳለን፣ ሲደርስም ፎቶ እንልካለን። ብዙ የልደት ኬኮቻችን ከዋሽንግተን፣ ከዱባይና ከለንደን ይታዘዛሉ።"),
          image: P.baker,
          imageShape: "arch",
          points: [t("Delivery with a photo", "ከፎቶ ጋር ማድረስ"), t("Pay by card from abroad through family, or bank transfer", "ከውጭ በቤተሰብ በኩል ወይም በባንክ ዝውውር ይክፈሉ")],
          action: order,
        },
        {
          type: "gallery",
          id: "made",
          layout: "prints",
          eyebrow: t("Made this week", "በዚህ ሳምንት የተሠሩ"),
          heading: t("Straight from our oven", "ከምድጃችን የወጡ"),
          images: [P.counter, P.cupcakes, P.wedding],
        },
        {
          type: "testimonials",
          id: "words",
          eyebrow: t("Customers say", "ደንበኞች ምን ይላሉ"),
          heading: t("Sweet words", "ጣፋጭ ቃላት"),
          items: [
            { quote: t("I ordered my mother's birthday cake from Dubai. They sent me a photo of her holding it.", "የእናቴን የልደት ኬክ ከዱባይ አዘዝኩ። ኬኩን ይዛ ፎቶ ላኩልኝ።"), name: "Tsega W.", role: t("Birthday cake from Dubai", "የልደት ኬክ ከዱባይ") },
            { quote: t("The black forest was the first thing gone at our Genna lunch.", "በገና ምሳችን ቀድሞ ያለቀው ብላክ ፎረስቱ ነበር።"), name: "Abel K.", role: t("Holiday order", "የበዓል ትዕዛዝ") },
          ],
        },
        {
          type: "cta",
          id: "end",
          heading: t("Genna is coming", "ገና እየመጣ ነው"),
          body: t("Holiday cakes sell out: order by 4 January.", "የበዓል ኬኮች ያልቃሉ፤ እስከ ታኅሣሥ 26 ይዘዙ።"),
          image: P.forest,
          primaryAction: order,
          secondaryAction: cakes,
        },
      ],
    },
    {
      path: "/cakes",
      title: t("Cakes", "ኬኮች"),
      nav: t("Cakes", "ኬኮች"),
      description: t("Celebration cakes from Lidya Cakes with sizes and prices in Birr: birthday, black forest and wedding cakes, made to order.", "የሊዲያ ኬክ የበዓል ኬኮች ከመጠንና ከዋጋ ጋር በብር፦ የልደት፣ ብላክ ፎረስትና የሠርግ ኬኮች፣ በትዕዛዝ።"),
      sections: [
        { type: "cards", id: "all", layout: "grid", eyebrow: t("Made to order", "በትዕዛዝ"), heading: t("All our cakes", "ሁሉም ኬኮቻችን"), intro: t("Prices in Birr. Other sizes and flavours on request.", "ዋጋ በብር። ሌላ መጠንና ጣዕም ሲጠየቅ።"), items: cakeCards },
        {
          type: "faq",
          id: "questions",
          heading: t("Questions about cakes", "ስለ ኬኮች ጥያቄዎች"),
          items: [
            { question: t("Do you make fasting cakes?", "የጾም ኬክ ትሠራላችሁ?"), answer: t("Yes, without eggs or butter, for the fasting seasons. Ask when you order.", "አዎ፣ ያለ እንቁላልና ቅቤ፣ ለጾም ወቅቶች። ሲያዝዙ ይጠይቁ።") },
            { question: t("How far ahead should I order?", "ምን ያህል ቀድሜ ማዘዝ አለብኝ?"), answer: t("Two days for most cakes, two weeks for weddings, and earlier before holidays.", "ለአብዛኞቹ ኬኮች ሁለት ቀን፣ ለሠርግ ሁለት ሳምንት፣ ከበዓላት በፊት ቀደም ብለው።") },
            { question: t("Do you deliver?", "ታደርሳላችሁ?"), answer: t("Yes, anywhere in Addis Ababa. The fee depends on the distance.", "አዎ፣ በአዲስ አበባ ውስጥ የትም። ክፍያው እንደ ርቀቱ ነው።") },
          ],
        },
      ],
    },
    {
      path: "/order",
      title: t("Order", "ይዘዙ"),
      nav: t("Order", "ይዘዙ"),
      description: t("Order a cake from Lidya Cakes for a date of your choice, from Addis or abroad.", "ከሊዲያ ኬክ ለመረጡት ቀን ኬክ ይዘዙ፤ ከአዲስ አበባም ከውጭም።"),
      sections: [orderForm],
    },
    {
      path: "/visit",
      title: t("Visit", "ይጎብኙን"),
      nav: t("Visit", "ይጎብኙን"),
      description: t("Visit Lidya Cakes in Bole Medhanialem, Addis Ababa: opening hours and directions.", "ሊዲያ ኬክን በቦሌ መድኃኔዓለም ይጎብኙ፦ የሥራ ሰዓትና አቅጣጫ።"),
      sections: [
        { type: "contact", id: "contact", heading: t("Come for coffee and cake", "ለቡናና ለኬክ ይምጡ"), intro: t("Fresh bread from half past six every morning.", "በየማለዳው ከ12:30 ጀምሮ ትኩስ ዳቦ።") },
        { type: "map", id: "map", heading: t("Find us in Bole", "በቦሌ ያግኙን"), query: "Bole Medhanialem, Addis Ababa" },
      ],
    },
  ],
});
