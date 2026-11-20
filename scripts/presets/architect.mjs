import { t, img, link, save } from "./lib.mjs";

// An architecture and interiors studio set like a drawing sheet: the "drafting" art direction.
// Projects, places and figures are examples to replace (publishing is blocked while sample numbers stay).
const start = link("Start a project", "ፕሮጀክት እንጀምር", "/contact");
const place = (en, am) => t(en, am);

const projects = [
  {
    image: img("real-estate-card-modern-villa-palms", "A white flat-roofed villa with timber screens and planted terraces among palm trees", "በዘንባባ ዛፎች መካከል የእንጨት መጋረጃዎችና ተክል ያለባቸው እርከኖች ያሉት ጠፍጣፋ ጣሪያ ያለው ነጭ ቪላ"),
    subtitle: t("House", "መኖሪያ ቤት"),
    title: t("Entoto Ridge House", "የእንጦጦ ሸንተረር ቤት"),
    meta: [place("Entoto", "እንጦጦ"), t("2025", "2017 ዓ.ም."), t("420 m²", "420 ካሬ ሜትር")],
  },
  {
    image: img("real-estate-card-apartment-block-yellow-balconies", "A newly finished white apartment block with yellow balcony railings on a green hillside", "በአረንጓዴ ኮረብታ ላይ ቢጫ የበረንዳ መከላከያ ያለው አዲስ የተጠናቀቀ ነጭ የመኖሪያ ሕንፃ"),
    subtitle: t("Housing", "የጋራ መኖሪያ"),
    title: t("Kebena Curve Residences", "የቀበና ከርቭ መኖሪያዎች"),
    meta: [place("Kebena", "ቀበና"), t("2024", "2016 ዓ.ም."), t("6,800 m²", "6,800 ካሬ ሜትር")],
  },
  {
    image: img("real-estate-card-midrise-apartments-balconies", "A mid-rise apartment building with glass balconies, large windows, pale cladding and a brick base", "የመስታወት በረንዳዎች፣ ትልልቅ መስኮቶች፣ ፈዛዛ ሽፋንና የጡብ መሠረት ያለው መካከለኛ ከፍታ ያለው ሕንፃ"),
    subtitle: t("Mixed use", "ቅይጥ አገልግሎት"),
    title: t("Kazanchis Court", "ካዛንቺስ ኮርት"),
    meta: [place("Kazanchis", "ካዛንቺስ"), t("2023", "2015 ዓ.ም."), t("3,200 m²", "3,200 ካሬ ሜትር")],
  },
];

const more = [
  {
    image: img("real-estate-card-bright-living-room", "A bright living room with two grey sofas facing each other, a pale rug and sliding glass doors", "ፊት ለፊት የተቀመጡ ሁለት ግራጫ ሶፋዎች፣ ፈዛዛ ምንጣፍና ተንሸራታች የመስታወት በሮች ያሉት ብሩህ ሳሎን"),
    subtitle: t("Interior", "የውስጥ ዲዛይን"),
    title: t("Sarbet Apartment", "የሳርቤት አፓርትመንት"),
    meta: [place("Sarbet", "ሳርቤት"), t("2025", "2017 ዓ.ም."), t("160 m²", "160 ካሬ ሜትር")],
  },
  {
    image: img("business-about-office", "An office corridor with black-framed glass walls, pendant lamps and a lounge area", "ጥቁር ፍሬም ያላቸው የመስታወት ግድግዳዎች፣ የተንጠለጠሉ መብራቶችና የመቀመጫ ቦታ ያለው የቢሮ መተላለፊያ"),
    subtitle: t("Workplace", "የሥራ ቦታ"),
    title: t("Meskel Square Glass Office", "የመስቀል አደባባይ የመስታወት ቢሮ"),
    meta: [place("Bole", "ቦሌ"), t("2024", "2016 ዓ.ም."), t("900 m²", "900 ካሬ ሜትር")],
  },
  {
    image: img("real-estate-gallery-kitchen-garden-window", "A warm modern kitchen with cream cabinets, an island and a large window onto a garden", "ክሬም ቀለም ያላቸው ካቢኔቶች፣ ደሴት ጠረጴዛና ወደ አትክልት የሚያሳይ ትልቅ መስኮት ያለው ዘመናዊ ማብሰያ ቤት"),
    subtitle: t("Interior", "የውስጥ ዲዛይን"),
    title: t("Old Airport Garden Kitchen", "የኦልድ ኤርፖርት የአትክልት ማብሰያ ቤት"),
    meta: [place("Old Airport", "ኦልድ ኤርፖርት"), t("2023", "2015 ዓ.ም."), t("38 m²", "38 ካሬ ሜትር")],
  },
];

