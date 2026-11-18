import { t, img, link, birr, save } from "./lib.mjs";

// Fashion: a habesha dress maker and boutique. Art direction "luxe" (docs/research/new-templates-design-plan.md):
// a poster hero with the name set across the photo's edge, hairlines instead of boxes, a woven
// tibeb band, prices in Birr and made-to-measure for families abroad.
const order = link("Order a dress", "ቀሚስ ይዘዙ", "/made-to-measure#order");
const collection = link("See the collection", "ስብስቡን ይመልከቱ", "/collection");
const measure = link("Made to measure", "በልክ ማሰፋት", "/made-to-measure");

const P = {
  rooftop: img("fashion-hero-kemis-woman-rooftop", "A woman in a white habesha kemis with a dark woven border on a rooftop above Addis Ababa", "ጥቁር ጥለት ያለው ነጭ የሀበሻ ቀሚስ የለበሰች ሴት፣ ከአዲስ አበባ በላይ ባለ ጣሪያ ላይ"),
  field: img("fashion-hero-kemis-woman-green-field", "A woman in a white habesha dress with a bright woven sash standing in a green field", "ደማቅ ጥለት ያለው መቀነት ያደረገች ነጭ የሀበሻ ቀሚስ የለበሰች ሴት፣ በአረንጓዴ መስክ ላይ"),
  weavers: img("fashion-about-handloom-weavers", "Weavers working at wooden hand looms with striped cloth drying beside them", "የተሸመኑ ባለ ጥለት ጨርቆች አጠገብ በእንጨት ሸማ ላይ የሚሠሩ ሸማኔዎች"),
  dress: img("fashion-card-habesha-dress-on-grass", "A young woman sitting on grass in a white habesha dress with green and red embroidery", "አረንጓዴና ቀይ ጥልፍ ያለው ነጭ የሀበሻ ቀሚስ ለብሳ በሣር ላይ የተቀመጠች ወጣት"),
  couple: img("fashion-card-couple-matching-outfits", "A couple in matching white traditional outfits with woven borders", "ጥለት ያላቸው ተመሳሳይ ነጭ የባህል ልብሶች የለበሱ ጥንዶች"),
  netela: img("fashion-card-netela-shawl", "A woman holding a white netela shawl with a woven border up to her face", "ጥለት ያለውን ነጭ ነጠላ ፊቷ ላይ የያዘች ሴት"),
  gabi: img("fashion-card-man-gabi-orange-wall", "A man wrapped in a white shawl with coloured stripes against an orange wall", "ባለቀለም መስመሮች ያሉት ነጭ ጋቢ የለበሰ ወንድ፣ በብርቱካናማ ግድግዳ ፊት"),
  tailor: img("fashion-card-tailor-measuring-client", "A tailor measuring a client's shoulders with a tape measure", "ልብስ ሰፊ የደንበኛውን ትከሻ በሜትር ሲለካ"),
  friends: img("fashion-gallery-two-friends-headbands", "Two friends in white traditional dresses with woven headbands", "ጥለት ያለው የራስ ማሰሪያ ያደረጉ፣ ነጭ የባህል ልብስ የለበሱ ሁለት ጓደኛሞች"),
  threads: img("fashion-gallery-loom-striped-threads", "Close-up of coloured threads stretched on a loom", "በሸማ ላይ የተወጠሩ ባለቀለም ክሮች በቅርበት"),
};

const size = (s) => t(s, s);
const toMeasure = t("Made to measure", "በልክ");
const sizes = [size("S"), size("M"), size("L"), size("XL"), toMeasure];

