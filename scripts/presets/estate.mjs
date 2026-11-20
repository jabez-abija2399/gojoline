import { t, img, link, birr, save } from "./lib.mjs";

// A luxury property agency told like a magazine: the "estate" art direction. Listings, prices and
// figures are examples to replace (publishing is blocked while sample listings stay).
const viewing = link("Book a private viewing", "የግል ጉብኝት ያስይዙ", "/viewing");
const ask = link("Ask about this home", "ስለዚህ ቤት ይጠይቁ", "/viewing");
const sale = t("For sale", "ለሽያጭ");
const rent = t("For rent", "ለኪራይ");

const listings = [
  {
    image: img("real-estate-card-modern-villa-palms", "A modern white villa with timber screens and planted terraces among palm trees", "በዘንባባ ዛፎች መካከል የእንጨት መጋረጃዎችና ተክል ያለባቸው እርከኖች ያሉት ዘመናዊ ነጭ ቪላ"),
    badge: sale,
    title: t("The Ridge Villa", "የሸንተረሩ ቪላ"),
    subtitle: t("Five bedrooms with a garden terrace", "የአትክልት እርከን ያለው ባለ አምስት መኝታ"),
    meta: [t("5 beds", "5 መኝታ"), t("4 baths", "4 መታጠቢያ"), t("420 m²", "420 ካሬ ሜትር")],
    price: birr(48500000),
    action: ask,
  },
  {
    image: img("real-estate-card-bright-living-room", "A bright living room with two grey sofas, a pale rug and sliding glass doors", "ሁለት ግራጫ ሶፋዎች፣ ፈዛዛ ምንጣፍና ተንሸራታች የመስታወት በሮች ያሉት ብሩህ ሳሎን"),
    badge: rent,
    title: t("Garden Apartment", "የአትክልቱ አፓርትመንት"),
    subtitle: t("Furnished, with a private garden", "የተሟላ፣ የግል አትክልት ያለው"),
    meta: [t("3 beds", "3 መኝታ"), t("2 baths", "2 መታጠቢያ"), t("160 m²", "160 ካሬ ሜትር")],
    price: birr(85000),
    priceNote: t("per month", "በወር"),
    action: ask,
  },
  {
    image: img("real-estate-card-midrise-apartments-balconies", "A mid-rise apartment building with glass balconies and large windows", "የመስታወት በረንዳዎችና ትልልቅ መስኮቶች ያሉት መካከለኛ ከፍታ ያለው የመኖሪያ ሕንፃ"),
    badge: sale,
    title: t("Glass Terrace Flats", "የመስታወት እርከን አፓርትመንቶች"),
    subtitle: t("Two-bedroom flats with terraces", "እርከን ያላቸው ባለ ሁለት መኝታ አፓርትመንቶች"),
    meta: [t("2 beds", "2 መኝታ"), t("2 baths", "2 መታጠቢያ"), t("118 m²", "118 ካሬ ሜትር")],
    price: birr(14800000),
    action: ask,
  },
  {
    image: img("real-estate-gallery-kitchen-garden-window", "A warm modern kitchen with cream cabinets and a large window onto a garden", "ክሬም ቀለም ያላቸው ካቢኔቶችና ወደ አትክልት የሚያሳይ ትልቅ መስኮት ያለው ዘመናዊ ማብሰያ ቤት"),
    badge: sale,
    title: t("Courtyard House", "የግቢው ቤት"),
    subtitle: t("A family house around a courtyard", "በግቢ ዙሪያ የተሠራ የቤተሰብ ቤት"),
    meta: [t("4 beds", "4 መኝታ"), t("3 baths", "3 መታጠቢያ"), t("310 m²", "310 ካሬ ሜትር")],
    price: birr(32000000),
    action: ask,
  },
  {
    image: img("real-estate-card-apartment-block-yellow-balconies", "A newly finished white apartment block with yellow balcony railings on a green hillside", "በአረንጓዴ ኮረብታ ላይ ቢጫ የበረንዳ መከላከያ ያለው አዲስ የተጠናቀቀ ነጭ የመኖሪያ ሕንፃ"),
    badge: sale,
    title: t("Hillside Residences", "የኮረብታው መኖሪያዎች"),
    subtitle: t("New flats, ready to move in", "አዲስ አፓርትመንቶች፣ ለመግባት ዝግጁ"),
    meta: [t("1–3 beds", "1–3 መኝታ"), t("From 74 m²", "ከ74 ካሬ ሜትር")],
    price: birr(9600000),
    priceNote: t("from", "ጀምሮ"),
    action: ask,
  },
];

