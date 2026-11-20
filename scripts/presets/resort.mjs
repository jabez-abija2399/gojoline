import { t, img, link, birr, save } from "./lib.mjs";

// A luxury hotel told like a magazine: the "grand" art direction (oversized serif, champagne
// hairlines, asymmetric photographs). Every photo is from the template's licensed library.
const reserve = link("Reserve your stay", "ቆይታዎን ያስይዙ", "/reserve");
const reserveSuite = link("Reserve this suite", "ይህን ስዊት ያስይዙ", "/reserve");
const night = t("per night for two, breakfast and spa included", "ለሁለት በአዳር፣ ቁርስና ስፓ ተካትቶ");

const suites = [
  {
    image: img("hotel-card-thatched-suite", "A suite under a high thatched roof with a draped four-poster bed and two cream armchairs", "ከፍ ያለ የሳር ክዳን ያለው ስዊት፣ መጋረጃ የተንጠለጠለበት አልጋና ሁለት ነጭ ወንበሮች"),
    subtitle: t("Our largest suite", "ትልቁ ስዊታችን"),
    title: t("The Acacia Suite", "የግራር ስዊት"),
    badge: t("Most requested", "በብዛት የሚጠየቅ"),
    meta: [t("2 guests", "2 እንግዶች"), t("64 m²", "64 ካሬ ሜትር"), t("Private terrace", "የግል በረንዳ")],
    description: t("A four-poster bed under a thatched roof, a deep bath, and a terrace that faces the hills at sunrise.", "በሳር ክዳን ሥር ባለ መጋረጃ አልጋ፣ ጥልቅ የገላ መታጠቢያ፣ እና ፀሐይ ስትወጣ ኮረብታዎቹን የሚመለከት በረንዳ።"),
    price: birr(28000),
    priceNote: night,
    action: reserveSuite,
  },
  {
    image: img("hotel-card-wooden-cabin-room", "A warm wood-panelled bedroom with a double bed and two round wicker chairs", "በእንጨት የተለበጠ ሞቅ ያለ መኝታ ክፍል፣ ድርብ አልጋና ሁለት ክብ የሸምበቆ ወንበሮች"),
    subtitle: t("Among the trees", "በዛፎቹ መካከል"),
    title: t("The Cedar Room", "የጽድ ክፍል"),
    meta: [t("2 guests", "2 እንግዶች"), t("38 m²", "38 ካሬ ሜትር"), t("Reading corner", "የንባብ ጥግ")],
    description: t("Panelled in warm wood, with wicker chairs by the window and the sound of the garden at night.", "በሞቀ እንጨት የተለበጠ፣ በመስኮቱ አጠገብ የሸምበቆ ወንበሮች፣ ማታ የአትክልቱ ድምፅ የሚሰማበት።"),
    price: birr(19500),
    priceNote: night,
    action: reserveSuite,
  },
  {
    image: img("hotel-card-standard-room", "A bright room with a white bed, ochre cushions and an arched niche above the headboard", "ነጭ አልጋ፣ ቢጫ ትራሶችና ከራስጌው በላይ ቅስት ያለው ብሩህ ክፍል"),
    subtitle: t("Opening onto the lawn", "ወደ መስኩ የሚከፈት"),
    title: t("The Garden Room", "የአትክልት ክፍል"),
    meta: [t("2 guests", "2 እንግዶች"), t("32 m²", "32 ካሬ ሜትር"), t("Garden door", "ወደ አትክልቱ በር")],
    description: t("Light from morning to evening, a door straight onto the lawn, and breakfast brought to you outside.", "ከጠዋት እስከ ማታ ብርሃን፣ በቀጥታ ወደ መስኩ የሚያወጣ በር፣ እና ቁርስ ውጭ ይቀርብልዎታል።"),
    price: birr(15000),
    priceNote: night,
    action: reserveSuite,
  },
];