const pieces = [
  {
    image: P.dress,
    badge: t("Women", "ሴቶች"),
    title: t("Menen dress, green tibeb", "መነን ቀሚስ፣ አረንጓዴ ጥለት"),
    subtitle: t("Hand-woven cotton, embroidered front", "በእጅ የተሸመነ ጥጥ፣ ፊቱ የተጠለፈ"),
    meta: sizes,
    price: birr(8500),
    action: order,
  },
  {
    image: P.couple,
    badge: t("Couples", "ጥንዶች"),
    title: t("Couple set, gold border", "የጥንዶች ልብስ፣ የወርቅ ቀለም ጥለት"),
    subtitle: t("A dress and a matching shirt with gabi", "ቀሚስና ተመሳሳይ ሸሚዝ ከጋቢ ጋር"),
    meta: [toMeasure, t("4 weeks", "4 ሳምንት")],
    price: birr(16000),
    priceNote: t("for both", "ለሁለቱም"),
    action: order,
  },
  {
    image: P.netela,
    badge: t("Women", "ሴቶች"),
    title: t("Netela with a woven edge", "ጥለት ያለው ነጠላ"),
    subtitle: t("Light cotton for church and every day", "ለቤተ ክርስቲያንና ለዕለት ቀላል ጥጥ"),
    meta: [t("One size", "አንድ መጠን")],
    price: birr(1800),
    action: order,
  },
  {
    image: P.gabi,
    badge: t("Men", "ወንዶች"),
    title: t("Gabi with coloured stripes", "ባለቀለም መስመር ጋቢ"),
    subtitle: t("Thick, warm, woven in Shiro Meda", "ወፍራምና ሞቃት፣ በሽሮ ሜዳ የተሸመነ"),
    meta: [t("One size", "አንድ መጠን")],
    price: birr(3200),
    action: order,
  },
  {
    image: P.friends,
    badge: t("Women", "ሴቶች"),
    title: t("Holiday dress with headband", "የበዓል ቀሚስ ከራስ ማሰሪያ ጋር"),
    subtitle: t("For Timkat, Meskel and Enkutatash", "ለጥምቀት፣ ለመስቀልና ለእንቁጣጣሽ"),
    meta: sizes,
    price: birr(7200),
    action: order,
  },
  {
    image: P.field,
    badge: t("Women", "ሴቶች"),
    title: t("Wedding kemis with sash", "የሠርግ ቀሚስ ከመቀነት ጋር"),
    subtitle: t("Full tibeb, made for you", "ሙሉ ጥለት፣ ለእርስዎ የሚሰፋ"),
    meta: [toMeasure, t("4 to 6 weeks", "ከ4 እስከ 6 ሳምንት")],
    price: birr(14000),
    priceNote: t("from", "ጀምሮ"),
    action: order,
  },
];

const steps = {
  type: "steps",
  id: "how",
  eyebrow: t("Made to measure", "በልክ ማሰፋት"),
  heading: t("From your measurements to your door", "ከልኬትዎ እስከ ቤትዎ"),
  intro: t("Families abroad order this way every week. You never need to come to Addis.", "በውጭ የሚኖሩ ቤተሰቦች በየሳምንቱ በዚህ መንገድ ያዝዛሉ። ወደ አዲስ አበባ መምጣት አያስፈልግዎትም።"),
  items: [
    { title: t("Choose a style and fabric", "ዲዛይንና ጨርቅ ይምረጡ"), description: t("From the collection, or send us a photo of a dress you love.", "ከስብስቡ ይምረጡ፤ ወይም የወደዱትን ቀሚስ ፎቶ ይላኩልን።") },
    { title: t("Send your measurements", "ልኬትዎን ይላኩ"), description: t("Eight numbers and a photo. We check them with you on Telegram before cutting.", "ስምንት ልኬቶችና አንድ ፎቶ። ከመቁረጣችን በፊት በቴሌግራም አብረን እናረጋግጣለን።") },
    { title: t("We weave and sew", "እንሸምናለን፣ እንሰፋለን"), description: t("Three to six weeks, depending on the tibeb. You get photos along the way.", "እንደ ጥለቱ ከሦስት እስከ ስድስት ሳምንት። በሂደቱ ፎቶ እንልክልዎታለን።") },
    { title: t("Collect or we ship", "ይውሰዱ ወይም እንልካለን"), description: t("Pick it up in Shiro Meda, or we send it worldwide by courier.", "ከሽሮ ሜዳ ይውሰዱ፤ ወይም በፖስታ ወደ የትኛውም አገር እንልካለን።") },
  ],
  action: order,
};

