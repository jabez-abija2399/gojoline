import { t, img, link, birr, save } from "./lib.mjs";

// Fine dining by candlelight: the "noir" art direction turns the page dark from these light-first
// colours (the accent becomes the room, the background the ink, the primary the brass).
const reserve = link("Reserve a table", "ጠረጴዛ ያስይዙ", "/reserve");

save("dining", {
  name: t("ESAT", "እሳት"),
  tagline: t("A kitchen built around a wood fire. Dinner, Tuesday to Saturday, in Bole.", "በእንጨት እሳት ዙሪያ የተገነባ ወጥ ቤት። እራት፣ ከማክሰኞ እስከ ቅዳሜ፣ በቦሌ።"),
  languages: ["en", "am"],
  theme: { primary: "#B07A45", accent: "#2A211A", background: "#F4EEE4", text: "#1E1813", font: "elegant", radius: "none", style: "noir" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Off Bole Road, behind the Friendship building, Addis Ababa", "ከቦሌ መንገድ ገባ ብሎ፣ ከፍሬንድሺፕ ሕንፃ ጀርባ፣ አዲስ አበባ"),
    hours: [
      { days: t("Tuesday to Saturday", "ከማክሰኞ እስከ ቅዳሜ"), time: t("Dinner, 6:30 pm to 11:00 pm", "እራት፣ ከምሽቱ 12:30 እስከ 5 ሰዓት") },
      { days: t("Sunday and Monday", "እሁድና ሰኞ"), time: t("Closed", "ዝግ") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("ESAT", "እሳት"),
      description: t("ESAT: a wood-fire kitchen in Bole, Addis Ababa. A seasonal menu from the highlands, by candlelight.", "እሳት፦ በቦሌ፣ አዲስ አበባ የእንጨት እሳት ወጥ ቤት። ከደጋው የሚመጣ የወቅቱ ምግብ፣ በሻማ ብርሃን።"),
      sections: [
        {
          type: "hero",
          id: "top",
          variant: "immersive",
          eyebrow: t("Bole · Addis Ababa", "ቦሌ · አዲስ አበባ"),
          heading: t("Fire, smoke and time", "እሳት፣ ጭስና ጊዜ"),
          subheading: t("Eight tables, one wood fire, and a menu that changes with the highland seasons.", "ስምንት ጠረጴዛዎች፣ አንድ የእንጨት እሳት፣ እና ከደጋው ወቅቶች ጋር የሚቀየር ምግብ።"),
          image: img("cafe-hero-clay-pot-dish", "A row of black clay pots of food with green herbs against a dark background", "በጨለማ ዳራ ፊት አረንጓዴ ቅጠል የተደረገባቸው በምግብ የተሞሉ ጥቁር የሸክላ ድስቶች"),
          primaryAction: reserve,
          secondaryAction: link("The menu", "ምግቡ", "#menu"),
        },
        { type: "quote", id: "philosophy", quote: t("We cook what the highlands give us this week: slowly, over wood, and only as much as we can serve well.", "ደጋው በዚህ ሳምንት የሰጠንን እናበስላለን፦ ቀስ ብለን፣ በእንጨት፣ በደንብ ልናቀርብ የምንችለውን ያህል ብቻ።") },
        {
          type: "cards",
          id: "signatures",
          layout: "feature",
          eyebrow: t("From the fire", "ከእሳቱ"),
          heading: t("Signature dishes", "ልዩ ምግቦቻችን"),
          items: [
            {
              image: img("cafe-card-tibs-injera", "A black clay plate of beef tibs, kitfo and fresh cheese beside rolled injera and mitmita", "በጥቁር የሸክላ ሳህን ጥብስ፣ ክትፎና አይብ ከተጠቀለለ እንጀራና ሚጥሚጣ አጠገብ"),
              subtitle: t("Highland beef", "የደጋ የበሬ ሥጋ"),
              title: t("Ember tibs", "የፍም ጥብስ"),
              description: t("Beef from Debre Berhan, seared on the embers, with aged butter, rosemary and teff injera from the morning bake.", "ከደብረ ብርሃን የመጣ የበሬ ሥጋ በፍም ላይ ተጠብሶ፣ ከቆየ ቅቤ፣ ከጥብስ ቅጠልና ከጠዋቱ የጤፍ እንጀራ ጋር።"),
            },
            {
              image: img("cafe-card-injera-veg-plate", "A white plate with rolled injera, red lentil stew, yellow split peas and collard greens", "የተጠቀለለ እንጀራ፣ ቀይ የምስር ወጥ፣ ቢጫ ክክና ጎመን ያለበት ነጭ ሳህን"),
              subtitle: t("The fasting table", "የጾም ገበታ"),
              title: t("Seven slow stews", "ሰባት ቀስ ብለው የበሰሉ ወጦች"),
              description: t("Lentils, split peas and greens cooked low for hours, served together the way they are on a fasting Wednesday.", "ምስር፣ ክክና ጎመን ለሰዓታት በዝቅተኛ እሳት በስለው፣ በጾም ረቡዕ እንደሚቀርቡት አብረው የሚቀርቡ።"),
            },
            {
              image: img("cafe-card-jebena-pour", "Coffee being poured from a clay jebena into a white cup on a tray scattered with beans", "ቡና በተበተነበት ትሪ ላይ ከሸክላ ጀበና ወደ ነጭ ስኒ የሚቀዳ ቡና"),
              subtitle: t("To finish", "ለመጨረሻ"),
              title: t("Coffee from the embers", "ከፍሙ የሚመጣ ቡና"),
              description: t("Beans roasted at the table over the last of the fire, ground by hand and poured three times.", "በእሳቱ ቅሪት ላይ በጠረጴዛው አጠገብ የሚቆሉ፣ በእጅ የሚወቀጡና ሦስት ጊዜ የሚቀዱ ፍሬዎች።"),
            },
          ],
        },
        {
          type: "about",
          id: "kitchen",
          eyebrow: t("The kitchen", "ወጥ ቤቱ"),
          heading: t("A kitchen built around one fire", "በአንድ እሳት ዙሪያ የተገነባ ወጥ ቤት"),
          body: t(
            "There is no gas in our kitchen. Everything is cooked over eucalyptus and olive wood, the way the cooks who taught us cooked at home.\n\nThe menu is written on Tuesday morning, after the market, and it ends when the week's produce does.",
            "በወጥ ቤታችን ውስጥ ጋዝ የለም። ያስተማሩን ምግብ አብሳዮች በቤታቸው እንደሚያበስሉት ሁሉም ነገር በባሕር ዛፍና በወይራ እንጨት ይበስላል።\n\nምግቡ የሚጻፈው ማክሰኞ ጠዋት ከገበያ በኋላ ነው፤ የሚያልቀውም የሳምንቱ ምርት ሲያልቅ ነው።",
          ),
          image: img("cafe-about-roasted-beans-pan", "Hands holding a clay pan of freshly roasted coffee beans with a metal stirrer", "አዲስ የተቆላ ቡና ያለበትን የሸክላ መጥበሻ ከብረት ማማሰያ ጋር የያዙ እጆች"),
          imageSide: "end",
        },
        {
          type: "menu",
          id: "menu",
          eyebrow: t("This season", "የዚህ ወቅት"),
          heading: t("The menu", "ምግቡ"),
          intro: t("Five courses for the table, or choose from the fire. Tell us when you book if you are fasting.", "ለገበታው አምስት ዓይነት ምግብ፣ ወይም ከእሳቱ ይምረጡ። ሲያስይዙ የሚጾሙ ከሆነ ይንገሩን።"),
          categories: [
            {
              name: t("To begin", "ለመጀመሪያ"),
              items: [
                { name: t("Ayib with herbs and honey", "አይብ ከቅጠላ ቅጠልና ከማር ጋር"), description: t("Fresh cheese, wild thyme, highland honey", "ትኩስ አይብ፣ የዱር ጤና አዳም፣ የደጋ ማር"), price: birr(650) },
                { name: t("Smoked shiro", "የተጨሰ ሽሮ"), description: t("Chickpea, smoked over wood, with crisp injera", "በእንጨት የተጨሰ ሽምብራ፣ ከደረቅ እንጀራ ጋር"), price: birr(580), tag: t("Fasting", "የጾም") },
              ],
            },
            {
              name: t("From the fire", "ከእሳቱ"),
              items: [
                { name: t("Ember tibs", "የፍም ጥብስ"), description: t("Debre Berhan beef, aged butter, rosemary", "የደብረ ብርሃን የበሬ ሥጋ፣ የቆየ ቅቤ፣ ጥብስ ቅጠል"), price: birr(1450) },
                { name: t("Lake fish in banana leaf", "በእንሰት ቅጠል የተጠቀለለ የሐይቅ ዓሣ"), description: t("Tilapia from Lake Ziway, green chilli, lemon", "ከዝዋይ ሐይቅ የመጣ ቆሮሶ፣ አረንጓዴ ቃሪያ፣ ሎሚ"), price: birr(1250) },
                { name: t("Seven slow stews", "ሰባት ቀስ ብለው የበሰሉ ወጦች"), description: t("For two, with the morning's injera", "ለሁለት፣ ከጠዋቱ እንጀራ ጋር"), price: birr(1800), tag: t("Fasting", "የጾም") },
              ],
            },
            {
              name: t("To finish", "ለመጨረሻ"),
              items: [
                { name: t("Honey and teff cake", "የማርና የጤፍ ኬክ"), description: t("Warm, with spiced cream", "ሞቅ ያለ፣ ከቅመም ክሬም ጋር"), price: birr(520) },
                { name: t("Coffee from the embers", "ከፍሙ የሚመጣ ቡና"), description: t("Three rounds, roasted at the table", "ሦስት ዙር፣ በጠረጴዛው አጠገብ የሚቆላ"), price: birr(400) },
              ],
            },
            {
              name: t("The table", "ገበታው"),
              items: [{ name: t("Five courses for the table", "ለገበታው አምስት ዓይነት"), description: t("The kitchen's choice, Tuesday to Saturday", "የወጥ ቤቱ ምርጫ፣ ከማክሰኞ እስከ ቅዳሜ"), price: birr(4200), unit: t("per guest", "ለአንድ እንግዳ") }],
            },
          ],
        },
        {
          type: "gallery",
          id: "room",
          layout: "mosaic",
          eyebrow: t("The room", "አዳራሹ"),
          heading: t("Candlelight and wood smoke", "የሻማ ብርሃንና የእንጨት ጭስ"),
          images: [
            img("studio-gallery-decorated-table", "A long table with a white cloth, glassware and white and pink flowers among greenery", "ነጭ ልብስ፣ ብርጭቆዎችና በአረንጓዴ ተክል መካከል ነጭና ሮዝ አበቦች ያሉበት ረጅም ጠረጴዛ"),
            img("cafe-gallery-cini-cups-tray", "Small cini coffee cups on an engraved metal tray", "በተቀረጸ የብረት ትሪ ላይ ትናንሽ የሲኒ ስኒዎች"),
            img("hotel-gallery-veranda-dusk", "A colonnaded veranda with soft lights above a lawn at dusk", "ሲመሽ በመስኩ ላይ ለስላሳ መብራቶች ያሉት ምሰሶዎች ያሉት በረንዳ"),
            img("events-card-decor-floral-centrepiece", "A tall rose centrepiece on a gold stand with round tables softly blurred behind", "ከጀርባው ክብ ጠረጴዛዎች ያሉት በወርቃማ መቆሚያ ላይ ረጅም የጽጌረዳ አበባ ማስዋቢያ"),
          ],
        },
        {
          type: "testimonials",
          id: "guests",
          eyebrow: t("Guests", "እንግዶች"),
          heading: t("After dinner", "ከእራት በኋላ"),
          items: [
            { quote: t("The tibs came off the embers still crackling. The best meal I have had in Addis.", "ጥብሱ ከፍሙ ሲወርድ ገና ይንጣጣ ነበር። በአዲስ አበባ የበላሁት ምርጥ ምግብ።"), name: "Liya B.", role: t("Anniversary dinner", "የጋብቻ በዓል እራት") },
            { quote: t("A fasting menu that nobody at our table wanted to share.", "በገበታችን ማንም ሊያካፍል ያልፈለገው የጾም ምግብ።"), name: "Henok A.", role: t("Dinner with family", "ከቤተሰብ ጋር እራት") },
            { quote: t("Quiet, warm and unhurried. They let the evening be long.", "ጸጥ ያለ፣ ሞቅ ያለና የማይቸኩል። ምሽቱ እንዲረዝም ይፈቅዳሉ።"), name: "Marta K.", role: t("Visiting from Nairobi", "ከናይሮቢ የመጣች") },
          ],
        },
        {
          type: "cta",
          id: "reserve",
          heading: t("A table by the fire is waiting", "በእሳቱ አጠገብ ያለ ጠረጴዛ እየጠበቀዎ ነው"),
          body: t("Eight tables, five evenings a week. Book a few days ahead.", "ስምንት ጠረጴዛዎች፣ በሳምንት አምስት ምሽቶች። ከጥቂት ቀናት በፊት ያስይዙ።"),
          image: img("hotel-hero-lodge-pool-dusk", "A thatched building lit by lanterns at dusk, reflected in dark water", "ሲመሽ በፋኖሶች የበራ የሳር ክዳን ሕንፃ፣ በጨለማ ውኃ ውስጥ ሲንጸባረቅ"),
          primaryAction: reserve,
          secondaryAction: link("Call us", "ይደውሉልን", "tel:+251911000000"),
        },
      ],
    },
    {
      path: "/reserve",
      title: t("Reserve", "ያስይዙ"),
      nav: t("Reserve", "ያስይዙ"),
      description: t("Reserve a table at ESAT in Bole. Dinner Tuesday to Saturday; we confirm by phone or Telegram.", "በቦሌ በሚገኘው እሳት ጠረጴዛ ያስይዙ። እራት ከማክሰኞ እስከ ቅዳሜ፤ በስልክ ወይም በቴሌግራም እናረጋግጣለን።"),
      sections: [
        {
          type: "form",
          id: "table",
          kind: "booking",
          eyebrow: t("Reservations", "ቦታ ማስያዝ"),
          heading: t("Reserve a table", "ጠረጴዛ ያስይዙ"),
          intro: t("Tell us the evening and how many you are. We confirm by phone or Telegram within a few hours.", "ምሽቱንና ስንት እንደሆናችሁ ይንገሩን። በጥቂት ሰዓታት ውስጥ በስልክ ወይም በቴሌግራም እናረጋግጣለን።"),
          fields: [
            { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
            { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true },
            { name: "date", label: t("Evening", "ምሽት"), type: "date", required: true },
            { name: "time", label: t("Time", "ሰዓት"), type: "time", required: true },
            { name: "guests", label: t("Guests", "የእንግዶች ብዛት"), type: "number", required: true },
            { name: "notes", label: t("Fasting, allergies or an occasion?", "ጾም፣ አለርጂ ወይም ልዩ ቀን?"), type: "textarea" },
          ],
          submitLabel: t("Request the table", "ጠረጴዛውን ጠይቅ"),
          successMessage: t("Thank you. We will confirm your table shortly.", "እናመሰግናለን። ጠረጴዛዎን በቅርቡ እናረጋግጣለን።"),
        },
        { type: "contact", id: "contact", eyebrow: t("Find us", "ያግኙን"), heading: t("Dinner, Tuesday to Saturday", "እራት፣ ከማክሰኞ እስከ ቅዳሜ"), intro: t("For groups of more than eight, call us.", "ከስምንት በላይ ለሆኑ ቡድኖች ይደውሉልን።") },
        { type: "map", id: "map", heading: t("Behind the Friendship building", "ከፍሬንድሺፕ ሕንፃ ጀርባ"), query: "Bole Road, Addis Ababa" },
      ],
    },
  ],
});
