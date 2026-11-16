import { t, img, link, birr, save } from "./lib.mjs";

const book = link("Book now", "ቀጠሮ ይያዙ", "/#booking");
const seePrices = link("See prices", "ዋጋ ይመልከቱ", "/prices");
const callUs = link("Call us", "ይደውሉልን", "tel:+251911000000");

const P = {
  braiding: img("salon-hero-braiding-salon", "Black-and-white photo of two stylists braiding a seated woman's hair into cornrows", "ሁለት የፀጉር ባለሙያዎች የተቀመጠች ሴትን ሹሩባ ሲሠሩ የሚያሳይ ጥቁርና ነጭ ፎቶ"),
  curls: img("salon-hero-natural-curls", "A young woman with full natural curls against a soft pink background", "ሙሉ የተፈጥሮ ጥቅልል ፀጉር ያላት ወጣት ሴት፣ በለስላሳ ሮዝ ዳራ ፊት"),
  chair: img("salon-about-salon-chair-mirror", "A salon station with a black styling chair, a round lit mirror and a wooden vanity", "ጥቁር የፀጉር ወንበር፣ ክብ ባለመብራት መስታወትና የእንጨት መደርደሪያ ያለው የሳሎን መቀመጫ"),
  interior: img("salon-about-salon-interior", "Black-and-white view of an empty salon with arched lit mirrors and styling chairs", "ቅስት መስታወቶችና የፀጉር ወንበሮች ያሉት ባዶ ሳሎን፣ ጥቁርና ነጭ ፎቶ"),
  afro: img("salon-card-afro", "A woman with a full round afro in a black jacket against a grey wall", "ሙሉ ክብ ጎፈሬ ያላት ሴት፣ ጥቁር ጃኬት ለብሳ በግራጫ ግድግዳ ፊት"),
  barber: img("salon-card-barber", "A barber in gloves and an apron trimming a client's curly top with a fade", "ጓንትና ሽርጥ ያደረገ ፀጉር አስተካካይ የደንበኛውን ፀጉር ሲያስተካክል"),
  braids: img("salon-card-braids", "A smiling woman in a red top having long braids plaited by a stylist's hands", "ቀይ ልብስ የለበሰች ፈገግተኛ ሴት ረጅም ሹሩባ በባለሙያ እጆች ሲሠራላት"),
  manicure: img("salon-card-manicure", "Close-up of a nail technician working on a client's manicure", "የጥፍር ባለሙያ የደንበኛዋን ጥፍር ስትሠራ በቅርበት"),
  serum: img("salon-gallery-serum-bottle", "An amber glass dropper bottle on a wooden pedestal with palm-leaf shadows", "በእንጨት መቆሚያ ላይ ያለ ቡናማ የብርጭቆ ጠርሙስ፣ የዘንባባ ጥላ ያረፈበት"),
  kemis: img("shop-card-habesha-kemis", "A woman with braided hair and silver jewellery in a white habesha kemis", "ሹሩባ የተሠራችና የብር ጌጥ ያደረገች ሴት፣ ነጭ የሀበሻ ቀሚስ ለብሳ"),
  bride: img("events-gallery-bride-veil-bouquet", "A smiling bride lifting her lace veil over a bouquet of white roses", "ፈገግተኛ ሙሽሪት የዳንቴል ዓይነ ርግቧን በነጭ ጽጌረዳ እቅፍ አበባ ላይ ስታነሳ"),
  beard: img("personal-hero-man-turtleneck", "Studio portrait of a man with a short, neat beard in a black turtleneck", "አጭርና የተስተካከለ ፂም ያለው ወንድ፣ ጥቁር ሹራብ ለብሶ"),
};

const dur = (en, am) => t(en, am);
const m30 = dur("30 min", "30 ደቂቃ");
const m45 = dur("45 min", "45 ደቂቃ");
const h1 = dur("1 hr", "1 ሰዓት");
const h2 = dur("2 hrs", "2 ሰዓት");
const h3 = dur("3 hrs", "3 ሰዓት");

