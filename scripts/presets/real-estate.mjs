import { t, img, link, birr, save } from "./lib.mjs";

const view = link("Book a viewing", "ለጉብኝት ቀጠሮ ይያዙ", "/#viewing");
const ask = link("Book a viewing", "ለጉብኝት ቀጠሮ ይያዙ", "/#viewing");
const sale = t("For sale", "ለሽያጭ");
const rent = t("For rent", "ለኪራይ");
const perMonth = t("per month", "በወር");
const beds = (n) => t(`${n} ${n === 1 ? "bed" : "beds"}`, `${n} መኝታ`);
const baths = (n) => t(`${n} ${n === 1 ? "bath" : "baths"}`, `${n} መታጠቢያ`);
const area = (n) => t(`${n} m²`, `${n} ካሬ ሜትር`);

const listings = [
  {
    image: img("real-estate-card-midrise-apartments-balconies", "Mid-rise apartment building with glass balconies and large windows", "የመስታወት በረንዳዎችና ሰፋፊ መስኮቶች ያሉት የአፓርትመንት ሕንፃ"),
    badge: sale,
    subtitle: t("Bole, Addis Ababa", "ቦሌ፣ አዲስ አበባ"),
    title: t("2-bedroom apartment near Atlas", "ባለ 2 መኝታ አፓርትመንት፣ አትላስ አካባቢ"),
    meta: [beds(2), baths(2), area(98)],
    description: t("Fifth floor with two balconies, lift, backup generator and basement parking. Title deed ready.", "5ኛ ፎቅ፣ ሁለት በረንዳ፣ ሊፍት፣ ጀነሬተር እና የምድር ቤት መኪና ማቆሚያ ያለው። ካርታው የተዘጋጀ።"),
    price: birr(9800000),
    action: ask,
  },
  {
    image: img("real-estate-card-modern-villa-palms", "Modern white flat-roofed villa with planted terraces among palm trees", "በዘንባባ ዛፎች መካከል የሚገኝ ዘመናዊ ነጭ ቪላ ከአትክልት በረንዳዎቹ ጋር"),
    badge: rent,
    subtitle: t("Old Airport, Addis Ababa", "ኦልድ ኤርፖርት፣ አዲስ አበባ"),
    title: t("4-bedroom villa with garden", "ባለ 4 መኝታ ቪላ ከአትክልት ግቢ ጋር"),
    meta: [beds(4), baths(3), area(320)],
    description: t("G+1 in a quiet compound, with staff quarters, a water tank and parking for three cars.", "ጸጥ ባለ ግቢ ውስጥ ያለ ጂ+1፤ የሠራተኛ ክፍል፣ የውሃ ታንከር እና ለሦስት መኪና ማቆሚያ አለው።"),
    price: birr(280000),
    priceNote: perMonth,
    action: ask,
  },
  {
    image: img("real-estate-card-bright-living-room", "Bright living room with two grey sofas, a pale rug and sliding glass doors", "ሁለት ግራጫ ሶፋዎች፣ ነጣ ያለ ምንጣፍ እና ተንሸራታች የመስታወት በሮች ያሉት ብሩህ ሳሎን"),
    badge: rent,
    subtitle: t("Kazanchis, Addis Ababa", "ካዛንቺስ፣ አዲስ አበባ"),
    title: t("Furnished 2-bedroom apartment", "ዕቃ የተሟላለት ባለ 2 መኝታ አፓርትመንት"),
    meta: [beds(2), baths(2), area(110)],
    description: t("Move in with a suitcase. Fully furnished, fibre internet, 24-hour security and lift.", "ሻንጣዎን ብቻ ይዘው ይግቡ። ሙሉ ዕቃ፣ ፋይበር ኢንተርኔት፣ የ24 ሰዓት ጥበቃ እና ሊፍት አለው።"),
    price: birr(85000),
    priceNote: perMonth,
    action: ask,
  },
  {
    image: img("real-estate-gallery-kitchen-garden-window", "Modern kitchen with cream cabinets, an island and a large window onto trees", "ክሬም ቀለም ካቢኔቶች፣ የመሃል ጠረጴዛ እና ዛፎችን የሚያሳይ ሰፊ መስኮት ያለው ዘመናዊ ኩሽና"),
    badge: sale,
    subtitle: t("CMC, Addis Ababa", "ሲኤምሲ፣ አዲስ አበባ"),
    title: t("2-bedroom apartment with open kitchen", "ባለ 2 መኝታ አፓርትመንት ከክፍት ኩሽና ጋር"),
    meta: [beds(2), baths(1), area(92)],
    description: t("Second floor, newly finished, with a fitted kitchen and a view over the garden.", "2ኛ ፎቅ፣ አዲስ የተጠናቀቀ፤ የተገጠመ ኩሽና እና የአትክልት እይታ አለው።"),
    price: birr(7400000),
    action: ask,
  },
  {
    image: img("real-estate-card-apartment-block-yellow-balconies", "New nine-storey white apartment block with yellow balcony railings on a green hillside", "በአረንጓዴ ኮረብታ ላይ የቆመ ቢጫ የበረንዳ አጥር ያለው አዲስ ባለ ዘጠኝ ፎቅ ነጭ የአፓርትመንት ሕንፃ"),
    badge: sale,
    subtitle: t("Ayat, Addis Ababa", "አያት፣ አዲስ አበባ"),
    title: t("1-bedroom at Ayat Garden Residences", "ባለ 1 መኝታ፣ አያት ጋርደን መኖሪያ"),
    meta: [beds(1), baths(1), area(64)],
    description: t("Ready to move in. 30% down and the rest over 24 months, with no interest.", "ለመግባት ዝግጁ። 30% ቅድመ ክፍያ፣ ቀሪው በ24 ወር ያለ ወለድ።"),
    price: birr(4900000),
    action: ask,
  },
  {
    image: img("real-estate-gallery-master-bedroom", "Artist's impression of a master bedroom with a grey bed, oak panelling and globe lights", "የዋና መኝታ ክፍል የንድፍ ምስል፤ ግራጫ አልጋ፣ የእንጨት ግድግዳ እና ክብ መብራቶች"),
    badge: sale,
    subtitle: t("Ayat, Addis Ababa", "አያት፣ አዲስ አበባ"),
    title: t("3-bedroom, Ayat Garden phase two", "ባለ 3 መኝታ፣ አያት ጋርደን ሁለተኛ ምዕራፍ"),
    meta: [beds(3), baths(2), area(138)],
    description: t("Under construction, handover in 18 months. The picture is an artist's impression.", "በግንባታ ላይ፤ ርክክብ በ18 ወር ውስጥ። ምስሉ የንድፍ ምስል ነው።"),
    price: birr(9600000),
    action: ask,
  },
];