save("architect", {
  name: t("Meskot Architects", "መስኮት አርክቴክቶች"),
  tagline: t("Architecture and interiors, Addis Ababa", "ሥነ ሕንፃና የውስጥ ዲዛይን፣ አዲስ አበባ"),
  languages: ["en", "am"],
  theme: { primary: "#1A1A1A", accent: "#1A1A1A", background: "#EFEDE8", text: "#1A1A1A", font: "modern", radius: "none", style: "drafting" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Sarbet, Addis Ababa", "ሳርቤት፣ አዲስ አበባ"),
    hours: [{ days: t("Monday to Friday", "ከሰኞ እስከ ዓርብ"), time: t("8:30 am to 5:30 pm", "ከጠዋቱ 2:30 እስከ ከሰዓት በኋላ 11:30") }],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Studio", "ስቱዲዮ"),
      description: t("Meskot Architects: houses, housing, workplaces and interiors in Addis Ababa and beyond.", "መስኮት አርክቴክቶች፦ በአዲስ አበባና ከዚያ ውጭ መኖሪያ ቤቶች፣ የጋራ መኖሪያዎች፣ የሥራ ቦታዎችና የውስጥ ዲዛይን።"),
      sections: [
        {
          type: "hero",
          id: "top",
          variant: "immersive",
          frame: true,
          eyebrow: t("Architecture · Addis Ababa", "ሥነ ሕንፃ · አዲስ አበባ"),
          heading: t("Buildings that hold the light", "ብርሃንን የሚይዙ ሕንፃዎች"),
          image: img("real-estate-hero-modern-apartment-corner-sky", "The top corner of a black-and-white apartment block with large windows against a pale sky", "ትልልቅ መስኮቶች ያሉት የጥቁርና ነጭ የመኖሪያ ሕንፃ የላይኛው ጥግ በፈዛዛ ሰማይ ፊት"),
          primaryAction: start,
          secondaryAction: link("Selected work", "የተመረጡ ሥራዎች", "#work"),
        },
        {
          type: "about",
          id: "studio",
          eyebrow: t("The studio", "ስቱዲዮው"),
          heading: t("Architecture and interiors, drawn by hand first", "ሥነ ሕንፃና የውስጥ ዲዛይን፣ መጀመሪያ በእጅ የሚሳሉ"),
          body: t(
            "We design houses, housing and workplaces for the light, rain and altitude of the Ethiopian highlands.\n\nEvery project begins with a walk around the site and a pencil, and we stay involved while it is built.",
            "ለኢትዮጵያ ደጋማ ቦታዎች ብርሃን፣ ዝናብና ከፍታ የሚስማሙ መኖሪያ ቤቶችን፣ የጋራ መኖሪያዎችንና የሥራ ቦታዎችን እንነድፋለን።\n\nእያንዳንዱ ፕሮጀክት የሚጀምረው ቦታውን በመዞርና በእርሳስ ነው፤ ሲገነባም አብረን እንሳተፋለን።",
          ),
          image: img("personal-about-creative-desk", "A wooden desk with pencils, brushes, books, rolled drawings, a lamp and plants", "እርሳሶች፣ ብሩሾች፣ መጻሕፍት፣ የተጠቀለሉ ሥዕሎች፣ መብራትና ተክሎች ያሉበት የእንጨት ጠረጴዛ"),
          imageSide: "start",
        },
        { type: "cards", id: "work", layout: "grid", eyebrow: t("Selected work", "የተመረጡ ሥራዎች"), heading: t("Three recent buildings", "ሦስት የቅርብ ጊዜ ሕንፃዎች"), items: projects, action: link("All projects", "ሁሉም ፕሮጀክቶች", "/projects") },
        {
          type: "hero",
          id: "context",
          variant: "immersive",
          eyebrow: t("Context", "አውድ"),
          heading: t("We design for this city's light, rain and height", "ለዚህች ከተማ ብርሃን፣ ዝናብና ከፍታ እንነድፋለን"),
          image: img("real-estate-hero-addis-skyline-trees", "The Addis Ababa skyline with a tall glass tower above a dark band of trees under a calm sky", "የአዲስ አበባ ሰማይ መስመር፣ ከጨለማ የዛፎች መስመር በላይ ረጅም የመስታወት ሕንፃ በረጋ ሰማይ ሥር"),
        },
        {
          type: "services",
          id: "principles",
          variant: "numbered",
          eyebrow: t("Principles", "መርሖች"),
          heading: t("How we work", "እንዴት እንደምንሠራ"),
          items: [
            { title: t("Site first", "መጀመሪያ ቦታው"), description: t("Sun, wind, neighbours and the trees already there shape the plan before we draw a wall.", "ግድግዳ ከመሳላችን በፊት ፀሐይ፣ ነፋስ፣ ጎረቤቶችና ቀድሞ የነበሩ ዛፎች ዕቅዱን ይቀርጻሉ።") },
            { title: t("Local materials", "የአገር ውስጥ ቁሳቁሶች"), description: t("Stone, brick and timber that builders here know, used carefully and left honest.", "እዚህ ያሉ ግንበኞች የሚያውቋቸው ድንጋይ፣ ጡብና እንጨት፣ በጥንቃቄ የሚጠቀሙና ተፈጥሯቸው የሚታይ።") },
            { title: t("On site to the end", "እስከ መጨረሻ ቦታው ላይ"), description: t("We stay close to the build, so what is built is what was drawn.", "የተሳለው እንዲገነባ ከግንባታው አንርቅም።") },
          ],
        },
        { type: "quote", id: "statement", quote: t("A good building is quiet. It lets the light, the people and the city speak.", "ጥሩ ሕንፃ ጸጥ ያለ ነው። ብርሃኑ፣ ሰዎቹና ከተማዋ እንዲናገሩ ይፈቅዳል።") },
        {
          type: "stats",
          id: "profile",
          tone: "soft",
          heading: t("The studio in numbers", "ስቱዲዮው በቁጥር"),
          items: [
            { value: t("12", "12"), label: t("years of practice", "የሥራ ዓመታት") },
            { value: t("48", "48"), label: t("buildings completed", "የተጠናቀቁ ሕንፃዎች") },
            { value: t("9", "9"), label: t("architects and designers", "አርክቴክቶችና ዲዛይነሮች") },
          ],
        },
        {
          type: "cta",
          id: "contact",
          heading: t("A site, a brief or just a sketch?", "ቦታ፣ መመሪያ ወይም ንድፍ ብቻ አለዎት?"),
          body: t("Tell us about it and we will reply.", "ስለ እሱ ይንገሩን፤ እንመልስልዎታለን።"),
          primaryAction: start,
        },
      ],
    },
    {
      path: "/projects",
      title: t("Projects", "ፕሮጀክቶች"),
      nav: t("Projects", "ፕሮጀክቶች"),
      description: t("Houses, housing, workplaces and interiors by Meskot Architects.", "በመስኮት አርክቴክቶች የተሠሩ መኖሪያ ቤቶች፣ የጋራ መኖሪያዎች፣ የሥራ ቦታዎችና የውስጥ ዲዛይኖች።"),
      sections: [{ type: "cards", id: "projects", layout: "grid", eyebrow: t("Projects", "ፕሮጀክቶች"), heading: t("Built and in progress", "የተገነቡና በሂደት ላይ ያሉ"), items: [...projects, ...more] }],
    },
    {
      path: "/contact",
      title: t("Contact", "አድራሻ"),
      nav: t("Contact", "አድራሻ"),
      description: t("Start a project with Meskot Architects in Addis Ababa.", "በአዲስ አበባ ከመስኮት አርክቴክቶች ጋር ፕሮጀክት ይጀምሩ።"),
      sections: [
        {
          type: "form",
          id: "brief",
          kind: "contact",
          eyebrow: t("New project", "አዲስ ፕሮጀክት"),
          heading: t("Tell us about your project", "ስለ ፕሮጀክትዎ ይንገሩን"),
          intro: t("A few lines are enough. We will reply and arrange to see the site.", "ጥቂት መስመሮች ይበቃሉ። እንመልስልዎታለን፣ ቦታውንም ለማየት እንቀጥራለን።"),
          fields: [
            { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
            { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true },
            { name: "kind", label: t("What is it?", "ምንድን ነው?"), type: "select", options: [t("A house", "መኖሪያ ቤት"), t("Apartments", "አፓርትመንቶች"), t("A workplace", "የሥራ ቦታ"), t("An interior", "የውስጥ ዲዛይን"), t("Something else", "ሌላ")] },
            { name: "where", label: t("Where is the site?", "ቦታው የት ነው?"), type: "text" },
            { name: "message", label: t("Tell us more", "ተጨማሪ ይንገሩን"), type: "textarea", required: true },
          ],
          submitLabel: t("Send", "ላክ"),
          successMessage: t("Thank you. We will be in touch.", "እናመሰግናለን። እናገኝዎታለን።"),
        },
        { type: "contact", id: "office", eyebrow: t("The office", "ቢሮው"), heading: t("Visit the studio", "ስቱዲዮውን ይጎብኙ"), intro: t("Call first and we will have the kettle on.", "አስቀድመው ይደውሉ፤ ሻይ ይዘን እንጠብቅዎታለን።") },
        { type: "map", id: "map", eyebrow: t("Getting here", "አደራረስ"), heading: t("Find the studio", "ስቱዲዮውን ያግኙ") },
      ],
    },
  ],
});