// Price list rows: name, duration chip (tag), short note, starting price.
const row = (en, am, tag, price, den, dam) => ({ name: t(en, am), tag, price: birr(price), ...(den ? { description: t(den, dam) } : {}) });

const hair = {
  name: t("Hair", "ፀጉር"),
  items: [
    row("Wash and blow-dry", "እጥበትና ማድረቅ", m45, 500, "Shampoo, conditioner and a smooth finish", "ሻምፖ፣ ኮንዲሽነርና ለስላሳ አጨራረስ"),
    row("Wash and set", "እጥበትና ቢጉዲ", h1, 600),
    row("Silk press", "ካውያ", h1, 900, "Natural hair straightened without chemicals", "የተፈጥሮ ፀጉር ያለ ኬሚካል ይለሰልሳል"),
    row("Trim and shape", "ጫፍ ማስተካከል", m30, 350),
    row("Natural curl styling", "የተፈጥሮ ፀጉር አሠራር", h1, 800, "Wash, define and dry your curls", "እጥበት፣ ጥቅልሉን ማውጣትና ማድረቅ"),
  ],
};
const braidsCat = {
  name: t("Braids", "ሹሩባ"),
  items: [
    row("Cornrows", "ቀጭን ሹሩባ", h1, 600, "Straight back or your own pattern", "ወደ ኋላ ወይም በመረጡት ቅርጽ"),
    row("Albaso", "አልባሶ", h2, 1200, "The classic holiday style", "የበዓል ባህላዊ አሠራር"),
    row("Box braids", "ቦክስ ብሬድ", dur("4 hrs", "4 ሰዓት"), 2500, "Medium size, shoulder length", "መካከለኛ ውፍረት፣ እስከ ትከሻ"),
    row("Knotless braids", "ኖትለስ ብሬድ", dur("5 hrs", "5 ሰዓት"), 3500),
    row("Twists", "ቱዊስት", h3, 2000),
    row("Braid take-down and wash", "ሹሩባ መፍታትና እጥበት", h1, 500),
  ],
};
const colourCat = {
  name: t("Colour and care", "ቀለምና እንክብካቤ"),
  items: [
    row("Full colour", "ሙሉ ቀለም", h2, 2500, "One shade, roots to ends", "አንድ ቀለም፣ ከሥር እስከ ጫፍ"),
    row("Root touch-up", "የሥር ቀለም", h1, 1400),
    row("Highlights", "ሃይላይት", h3, 3200),
    row("Relaxer", "ሪላክሰር", h1, 1200, "With a neutralising wash", "ከማስተካከያ እጥበት ጋር"),
    row("Deep conditioning", "ጥልቅ እንክብካቤ", m45, 800, "Steam treatment for dry or breaking hair", "ለደረቀና ለሚሰባበር ፀጉር የእንፋሎት እንክብካቤ"),
    row("Scalp treatment", "የራስ ቆዳ እንክብካቤ", m30, 600),
  ],
};
const barberCat = {
  name: t("Barber corner", "የወንዶች ፀጉር ቤት"),
  items: [
    row("Haircut", "ፀጉር ቁርጥ", m30, 300, "Clippers or scissors, with a wash", "በማሽን ወይም በመቀስ፣ ከእጥበት ጋር"),
    row("Fade", "ፌድ", m45, 400),
    row("Haircut and beard", "ፀጉርና ፂም", m45, 450, "Cut, beard shape and hot towel", "ቁርጥ፣ ፂም ማስተካከልና ሙቅ ፎጣ"),
    row("Beard trim", "ፂም ማስተካከል", dur("15 min", "15 ደቂቃ"), 150),
    row("Head shave", "ሙሉ ላጭ", dur("20 min", "20 ደቂቃ"), 250),
    row("Kids' cut", "የልጆች ቁርጥ", m30, 200, "Under 12", "ከ12 ዓመት በታች"),
  ],
};
const nailsCat = {
  name: t("Nails and beauty", "ጥፍርና ውበት"),
  items: [
    row("Manicure", "ማኒኪዩር", m45, 500),
    row("Gel polish", "ጄል ቀለም", h1, 900, "Lasts about three weeks", "ሦስት ሳምንት ያህል ይቆያል"),
    row("Pedicure", "ፔዲኪዩር", h1, 700),
    row("Henna, hands", "ሂና፣ ለእጅ", h1, 600),
    row("Eyebrow shaping", "ቅንድብ ማስተካከል", dur("15 min", "15 ደቂቃ"), 150),
    row("Makeup", "ሜካፕ", h1, 2000, "Day or evening", "የቀን ወይም የምሽት"),
  ],
};
const bridalCat = {
  name: t("Brides", "ለሙሽሮች"),
  items: [
    row("Bridal hair", "የሙሽራ ፀጉር", h3, 6000, "With a trial a week before", "ከአንድ ሳምንት በፊት ከሙከራ ጋር"),
    row("Bridal hair and makeup", "የሙሽራ ፀጉርና ሜካፕ", dur("4 hrs", "4 ሰዓት"), 12000, "Hair, makeup, nails and henna on the day", "በዕለቱ ፀጉር፣ ሜካፕ፣ ጥፍርና ሂና"),
    row("Bridesmaid styling", "የሚዜ አሠራር", h1, 1500, "Per person, hair only", "ለአንድ ሰው፣ ፀጉር ብቻ"),
  ],
};