const propertyOptions = [...listings.map((l) => l.title), t("Not sure yet", "ገና አልወሰንኩም")];
const nameField = { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true };
const phoneField = { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true };
const callTime = {
  name: "call_time",
  label: t("Best time to call", "ለመደወል የሚመችዎ ሰዓት"),
  type: "select",
  options: [t("Morning", "ጠዋት"), t("Afternoon", "ከሰዓት በኋላ"), t("Evening", "ምሽት")],
};

const viewingForm = {
  type: "form",
  id: "viewing",
  kind: "booking",
  heading: t("Book a viewing", "ለጉብኝት ቀጠሮ ይያዙ"),
  intro: t("Choose a home and a day. An agent calls you back within one working day and takes you there in person, free of charge.", "ቤቱንና ቀኑን ይምረጡ። ወኪላችን በአንድ የሥራ ቀን ውስጥ ደውሎ ራሱ ወስዶ ያስጎበኝዎታል፤ ጉብኝቱ ነፃ ነው።"),
  fields: [
    nameField,
    phoneField,
    { name: "property", label: t("Property", "ቤቱ"), type: "select", required: true, options: propertyOptions },
    { name: "day", label: t("Preferred day", "የሚመችዎ ቀን"), type: "date" },
    callTime,
  ],
  submitLabel: t("Request viewing", "ቀጠሮ ይጠይቁ"),
  successMessage: t("Thank you. An agent will call you soon to agree the time.", "እናመሰግናለን። ሰዓቱን ለመወሰን ወኪላችን በቅርቡ ይደውልልዎታል።"),
};

