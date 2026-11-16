import { t, img, link, birr, save } from "./lib.mjs";

const seeMenu = link("See the menu", "ምናሌውን ይመልከቱ", "/menu");
const callUs = link("Call us", "ይደውሉልን", "tel:+251911000000");
const reserve = link("Reserve a ceremony", "ሥነ ሥርዓት ያስይዙ", "/#booking");

const P = {
  jebena: img("cafe-card-jebena-pour", "Coffee poured from a clay jebena into a white cup on a wooden tray", "ከሸክላ ጀበና ወደ ነጭ ስኒ የሚቀዳ ቡና፣ በእንጨት ትሪ ላይ"),
  latte: img("cafe-card-latte-glass", "A milky coffee with latte art in a glass on a wooden table", "በእንጨት ጠረጴዛ ላይ በብርጭቆ የቀረበ የወተት ቡና"),
  tibs: img("cafe-card-tibs-injera", "A clay plate of beef tibs, kitfo and ayib beside rolled injera", "በሸክላ ሳህን የቀረበ ጥብስ፣ ክትፎና አይብ ከተጠቀለለ እንጀራ ጋር"),
  veg: img("cafe-card-injera-veg-plate", "A plate of rolled injera with red lentils, yellow lentils and collard greens", "የተጠቀለለ እንጀራ ከምስር ወጥ፣ ከክክ አልጫና ከጎመን ጋር"),
  pastries: img("cafe-gallery-pastries-coffee", "A café table with a latte, a croissant, a fruit danish and doughnuts", "ማኪያቶ፣ ክሮሳንት፣ የፍራፍሬ ኬክና ዶናት ያለበት የካፌ ጠረጴዛ"),
  bread: img("cafe-gallery-bread-baskets", "Hands cutting round difo dabo bread in a woven basket", "በመሶብ ውስጥ ድፎ ዳቦ የሚቆርሱ እጆች"),
  cups: img("cafe-gallery-cini-cups-tray", "Small cini coffee cups on an engraved metal tray, a hand reaching for one", "በተቀረጸ የብረት ትሪ ላይ ያሉ ስኒዎች፣ አንዱን የሚያነሳ እጅ"),
  incense: img("cafe-about-ceremony-incense", "A coffee ceremony: a jebena pouring into cini cups, incense smoking beside baskets of green beans", "የቡና ሥነ ሥርዓት፦ ከጀበና ወደ ስኒ የሚቀዳ ቡና፣ የሚጤስ ዕጣንና የጥሬ ቡና ቅርጫቶች"),
  roast: img("cafe-about-roasted-beans-pan", "Hands holding a clay pan of freshly roasted coffee beans", "አዲስ የተቆላ ቡና የያዘ የሸክላ ምጣድ በእጅ"),
  pots: img("cafe-hero-clay-pot-dish", "A row of black clay pots of food topped with a green herb sprig", "በአረንጓዴ ቅጠል ያጌጡ በረድፍ የተቀመጡ ጥቁር የሸክላ ድስቶች"),
  pour: img("cafe-hero-coffee-ceremony-pour", "A woman in a white habesha dress pours coffee from a jebena into rows of cini cups", "ነጭ የሀበሻ ቀሚስ የለበሰች ሴት ከጀበና ወደ ተደረደሩ ስኒዎች ቡና ስትቀዳ"),
};

const fasting = t("Fasting", "የጾም");
const popular = t("Popular", "ተወዳጅ");
// Badges on the favourites become filter pills (research: Dishoom's tag chips, a category row).
const coffee = t("Coffee", "ቡና");
const food = t("Food", "ምግብ");
const bakery = t("Bakery", "ዳቦና ኬክ");