const pick = (cat, names) => ({ name: cat.name, items: cat.items.filter((i) => names.includes(i.name.en)) });
const priceNote = t(
  "Prices are starting prices in Birr. Long or very thick hair can cost more: we tell you the price before we start.",
  "ዋጋዎቹ መነሻ ዋጋ ናቸው፤ በብር። ለረጅም ወይም በጣም ወፍራም ፀጉር ሊጨምር ይችላል፤ ከመጀመራችን በፊት ዋጋውን እንነግርዎታለን።",
);

const team = [
  {
    image: P.braids,
    title: t("Tigist", "ትግስት"),
    subtitle: t("Braids and natural hair", "ሹሩባና የተፈጥሮ ፀጉር"),
    description: t("Neat parts, light hands, no pulling. Monday to Saturday.", "ቀጥ ያለ መስመር፣ ቀላል እጅ፣ ያለ ሕመም። ከሰኞ እስከ ቅዳሜ።"),
  },
  {
    image: P.barber,
    title: t("Yonas", "ዮናስ"),
    subtitle: t("Barber", "ፀጉር አስተካካይ"),
    description: t("Fades, beards and kids' cuts in the barber corner. Every day.", "ፌድ፣ ፂምና የልጆች ቁርጥ በወንዶች ፀጉር ቤታችን። በየቀኑ።"),
  },
  {
    image: P.manicure,
    title: t("Bethlehem", "ቤተልሔም"),
    subtitle: t("Nails and henna", "ጥፍርና ሂና"),
    description: t("Gel, manicure, pedicure and bridal henna. Tuesday to Sunday.", "ጄል፣ ማኒኪዩር፣ ፔዲኪዩርና የሙሽራ ሂና። ከማክሰኞ እስከ እሑድ።"),
  },
];

const serviceOptions = [
  t("Hair: wash, style or cut", "ፀጉር፦ እጥበት፣ አሠራር ወይም ቁርጥ"),
  t("Braids", "ሹሩባ"),
  t("Colour or treatment", "ቀለም ወይም እንክብካቤ"),
  t("Barber corner", "የወንዶች ፀጉር ቤት"),
  t("Nails, henna or makeup", "ጥፍር፣ ሂና ወይም ሜካፕ"),
  t("Bridal", "ለሙሽራ"),
];