const bookingForm = {
  type: "form",
  id: "booking",
  kind: "booking",
  eyebrow: t("Reservations", "ቦታ ማስያዝ"),
  heading: t("Reserve your stay", "ቆይታዎን ያስይዙ"),
  intro: t("Tell us when you would like to come. The house answers personally within a few hours, by phone or Telegram.", "መቼ መምጣት እንደሚፈልጉ ይንገሩን። በጥቂት ሰዓታት ውስጥ በስልክ ወይም በቴሌግራም በግል እንመልስልዎታለን።"),
  fields: [
    { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
    { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true },
    { name: "arrival", label: t("Arrival date", "የሚደርሱበት ቀን"), type: "date", required: true },
    { name: "nights", label: t("Nights", "የአዳር ብዛት"), type: "number", required: true },
    { name: "suite", label: t("Suite", "ስዊት"), type: "select", options: [t("The Acacia Suite", "የግራር ስዊት"), t("The Cedar Room", "የጽድ ክፍል"), t("The Garden Room", "የአትክልት ክፍል")] },
    { name: "wishes", label: t("Anything we should prepare?", "የምናዘጋጅልዎ ነገር አለ?"), type: "textarea" },
  ],
  submitLabel: t("Send my request", "ጥያቄዬን ላክ"),
  successMessage: t("Thank you. We will be in touch within a few hours to confirm your stay.", "እናመሰግናለን። ቆይታዎን ለማረጋገጥ በጥቂት ሰዓታት ውስጥ እናገኝዎታለን።"),
};

save("resort", {
  name: t("Wanza Hill Retreat", "ዋንዛ ሂል ሪትሪት"),
  tagline: t("A small luxury retreat in the hills above Bishoftu", "ከቢሾፍቱ በላይ ባሉ ኮረብታዎች ላይ ያለ ትንሽ ቅንጡ ማረፊያ"),
  languages: ["en", "am"],
  theme: { primary: "#7E6136", accent: "#1E1C19", background: "#F6F1E8", text: "#23201C", highlight: "#D8C3A0", font: "elegant", radius: "none", style: "grand" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Wanza Hill road, Bishoftu", "ዋንዛ ሂል መንገድ፣ ቢሾፍቱ"),
    hours: [
      { days: t("Reception", "እንግዳ መቀበያ"), time: t("Open day and night", "ቀንና ሌሊት ክፍት") },
      { days: t("Spa, every day", "ስፓ፣ በየቀኑ"), time: t("8:00 am to 8:00 pm", "ከጠዋቱ 2 እስከ ምሽቱ 2 ሰዓት") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("The house", "ቤቱ"),
      description: t("Wanza Hill Retreat: twelve suites, a spa and a long table under the acacias, in the hills above Bishoftu.", "ዋንዛ ሂል ሪትሪት፦ አሥራ ሁለት ስዊቶች፣ ስፓ እና በግራሮች ሥር ረጅም ገበታ፣ ከቢሾፍቱ በላይ ባሉ ኮረብታዎች።"),
      sections: [
        {
          type: "hero",
          id: "top",
          variant: "immersive",
          eyebrow: t("Bishoftu · Ethiopia", "ቢሾፍቱ · ኢትዮጵያ"),
          heading: t("Stillness, above the hills", "ከኮረብታዎቹ በላይ ያለ ጸጥታ"),
          subheading: t("Twelve suites among the acacias, a spa, a long table under the trees, and nothing that must be done before sunset.", "በግራሮች መካከል አሥራ ሁለት ስዊቶች፣ ስፓ፣ በዛፎች ሥር ረጅም ገበታ፤ ፀሐይ ከመጥለቋ በፊት መሠራት ያለበት ምንም ነገር የለም።"),
          image: img("hotel-hero-infinity-pool-hills", "A curved infinity pool with loungers on a terrace overlooking acacia-covered hills", "በግራር የተሸፈኑ ኮረብታዎችን የሚመለከት፣ ማረፊያ ወንበሮች ያሉት ጠርዝ የሌለው መዋኛ"),
          primaryAction: reserve,
          secondaryAction: link("Discover the suites", "ስዊቶቹን ይመልከቱ", "#suites"),
        },
        {
          type: "about",
          id: "house",
          eyebrow: t("The house", "ቤቱ"),
          heading: t("A private house, kept for a few guests at a time", "ለጥቂት እንግዶች ብቻ የሚዘጋጅ የግል ቤት"),
          body: t(
            "Wanza Hill began as a family house on the ridge. We kept its high thatched roofs, its cane chairs and its view, and made room for no more than twenty-four guests.\n\nThere is no lobby and no queue. Someone who knows your name meets you at the door, and the rest of the day is yours.",
            "ዋንዛ ሂል በኮረብታው ጫፍ ላይ ያለ የቤተሰብ ቤት ሆኖ ነው የጀመረው። ከፍ ያሉ የሳር ክዳኖቹን፣ የሸምበቆ ወንበሮቹንና እይታውን ጠብቀን፣ ከሃያ አራት ለማይበልጡ እንግዶች ቦታ አዘጋጀን።\n\nእዚህ ሰልፍም ትልቅ አዳራሽም የለም። ስምዎን የሚያውቅ ሰው በሩ ላይ ይቀበልዎታል፤ የቀረው ቀን የእርስዎ ነው።",
          ),
          image: img("hotel-about-thatched-lounge", "An open-air lounge under a high thatched roof with cane armchairs and a leather sofa, garden beyond", "ከፍ ባለ የሳር ክዳን ሥር ያለ ክፍት የመቀመጫ ቦታ፣ የሸምበቆ ወንበሮችና የቆዳ ሶፋ፣ ከኋላ አትክልት"),
          imageSide: "start",
          action: link("Our suites and rates", "ስዊቶችና ዋጋዎች", "/suites"),
        },
        {
          type: "cards",
          id: "suites",
          layout: "feature",
          eyebrow: t("Rooms & suites", "ክፍሎችና ስዊቶች"),
          heading: t("Signature suites", "ልዩ ስዊቶቻችን"),
          items: suites,
        },
        {
          type: "tabs",
          id: "experiences",
          eyebrow: t("Experiences", "ልምዶች"),
          heading: t("Days shaped around you", "በእርስዎ ልክ የተቀረጹ ቀናት"),
          intro: t("Nothing is scheduled unless you ask. These are the things guests come back for.", "እርስዎ ካልጠየቁ ምንም ቀጠሮ የለም። እንግዶች ተመልሰው የሚመጡባቸው ነገሮች እነዚህ ናቸው።"),
          items: [
            {
              label: t("The spa", "ስፓው"),
              heading: t("An afternoon in the spa", "ከሰዓት በስፓው"),
              body: t("Massages with oils pressed from Ethiopian herbs, a steam room of eucalyptus, and a quiet garden to rest in after.", "በኢትዮጵያ ዕፅዋት ዘይት የሚደረግ ማሳጅ፣ የባሕር ዛፍ የእንፋሎት ክፍል፣ ከዚያም የሚያርፉበት ጸጥ ያለ አትክልት።"),
              image: img("hotel-card-spa-massage", "A guest with eyes closed receiving a back massage on a white table", "ዓይኗን ጨፍና በነጭ አልጋ ላይ የጀርባ ማሳጅ የምትወስድ እንግዳ"),
              points: [t("One treatment a day, included", "በቀን አንድ ሕክምና፣ ተካትቶ"), t("Open every day until 8 pm", "በየቀኑ እስከ ምሽቱ 2 ሰዓት ክፍት")],
            },
            {
              label: t("The long table", "ረጅሙ ገበታ"),
              heading: t("Dinner under the acacia", "በግራሩ ሥር እራት"),
              body: t("On clear evenings we lay one long table in the open, and the kitchen cooks over fire from what the farm brought that morning.", "ጥርት ባሉ ምሽቶች ሜዳ ላይ አንድ ረጅም ገበታ እናዘጋጃለን፤ ወጥ ቤቱ በዚያው ጠዋት ከእርሻው በመጣው በእሳት ያበስላል።"),
              image: img("hotel-gallery-bush-dining-acacia", "A long table with a red cloth set in open grassland beside a lone acacia under a wide sky", "ሰፊ ሰማይ ሥር ከብቸኛ ግራር አጠገብ ቀይ ልብስ የለበሰ ረጅም ገበታ"),
              points: [t("Every Friday and Saturday", "በየዓርብና ቅዳሜ"), t("Tell us what you don't eat", "የማይመገቡትን ይንገሩን")],
            },
            {
              label: t("Coffee", "ቡና"),
              heading: t("The coffee ceremony", "የቡና ሥነ ሥርዓት"),
              body: t("Every afternoon at four, beans are roasted, ground and poured from the jebena on the terrace. Stay for all three rounds.", "በየቀኑ ከሰዓት በ10 ሰዓት ቡናው በበረንዳው ላይ ይቆላል፣ ይወቀጣል፣ ከጀበናው ይቀዳል። ሦስቱንም ዙር ይቆዩ።"),
              image: img("hotel-gallery-jebena-coffee-pour", "A hand pouring coffee from a clay jebena into a white cup on a tray of coffee beans", "ቡና በተበተነበት ትሪ ላይ ከሸክላ ጀበና ወደ ነጭ ስኒ ቡና የሚቀዳ እጅ"),
            },
            {
              label: t("Evenings", "ምሽቶች"),
              heading: t("Evenings on the veranda", "ምሽት በበረንዳው"),
              body: t("Lanterns on the stone veranda, a fire when the hills turn cold, and the quiet of a house with very few guests.", "በድንጋዩ በረንዳ ላይ ፋኖሶች፣ ኮረብታው ሲቀዘቅዝ እሳት፣ እና በጣም ጥቂት እንግዶች ያሉበት ቤት ጸጥታ።"),
              image: img("hotel-gallery-veranda-dusk", "A colonnaded veranda with a stone base and soft lights above a lawn at dusk", "ሲመሽ በመስኩ ላይ ለስላሳ መብራቶች ያሉት፣ የድንጋይ መሠረትና ምሰሶዎች ያሉት በረንዳ"),
            },
          ],
        },
        {
          type: "hero",
          id: "destination",
          variant: "immersive",
          eyebrow: t("The destination", "መዳረሻው"),
          heading: t("The oldest highlands in Africa, a short flight away", "የአፍሪካ ጥንታዊ ደጋማ ቦታዎች፣ በአጭር በረራ"),
          subheading: t("From the house, our concierge arranges private journeys north: rock churches, castles, waterfalls and the roof of Ethiopia.", "ከቤቱ ሆኖ የእንግዶች አስተባባሪያችን ወደ ሰሜን የግል ጉዞዎችን ያዘጋጃል፦ ውቅር አብያተ ክርስቲያናት፣ ግንቦች፣ ፏፏቴዎችና የኢትዮጵያ ጣሪያ።"),
          image: img("tours-hero-highlands-sunset", "Sunset over Ethiopian highland ridges with a road winding through the valley", "በሸለቆው ውስጥ የሚጠመዘዝ መንገድ ያለበት የኢትዮጵያ ደጋማ ሸንተረሮች ላይ የፀሐይ መጥለቅ"),
        },
        {
          type: "cards",
          id: "journeys",
          layout: "scroll",
          eyebrow: t("Beyond the house", "ከቤቱ ባሻገር"),
          heading: t("Journeys we arrange", "የምናዘጋጃቸው ጉዞዎች"),
          items: [
            { image: img("tours-card-lalibela-monk", "A monk in a yellow robe reading beside a carved cross-shaped window in rock", "በዓለት በተቀረጸ የመስቀል ቅርጽ መስኮት አጠገብ ቢጫ ልብስ የለበሱ መነኩሴ ሲያነቡ"), title: t("Lalibela", "ላሊበላ"), subtitle: t("Two days · by air", "ሁለት ቀን · በአውሮፕላን") },
            { image: img("tours-card-simien-escarpment", "Sunlit green terraced escarpments and deep valleys of the Simien Mountains", "በፀሐይ የበሩ አረንጓዴ የሰሜን ተራሮች ገደሎችና ጥልቅ ሸለቆዎች"), title: t("The Simien Mountains", "የሰሜን ተራሮች"), subtitle: t("Three days · by air and road", "ሦስት ቀን · በአውሮፕላንና በመኪና") },
            { image: img("tours-card-blue-nile-falls", "The Blue Nile Falls in full flow surrounded by green forest", "በአረንጓዴ ደን የተከበበው የዓባይ ፏፏቴ በሙላት ሲፈስ"), title: t("The Blue Nile Falls", "የዓባይ ፏፏቴ"), subtitle: t("One day · by air", "አንድ ቀን · በአውሮፕላን") },
            { image: img("tours-gallery-gondar-castle", "The castle of Fasilides in Gondar framed by two tall trees", "በሁለት ረጃጅም ዛፎች መካከል የሚታየው የጎንደር የፋሲለደስ ግንብ"), title: t("Gondar", "ጎንደር"), subtitle: t("One day · by air", "አንድ ቀን · በአውሮፕላን") },
          ],
        },
        {
          type: "testimonials",
          id: "guests",
          eyebrow: t("Guests", "እንግዶች"),
          heading: t("In their words", "በራሳቸው ቃል"),
          items: [
            { quote: t("It felt less like a hotel than being the guest of a family with impeccable taste.", "ሆቴል ከመሆን ይልቅ ውብ ምርጫ ያለው ቤተሰብ እንግዳ የሆንን ያህል ተሰማን።"), name: "Hanna & Yonas", role: t("Anniversary, three nights", "የጋብቻ በዓል፣ ሦስት አዳር") },
            { quote: t("Dinner under the acacia is the most beautiful evening I have spent anywhere.", "በግራሩ ሥር የበላነው እራት ከመቼውም ያሳለፍኩት እጅግ ውብ ምሽት ነው።"), name: "Claire D.", role: t("Travelling from Paris", "ከፓሪስ የመጣች") },
            { quote: t("They remembered how I take my coffee on the second morning. That is the whole place in one detail.", "በሁለተኛው ጠዋት ቡናዬን እንዴት እንደምጠጣ አስታወሱ። ቦታው በሙሉ በዚያች አንድ ነገር ይገለጻል።"), name: "Samuel K.", role: t("Returning guest", "ተመላሽ እንግዳ") },
          ],
        },
        {
          type: "cta",
          id: "reserve",
          heading: t("Your evening is already set", "ምሽትዎ ተዘጋጅቷል"),
          body: t("Reserve directly with the house for our best rate, a spa treatment each day and a car from the airport.", "በቀጥታ ከእኛ ሲያስይዙ ምርጡን ዋጋ፣ በየቀኑ አንድ የስፓ ሕክምና እና ከአየር ማረፊያ መኪና ያገኛሉ።"),
          image: img("hotel-hero-lodge-pool-dusk", "A thatched lodge lit by lanterns at dusk, reflected in a dark pool", "ሲመሽ በፋኖሶች የበራ የሳር ክዳን ሎጅ፣ በጨለማው መዋኛ ውስጥ ሲንጸባረቅ"),
          primaryAction: reserve,
          secondaryAction: link("Call the house", "ወደ ቤቱ ይደውሉ", "tel:+251911000000"),
        },
      ],
    },
    {
      path: "/suites",
      title: t("Suites", "ስዊቶች"),
      nav: t("Suites", "ስዊቶች"),
      description: t("The Acacia Suite, the Cedar Room and the Garden Room at Wanza Hill Retreat, with rates per night.", "በዋንዛ ሂል ሪትሪት የግራር ስዊት፣ የጽድ ክፍልና የአትክልት ክፍል፣ ከአዳር ዋጋ ጋር።"),
      sections: [
        { type: "cards", id: "rates", layout: "grid", eyebrow: t("Suites & rates", "ስዊቶችና ዋጋዎች"), heading: t("Choose your suite", "ስዊትዎን ይምረጡ"), intro: t("Rates are per night for two guests and include breakfast, one spa treatment a day and the airport car.", "ዋጋዎቹ ለሁለት እንግዶች በአዳር ሲሆኑ ቁርስ፣ በቀን አንድ የስፓ ሕክምና እና የአየር ማረፊያ መኪናን ያካትታሉ።"), items: suites },
        {
          type: "services",
          id: "every-suite",
          variant: "numbered",
          eyebrow: t("In every suite", "በእያንዳንዱ ስዊት"),
          heading: t("The details we never leave out", "ፈጽሞ የማንዘነጋቸው ዝርዝሮች"),
          image: img("hotel-about-coffee-ceremony-host", "A host in a white habesha dress pouring coffee from a clay jebena into rows of small cups", "ነጭ የሀበሻ ቀሚስ የለበሰች አስተናጋጅ ከሸክላ ጀበና በተደረደሩ ትናንሽ ስኒዎች ቡና ስትቀዳ"),
          items: [
            { title: t("Linen and quiet", "ንጹሕ አልጋ ልብስና ጸጥታ"), description: t("Cotton sheets woven in Ethiopia, heavy curtains and no television unless you ask for one.", "በኢትዮጵያ የተሸመነ የጥጥ አንሶላ፣ ወፍራም መጋረጃዎች፣ ካልጠየቁ በስተቀር ቴሌቪዥን የለም።"), icon: "bed" },
            { title: t("Breakfast where you like", "ቁርስ በፈለጉበት"), description: t("In bed, on your terrace or at the long table. Served until late morning.", "በአልጋዎ፣ በበረንዳዎ ወይም በረጅሙ ገበታ። እስከ ረፋድ ይቀርባል።"), icon: "coffee" },
            { title: t("A car from the airport", "ከአየር ማረፊያ መኪና"), description: t("We meet you at Bole and drive you to the house, about an hour away.", "ቦሌ ላይ ተቀብለን አንድ ሰዓት ገደማ ወደሚርቀው ቤቱ እናደርስዎታለን።"), icon: "car" },
            { title: t("Someone to ask", "የሚጠይቁት ሰው"), description: t("One host looks after you for your whole stay, by phone or Telegram.", "በቆይታዎ ሙሉ አንድ አስተናጋጅ በስልክ ወይም በቴሌግራም ይንከባከብዎታል።"), icon: "key" },
          ],
        },
        {
          type: "faq",
          id: "faq",
          eyebrow: t("Before you come", "ከመምጣትዎ በፊት"),
          heading: t("Good to know", "ማወቅ ያለብዎ"),
          items: [
            { question: t("When can I arrive and leave?", "መቼ መድረስና መውጣት እችላለሁ?"), answer: t("Your suite is ready from 2 pm and yours until noon on the day you leave. Ask us for earlier or later.", "ስዊትዎ ከቀኑ 8 ሰዓት ጀምሮ ዝግጁ ሲሆን በሚወጡበት ቀን እስከ ቀኑ 6 ሰዓት የእርስዎ ነው። ቀደም ወይም ዘግየት ብለው ከፈለጉ ይጠይቁን።") },
            { question: t("How do I pay?", "ክፍያ እንዴት ነው?"), answer: t("We confirm your stay first. You pay at the house by bank transfer, Telebirr or card.", "መጀመሪያ ቆይታዎን እናረጋግጣለን። ክፍያው በቤቱ በባንክ ዝውውር፣ በቴሌብር ወይም በካርድ ይፈጸማል።") },
            { question: t("Are children welcome?", "ልጆች መምጣት ይችላሉ?"), answer: t("Yes, children of every age. The Acacia Suite takes an extra bed.", "አዎ፣ በማንኛውም ዕድሜ ያሉ ልጆች። የግራር ስዊት ተጨማሪ አልጋ ይይዛል።") },
          ],
        },
        {
          type: "cta",
          id: "reserve",
          heading: t("Come and stay", "መጥተው ይቆዩ"),
          body: t("Tell us your dates and the house will do the rest.", "ቀኖችዎን ይንገሩን፤ የቀረውን ቤቱ ያደርጋል።"),
          image: img("hotel-gallery-veranda-dusk", "A colonnaded veranda with soft lights above a lawn at dusk", "ሲመሽ በመስኩ ላይ ለስላሳ መብራቶች ያሉት ምሰሶዎች ያሉት በረንዳ"),
          primaryAction: reserve,
        },
      ],
    },
    {
      path: "/reserve",
      title: t("Reserve", "ያስይዙ"),
      nav: t("Reserve", "ያስይዙ"),
      description: t("Reserve a suite at Wanza Hill Retreat in Bishoftu. We answer within a few hours.", "በቢሾፍቱ ዋንዛ ሂል ሪትሪት ስዊት ያስይዙ። በጥቂት ሰዓታት ውስጥ እንመልሳለን።"),
      sections: [
        bookingForm,
        { type: "contact", id: "contact", eyebrow: t("The house", "ቤቱ"), heading: t("Speak to us directly", "በቀጥታ ያነጋግሩን"), intro: t("Call or write on Telegram. A person answers, day and night.", "ይደውሉ ወይም በቴሌግራም ይጻፉ። ቀንና ሌሊት ሰው ይመልሳል።") },
        { type: "map", id: "map", eyebrow: t("Getting here", "አደራረስ"), heading: t("An hour from Bole airport", "ከቦሌ አየር ማረፊያ አንድ ሰዓት"), query: "Bishoftu, Ethiopia" },
      ],
    },
  ],
});