const signatures = [
  {
    image: P.jebena,
    subtitle: t("From the jebena", "ከጀበና"),
    title: t("Jebena buna", "የጀበና ቡና"),
    badge: coffee,
    description: t("Sidama beans roasted this morning, brewed in clay and served with popcorn.", "ዛሬ ጠዋት የተቆላ የሲዳማ ቡና፣ በጀበና ተፈልቶ ከፈንዲሻ ጋር ይቀርባል።"),
    price: birr(60),
    priceNote: t("a cup", "በስኒ"),
  },
  {
    image: P.latte,
    subtitle: t("From the machine", "ከማሽን"),
    title: t("Macchiato", "ማኪያቶ"),
    badge: coffee,
    description: t("The Addis classic: a short, strong coffee with a little steamed milk.", "የአዲስ አበባ ተወዳጅ፦ አጭር፣ ጠንካራ ቡና ከጥቂት የተፈላ ወተት ጋር።"),
    price: birr(80),
  },
  {
    image: P.tibs,
    subtitle: t("Lunch and dinner", "ምሳና እራት"),
    title: t("Tibs and kitfo plate", "ጥብስና ክትፎ"),
    badge: food,
    description: t("Beef tibs, kitfo and fresh ayib with rolled injera and mitmita. Good for two.", "የበሬ ጥብስ፣ ክትፎና ትኩስ አይብ ከእንጀራና ከሚጥሚጣ ጋር። ለሁለት ሰው ይበቃል።"),
    price: birr(680),
  },
  {
    image: P.veg,
    subtitle: t("Fasting plate", "የጾም ምግብ"),
    title: t("Beyaynetu", "በያይነቱ"),
    badge: food,
    description: t("Misir wot, kik alicha and gomen on injera, cooked fresh every day.", "ምስር ወጥ፣ ክክ አልጫና ጎመን በእንጀራ ላይ፤ በየቀኑ ትኩስ የሚሠራ።"),
    price: birr(340),
  },
  {
    image: P.pastries,
    subtitle: t("With your macchiato", "ከማኪያቶዎ ጋር"),
    title: t("Croissant", "ክሮሳንት"),
    badge: bakery,
    description: t("Baked here every morning, with a fruit danish and doughnuts beside it.", "በየማለዳው እዚሁ የሚጋገር፤ ከፍራፍሬ ኬክና ከዶናት ጋር።"),
    price: birr(120),
  },
  {
    image: P.bread,
    subtitle: t("Home-baked", "በቤት የተጋገረ"),
    title: t("Difo dabo", "ድፎ ዳቦ"),
    badge: bakery,
    description: t("Round wheat bread from a family recipe, best with the afternoon ceremony.", "በቤተሰብ አሠራር የሚጋገር ክብ የስንዴ ዳቦ፤ ከከሰዓቱ ሥነ ሥርዓት ጋር ይጣፍጣል።"),
    price: birr(60),
    priceNote: t("a slice", "በቁራሽ"),
  },
];