save("real-estate", {
  name: t("Selam Properties", "ሰላም ፕሮፐርቲስ"),
  tagline: t("Apartments and houses for sale and rent in Addis Ababa", "በአዲስ አበባ የሚሸጡና የሚከራዩ አፓርትመንቶችና ቤቶች"),
  languages: ["en", "am"],
  theme: { primary: "#16324F", accent: "#0C1C2C", background: "#F5F7F9", text: "#1B2530", font: "modern", radius: "small", style: "clean" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    whatsapp: "+251 911 000 000",
    address: t("Bole, near Atlas Hotel, Addis Ababa", "ቦሌ፣ አትላስ ሆቴል አጠገብ፣ አዲስ አበባ"),
    hours: [
      { days: t("Monday to Friday", "ከሰኞ እስከ ዓርብ"), time: t("8:30 am to 6:00 pm", "ከጠዋቱ 2:30 እስከ ምሽቱ 12 ሰዓት") },
      { days: t("Saturday", "ቅዳሜ"), time: t("9:00 am to 1:00 pm", "ከጠዋቱ 3 እስከ ቀኑ 7 ሰዓት") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Checked apartments and houses to buy or rent in Addis Ababa, with clear prices in Birr.", "በአዲስ አበባ የሚሸጡና የሚከራዩ የተረጋገጡ አፓርትመንቶችና ቤቶች፤ ግልጽ ዋጋ በብር።"),
      sections: [
        {
          type: "hero",
          variant: "immersive",
          eyebrow: t("Buy · Rent · Addis Ababa", "ግዢ · ኪራይ · አዲስ አበባ"),
          heading: t("Find your home in Addis", "በአዲስ አበባ ቤትዎን ያግኙ"),
          subheading: t("Apartments and houses we have visited ourselves, in Bole, Kazanchis, CMC, Ayat and Old Airport. Clear prices, checked title deeds.", "እኛው ራሳችን ሄደን ያየናቸው አፓርትመንቶችና ቤቶች፤ በቦሌ፣ በካዛንቺስ፣ በሲኤምሲ፣ በአያት እና በኦልድ ኤርፖርት። ግልጽ ዋጋ፣ የተጣራ ካርታ።"),
          image: img("real-estate-hero-addis-skyline-trees", "Addis Ababa skyline with a tall glass tower rising above trees", "ከዛፎች በላይ ከፍ ያለ የመስታወት ሕንፃ የሚታይበት የአዲስ አበባ ሰማይ ጠቀስ ገጽታ"),
          primaryAction: view,
          secondaryAction: link("See properties", "ቤቶቹን ይመልከቱ", "/listings"),
          facts: [
            { value: t("42", "42"), label: t("homes available now", "አሁን የሚገኙ ቤቶች") },
            { value: t("9", "9"), label: t("neighbourhoods", "ሰፈሮች") },
            { value: t("24 hrs", "24 ሰዓት"), label: t("to arrange a viewing", "ጉብኝት ለማዘጋጀት") },
          ],
        },
        {
          type: "cards",
          id: "featured",
          layout: "grid",
          eyebrow: t("Featured homes", "የተመረጡ ቤቶች"),
          heading: t("New on the market", "አዲስ ለገበያ የቀረቡ"),
          intro: t("Every home is visited, measured and photographed by our own agents before it appears here.", "እያንዳንዱ ቤት እዚህ ከመውጣቱ በፊት በራሳችን ወኪሎች ተጎብኝቶ፣ ተለክቶና ፎቶ ተነስቶ ነው።"),
          items: listings.slice(0, 3),
          action: link("See all properties", "ሁሉንም ቤቶች ይመልከቱ", "/listings"),
        },
        {
          type: "stats",
          tone: "dark",
          items: [
            { value: t("12", "12"), label: t("years in Addis Ababa", "ዓመታት በአዲስ አበባ") },
            { value: t("640+", "640+"), label: t("families housed", "ቤት ያገኙ ቤተሰቦች") },
            { value: t("100%", "100%"), label: t("of title deeds checked before listing", "ካርታዎች ከመውጣታቸው በፊት ተጣርተዋል") },
          ],
        },
        {
          type: "about",
          id: "project",
          eyebrow: t("Featured project · Ready to move in", "ተመራጭ ፕሮጀክት · ለመግባት ዝግጁ"),
          heading: t("Ayat Garden Residences", "አያት ጋርደን መኖሪያ"),
          body: t(
            "Seventy-two apartments on a green hillside in Ayat, ten minutes from the light rail. Phase one is finished and families are moving in; phase two hands over in 18 months.\n\nPrices start at 4,900,000 Birr for a one-bedroom home.",
            "በአያት አረንጓዴ ኮረብታ ላይ፣ ከቀላል ባቡር አሥር ደቂቃ ርቀት ላይ የሚገኙ ሰባ ሁለት አፓርትመንቶች። የመጀመሪያው ምዕራፍ ተጠናቆ ቤተሰቦች እየገቡ ነው፤ ሁለተኛው በ18 ወር ውስጥ ይረከባል።\n\nባለ አንድ መኝታ ቤት ከ4,900,000 ብር ይጀምራል።",
          ),
          image: img("real-estate-card-apartment-block-yellow-balconies", "New nine-storey white apartment block with yellow balcony railings on a green hillside", "በአረንጓዴ ኮረብታ ላይ የቆመ ቢጫ የበረንዳ አጥር ያለው አዲስ ባለ ዘጠኝ ፎቅ ነጭ የአፓርትመንት ሕንፃ"),
          imageSide: "start",
          points: [
            t("1, 2 and 3 bedroom homes, 64 to 138 m²", "ባለ 1፣ 2 እና 3 መኝታ ቤቶች፣ ከ64 እስከ 138 ካሬ ሜትር"),
            t("30% down, the rest over 24 months without interest", "30% ቅድመ ክፍያ፣ ቀሪው በ24 ወር ያለ ወለድ"),
            t("Lift, generator, borehole water and guarded parking", "ሊፍት፣ ጀነሬተር፣ የጉድጓድ ውሃ እና የሚጠበቅ መኪና ማቆሚያ"),
          ],
          action: link("See available units", "ያሉትን ቤቶች ይመልከቱ", "/listings"),
        },
        {
          type: "cards",
          id: "areas",
          layout: "scroll",
          eyebrow: t("Where we work", "የምንሠራባቸው ሰፈሮች"),
          heading: t("Choose your side of the city", "የሚመችዎን ሰፈር ይምረጡ"),
          items: [
            {
              image: img("business-hero-addis-street", "A busy Addis Ababa avenue lined with glass mid-rise buildings at dusk", "በምሽት የመስታወት ሕንፃዎች የተሰለፉበት የአዲስ አበባ ሰፊ ጎዳና"),
              title: t("Bole", "ቦሌ"),
              subtitle: t("Close to the airport, cafés and offices", "ለአየር ማረፊያ፣ ለካፌዎችና ለቢሮዎች ቅርብ"),
            },
            {
              image: img("business-card-addis-towers", "Glass high-rise towers in Addis Ababa above green trees", "ከአረንጓዴ ዛፎች በላይ የሚታዩ የአዲስ አበባ የመስታወት ሰማይ ጠቀስ ሕንፃዎች"),
              title: t("Kazanchis", "ካዛንቺስ"),
              subtitle: t("City-centre apartments, walk to work", "የመሃል ከተማ አፓርትመንቶች፣ ለሥራ ቅርብ"),
            },
            {
              image: img("real-estate-about-addis-neighbourhood", "White and blue mid-rise blocks among dense green trees in Addis Ababa", "በአዲስ አበባ በጥቅጥቅ አረንጓዴ ዛፎች መካከል ያሉ ነጭና ሰማያዊ ሕንፃዎች"),
              title: t("CMC and Ayat", "ሲኤምሲ እና አያት"),
              subtitle: t("More space and green for families", "ለቤተሰብ ሰፊና አረንጓዴ"),
            },
            {
              image: img("real-estate-gallery-kitchen-garden-window", "Modern kitchen with cream cabinets, an island and a large window onto trees", "ክሬም ቀለም ካቢኔቶች፣ የመሃል ጠረጴዛ እና ዛፎችን የሚያሳይ ሰፊ መስኮት ያለው ዘመናዊ ኩሽና"),
              title: t("Old Airport", "ኦልድ ኤርፖርት"),
              subtitle: t("Quiet streets, houses with gardens", "ጸጥ ያሉ መንገዶች፣ ግቢ ያላቸው ቤቶች"),
            },
          ],
        },
        {
          type: "services",
          variant: "bento",
          id: "why",
          eyebrow: t("Why Selam", "ለምን ሰላም?"),
          heading: t("Buying a home should feel safe", "ቤት መግዛት ስጋት ሊሆን አይገባም"),
          items: [
            { icon: "shield", title: t("Title deeds checked first", "ካርታው አስቀድሞ ይጣራል"), description: t("We check every title deed at the land office before a home is listed, so you never pay for a property with a problem.", "ቤቱ ከመውጣቱ በፊት እያንዳንዱን ካርታ በመሬት አስተዳደር ቢሮ እናጣራለን፤ ችግር ላለበት ንብረት ገንዘብ አይከፍሉም።") },
            { icon: "key", title: t("Homes we have seen", "ያየናቸው ቤቶች ብቻ"), description: t("No listings copied from elsewhere. If it is here, it is available.", "ከሌላ ቦታ የተገለበጠ ማስታወቂያ የለም። እዚህ ካለ በእርግጥ ይገኛል።") },
            { icon: "globe", title: t("Service for the diaspora", "ለዳያስፖራ አገልግሎት"), description: t("Video viewings and updates on WhatsApp or Telegram while you are abroad.", "ውጭ ሆነው በቪዲዮ ይጎብኙ፤ መረጃውን በዋትስአፕ ወይም በቴሌግራም ያግኙ።") },
            { icon: "handshake", title: t("With you until the keys", "ቁልፉን እስኪረከቡ አብረንዎ ነን"), description: t("One agent from the first viewing to the signed contract and the transfer.", "ከመጀመሪያው ጉብኝት እስከ ውል ፊርማና ስም ዝውውር አንድ ወኪል ይከታተልዎታል።") },
          ],
        },
        {
          type: "testimonials",
          eyebrow: t("Clients say", "ደንበኞች ምን ይላሉ"),
          heading: t("People we have helped home", "ቤት እንዲያገኙ የረዳናቸው"),
          items: [
            { quote: t("I bought from Toronto. They sent videos of every room, checked the title deed and my sister collected the keys.", "ከቶሮንቶ ሆኜ ነው የገዛሁት። የእያንዳንዱን ክፍል ቪዲዮ ላኩልኝ፣ ካርታውን አጣሩ፣ ቁልፉንም እህቴ ተረከበች።"), name: "Meron A.", role: t("Bought in Ayat", "አያት የገዙ") },
            { quote: t("We saw four apartments in one Saturday and signed for the second. No surprises on the price.", "በአንድ ቅዳሜ አራት አፓርትመንት አይተን ሁለተኛውን ተፈራረምን። በዋጋው ላይ ያልጠበቅነው ነገር አልነበረም።"), name: "Yonas K.", role: t("Renting in Kazanchis", "ካዛንቺስ የተከራዩ") },
            { quote: t("They found a good tenant for my villa in two weeks and the rent arrives on time every month.", "በሁለት ሳምንት ውስጥ ለቪላዬ ጥሩ ተከራይ አገኙልኝ፤ ኪራዩም በየወሩ በሰዓቱ ይገባል።"), name: "Tigist H.", role: t("Owner, Old Airport", "የቤት ባለቤት፣ ኦልድ ኤርፖርት") },
          ],
        },
        viewingForm,
        {
          type: "faq",
          id: "questions",
          heading: t("Buying and renting, answered", "ስለ ግዢና ኪራይ የሚጠየቁ"),
          items: [
            { question: t("Does a viewing cost anything?", "ጉብኝት ክፍያ አለው?"), answer: t("No. Viewings are free and an agent goes with you.", "የለውም። ጉብኝት ነፃ ነው፤ ወኪላችንም አብሮዎት ይሄዳል።") },
            { question: t("How do I pay for a home?", "ክፍያ የሚፈጸመው እንዴት ነው?"), answer: t("By bank transfer in Birr, straight to the owner or developer, after the contract is signed.", "ውሉ ከተፈረመ በኋላ በባንክ ዝውውር በብር፣ በቀጥታ ለባለቤቱ ወይም ለአልሚው።") },
            { question: t("Can I buy while living abroad?", "ውጭ አገር ሆኜ መግዛት እችላለሁ?"), answer: t("Yes. We show the home by video and work with the person you give power of attorney.", "አዎ። ቤቱን በቪዲዮ እናሳይዎታለን፤ ውክልና ከሰጡት ሰው ጋርም እንሠራለን።") },
            { question: t("How much rent is paid in advance?", "ኪራይ ስንት ወር አስቀድሞ ይከፈላል?"), answer: t("Most owners ask for three months. We tell you before the viewing.", "አብዛኞቹ ባለቤቶች የሦስት ወር ይጠይቃሉ። ከጉብኝቱ በፊት እናሳውቅዎታለን።") },
          ],
        },
        {
          type: "cta",
          heading: t("See it before you decide", "ከመወሰንዎ በፊት ቤቱን ይዩት"),
          body: t("Tell us which home you like. We arrange the viewing within 24 hours.", "የወደዱትን ቤት ይንገሩን። በ24 ሰዓት ውስጥ ጉብኝቱን እናዘጋጃለን።"),
          image: img("real-estate-hero-modern-apartment-corner-sky", "Top corner of a modern black-and-white apartment block against a pale blue sky", "በነጣ ሰማያዊ ሰማይ ሥር የሚታይ የዘመናዊ ጥቁርና ነጭ አፓርትመንት ሕንፃ ጥግ"),
          primaryAction: view,
          secondaryAction: link("Call us", "ይደውሉልን", "tel:+251911000000"),
        },
      ],
    },
    {
      path: "/listings",
      title: t("Properties", "ቤቶች"),
      nav: t("Properties", "ቤቶች"),
      description: t("Apartments and houses for sale and rent in Addis Ababa, with prices, sizes and locations.", "በአዲስ አበባ የሚሸጡና የሚከራዩ አፓርትመንቶችና ቤቶች፤ ከዋጋቸው፣ ከስፋታቸውና ከአድራሻቸው ጋር።"),
      sections: [
        {
          type: "hero",
          variant: "banner",
          eyebrow: t("Updated every week", "በየሳምንቱ ይታደሳል"),
          heading: t("Homes for sale and rent", "የሚሸጡና የሚከራዩ ቤቶች"),
          subheading: t("Rent is per month. Sale prices are in Birr and open to a fair offer.", "ኪራይ በወር ነው። የሽያጭ ዋጋ በብር ሲሆን ለተገቢ ድርድር ክፍት ነው።"),
          image: img("real-estate-hero-modern-apartment-corner-sky", "Top corner of a modern black-and-white apartment block against a pale blue sky", "በነጣ ሰማያዊ ሰማይ ሥር የሚታይ የዘመናዊ ጥቁርና ነጭ አፓርትመንት ሕንፃ ጥግ"),
          primaryAction: view,
        },
        {
          type: "cards",
          id: "homes",
          layout: "grid",
          eyebrow: t("Available now", "አሁን የሚገኙ"),
          heading: t("Six homes picked for this week", "የዚህ ሳምንት ስድስት ምርጥ ቤቶች"),
          intro: t("Did not find it here? We have 42 homes on our books. Tell us your budget and area and we send you a shortlist.", "የሚፈልጉትን እዚህ አላገኙም? በመዝገባችን 42 ቤቶች አሉ። በጀትዎንና ሰፈርዎን ይንገሩን፤ የሚስማሙዎትን መርጠን እንልካለን።"),
          items: listings,
        },
        {
          type: "steps",
          eyebrow: t("How it works", "አሠራሩ"),
          heading: t("From first look to keys", "ከመጀመሪያ እይታ እስከ ቁልፍ ርክክብ"),
          items: [
            { title: t("Pick a home", "ቤት ይምረጡ"), description: t("Send the form, call us or write on Telegram.", "ቅጹን ይሙሉ፣ ይደውሉ ወይም በቴሌግራም ይጻፉልን።") },
            { title: t("Visit with an agent", "ከወኪላችን ጋር ይጎብኙ"), description: t("We meet you at the property, or show it by video call.", "ቤቱ ጋ እንገናኛለን፤ ወይም በቪዲዮ ጥሪ እናሳይዎታለን።") },
            { title: t("Agree the price", "በዋጋው ይስማሙ"), description: t("We carry your offer to the owner and put it in writing.", "ያቀረቡትን ዋጋ ለባለቤቱ አድርሰን ስምምነቱን በጽሑፍ እናሰፍራለን።") },
            { title: t("Sign and move in", "ይፈርሙና ይግቡ"), description: t("We prepare the contract and go with you to the transfer.", "ውሉን አዘጋጅተን እስከ ስም ዝውውር አብረንዎ እንሄዳለን።") },
          ],
          action: view,
        },
        {
          type: "form",
          id: "callback",
          kind: "contact",
          heading: t("Let us call you", "እኛ እንደውልልዎ"),
          intro: t("Leave your number and what you are looking for. We call back with homes that fit.", "ስልክ ቁጥርዎንና የሚፈልጉትን ይተዉልን። የሚስማሙዎትን ቤቶች ይዘን እንደውላለን።"),
          fields: [
            nameField,
            phoneField,
            { name: "interest", label: t("I want to", "የምፈልገው"), type: "select", required: true, options: [t("Buy a home", "ቤት መግዛት"), t("Rent a home", "ቤት መከራየት")] },
            { name: "area", label: t("Preferred area", "የሚፈልጉት ሰፈር"), type: "text" },
            callTime,
          ],
          submitLabel: t("Please call me", "ይደውሉልኝ"),
          successMessage: t("Thank you. We will call you at the time you chose.", "እናመሰግናለን። በመረጡት ሰዓት እንደውልልዎታለን።"),
        },
      ],
    },
    {
      path: "/owners",
      title: t("Sell or let", "ለባለቤቶች"),
      nav: t("Sell or let", "ለባለቤቶች"),
      description: t("Valuation, sales, tenant finding and property management for owners in Addis Ababa.", "በአዲስ አበባ ላሉ የቤት ባለቤቶች የዋጋ ግምት፣ ሽያጭ፣ ተከራይ ፍለጋ እና የንብረት አስተዳደር።"),
      sections: [
        {
          type: "hero",
          variant: "banner",
          eyebrow: t("For owners", "ለቤት ባለቤቶች"),
          heading: t("Sell or let your home with us", "ቤትዎን በእኛ ይሽጡ ወይም ያከራዩ"),
          subheading: t("A fair price, serious buyers and tenants, and one person who answers your calls.", "ተገቢ ዋጋ፣ ቁም ነገረኛ ገዢና ተከራይ፣ እንዲሁም ስልክዎን የሚያነሳ አንድ ሰው።"),
          image: img("real-estate-about-addis-neighbourhood", "White and blue mid-rise blocks among dense green trees in Addis Ababa", "በአዲስ አበባ በጥቅጥቅ አረንጓዴ ዛፎች መካከል ያሉ ነጭና ሰማያዊ ሕንፃዎች"),
          primaryAction: link("Request a valuation", "የዋጋ ግምት ይጠይቁ", "#valuation"),
        },
        {
          type: "services",
          variant: "numbered",
          eyebrow: t("What we do", "የምንሠራው"),
          heading: t("Three ways we work for owners", "ለባለቤቶች የምንሰጣቸው ሦስት አገልግሎቶች"),
          items: [
            { icon: "ruler", title: t("Valuation", "የዋጋ ግምት"), description: t("A site visit and a written estimate of the market price, for sale, rent or a bank loan.", "ቦታው ድረስ መጥተን ለሽያጭ፣ ለኪራይ ወይም ለባንክ ብድር የሚሆን የገበያ ዋጋ ግምት በጽሑፍ እንሰጣለን።"), price: birr(15000) },
            { icon: "camera", title: t("Selling", "ሽያጭ"), description: t("Professional photos, listing here and on Telegram, and viewings only with checked buyers.", "ጥራት ያለው ፎቶ፣ እዚህና በቴሌግራም ማስተዋወቅ፣ ጉብኝት ከተጣሩ ገዢዎች ጋር ብቻ።") },
            { icon: "users", title: t("Letting and management", "ኪራይና አስተዳደር"), description: t("We check each tenant, prepare the contract, collect the rent and arrange repairs, with a report every month.", "ተከራዩን አጣርተን ውሉን እናዘጋጃለን፣ ኪራይ እንሰበስባለን፣ ጥገና እናስተባብራለን፤ በየወሩም ሪፖርት እንልካለን።") },
          ],
        },
        {
          type: "about",
          eyebrow: t("Our team", "ቡድናችን"),
          heading: t("Agents who know the street, not just the map", "ሰፈሩን በእግሩ የሚያውቁ ወኪሎች"),
          body: t(
            "Selam Properties started in a single room in Bole twelve years ago. Today eight agents cover nine neighbourhoods, and each one works only in the area they live in.\n\nYou get one agent's direct number. They answer it.",
            "ሰላም ፕሮፐርቲስ ከአሥራ ሁለት ዓመት በፊት ቦሌ ውስጥ በአንዲት ክፍል ነበር የጀመረው። ዛሬ ስምንት ወኪሎች ዘጠኝ ሰፈሮችን ይሸፍናሉ፤ እያንዳንዱም የሚሠራው በሚኖርበት ሰፈር ብቻ ነው።\n\nየአንድ ወኪል ቀጥታ ስልክ ይሰጥዎታል፤ እሱም ያነሳል።",
          ),
          image: img("real-estate-about-team-three-men", "Three young men in smart shirts standing on a stone path beside a building", "ሥርዓት ያለው ሸሚዝ የለበሱ ሦስት ወጣት ወንዶች ከሕንፃ አጠገብ በድንጋይ መንገድ ላይ ቆመው"),
          imageSide: "end",
          highlights: [
            { value: t("8", "8"), label: t("agents", "ወኪሎች") },
            { value: t("3 weeks", "3 ሳምንት"), label: t("average time to let", "ለማከራየት የሚወስደው አማካይ ጊዜ") },
          ],
        },
        {
          type: "steps",
          eyebrow: t("How it works", "አሠራሩ"),
          heading: t("From valuation to signed contract", "ከግምት እስከ ውል ፊርማ"),
          items: [
            { title: t("We visit and value", "ጎብኝተን እንገምታለን"), description: t("An agent sees the property and tells you what it can fetch today.", "ወኪላችን ቤቱን አይቶ ዛሬ ሊያወጣ የሚችለውን ዋጋ ይነግርዎታል።") },
            { title: t("We bring the right people", "ትክክለኛ ሰዎችን እናመጣለን"), description: t("Only buyers and tenants we have spoken to and checked.", "አነጋግረንና አጣርተን ያረጋገጥናቸው ገዢዎችና ተከራዮች ብቻ።") },
            { title: t("You sign, we handle the rest", "እርስዎ ይፈርማሉ፣ ቀሪው በእኛ ነው"), description: t("Contract, handover and, if you wish, monthly management.", "ውል፣ ርክክብ እና ከፈለጉ ወርሃዊ አስተዳደር።") },
          ],
        },
        {
          type: "form",
          id: "valuation",
          kind: "contact",
          heading: t("Request a valuation", "የዋጋ ግምት ይጠይቁ"),
          intro: t("Tell us where the property is. An agent calls you within one working day to agree a visit.", "ቤቱ የት እንደሚገኝ ይንገሩን። ወኪላችን በአንድ የሥራ ቀን ውስጥ ደውሎ የጉብኝት ቀን ይወስናል።"),
          fields: [
            nameField,
            phoneField,
            { name: "service", label: t("I want to", "የምፈልገው"), type: "select", required: true, options: [t("Sell my property", "ቤቴን መሸጥ"), t("Let my property", "ቤቴን ማከራየት"), t("Have it managed", "ቤቴ እንዲተዳደርልኝ"), t("Know its value", "ዋጋውን ማወቅ")] },
            { name: "location", label: t("Where is the property?", "ቤቱ የሚገኝበት ሰፈር"), type: "text", required: true },
            { name: "details", label: t("Type and size (optional)", "ዓይነቱና ስፋቱ (ካለ)"), type: "textarea" },
          ],
          submitLabel: t("Send request", "ጥያቄውን ይላኩ"),
          successMessage: t("Thank you. An agent will call you within one working day.", "እናመሰግናለን። ወኪላችን በአንድ የሥራ ቀን ውስጥ ይደውልልዎታል።"),
        },
      ],
    },
    {
      path: "/contact",
      title: t("Contact", "ያግኙን"),
      nav: t("Contact", "ያግኙን"),
      description: t("Call, message or visit Selam Properties in Bole, Addis Ababa.", "ሰላም ፕሮፐርቲስን ይደውሉ፣ መልእክት ይላኩ ወይም ቦሌ ቢሯችን ይምጡ።"),
      sections: [
        { type: "contact", heading: t("Talk to an agent", "ወኪላችንን ያነጋግሩ"), intro: t("Call, write on Telegram or WhatsApp, or walk in during office hours. We speak Amharic and English.", "ይደውሉ፣ በቴሌግራም ወይም በዋትስአፕ ይጻፉ፣ አልያም በሥራ ሰዓት ቢሯችን ይምጡ። በአማርኛና በእንግሊዝኛ እናስተናግዳለን።") },
        {
          type: "form",
          id: "message",
          kind: "contact",
          heading: t("Send a message", "መልእክት ይላኩ"),
          fields: [nameField, phoneField, { name: "message", label: t("How can we help?", "ምን እንርዳዎ?"), type: "textarea", required: true }],
          submitLabel: t("Send", "ላክ"),
          successMessage: t("Thank you. We will answer soon.", "እናመሰግናለን። በቅርቡ እንመልሳለን።"),
        },
        { type: "map", heading: t("Our office in Bole", "የቦሌ ቢሯችን"), query: "Atlas, Bole, Addis Ababa" },
      ],
    },
  ],
});