save("estate", {
  name: t("Gara House Properties", "ጋራ ሃውስ ፕሮፐርቲስ"),
  tagline: t("Homes of character in Addis Ababa, for sale and to rent", "በአዲስ አበባ ለሽያጭና ለኪራይ ልዩ ቤቶች"),
  languages: ["en", "am"],
  theme: { primary: "#1F3A33", accent: "#1F3A33", background: "#F1ECE3", text: "#1B1F1D", font: "classic", radius: "none", style: "estate" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Bole, Addis Ababa", "ቦሌ፣ አዲስ አበባ"),
    hours: [{ days: t("Monday to Saturday", "ከሰኞ እስከ ቅዳሜ"), time: t("9:00 am to 6:00 pm", "ከጠዋቱ 3 እስከ ምሽቱ 12 ሰዓት") }],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Homes", "ቤቶች"),
      description: t("Gara House Properties: homes of character for sale and to rent in Addis Ababa. Private viewings by appointment.", "ጋራ ሃውስ ፕሮፐርቲስ፦ በአዲስ አበባ ለሽያጭና ለኪራይ ልዩ ቤቶች። የግል ጉብኝት በቀጠሮ።"),
      sections: [
        {
          type: "hero",
          id: "top",
          variant: "immersive",
          eyebrow: t("Addis Ababa · For sale and to rent", "አዲስ አበባ · ለሽያጭና ለኪራይ"),
          heading: t("Homes worth coming home to", "ወደ ቤት መመለስ የሚያስመኙ ቤቶች"),
          image: img("real-estate-hero-addis-skyline-trees", "The Addis Ababa skyline with a tall glass tower above a band of trees under a calm sky", "የአዲስ አበባ ሰማይ መስመር፣ ከዛፎች መስመር በላይ ረጅም የመስታወት ሕንፃ በረጋ ሰማይ ሥር"),
          primaryAction: link("See the homes", "ቤቶቹን ይመልከቱ", "#homes"),
          secondaryAction: viewing,
        },
        {
          type: "cards",
          id: "listing-of-the-month",
          layout: "feature",
          eyebrow: t("Listing of the month", "የወሩ ምርጥ ቤት"),
          heading: t("A penthouse above Bole", "ከቦሌ በላይ ያለ የጣሪያ ቤት"),
          items: [
            {
              image: img("business-card-addis-towers", "Glass high-rise towers above green trees under a blue sky", "በሰማያዊ ሰማይ ሥር ከአረንጓዴ ዛፎች በላይ የመስታወት ረጃጅም ሕንፃዎች"),
              badge: sale,
              title: t("The Skyline Penthouse", "የሰማይ መስመሩ የጣሪያ ቤት"),
              subtitle: t("Top floor, views on three sides", "የላይኛው ፎቅ፣ በሦስት በኩል እይታ"),
              meta: [t("4 beds", "4 መኝታ"), t("3 baths", "3 መታጠቢያ"), t("260 m²", "260 ካሬ ሜትር"), t("Roof terrace", "የጣሪያ እርከን")],
              description: t("Light all day, a terrace for evenings over the city, and a lift that opens into the hall.", "ቀኑን ሙሉ ብርሃን፣ በከተማዋ ላይ ለምሽት የሚሆን እርከን፣ እና ወደ አዳራሹ በቀጥታ የሚከፈት ሊፍት።"),
              price: birr(56000000),
              action: viewing,
            },
          ],
        },
        { type: "cards", id: "homes", layout: "grid", eyebrow: t("Homes", "ቤቶች"), heading: t("Now available", "አሁን የሚገኙ"), items: listings },
        {
          type: "cards",
          id: "neighbourhoods",
          layout: "scroll",
          eyebrow: t("Neighbourhoods", "ሰፈሮች"),
          heading: t("Where our homes are", "ቤቶቻችን ያሉበት"),
          items: [
            { image: img("business-hero-addis-street", "A busy avenue lined with modern glass buildings at dusk", "ሲመሽ በዘመናዊ የመስታወት ሕንፃዎች የተከበበ የተጨናነቀ ጎዳና"), title: t("Bole", "ቦሌ"), subtitle: t("Close to everything", "ለሁሉም ቅርብ") },
            { image: img("real-estate-about-addis-neighbourhood", "A district of white and blue mid-rise blocks among dense green trees", "በጥቅጥቅ አረንጓዴ ዛፎች መካከል ነጭና ሰማያዊ መካከለኛ ሕንፃዎች ያሉበት ሰፈር"), title: t("Old Airport", "ኦልድ ኤርፖርት"), subtitle: t("Quiet and green", "ጸጥ ያለና አረንጓዴ") },
            { image: img("real-estate-hero-modern-apartment-corner-sky", "The top corner of a black-and-white apartment block against a pale sky", "በፈዛዛ ሰማይ ፊት የጥቁርና ነጭ የመኖሪያ ሕንፃ የላይኛው ጥግ"), title: t("CMC", "ሲኤምሲ"), subtitle: t("New buildings, wide roads", "አዳዲስ ሕንፃዎች፣ ሰፋፊ መንገዶች") },
            { image: img("hotel-hero-infinity-pool-hills", "An infinity pool on a terrace overlooking acacia-covered hills", "በግራር የተሸፈኑ ኮረብታዎችን የሚመለከት በእርከን ላይ ያለ መዋኛ"), title: t("Bishoftu", "ቢሾፍቱ"), subtitle: t("Weekend houses by the lakes", "በሐይቆቹ ዳር የዕረፍት ቤቶች") },
          ],
        },
        {
          type: "stats",
          id: "agency",
          tone: "soft",
          heading: t("The agency", "ኤጀንሲው"),
          items: [
            { value: t("14", "14"), label: t("years in Addis Ababa", "ዓመታት በአዲስ አበባ") },
            { value: t("600+", "600+"), label: t("homes sold and let", "የተሸጡና የተከራዩ ቤቶች") },
            { value: t("48 h", "48 ሰዓት"), label: t("to arrange a viewing", "ጉብኝት ለማዘጋጀት") },
          ],
        },
        {
          type: "testimonials",
          id: "clients",
          eyebrow: t("Clients", "ደንበኞች"),
          heading: t("In their words", "በራሳቸው ቃል"),
          items: [
            { quote: t("They showed us four houses, not forty, and the second one was ours.", "አርባ ሳይሆን አራት ቤቶች አሳዩን፤ ሁለተኛው የእኛ ሆነ።"), name: "Selam & Dawit", role: t("Bought a family house", "የቤተሰብ ቤት የገዙ") },
            { quote: t("Calm, honest and on time, from the first visit to the keys.", "ከመጀመሪያው ጉብኝት እስከ ቁልፉ ድረስ ረጋ ያሉ፣ ታማኝና በሰዓቱ።"), name: "Martha G.", role: t("Rented an apartment", "አፓርትመንት የተከራየች") },
          ],
        },
        { type: "cta", id: "visit", heading: t("See a home in person", "ቤቱን በአካል ይመልከቱ"), body: t("Tell us what you are looking for and when you are free.", "የሚፈልጉትንና ነጻ የሆኑበትን ጊዜ ይንገሩን።"), primaryAction: viewing },
      ],
    },
    {
      path: "/viewing",
      title: t("Viewing", "ጉብኝት"),
      nav: t("Book a viewing", "ጉብኝት ያስይዙ"),
      description: t("Book a private viewing with Gara House Properties in Addis Ababa.", "በአዲስ አበባ ከጋራ ሃውስ ፕሮፐርቲስ ጋር የግል ጉብኝት ያስይዙ።"),
      sections: [
        {
          type: "form",
          id: "viewing",
          kind: "booking",
          eyebrow: t("Private viewing", "የግል ጉብኝት"),
          heading: t("Book a viewing", "ጉብኝት ያስይዙ"),
          intro: t("Tell us which home and when suits you. We will call to confirm.", "የትኛውን ቤትና መቼ እንደሚመችዎ ይንገሩን። ለማረጋገጥ እንደውላለን።"),
          fields: [
            { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
            { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true },
            { name: "home", label: t("Which home?", "የትኛው ቤት?"), type: "text" },
            { name: "looking", label: t("Buying or renting?", "መግዛት ወይስ መከራየት?"), type: "select", options: [t("Buying", "መግዛት"), t("Renting", "መከራየት")] },
            { name: "date", label: t("A day that suits you", "የሚመችዎ ቀን"), type: "date" },
          ],
          submitLabel: t("Request the viewing", "ጉብኝቱን ጠይቅ"),
          successMessage: t("Thank you. We will call you to confirm the viewing.", "እናመሰግናለን። ጉብኝቱን ለማረጋገጥ እንደውልልዎታለን።"),
        },
        { type: "contact", id: "office", eyebrow: t("The office", "ቢሮው"), heading: t("Or call us", "ወይም ይደውሉልን") },
      ],
    },
  ],
});