const bookingForm = {
  type: "form",
  id: "booking",
  kind: "booking",
  heading: t("Reserve a ceremony", "ሥነ ሥርዓት ያስይዙ"),
  intro: t(
    "For a quick coffee or lunch, just walk in. For the full coffee ceremony or a group of six or more, tell us when you are coming and we will have everything ready.",
    "ለቡና ወይም ለምሳ በቀጥታ ይምጡ። ለሙሉ የቡና ሥነ ሥርዓት ወይም ከስድስት ሰው በላይ ለሆነ ቡድን ግን መቼ እንደሚመጡ ይንገሩን፤ ሁሉን አዘጋጅተን እንጠብቅዎታለን።",
  ),
  fields: [
    { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
    { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true },
    { name: "date", label: t("Date", "ቀን"), type: "date", required: true },
    { name: "time", label: t("Time", "ሰዓት"), type: "time" },
    { name: "guests", label: t("Number of people", "የሰው ብዛት"), type: "number", required: true },
    { name: "occasion", label: t("What for?", "ለምን ጉዳይ?"), type: "select", options: [t("Full coffee ceremony", "ሙሉ የቡና ሥነ ሥርዓት"), t("Group table", "የቡድን ጠረጴዛ"), t("Birthday or family gathering", "ልደት ወይም የቤተሰብ ዝግጅት")] },
  ],
  submitLabel: t("Send request", "ጥያቄውን ላክ"),
  successMessage: t("Thank you. We will call you shortly to confirm.", "እናመሰግናለን። ለማረጋገጥ በቅርቡ እንደውልልዎታለን።"),
};

save("cafe", {
  name: t("Bole Buna House", "ቦሌ ቡና ቤት"),
  tagline: t("Coffee roasted every morning and home cooking on Bole Road", "በየማለዳው የሚቆላ ቡና እና የቤት ምግብ በቦሌ መንገድ"),
  languages: ["en", "am"],
  theme: { primary: "#8A4B2A", accent: "#2B1A12", background: "#FAF4EA", text: "#33261F", font: "classic", radius: "medium", style: "warm" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Bole Road, near Edna Mall, Addis Ababa", "ቦሌ መንገድ፣ ኤድና ሞል አጠገብ፣ አዲስ አበባ"),
    hours: [
      { days: t("Monday to Saturday", "ከሰኞ እስከ ቅዳሜ"), time: t("7:00 am to 9:00 pm", "ከጠዋቱ 1 እስከ ምሽቱ 3 ሰዓት") },
      { days: t("Sunday", "እሑድ"), time: t("8:00 am to 6:00 pm", "ከጠዋቱ 2 እስከ ምሽቱ 12 ሰዓት") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Coffee roasted every morning, a traditional ceremony and home-cooked Ethiopian food on Bole Road, Addis Ababa.", "በየማለዳው የሚቆላ ቡና፣ ባህላዊ የቡና ሥነ ሥርዓት እና የቤት አሠራር ምግብ በቦሌ መንገድ፣ አዲስ አበባ።"),
      sections: [
        {
          type: "hero",
          variant: "immersive",
          eyebrow: t("Bole · near Edna Mall", "ቦሌ · ኤድና ሞል አጠገብ"),
          id: "top",
          heading: t("Coffee roasted every morning", "በየማለዳው የሚቆላ ቡና"),
          subheading: t("Jebena buna poured at your table, a proper macchiato, and food cooked the way it is at home.", "በጠረጴዛዎ ላይ የሚቀዳ የጀበና ቡና፣ ልክ የሆነ ማኪያቶ እና እንደ ቤት የሚሠራ ምግብ።"),
          image: P.pour,
          // Dishoom's "window into the room": the photo opens out from a frame as the page scrolls.
          frame: true,
          primaryAction: seeMenu,
          secondaryAction: callUs,
          facts: [
            { value: t("60 Br", "60 ብር"), label: t("a cup of jebena buna", "አንድ ስኒ የጀበና ቡና") },
            { value: t("3 min", "3 ደቂቃ"), label: t("on foot from Edna Mall", "ከኤድና ሞል በእግር") },
            { value: t("7", "7"), label: t("days a week, from 7:00 am", "ቀን በሳምንት፣ ከጠዋቱ 1 ሰዓት ጀምሮ") },
          ],
        },
        {
          // Dishoom's intro line that darkens word by word as you read.
          type: "quote",
          id: "welcome",
          quote: t(
            "Every cup here starts as green coffee in a clay pan at dawn, and ends at your table with popcorn and good talk.",
            "እዚህ እያንዳንዱ ስኒ የሚጀምረው ጎህ ሲቀድ በሸክላ ምጣድ ላይ ካለ ጥሬ ቡና ነው፤ የሚያልቀውም በጠረጴዛዎ ላይ ከፈንዲሻና ከጥሩ ጨዋታ ጋር ነው።",
          ),
        },
        {
          type: "cards",
          id: "favourites",
          layout: "grid",
          eyebrow: t("House favourites", "የቤቱ ተወዳጆች"),
          heading: t("What people come back for", "ደንበኞች የሚመለሱባቸው"),
          intro: t("Six things we make every day. The rest is on the menu.", "በየቀኑ የምናዘጋጃቸው ስድስት ምርጦች። ቀሪው በምናሌው ላይ አለ።"),
          items: signatures,
          action: seeMenu,
        },
        {
          type: "marquee",
          id: "dishes",
          tone: "primary",
          items: [t("Jebena buna", "የጀበና ቡና"), t("Macchiato", "ማኪያቶ"), t("Chechebsa", "ጨጨብሳ"), t("Beyaynetu", "በያይነቱ"), t("Shiro tegabino", "ሽሮ ተጋቢኖ"), t("Spris", "ስፕሪስ"), t("Difo dabo", "ድፎ ዳቦ")],
        },
        {
          // Centrepiece: Delta's coffee cycle, told as the house's own bean-to-cup story.
          type: "tabs",
          id: "coffee",
          eyebrow: t("Our coffee", "ቡናችን"),
          heading: t("Green beans in, fresh coffee out", "ጥሬው ገብቶ፣ ትኩሱ ይወጣል"),
          items: [
            {
              label: t("The roast", "ቡና መቁላት"),
              heading: t("Roasted in clay before we open", "በር ከመክፈታችን በፊት በሸክላ የሚቆላ"),
              body: t(
                "We buy green coffee from Sidama and Yirgacheffe in small lots and roast it here in a clay pan at dawn. By the time you walk in, the whole house smells of it.",
                "ጥሬ ቡናውን ከሲዳማና ከይርጋጨፌ በትንሽ በትንሹ ገዝተን ጎህ ሲቀድ እዚሁ በሸክላ ምጣድ እንቆላለን። እርስዎ ሲገቡ ቤቱ በሙሉ በቡና መዓዛ ታውዷል።",
              ),
              image: P.roast,
              points: [
                t("Roasted fresh every morning, never the day before", "በየማለዳው የሚቆላ፣ የትናንት ቡና አናቀርብም"),
                t("Roasted beans to take home, 350 Br a quarter kilo", "የተቆላ ቡና ለቤትዎ፣ ሩብ ኪሎ በ350 ብር"),
              ],
            },
            {
              label: t("The ceremony", "ሥነ ሥርዓቱ"),
              heading: t("Three rounds, no hurry", "ሦስት ዙር፣ ያለ ጥድፊያ"),
              body: t(
                "Abol, tona, bereka: the first cup is the strongest, the third is the blessing. We hold the ceremony at 10:00 and 4:00 by the window, with popcorn and incense. Join a round for the price of a cup.",
                "አቦል፣ ቶና፣ በረካ፦ የመጀመሪያው ስኒ ጠንካራው ነው፤ ሦስተኛው በረከቱ። ሥነ ሥርዓቱን ከጠዋቱ 4 እና ከቀኑ 10 ሰዓት በመስኮቱ አጠገብ ከፈንዲሻና ከዕጣን ጋር እናካሂዳለን። በአንድ ስኒ ዋጋ ይቀላቀሉ።",
              ),
              image: P.incense,
              points: [
                t("60 Br a cup to join a round", "አንድ ዙር ለመቀላቀል በስኒ 60 ብር"),
                t("600 Br for your own ceremony, up to 6 people", "ለራስዎ ሥነ ሥርዓት 600 ብር፣ እስከ 6 ሰው"),
              ],
              action: reserve,
            },
            {
              label: t("The family", "ቤተሰባችን"),
              heading: t("One family, one jebena", "አንድ ቤተሰብ፣ አንድ ጀበና"),
              body: t(
                "The café is run by one family. We started with one jebena, six stools and our mother's recipe for chechebsa. Come for a quick macchiato at the counter, or sit down for the whole afternoon.",
                "ካፌውን የሚያስተዳድረው አንድ ቤተሰብ ነው። የጀመርነው በአንድ ጀበና፣ በስድስት በርጩማና በእናታችን የጨጨብሳ አሠራር ነው። ለፈጣን ማኪያቶ ብቅ ይበሉ፤ አሊያም ከሰዓቱን ሙሉ ተቀምጠው ያሳልፉ።",
              ),
              image: P.cups,
              points: [t("Fasting dishes every day of the week", "የጾም ምግብ በሳምንቱ ቀናት ሁሉ")],
              action: link("Our story", "ታሪካችን", "/story"),
            },
          ],
        },
        {
          type: "testimonials",
          id: "reviews",
          eyebrow: t("Guests say", "ደንበኞች ምን ይላሉ"),
          heading: t("Kind words over coffee", "በቡና ላይ የተባሉ መልካም ቃላት"),
          items: [
            { quote: t("The only place on Bole Road where the coffee still tastes like my mother's. I stop here before work every day.", "በቦሌ መንገድ ላይ ቡናው እንደ እናቴ ቡና የሚጣፍጥበት ብቸኛ ቤት። ሥራ ከመግባቴ በፊት በየቀኑ እዚህ እቆማለሁ።"), name: "Hanna T.", role: t("Comes every morning", "የየማለዳ ደንበኛ") },
            { quote: t("We brought visitors for the full ceremony. They roasted the beans in front of us and nobody wanted to leave.", "እንግዶቻችንን ለሙሉ ሥነ ሥርዓት ይዘን መጣን። ቡናውን በፊታችን ቆሉልን፤ ማንም መነሳት አልፈለገም።"), name: "Samuel G.", role: t("Booked a ceremony for 8", "ለ8 ሰው ሥነ ሥርዓት ያስያዘ") },
            { quote: t("The beyaynetu is generous and fresh, and the price is fair for Bole.", "በያይነቱው የተትረፈረፈና ትኩስ ነው፤ ዋጋውም ለቦሌ ተመጣጣኝ ነው።"), name: "Meron A.", role: t("Lunch regular", "የምሳ ደንበኛ") },
          ],
        },
        bookingForm,
        { type: "contact", id: "contact", heading: t("Visit or call us", "ይጎብኙን ወይም ይደውሉልን"), intro: t("Call ahead and your takeaway order will be ready when you arrive.", "አስቀድመው ቢደውሉ ይዘው የሚሄዱት ትዕዛዝ ሲደርሱ ተዘጋጅቶ ይጠብቅዎታል።") },
        { type: "map", heading: t("Three minutes from Edna Mall", "ከኤድና ሞል ሦስት ደቂቃ"), query: "Edna Mall, Bole, Addis Ababa" },
        {
          type: "cta",
          id: "visit",
          heading: t("Come for the coffee, stay for lunch", "ለቡና ይምጡ፤ ለምሳ ይቆዩ"),
          body: t("Open every day. No booking needed for a cup or a plate.", "በየቀኑ ክፍት ነን። ለአንድ ስኒ ቡና ወይም ለምሳ ማስያዝ አያስፈልግም።"),
          image: P.pots,
          primaryAction: seeMenu,
          secondaryAction: callUs,
        },
      ],
    },
    {
      path: "/menu",
      title: t("Menu", "ምናሌ"),
      nav: t("Menu", "ምናሌ"),
      description: t("The full menu of Bole Buna House with prices in Birr: coffee, breakfast, meals, pastries and juice.", "የቦሌ ቡና ቤት ሙሉ ምናሌ ከዋጋ ጋር፦ ቡና፣ ቁርስ፣ ምግብ፣ ኬክና ጭማቂ።"),
      sections: [
        {
          type: "hero",
          variant: "banner",
          eyebrow: t("Menu", "ምናሌ"),
          heading: t("Cooked today, priced fairly", "ዛሬ የተሠራ፣ በተመጣጣኝ ዋጋ"),
          subheading: t("Everything is made here each morning. Prices are in Birr and include VAT.", "ሁሉም በየማለዳው እዚሁ ይዘጋጃል። ዋጋዎቹ በብር ሲሆኑ ተ.እ.ታን ያካትታሉ።"),
          image: P.bread,
        },
        {
          type: "menu",
          id: "menu",
          eyebrow: t("Eat in or take away", "እዚሁ ወይም ይዘው ይሂዱ"),
          heading: t("Our menu", "ምናሌያችን"),
          categories: [
            {
              name: t("Coffee and tea", "ቡናና ሻይ"),
              items: [
                { name: t("Jebena buna", "የጀበና ቡና"), description: t("Brewed in clay, served with popcorn", "በጀበና የተፈላ፣ ከፈንዲሻ ጋር"), price: birr(60), image: P.jebena },
                { name: t("Macchiato", "ማኪያቶ"), description: t("Short and strong, with steamed milk", "አጭርና ጠንካራ፣ ከተፈላ ወተት ጋር"), price: birr(80), image: P.latte },
                { name: t("Espresso", "ኤስፕሬሶ"), price: birr(70) },
                { name: t("Caffè latte", "ካፌ ላቴ"), price: birr(110) },
                { name: t("Spris", "ስፕሪስ"), description: t("Half coffee, half tea, the Addis way", "ግማሽ ቡና፣ ግማሽ ሻይ"), price: birr(70) },
                { name: t("Spiced tea", "የቅመም ሻይ"), description: t("With cinnamon, cardamom and cloves", "ከቀረፋ፣ ከኮረሪማና ከቅርንፉድ ጋር"), price: birr(50) },
                { name: t("Full coffee ceremony", "ሙሉ የቡና ሥነ ሥርዓት"), description: t("Roasted at your table, three rounds, popcorn and incense. For up to 6 people; please book", "በጠረጴዛዎ ላይ የሚቆላ፣ አቦል፣ ቶና፣ በረካ፤ ከፈንዲሻና ከዕጣን ጋር። እስከ 6 ሰው፤ እባክዎ አስቀድመው ያስይዙ"), price: birr(600) },
              ],
            },
            {
              name: t("Breakfast", "ቁርስ"),
              items: [
                { name: t("Chechebsa", "ጨጨብሳ"), description: t("Torn flatbread in spiced butter, with honey and yoghurt", "በቅመም ቅቤ የታሸ ቂጣ፣ ከማርና ከእርጎ ጋር"), price: birr(280), tag: popular },
                { name: t("Firfir", "ፍርፍር"), description: t("Injera in berbere sauce, with or without meat", "በበርበሬ ወጥ የተፈረፈረ እንጀራ፣ በሥጋ ወይም ያለ ሥጋ"), price: birr(300) },
                { name: t("Ful", "ፉል"), description: t("Mashed beans with tomato, onion, green pepper and bread", "ከቲማቲም፣ ከሽንኩርትና ከቃሪያ ጋር፣ በዳቦ"), price: birr(220), tag: fasting },
                { name: t("Scrambled eggs", "እንቁላል ፍርፍር"), description: t("With tomato, onion and bread", "ከቲማቲምና ከሽንኩርት ጋር፣ በዳቦ"), price: birr(240) },
                { name: t("Kinche", "ቅንጬ"), description: t("Cracked wheat cooked soft in spiced butter", "በቅመም ቅቤ የበሰለ ቅንጬ"), price: birr(200) },
              ],
            },
            {
              name: t("Meals", "ምግብ"),
              items: [
                { name: t("Tibs and kitfo plate", "ጥብስና ክትፎ"), description: t("With ayib, injera and mitmita. Good for two", "ከአይብ፣ ከእንጀራና ከሚጥሚጣ ጋር። ለሁለት ሰው"), price: birr(680), image: P.tibs },
                { name: t("Beyaynetu", "በያይነቱ"), description: t("Misir wot, kik alicha and gomen on injera", "ምስር ወጥ፣ ክክ አልጫና ጎመን በእንጀራ ላይ"), price: birr(340), tag: fasting },
                { name: t("Shiro tegabino", "ሽሮ ተጋቢኖ"), description: t("Served bubbling in a clay pot", "በሸክላ ድስት እየፈላ የሚቀርብ"), price: birr(260), tag: fasting },
                { name: t("Beef tibs", "የበሬ ጥብስ"), description: t("Fried with onion, rosemary and green pepper", "በሽንኩርት፣ በጥብስ ቅጠልና በቃሪያ የተጠበሰ"), price: birr(520) },
                { name: t("Doro wot", "ዶሮ ወጥ"), description: t("Slow-cooked chicken stew with an egg. Saturdays and Sundays", "በዝግታ የበሰለ ዶሮ ወጥ ከእንቁላል ጋር። ቅዳሜና እሑድ ብቻ"), price: birr(620) },
              ],
            },
            {
              name: t("Bakery and juice", "ዳቦ፣ ኬክና ጭማቂ"),
              items: [
                { name: t("Croissant", "ክሮሳንት"), price: birr(120), image: P.pastries },
                { name: t("Fruit danish", "የፍራፍሬ ኬክ"), price: birr(140) },
                { name: t("Sugared doughnut", "ዶናት"), price: birr(70) },
                { name: t("Difo dabo, a slice", "ድፎ ዳቦ፣ በቁራሽ"), description: t("Home-baked wheat bread", "በቤት የተጋገረ የስንዴ ዳቦ"), price: birr(60), tag: fasting },
                { name: t("Avocado juice", "የአቮካዶ ጭማቂ"), price: birr(180) },
                { name: t("Layered juice", "ስፕሪስ ጭማቂ"), description: t("Avocado, mango and papaya in layers", "አቮካዶ፣ ማንጎና ፓፓያ በንብርብር"), price: birr(200), tag: popular },
              ],
            },
          ],
        },
        {
          type: "services",
          variant: "list",
          eyebrow: t("Good to know", "ማወቅ ያለብዎ"),
          heading: t("How we serve", "አገልግሎታችን"),
          items: [
            { icon: "leaf", title: t("Fasting food every day", "የጾም ምግብ በየቀኑ"), description: t("Dishes marked Fasting have no meat, egg or dairy.", "«የጾም» የተባሉት ምግቦች ሥጋ፣ እንቁላልም ሆነ የወተት ተዋጽኦ የላቸውም።") },
            { icon: "shopping-bag", title: t("Takeaway", "ይዘው ይሂዱ"), description: t("Call with your order and collect it in 15 minutes.", "ደውለው ያዝዙ፤ በ15 ደቂቃ ውስጥ መጥተው ይውሰዱ።") },
            { icon: "coffee", title: t("Beans to take home", "የተቆላ ቡና ለቤትዎ"), description: t("Roasted this morning, 350 Br a quarter kilo, ground if you like.", "ዛሬ ጠዋት የተቆላ፣ ሩብ ኪሎ በ350 ብር፤ ከፈለጉ ተፈጭቶ።") },
            { icon: "users", title: t("Groups", "ቡድኖች"), description: t("Six or more? Tell us a day ahead and we set a long table.", "ስድስትና ከዚያ በላይ ከሆናችሁ ከአንድ ቀን በፊት ንገሩን፤ ረጅም ጠረጴዛ እናዘጋጃለን።") },
          ],
        },
        {
          type: "cta",
          heading: t("Hungry already?", "ራበዎት?"),
          body: t("Walk in any day, or call and we will have it packed.", "በማንኛውም ቀን ይምጡ፤ ወይም ይደውሉ፣ አሽገን እንጠብቅዎታለን።"),
          primaryAction: callUs,
          secondaryAction: reserve,
        },
      ],
    },
    {
      path: "/story",
      title: t("Our story", "ታሪካችን"),
      nav: t("Our story", "ታሪካችን"),
      description: t("How Bole Buna House buys, roasts and serves its coffee, and when the daily ceremony is held.", "ቦሌ ቡና ቤት ቡናውን እንዴት እንደሚገዛ፣ እንደሚቆላና እንደሚያቀርብ፤ የዕለቱ ሥነ ሥርዓትም መቼ እንደሆነ።"),
      sections: [
        {
          type: "hero",
          variant: "split",
          eyebrow: t("Since 2015", "ከ2007 ዓ.ም. ጀምሮ"),
          heading: t("A family house built around the jebena", "በጀበና ዙሪያ የተመሠረተ የቤተሰብ ቤት"),
          subheading: t("We started with one jebena, six stools and our mother's recipe for chechebsa. The jebena is bigger now. The recipe is the same.", "የጀመርነው በአንድ ጀበና፣ በስድስት በርጩማና በእናታችን የጨጨብሳ አሠራር ነው። ዛሬ ጀበናው ተልቋል፤ አሠራሩ ግን ያው ነው።"),
          image: P.incense,
          primaryAction: seeMenu,
        },
        {
          type: "gallery",
          id: "gallery",
          eyebrow: t("Around the house", "በቤታችን"),
          heading: t("A morning at Buna House", "አንድ ማለዳ በቡና ቤታችን"),
          images: [
            P.roast,
            P.bread,
            img("tours-gallery-spice-market", "A woman in a green headscarf sorting red and green chillies and ginger at an open-air market", "አረንጓዴ ሻሽ ያሰረች ሴት በገበያ ላይ ቃሪያና ዝንጅብል ስትለይ"),
            P.pastries,
            img("shop-card-jebena-pottery", "Black clay jebena coffee pots and a red clay bottle painted with white patterns", "ጥቁር የሸክላ ጀበናዎችና በነጭ ጌጥ የተሣለ ቀይ የሸክላ ጠርሙስ"),
          ],
        },
        {
          type: "about",
          eyebrow: t("The ceremony", "ሥነ ሥርዓቱ"),
          heading: t("Three rounds, no hurry", "ሦስት ዙር፣ ያለ ጥድፊያ"),
          body: t(
            "Abol, tona, bereka: the first cup is the strongest, the third is the blessing. Our ceremony takes about an hour, because that is how long good talk takes.\n\nWe hold it twice a day in the corner by the window. Anyone can join a round for the price of a cup, or you can reserve the whole ceremony for your own guests.",
            "አቦል፣ ቶና፣ በረካ፦ የመጀመሪያው ስኒ ጠንካራው ነው፤ ሦስተኛው በረከቱ። ሥነ ሥርዓታችን አንድ ሰዓት ያህል ይወስዳል፤ ጥሩ ጨዋታም ያን ያህል ጊዜ ይፈልጋልና።\n\nበቀን ሁለት ጊዜ በመስኮቱ አጠገብ ባለው ጥግ እናካሂዳለን። ማንም ሰው በአንድ ስኒ ዋጋ መቀላቀል ይችላል፤ ለራስዎ እንግዶች ሙሉውን ሥነ ሥርዓት ማስያዝም ይቻላል።",
          ),
          image: P.cups,
          highlights: [
            { value: t("3", "3"), label: t("rounds of coffee", "ዙር ቡና") },
            { value: t("600 Br", "600 ብር"), label: t("private, up to 6", "ለግል፣ እስከ 6 ሰው") },
          ],
          action: reserve,
        },
        {
          type: "schedule",
          id: "day",
          layout: "tiles",
          eyebrow: t("Every day", "በየቀኑ"),
          heading: t("A day at Buna House", "የቡና ቤታችን ውሎ"),
          items: [
            { time: t("6:00 am", "ከጠዋቱ 12 ሰዓት"), title: t("Roasting", "ቡና ቆሎ"), note: t("Before we open", "በር ከመክፈታችን በፊት"), at: "06:00" },
            { time: t("7:00 am", "ከጠዋቱ 1 ሰዓት"), title: t("Doors open, breakfast", "በር ይከፈታል፣ ቁርስ"), note: t("Until 11:00", "እስከ 5 ሰዓት"), at: "07:00" },
            { time: t("10:00 am", "ከጠዋቱ 4 ሰዓት"), title: t("Morning ceremony", "የጠዋት ሥነ ሥርዓት"), note: t("Join for 60 Br a cup", "በስኒ 60 ብር ይቀላቀሉ"), at: "10:00" },
            { time: t("12:00 pm", "ከቀኑ 6 ሰዓት"), title: t("Lunch", "ምሳ"), note: t("Hot dishes until closing", "ትኩስ ምግብ እስከ መዝጊያ"), at: "12:00" },
            { time: t("4:00 pm", "ከቀኑ 10 ሰዓት"), title: t("Afternoon ceremony", "የከሰዓት ሥነ ሥርዓት"), note: t("With fresh difo dabo", "ከትኩስ ድፎ ዳቦ ጋር"), at: "16:00" },
          ],
          footnote: t("On Sundays we open at 8:00 am and hold one ceremony, at 4:00 pm.", "እሑድ ከጠዋቱ 2 ሰዓት እንከፍታለን፤ ሥነ ሥርዓቱም አንድ ጊዜ፣ ከቀኑ 10 ሰዓት ነው።"),
        },
        {
          type: "quote",
          quote: t("Coffee is not something you drink alone. Pull up a stool.", "ቡና ለብቻ አይጠጣም። በርጩማ ይሳቡና ይቀመጡ።"),
          name: t("The family at Bole Buna House", "የቦሌ ቡና ቤት ቤተሰብ"),
        },
        {
          type: "cta",
          heading: t("Taste it for yourself", "መጥተው ይቅመሱት"),
          image: P.tibs,
          primaryAction: seeMenu,
          secondaryAction: reserve,
        },
      ],
    },
    {
      path: "/visit",
      title: t("Visit", "አድራሻ"),
      nav: t("Visit", "አድራሻ"),
      description: t("Opening hours, address, phone and Telegram for Bole Buna House, near Edna Mall.", "የቦሌ ቡና ቤት የሥራ ሰዓት፣ አድራሻ፣ ስልክና ቴሌግራም፤ ኤድና ሞል አጠገብ።"),
      sections: [
        { type: "contact", heading: t("Find us on Bole Road", "በቦሌ መንገድ ያገኙናል"), intro: t("We answer the phone and Telegram whenever the doors are open.", "በሥራ ሰዓታችን ስልክና ቴሌግራም እንመልሳለን።") },
        { type: "map", heading: t("Where we are", "የምንገኝበት"), query: "Edna Mall, Bole, Addis Ababa" },
        {
          type: "faq",
          heading: t("Before you come", "ከመምጣትዎ በፊት"),
          items: [
            { question: t("Do I need to book a table?", "ጠረጴዛ አስቀድሞ መያዝ ያስፈልጋል?"), answer: t("No, just walk in. Book only for the full ceremony or for six people or more.", "አያስፈልግም፤ በቀጥታ ይምጡ። ማስያዝ የሚያስፈልገው ለሙሉ ሥነ ሥርዓት ወይም ለስድስትና ከዚያ በላይ ሰው ብቻ ነው።") },
            { question: t("How can I pay?", "ክፍያ እንዴት ነው?"), answer: t("Cash, Telebirr or bank transfer.", "በጥሬ ገንዘብ፣ በቴሌብር ወይም በባንክ ዝውውር።") },
            { question: t("Is there parking?", "የመኪና ማቆሚያ አለ?"), answer: t("There are a few places in front, and guarded street parking beside Edna Mall.", "ከፊት ለፊት ጥቂት ቦታዎች አሉ፤ በኤድና ሞል አጠገብም ጥበቃ ያለው የመንገድ ዳር ማቆሚያ አለ።") },
            { question: t("Do you deliver?", "ቤት ድረስ ታደርሳላችሁ?"), answer: t("Not yet. You can order by phone and collect, or send a rider to pick it up.", "እስካሁን አናደርስም። በስልክ አዝዘው መጥተው መውሰድ ወይም አድራሽ መላክ ይችላሉ።") },
          ],
        },
        {
          type: "form",
          id: "message",
          kind: "contact",
          heading: t("Send us a message", "መልእክት ይላኩልን"),
          intro: t("Catering, a large order, or a word about your visit: we read everything.", "ለድግስ፣ ለብዛት ትዕዛዝ ወይም ስለ ቆይታዎ አስተያየት፦ ሁሉንም እናነባለን።"),
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