const orderForm = {
  type: "form",
  id: "order",
  kind: "order",
  heading: t("Order a dress", "ቀሚስ ይዘዙ"),
  intro: t("Tell us what you would like. We answer on Telegram within the day with the price and the date it will be ready.", "የሚፈልጉትን ይንገሩን። በዕለቱ በቴሌግራም ዋጋውንና የሚደርስበትን ቀን እንነግርዎታለን።"),
  fields: [
    { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
    { name: "phone", label: t("Phone or Telegram", "ስልክ ወይም ቴሌግራም"), type: "tel", required: true },
    { name: "piece", label: t("What would you like?", "ምን ይፈልጋሉ?"), type: "select", required: true, options: [t("A dress from the collection", "ከስብስቡ ቀሚስ"), t("A dress made to measure", "በልክ የሚሰፋ ቀሚስ"), t("A couple set", "የጥንዶች ልብስ"), t("Netela or gabi", "ነጠላ ወይም ጋቢ")] },
    { name: "date", label: t("When do you need it?", "መቼ ይፈልጉታል?"), type: "date" },
    { name: "country", label: t("Country, if outside Ethiopia", "ከኢትዮጵያ ውጭ ከሆኑ አገር"), type: "text" },
    { name: "notes", label: t("Size, colours or a photo you will send", "መጠን፣ ቀለም ወይም የሚልኩት ፎቶ"), type: "textarea" },
  ],
  submitLabel: t("Send my order", "ትዕዛዜን ላክ"),
  successMessage: t("Thank you. We will write to you on Telegram today.", "እናመሰግናለን። ዛሬ በቴሌግራም እንጽፍልዎታለን።"),
};

save("fashion", {
  name: t("Tsion Kemis", "ጽዮን ቀሚስ"),
  tagline: t("Hand-woven habesha dresses, made to measure in Shiro Meda, Addis Ababa", "በእጅ የተሸመኑ የሀበሻ ቀሚሶች፣ በልክ የሚሰፉ፣ ሽሮ ሜዳ፣ አዲስ አበባ"),
  languages: ["en", "am"],
  theme: { primary: "#7A2333", accent: "#1E1714", background: "#FAF6EF", text: "#1E1714", highlight: "#C9A227", font: "elegant", radius: "none", style: "luxe" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Shiro Meda market road, shop 14, Addis Ababa", "ሽሮ ሜዳ ገበያ መንገድ፣ ሱቅ ቁጥር 14፣ አዲስ አበባ"),
    hours: [
      { days: t("Monday to Saturday", "ከሰኞ እስከ ቅዳሜ"), time: t("9:00 am to 7:00 pm", "ከጠዋቱ 3 እስከ ምሽቱ 1 ሰዓት") },
      { days: t("Sunday", "እሑድ"), time: t("By appointment", "በቀጠሮ") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Hand-woven habesha dresses, netela and gabi from Shiro Meda, made to measure and shipped worldwide. Prices in Birr, orders on Telegram.", "ከሽሮ ሜዳ በእጅ የተሸመኑ የሀበሻ ቀሚሶች፣ ነጠላና ጋቢ፤ በልክ የሚሰፉና ወደ ውጭ የሚላኩ። ዋጋ በብር፣ ትዕዛዝ በቴሌግራም።"),
      sections: [
        {
          type: "hero",
          variant: "poster",
          id: "top",
          eyebrow: t("Hand-woven · Shiro Meda · Addis Ababa", "በእጅ የተሸመነ · ሽሮ ሜዳ · አዲስ አበባ"),
          heading: t("Kemis for Timkat, made to fit", "ለጥምቀት የሚሆን ቀሚስ፣ በልክዎ"),
          subheading: t("Cotton and tibeb woven on our own looms, sewn to your measurements in three weeks.", "በራሳችን ሸማ የተሸመነ ጥጥና ጥለት፣ በሦስት ሳምንት በልክዎ የሚሰፋ።"),
          image: P.rooftop,
          primaryAction: collection,
          secondaryAction: measure,
        },
        {
          type: "marquee",
          id: "promises",
          tone: "dark",
          items: [t("Made to your measurements", "በልክዎ የሚሰፋ"), t("Delivery in Addis in 1–2 days", "በአዲስ አበባ በ1–2 ቀን ማድረስ"), t("We ship worldwide", "ወደ ውጭ እንልካለን"), t("Woven on our own looms", "በራሳችን ሸማ የተሸመነ")],
        },
        {
          type: "cards",
          id: "pieces",
          layout: "scroll",
          eyebrow: t("New this season", "የዚህ ወቅት"),
          heading: t("Dresses for the holidays ahead", "ለሚመጡት በዓላት"),
          intro: t("Every piece can be made in your size. Prices in Birr.", "ሁሉም በልክዎ ሊሰፋ ይችላል። ዋጋ በብር።"),
          items: pieces.slice(0, 4),
          action: collection,
        },
        steps,
        {
          type: "about",
          id: "craft",
          eyebrow: t("Our looms", "ሸማችን"),
          heading: t("One dress, three weeks of weaving", "አንድ ቀሚስ፣ የሦስት ሳምንት ሽመና"),
          body: t(
            "Our weavers work on wooden looms in Shiro Meda, the way their families have for generations. The tibeb, the woven border, is made thread by thread.\n\nThat is why a Tsion dress lasts for years and can be passed down.",
            "ሸማኔዎቻችን በሽሮ ሜዳ በእንጨት ሸማ ይሠራሉ፤ ቤተሰቦቻቸው ለትውልዶች እንደሠሩት። ጥለቱ በክር በክር ይሠራል።\n\nለዚህ ነው የጽዮን ቀሚስ ለዓመታት የሚቆየውና ለልጅ የሚተላለፈው።",
          ),
          image: P.weavers,
          imageSide: "end",
          highlights: [
            { value: t("3 weeks", "3 ሳምንት"), label: t("of weaving for one dress", "ለአንድ ቀሚስ ሽመና") },
            { value: t("8", "8"), label: t("weavers on our looms", "ሸማኔዎች") },
          ],
        },
        {
          type: "gallery",
          id: "worn",
          layout: "wall",
          eyebrow: t("Worn by our customers", "ደንበኞቻችን ለብሰውት"),
          heading: t("From Addis to Washington", "ከአዲስ አበባ እስከ ዋሽንግተን"),
          images: [P.field, P.friends, P.threads],
        },
        {
          type: "testimonials",
          id: "words",
          eyebrow: t("Customers say", "ደንበኞች ምን ይላሉ"),
          heading: t("Sewn for them, from far away", "ከሩቅ ሆነው ያሰፉ"),
          items: [
            { quote: t("I live in Washington and sent my measurements on Telegram. It fit like it was sewn in front of me.", "የምኖረው ዋሽንግተን ነው፤ ልኬቴን በቴሌግራም ላክሁ። ፊቴ ላይ የተሰፋ ያህል ልክ ሆነ።"), name: "Hanna T.", role: t("Wedding kemis, Washington DC", "የሠርግ ቀሚስ፣ ዋሽንግተን") },
            { quote: t("They sent photos before it left Addis, so I knew exactly what was coming.", "ከአዲስ አበባ ከመላኩ በፊት ፎቶ ላኩልኝ፤ የሚመጣልኝን በትክክል አውቄ ነበር።"), name: "Saron M.", role: t("Couple set, London", "የጥንዶች ልብስ፣ ለንደን") },
          ],
        },
        {
          type: "cta",
          id: "end",
          heading: t("Order for Genna before 20 December", "ለገና እስከ ታኅሣሥ 11 ይዘዙ"),
          body: t("Made-to-measure dresses take three weeks. Order now to wear it on the day.", "በልክ የሚሰፋ ቀሚስ ሦስት ሳምንት ይወስዳል። በዕለቱ እንዲለብሱት አሁን ይዘዙ።"),
          image: P.tailor,
          primaryAction: order,
          secondaryAction: collection,
        },
      ],
    },
    {
      path: "/collection",
      title: t("Collection", "ስብስብ"),
      nav: t("Collection", "ስብስብ"),
      description: t("The Tsion Kemis collection: habesha dresses, couple sets, netela and gabi, with prices in Birr and sizes or made to measure.", "የጽዮን ቀሚስ ስብስብ፦ የሀበሻ ቀሚሶች፣ የጥንዶች ልብስ፣ ነጠላና ጋቢ፤ ዋጋ በብር፣ በመጠን ወይም በልክ።"),
      sections: [
        {
          type: "hero",
          variant: "banner",
          eyebrow: t("Collection", "ስብስብ"),
          heading: t("Every piece, every price", "ሁሉም ልብስ፣ ሁሉም ዋጋ"),
          subheading: t("Choose a size, or have it made to measure at no extra cost.", "መጠን ይምረጡ፤ ወይም ያለ ተጨማሪ ክፍያ በልክ ያሰፉ።"),
          image: P.threads,
          primaryAction: order,
        },
        {
          type: "cards",
          id: "all",
          layout: "grid",
          eyebrow: t("Women, men and couples", "ሴቶች፣ ወንዶችና ጥንዶች"),
          heading: t("The collection", "ስብስቡ"),
          items: pieces,
        },
        { type: "contact", id: "contact", heading: t("Ask about a piece", "ስለ አንድ ልብስ ይጠይቁ"), intro: t("Send a photo on Telegram and we tell you the price and how long it takes.", "ፎቶ በቴሌግራም ይላኩ፤ ዋጋውንና የሚወስደውን ጊዜ እንነግርዎታለን።") },
      ],
    },
    {
      path: "/made-to-measure",
      title: t("Made to measure", "በልክ ማሰፋት"),
      nav: t("Made to measure", "በልክ"),
      description: t("How to order a habesha dress made to your measurements from Tsion Kemis, from Addis or abroad, with delivery worldwide.", "ከጽዮን ቀሚስ በልክዎ የሚሰፋ የሀበሻ ቀሚስ እንዴት እንደሚያዝዙ፤ ከአዲስ አበባም ከውጭም፣ በዓለም ዙሪያ ማድረስ።"),
      sections: [
        {
          type: "hero",
          variant: "split",
          eyebrow: t("Made to measure", "በልክ ማሰፋት"),
          heading: t("Your dress, your measurements", "የእርስዎ ቀሚስ፣ በእርስዎ ልክ"),
          subheading: t("Eight measurements and a photo are all we need. We check them with you before cutting.", "የሚያስፈልገን ስምንት ልኬቶችና አንድ ፎቶ ብቻ ነው። ከመቁረጣችን በፊት አብረን እናረጋግጣለን።"),
          image: P.tailor,
          primaryAction: order,
          hours: false,
        },
        steps,
        {
          type: "faq",
          id: "questions",
          eyebrow: t("Questions", "ጥያቄዎች"),
          heading: t("Before you order", "ከማዘዝዎ በፊት"),
          items: [
            { question: t("How do I measure myself?", "ራሴን እንዴት እለካለሁ?"), answer: t("We send you a short guide on Telegram with pictures. A friend and a tape measure are enough.", "ፎቶ ያለበት አጭር መመሪያ በቴሌግራም እንልክልዎታለን። አንድ ጓደኛና ሜትር በቂ ናቸው።") },
            { question: t("How do I pay from abroad?", "ከውጭ እንዴት እከፍላለሁ?"), answer: t("Family in Ethiopia can pay by Telebirr or bank transfer. Half when you order, half before we ship.", "በኢትዮጵያ ያለ ቤተሰብ በቴሌብር ወይም በባንክ ሊከፍል ይችላል። ግማሹን ሲያዝዙ፣ ግማሹን ከመላካችን በፊት።") },
            { question: t("What if it does not fit?", "ልክ ባይሆንስ?"), answer: t("We adjust it for free within a month. Send it back or bring it to the shop.", "በአንድ ወር ውስጥ በነጻ እናስተካክላለን። ይላኩልን ወይም ወደ ሱቁ ይዘው ይምጡ።") },
          ],
        },
        orderForm,
      ],
    },
    {
      path: "/visit",
      title: t("Visit", "ይጎብኙን"),
      nav: t("Visit", "ይጎብኙን"),
      description: t("Visit Tsion Kemis in Shiro Meda, Addis Ababa: opening hours, directions and fittings by appointment.", "ጽዮን ቀሚስን በሽሮ ሜዳ ይጎብኙ፦ የሥራ ሰዓት፣ አድራሻና በቀጠሮ ልኬት።"),
      sections: [
        { type: "contact", id: "contact", eyebrow: t("Visit the shop", "ሱቃችንን ይጎብኙ"), heading: t("Come for a fitting", "ለልኬት ይምጡ"), intro: t("Fittings are by appointment so we can give you time. Walk in to see the collection any day.", "ጊዜ ልንሰጥዎ ልኬት በቀጠሮ ነው። ስብስቡን ለማየት በማንኛውም ቀን ይምጡ።") },
        { type: "map", id: "map", heading: t("Find us in Shiro Meda", "በሽሮ ሜዳ ያግኙን"), query: "Shiro Meda, Addis Ababa" },
      ],
    },
  ],
});