const bookingForm = {
  type: "form",
  id: "booking",
  kind: "booking",
  heading: t("Book your chair", "ወንበርዎን ይያዙ"),
  intro: t("Choose a day and a time. We confirm by phone or Telegram within the hour, and you pay at the salon.", "ቀንና ሰዓት ይምረጡ። በአንድ ሰዓት ውስጥ በስልክ ወይም በቴሌግራም እናረጋግጣለን፤ ክፍያ በሳሎኑ ነው።"),
  fields: [
    { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
    { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true },
    { name: "service", label: t("Service", "አገልግሎት"), type: "select", required: true, options: serviceOptions },
    { name: "date", label: t("Day", "ቀን"), type: "date", required: true },
    { name: "time", label: t("Time", "ሰዓት"), type: "time" },
  ],
  submitLabel: t("Book now", "ቀጠሮ ይያዙ"),
  successMessage: t("Thank you. We will confirm your time shortly.", "እናመሰግናለን። ቀጠሮዎን በቅርቡ እናረጋግጣለን።"),
};

save("salon", {
  name: t("Saba Beauty Salon", "ሳባ የውበት ሳሎን"),
  tagline: t("Braids, colour, nails and a barber corner in Haya Hulet, Addis Ababa", "ሹሩባ፣ ቀለም፣ ጥፍር እና የወንዶች ፀጉር ቤት በሃያ ሁለት፣ አዲስ አበባ"),
  languages: ["en", "am"],
  theme: { primary: "#B4533C", accent: "#2A1A14", background: "#FBF4EE", text: "#2B211C", font: "elegant", radius: "none", style: "editorial" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Haya Hulet main road, 1st floor, Addis Ababa", "ሃያ ሁለት ዋና መንገድ፣ 1ኛ ፎቅ፣ አዲስ አበባ"),
    hours: [
      { days: t("Monday to Saturday", "ከሰኞ እስከ ቅዳሜ"), time: t("8:00 am to 8:00 pm", "ከጠዋቱ 2 እስከ ምሽቱ 2 ሰዓት") },
      { days: t("Sunday", "እሑድ"), time: t("9:00 am to 6:00 pm", "ከጠዋቱ 3 እስከ ምሽቱ 12 ሰዓት") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Braids, natural hair, colour, nails and a barber corner in Haya Hulet, Addis Ababa. Prices in Birr, booking by phone or Telegram.", "ሹሩባ፣ የተፈጥሮ ፀጉር፣ ቀለም፣ ጥፍር እና የወንዶች ፀጉር ቤት በሃያ ሁለት፣ አዲስ አበባ። ዋጋ በብር፣ ቀጠሮ በስልክ ወይም በቴሌግራም።"),
      sections: [
        {
          type: "hero",
          variant: "immersive",
          eyebrow: t("Haya Hulet · Addis Ababa", "ሃያ ሁለት · አዲስ አበባ"),
          heading: t("Hair, done with care", "ለፀጉርዎ የሚገባ እንክብካቤ"),
          subheading: t("Braids, natural hair, colour and nails under one roof, with a barber corner for the men in your life.", "ሹሩባ፣ የተፈጥሮ ፀጉር፣ ቀለምና ጥፍር በአንድ ጣሪያ ሥር፤ ለወንዶችም የራሱ ፀጉር ቤት አለው።"),
          image: P.braiding,
          primaryAction: book,
          secondaryAction: seePrices,
          facts: [
            { value: t("6", "6"), label: t("stylists and barbers", "የፀጉር ባለሙያዎች") },
            { value: t("300 Br", "300 ብር"), label: t("haircuts from", "የፀጉር ቁርጥ መነሻ") },
            { value: t("7 days", "7 ቀን"), label: t("open every week", "በሳምንት ክፍት") },
          ],
        },
        {
          type: "menu",
          id: "prices",
          eyebrow: t("Price list", "የዋጋ ዝርዝር"),
          heading: t("Most booked", "በብዛት የሚጠየቁ"),
          intro: priceNote,
          categories: [
            pick(hair, ["Wash and blow-dry", "Silk press", "Natural curl styling"]),
            pick(braidsCat, ["Cornrows", "Albaso", "Box braids"]),
            pick(barberCat, ["Haircut", "Haircut and beard", "Kids' cut"]),
            pick(nailsCat, ["Manicure", "Gel polish", "Makeup"]),
          ],
        },
        {
          type: "gallery",
          eyebrow: t("Looks", "አሠራሮች"),
          heading: t("Styles we love doing", "ወደን የምንሠራቸው"),
          intro: t("From wash-and-go curls to holiday albaso and wedding mornings.", "ከተፈጥሮ ጥቅልል እስከ የበዓል አልባሶ፣ እስከ ሠርግ ማለዳ።"),
          images: [P.curls, P.afro, P.kemis, P.bride, P.beard],
        },
        {
          type: "cards",
          id: "team",
          layout: "people",
          eyebrow: t("Your stylists", "ባለሙያዎቻችን"),
          heading: t("Ask for them by name", "በስማቸው ይጠይቁ"),
          intro: t("Each of us does a few things, and does them well.", "እያንዳንዳችን ጥቂት ነገር እንሠራለን፤ እሱንም አሳምረን።"),
          items: team,
          action: book,
        },
        {
          type: "testimonials",
          eyebrow: t("Clients say", "ደንበኞች ምን ይላሉ"),
          heading: t("Why they come back", "ለምን ይመለሳሉ"),
          items: [
            { quote: t("My box braids took four hours, not eight, and my scalp did not hurt once.", "ቦክስ ብሬዴ ስምንት ሳይሆን አራት ሰዓት ብቻ ፈጀ፤ ራሴንም አንዴም አላመመኝም።"), name: "Selam K.", role: t("Box braids", "ቦክስ ብሬድ") },
            { quote: t("They told me the price before they started and it was the price I paid. That is rare.", "ከመጀመራቸው በፊት ዋጋውን ነገሩኝ፤ የከፈልኩትም ያንኑ ነው። ይህ ብዙ ቦታ አይገኝም።"), name: "Rahel D.", role: t("Colour and treatment", "ቀለምና እንክብካቤ") },
            { quote: t("I bring my son on Saturdays. He gets a fade while I get my nails done.", "ቅዳሜ ቅዳሜ ልጄን ይዤ እመጣለሁ። እኔ ጥፍሬን ስሠራ እሱ ፀጉሩን ይስተካከላል።"), name: "Mekdes A.", role: t("Nails and barber corner", "ጥፍርና የወንዶች ፀጉር ቤት") },
          ],
        },
        {
          type: "about",
          eyebrow: t("The salon", "ስለ ሳሎኑ"),
          heading: t("A calm room above a busy street", "ከሚጨናነቅ መንገድ በላይ፣ ጸጥ ያለ ቤት"),
          body: t(
            "Saba opened with two chairs and one rule: nobody leaves with a sore scalp or a surprise bill. Today there are eight chairs, a nail table and a barber corner with its own door.\n\nWe use clean tools for every client, gentle products for natural hair, and we always show you the mirror before you pay.",
            "ሳባ የተከፈተው በሁለት ወንበርና በአንድ መርሕ ነው፦ ማንም ደንበኛ ራሱ ታምሞ ወይም ያልጠበቀው ሒሳብ ገጥሞት አይወጣም። ዛሬ ስምንት ወንበር፣ የጥፍር ጠረጴዛና የራሱ በር ያለው የወንዶች ፀጉር ቤት አለን።\n\nለእያንዳንዱ ደንበኛ ንጹሕ መሣሪያ፣ ለተፈጥሮ ፀጉር ለስላሳ ምርቶች እንጠቀማለን፤ ከመክፈልዎ በፊትም ሁልጊዜ በመስታወት እናሳይዎታለን።",
          ),
          image: P.interior,
          imageSide: "end",
          points: [
            t("Tools cleaned and combs changed for every client", "ለእያንዳንዱ ደንበኛ የጸዳ መሣሪያና አዲስ ማበጠሪያ"),
            t("The price agreed before we start", "ከመጀመራችን በፊት የተስማማ ዋጋ"),
            t("Bring your own extensions, or buy them here", "ተጨማሪ ፀጉር ይዘው ይምጡ፤ አሊያም ከእኛ ይግዙ"),
          ],
          action: seePrices,
        },
        bookingForm,
        { type: "contact", id: "contact", heading: t("Call, write or walk in", "ይደውሉ፣ ይጻፉ ወይም ይምጡ"), intro: t("Walk-ins are welcome when a chair is free. For braids and colour, book a day ahead.", "ወንበር ካለ ያለ ቀጠሮም ይስተናገዳሉ። ለሹሩባና ለቀለም ግን ከአንድ ቀን በፊት ቀጠሮ ይያዙ።") },
        { type: "map", heading: t("Find us in Haya Hulet", "በሃያ ሁለት ያገኙናል"), query: "Haya Hulet, Addis Ababa" },
        {
          type: "cta",
          heading: t("Your chair is waiting", "ወንበርዎ እየጠበቀዎ ነው"),
          body: t("Book today, pay at the salon.", "ዛሬ ቀጠሮ ይያዙ፤ ክፍያ በሳሎኑ።"),
          image: P.chair,
          primaryAction: book,
          secondaryAction: callUs,
        },
      ],
    },
    {
      path: "/prices",
      title: t("Prices", "ዋጋ"),
      nav: t("Prices", "ዋጋ"),
      description: t("The full price list of Saba Beauty Salon: hair, braids, colour, nails, makeup and bridal styling, with how long each takes.", "የሳባ የውበት ሳሎን ሙሉ የዋጋ ዝርዝር፦ ፀጉር፣ ሹሩባ፣ ቀለም፣ ጥፍር፣ ሜካፕና የሙሽራ አሠራር፤ እያንዳንዱ ከሚወስደው ጊዜ ጋር።"),
      sections: [
        {
          type: "hero",
          variant: "banner",
          eyebrow: t("Price list", "የዋጋ ዝርዝር"),
          heading: t("Every price, in plain sight", "ሁሉም ዋጋ በግልጽ"),
          subheading: t("What it costs and how long it takes, so you can plan your day.", "ምን ያህል እንደሚያስከፍልና ምን ያህል ጊዜ እንደሚወስድ፤ ቀንዎን ለማቀድ እንዲመችዎ።"),
          image: P.manicure,
          primaryAction: book,
        },
        {
          type: "menu",
          id: "list",
          eyebrow: t("Salon", "ሳሎን"),
          heading: t("Services and prices", "አገልግሎትና ዋጋ"),
          intro: priceNote,
          categories: [hair, braidsCat, colourCat, nailsCat, bridalCat, barberCat],
        },
        {
          type: "services",
          variant: "list",
          eyebrow: t("Good to know", "ማወቅ ያለብዎ"),
          heading: t("Before your visit", "ከመምጣትዎ በፊት"),
          items: [
            { icon: "clock", title: t("Come on time", "በሰዓቱ ይድረሱ"), description: t("We hold your chair for 15 minutes.", "ወንበርዎን ለ15 ደቂቃ እንጠብቃለን።") },
            { icon: "droplet", title: t("Come with washed hair for braids", "ለሹሩባ ታጥበው ይምጡ"), description: t("Or add a wash here for 200 Br.", "አሊያም በ200 ብር እዚሁ እናጥብልዎታለን።") },
            { icon: "baby", title: t("Children are welcome", "ልጆች እንኳን ደህና መጡ"), description: t("Kids' braids and cuts cost less. Ask us.", "የልጆች ሹሩባና ቁርጥ ዋጋው ያነሰ ነው። ይጠይቁን።") },
            { icon: "check", title: t("Pay how you like", "በመረጡት ይክፈሉ"), description: t("Cash, Telebirr or bank transfer, after the mirror.", "በጥሬ ገንዘብ፣ በቴሌብር ወይም በባንክ፤ መስታወት ካዩ በኋላ።") },
          ],
        },
        {
          type: "steps",
          eyebrow: t("Booking", "ቀጠሮ"),
          heading: t("How to book", "ቀጠሮ እንዴት ይያዛል"),
          items: [
            { title: t("Tell us what and when", "ምን እና መቼ ይንገሩን"), description: t("Fill in the form, call, or write on Telegram.", "ቅጹን ይሙሉ፣ ይደውሉ ወይም በቴሌግራም ይጻፉ።") },
            { title: t("We confirm your time", "ሰዓትዎን እናረጋግጣለን"), description: t("Within the hour, with the stylist's name.", "በአንድ ሰዓት ውስጥ፣ ከባለሙያው ስም ጋር።") },
            { title: t("Sit down and relax", "ተቀምጠው ይዝናኑ"), description: t("Tea or coffee is on us. You pay at the end.", "ሻይ ወይም ቡና በእኛ ነው። ክፍያ በመጨረሻ።") },
          ],
          action: book,
        },
      ],
    },
    {
      path: "/barber",
      title: t("Barber corner", "የወንዶች ፀጉር ቤት"),
      nav: t("Barber", "ለወንዶች"),
      description: t("The barber corner at Saba: haircuts, fades, beards and kids' cuts in Haya Hulet. No booking needed.", "የሳባ የወንዶች ፀጉር ቤት፦ ቁርጥ፣ ፌድ፣ ፂምና የልጆች ቁርጥ በሃያ ሁለት። ቀጠሮ አያስፈልግም።"),
      sections: [
        {
          type: "hero",
          variant: "split",
          eyebrow: t("Barber corner", "የወንዶች ፀጉር ቤት"),
          heading: t("A sharp cut, no waiting around", "ጥርት ያለ ቁርጥ፣ ያለ ረጅም ወረፋ"),
          subheading: t("Two chairs with their own door, beside the salon. Walk in any day, or book a time and skip the queue.", "ከሳሎኑ ጎን፣ የራሱ በር ያለው ሁለት ወንበር። በማንኛውም ቀን ይምጡ፤ ወይም ቀጠሮ ይዘው ወረፋ ይለፉ።"),
          image: P.barber,
          primaryAction: book,
          secondaryAction: callUs,
        },
        {
          type: "menu",
          id: "barber-prices",
          eyebrow: t("Price list", "የዋጋ ዝርዝር"),
          heading: t("Cuts and beards", "ቁርጥና ፂም"),
          categories: [
            barberCat,
            {
              name: t("Extras", "ተጨማሪ"),
              items: [
                row("Hot towel shave", "በሙቅ ፎጣ መላጨት", m30, 300),
                row("Hair wash", "ፀጉር እጥበት", dur("10 min", "10 ደቂቃ"), 100),
                row("Black dye, hair or beard", "ጥቁር ቀለም፣ ለፀጉር ወይም ለፂም", m30, 400),
                row("Groom's cut and beard", "የሙሽራ ቁርጥና ፂም", h1, 1000, "On the wedding morning, by appointment", "በሠርጉ ማለዳ፣ በቀጠሮ"),
              ],
            },
          ],
        },
        {
          type: "services",
          variant: "numbered",
          eyebrow: t("How we work", "አሠራራችን"),
          heading: t("Three things we never skip", "ፈጽሞ የማንዘላቸው ሦስት ነገሮች"),
          items: [
            { title: t("Clean blades", "ንጹሕ ምላጭ"), description: t("Clippers disinfected and a new blade for every shave.", "ማሽኑ ይጸዳል፤ ለእያንዳንዱ ደንበኛ አዲስ ምላጭ።") },
            { title: t("We ask first", "አስቀድመን እንጠይቃለን"), description: t("Show us a photo or tell us the number. No guessing.", "ፎቶ ያሳዩን ወይም ቁጥሩን ይንገሩን። በግምት አንሠራም።") },
            { title: t("The mirror at the end", "በመጨረሻ መስታወት"), description: t("You see the back before you stand up.", "ከመነሳትዎ በፊት የኋላውን ያያሉ።") },
          ],
        },
        {
          type: "quote",
          quote: t("Same barber, same cut, every two weeks. That is all I want.", "ያው አስተካካይ፣ ያው ቁርጥ፣ በየሁለት ሳምንቱ። የምፈልገው ይኸው ብቻ ነው።"),
          name: t("Henok B.", "ሄኖክ በ."),
          role: t("Client of the barber corner", "የወንዶች ፀጉር ቤት ደንበኛ"),
          image: P.beard,
        },
        {
          type: "cta",
          heading: t("Next chair is yours", "ቀጣዩ ወንበር የእርስዎ ነው"),
          body: t("Open every day. Haircuts from 300 Birr.", "በየቀኑ ክፍት። ፀጉር ቁርጥ ከ300 ብር ጀምሮ።"),
          primaryAction: book,
          secondaryAction: callUs,
        },
      ],
    },
    {
      path: "/contact",
      title: t("Contact", "አድራሻ"),
      nav: t("Contact", "አድራሻ"),
      description: t("Opening hours, address, phone and Telegram for Saba Beauty Salon in Haya Hulet, Addis Ababa.", "የሳባ የውበት ሳሎን የሥራ ሰዓት፣ አድራሻ፣ ስልክና ቴሌግራም፤ ሃያ ሁለት፣ አዲስ አበባ።"),
      sections: [
        { type: "contact", heading: t("Talk to us", "ያነጋግሩን"), intro: t("We answer the phone and Telegram during opening hours. Send a photo of the style you want and we will tell you the price.", "በሥራ ሰዓታችን ስልክና ቴሌግራም እንመልሳለን። የሚፈልጉትን አሠራር ፎቶ ይላኩልን፤ ዋጋውን እንነግርዎታለን።") },
        { type: "map", heading: t("Where we are", "የምንገኝበት"), query: "Haya Hulet, Addis Ababa" },
        {
          type: "faq",
          heading: t("Questions we hear every day", "በየቀኑ የምንጠየቃቸው"),
          items: [
            { question: t("Do I need an appointment?", "ቀጠሮ ያስፈልጋል?"), answer: t("Not for a wash, a cut or nails if a chair is free. For braids, colour and bridal work, please book at least a day ahead.", "ለእጥበት፣ ለቁርጥ ወይም ለጥፍር ወንበር ካለ አያስፈልግም። ለሹሩባ፣ ለቀለምና ለሙሽራ ሥራ ግን ቢያንስ ከአንድ ቀን በፊት ቀጠሮ ይያዙ።") },
            { question: t("Should I bring my own extensions?", "ተጨማሪ ፀጉር ይዤ ልምጣ?"), answer: t("You can. We also sell braiding hair at the salon; the price is separate from the braiding.", "ይችላሉ። በሳሎናችንም የሹሩባ ፀጉር እንሸጣለን፤ ዋጋው ከሥራው ዋጋ የተለየ ነው።") },
            { question: t("Can you come to my home for a wedding?", "ለሠርግ ቤት ድረስ ትመጣላችሁ?"), answer: t("Yes, inside Addis Ababa, for bridal bookings. Tell us the date and the number of people.", "አዎ፣ በአዲስ አበባ ውስጥ ለሙሽራ ቀጠሮ እንመጣለን። ቀኑንና የሰዉን ብዛት ይንገሩን።") },
            { question: t("How do I pay?", "ክፍያ እንዴት ነው?"), answer: t("At the salon, in cash, by Telebirr or by bank transfer.", "በሳሎኑ በጥሬ ገንዘብ፣ በቴሌብር ወይም በባንክ ዝውውር።") },
          ],
        },
        {
          type: "form",
          id: "message",
          kind: "contact",
          heading: t("Send a message", "መልእክት ይላኩ"),
          intro: t("Ask about a style, a bridal date or a group booking.", "ስለ አሠራር፣ ስለ ሠርግ ቀን ወይም ስለ ቡድን ቀጠሮ ይጠይቁን።"),
          fields: [
            { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
            { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true },
            { name: "message", label: t("Message", "መልእክት"), type: "textarea", required: true },
          ],
          submitLabel: t("Send", "ላክ"),
          successMessage: t("Thank you. We will answer soon.", "እናመሰግናለን። በቅርቡ እንመልሳለን።"),
        },
      ],
    },
  ],
});
