import { t, img, link, birr, save } from "./lib.mjs";

// Construction: a building materials supplier that also does finishing work. Art direction
// "swiss" (docs/research/new-templates-design-plan.md): a strict grid, numbered sections,
// condensed capitals, a hazard stripe, and today's prices in a table with units.
const quote = link("Get a price", "ዋጋ ይጠይቁ", "/#quote");
const prices = link("Today's prices", "የዛሬ ዋጋ", "/prices");
const call = link("Call the yard", "ይደውሉልን", "tel:+251911000000");

const P = {
  yard: img("construction-hero-steel-materials-yard", "Stacks of steel profiles in a materials yard under a palm tree", "በዘንባባ ዛፍ አጠገብ ባለ የዕቃ ግቢ የተደረደሩ የብረት ፕሮፋይሎች"),
  site: img("construction-hero-site-mixer-steel-columns", "A building site with steel column cages and a cement mixer", "የብረት ምሰሶዎችና የሲሚንቶ መደባለቂያ ያሉበት የግንባታ ቦታ"),
  crew: img("construction-about-smiling-site-workers", "Smiling site workers in safety vests and hard hats", "የደኅንነት ልብስና ቆብ ያደረጉ ፈገግተኛ የግንባታ ሠራተኞች"),
  cement: img("construction-card-cement-bags-pallet", "Unbranded cement bags stacked on a wooden pallet", "በእንጨት ፓሌት ላይ የተደረደሩ የሲሚንቶ ከረጢቶች"),
  rebar: img("construction-card-steel-rebar-stack", "A stack of ribbed steel reinforcing bars", "የተደረደሩ የአርማታ ብረቶች"),
  tiles: img("construction-card-ceramic-floor-tiles", "Ceramic floor tiles being laid with spacers", "በመለያ እየተነጠፉ ያሉ የሴራሚክ ወለል ንጣፎች"),
  aluminium: img("construction-card-aluminium-profile-measuring", "An aluminium window profile being measured with a tape", "በሜትር የሚለካ የአሉሚኒየም መስኮት ፕሮፋይል"),
  paint: img("construction-card-open-paint-cans", "Open paint cans in several colours", "የተከፈቱ የተለያዩ ቀለም ጣሳዎች"),
  apartment: img("construction-gallery-apartment-building-luanda", "A finished apartment building with balconies", "በረንዳዎች ያሉት የተጠናቀቀ የአፓርትመንት ሕንፃ"),
  painting: img("construction-gallery-interior-wall-painting", "A painter rolling white paint onto an interior wall", "የውስጥ ግድግዳ በነጭ ቀለም የሚቀባ ቀለም ቀቢ"),
};

const inStock = t("In stock", "አለ");
const arriving = t("Arriving Friday", "ዓርብ ይደርሳል");
const qtl = t("quintal", "ኩንታል");
const item = (en, am, unit, price, tag, den, dam) => ({ name: t(en, am), unit, price: birr(price), ...(tag ? { tag } : {}), ...(den ? { description: t(den, dam) } : {}) });

const cement = {
  name: t("Cement", "ሲሚንቶ"),
  items: [
    item("OPC 42.5", "ኦፒሲ 42.5", qtl, 1850, inStock, "For columns, beams and slabs", "ለምሰሶ፣ ለቢምና ለሶሌታ"),
    item("PPC 32.5", "ፒፒሲ 32.5", qtl, 1650, inStock, "For blocks, plaster and floors", "ለብሎኬት፣ ለልስንና ለወለል"),
  ],
};
const steel = {
  name: t("Reinforcing steel", "አርማታ ብረት"),
  items: [
    item("Rebar Ø8 mm", "ብረት Ø8 ሚሜ", t("12 m bar", "12 ሜትር"), 520, inStock),
    item("Rebar Ø12 mm", "ብረት Ø12 ሚሜ", t("12 m bar", "12 ሜትር"), 1380, inStock),
    item("Rebar Ø16 mm", "ብረት Ø16 ሚሜ", t("12 m bar", "12 ሜትር"), 2450, arriving),
    item("Binding wire", "ማሰሪያ ሽቦ", t("kg", "ኪሎ"), 160, inStock),
  ],
};
const finishing = {
  name: t("Finishing", "የማጠናቀቂያ ዕቃዎች"),
  items: [
    item("Ceramic floor tile 60×60", "የሴራሚክ ወለል 60×60", t("m²", "ካሬ ሜትር"), 1200, inStock),
    item("Wall paint, white", "የግድግዳ ቀለም፣ ነጭ", t("20 L bucket", "20 ሊትር"), 4500, inStock),
    item("Aluminium window profile", "የአሉሚኒየም መስኮት ፕሮፋይል", t("6 m", "6 ሜትር"), 2800, arriving),
    item("Gypsum board 12 mm", "ጂፕሰም ቦርድ 12 ሚሜ", t("sheet", "ሉክ"), 950, inStock),
  ],
};
const priceNote = t("Prices in Birr, before delivery. They change with the market: we confirm the price of the day before you pay.", "ዋጋዎቹ በብር ናቸው፣ ማጓጓዣ አልተጨመረም። ከገበያው ጋር ይለዋወጣሉ፤ ከመክፈልዎ በፊት የዕለቱን ዋጋ እናረጋግጣለን።");

const supply = [
  { image: P.cement, title: t("Cement", "ሲሚንቶ"), description: t("OPC and PPC by the quintal, from one bag to a full truck.", "ኦፒሲና ፒፒሲ በኩንታል፤ ከአንድ ከረጢት እስከ ሙሉ መኪና።"), action: prices },
  { image: P.rebar, title: t("Reinforcing steel", "አርማታ ብረት"), description: t("Ø8 to Ø20 mm, cut and bent to your schedule on request.", "ከØ8 እስከ Ø20 ሚሜ፤ ሲጠየቅ በዲዛይንዎ ተቆርጦና ተጣጥፎ።"), action: prices },
  { image: P.tiles, title: t("Tiles and floors", "ሴራሚክና ወለል"), description: t("Floor and wall tiles, adhesive and grout, laid by our team if you like.", "የወለልና የግድግዳ ሴራሚክ፣ ማጣበቂያና ማሸጊያ፤ ከፈለጉ በቡድናችን ይነጠፋል።"), action: prices },
  { image: P.aluminium, title: t("Aluminium and glass", "አሉሚኒየምና መስታወት"), description: t("Window and door profiles, made and fitted to measure.", "የመስኮትና የበር ፕሮፋይሎች፤ በልክ ተሠርተው ይገጠማሉ።"), action: quote },
  { image: P.paint, title: t("Paint", "ቀለም"), description: t("Interior and exterior paint in 4 L and 20 L, mixed to your colour.", "የውስጥና የውጭ ቀለም በ4 እና በ20 ሊትር፤ በመረጡት ቀለም ይደባለቃል።"), action: prices },
];

const quoteForm = {
  type: "form",
  id: "quote",
  kind: "order",
  heading: t("Request a quote", "ዋጋ ይጠይቁ"),
  intro: t("Tell us what you need and where. We send the price of the day and the delivery cost on Telegram within the hour.", "የሚፈልጉትንና የሚደርስበትን ቦታ ይንገሩን። የዕለቱን ዋጋና የማጓጓዣ ክፍያ በአንድ ሰዓት ውስጥ በቴሌግራም እንልካለን።"),
  fields: [
    { name: "name", label: t("Your name or company", "ስምዎ ወይም ድርጅትዎ"), type: "text", required: true },
    { name: "phone", label: t("Phone", "ስልክ"), type: "tel", required: true },
    { name: "items", label: t("Products and quantities", "ዕቃዎችና ብዛት"), type: "textarea", required: true },
    { name: "site", label: t("Site location", "የግንባታው ቦታ"), type: "text", required: true },
    { name: "date", label: t("Delivery date", "የሚደርስበት ቀን"), type: "date" },
  ],
  submitLabel: t("Send my request", "ጥያቄዬን ላክ"),
  successMessage: t("Thank you. We will send the price within the hour.", "እናመሰግናለን። ዋጋውን በአንድ ሰዓት ውስጥ እንልካለን።"),
};

save("construction", {
  name: t("Abebe Building Supply", "አበበ የግንባታ ዕቃዎች"),
  tagline: t("Cement, steel and finishing materials, delivered to your site in Addis Ababa", "ሲሚንቶ፣ ብረትና የማጠናቀቂያ ዕቃዎች፣ አዲስ አበባ ውስጥ እስከ ግንባታ ቦታዎ"),
  languages: ["en", "am"],
  theme: { primary: "#B8461B", accent: "#1F2328", background: "#F4F2ED", text: "#17191C", highlight: "#F5B800", font: "condensed", radius: "none", style: "swiss" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Merkato, near Anwar mosque, Addis Ababa", "መርካቶ፣ አንዋር መስጊድ አካባቢ፣ አዲስ አበባ"),
    hours: [
      { days: t("Monday to Saturday", "ከሰኞ እስከ ቅዳሜ"), time: t("7:30 am to 6:30 pm", "ከጠዋቱ 1:30 እስከ ምሽቱ 12:30") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Cement, reinforcing steel, tiles, aluminium and paint in Merkato, Addis Ababa, with today's prices in Birr and delivery to your site.", "ሲሚንቶ፣ አርማታ ብረት፣ ሴራሚክ፣ አሉሚኒየምና ቀለም በመርካቶ፣ አዲስ አበባ፤ የዛሬ ዋጋ በብርና እስከ ግንባታ ቦታዎ ማድረስ።"),
      sections: [
        {
          type: "hero",
          variant: "split",
          id: "top",
          eyebrow: t("Merkato · Addis Ababa · since 2012", "መርካቶ · አዲስ አበባ · ከ2004 ጀምሮ"),
          heading: t("Cement, steel and finishing. Delivered.", "ሲሚንቶ፣ ብረትና ማጠናቀቂያ፤ እስከ ቦታዎ።"),
          subheading: t("Today's prices on the page, a quote on Telegram within the hour, and our own trucks to your site.", "የዛሬ ዋጋ በገጹ ላይ፣ ዋጋ በአንድ ሰዓት ውስጥ በቴሌግራም፣ በራሳችን መኪና እስከ ግንባታ ቦታዎ።"),
          image: P.yard,
          primaryAction: quote,
          secondaryAction: prices,
          facts: [
            { value: t("14", "14"), label: t("years in Merkato", "ዓመት በመርካቶ") },
            { value: t("3", "3"), label: t("delivery trucks", "የማጓጓዣ መኪኖች") },
            { value: t("Same day", "በዕለቱ"), label: t("delivery in Addis", "በአዲስ አበባ ማድረስ") },
          ],
        },
        {
          type: "menu",
          id: "prices",
          layout: "table",
          eyebrow: t("Updated every morning", "በየጠዋቱ የሚታደስ"),
          heading: t("Today's prices", "የዛሬ ዋጋ"),
          intro: priceNote,
          categories: [cement, { name: steel.name, items: steel.items.slice(1, 3) }, { name: finishing.name, items: finishing.items.slice(0, 2) }],
        },
        {
          type: "cards",
          id: "supply",
          layout: "grid",
          eyebrow: t("What we supply", "የምናቀርበው"),
          heading: t("Everything from the slab to the paint", "ከሶሌታ እስከ ቀለም"),
          items: supply,
        },
        {
          type: "stats",
          id: "numbers",
          tone: "dark",
          heading: t("A yard you can count on", "የሚታመን ግቢ"),
          items: [
            { value: t("14", "14"), label: t("years in Merkato", "ዓመት በመርካቶ") },
            { value: t("340+", "340+"), label: t("buildings supplied", "ዕቃ ያቀረብንላቸው ሕንፃዎች") },
            { value: t("3", "3"), label: t("trucks of our own", "የራሳችን መኪኖች") },
            { value: t("6", "6"), label: t("sub-cities we deliver to daily", "በየቀኑ የምናደርስባቸው ክፍለ ከተሞች") },
          ],
        },
        {
          type: "steps",
          id: "how",
          eyebrow: t("How ordering works", "እንዴት ይታዘዛል"),
          heading: t("From a message to your site", "ከመልእክት እስከ ግንባታ ቦታዎ"),
          items: [
            { title: t("Send your list", "ዝርዝርዎን ይላኩ"), description: t("Here, by phone or on Telegram.", "እዚህ፣ በስልክ ወይም በቴሌግራም።") },
            { title: t("Get the price of the day", "የዕለቱን ዋጋ ያግኙ"), description: t("With the delivery cost, within the hour.", "ከማጓጓዣ ክፍያ ጋር፣ በአንድ ሰዓት ውስጥ።") },
            { title: t("Pay by Telebirr or bank", "በቴሌብር ወይም በባንክ ይክፈሉ"), description: t("You get a receipt with our TIN.", "የግብር ከፋይ መለያ ቁጥራችን ያለበት ደረሰኝ ይሰጥዎታል።") },
            { title: t("We deliver", "እናደርሳለን"), description: t("Same day inside Addis when you order before noon.", "ከቀትር በፊት ካዘዙ በአዲስ አበባ ውስጥ በዕለቱ።") },
          ],
          action: quote,
        },
        {
          type: "cards",
          id: "projects",
          layout: "feature",
          eyebrow: t("Recent work", "የቅርብ ጊዜ ሥራዎች"),
          heading: t("Buildings we supplied and finished", "ዕቃ ያቀረብንላቸውና ያጠናቀቅናቸው"),
          items: [
            { image: P.apartment, subtitle: t("G+7 apartments · CMC", "ጂ+7 አፓርትመንት · ሲኤምሲ"), title: t("Cement, steel and tiles for 48 flats", "ለ48 ቤቶች ሲሚንቶ፣ ብረትና ሴራሚክ"), description: t("Supplied over fourteen months, delivered on schedule floor by floor.", "በአሥራ አራት ወራት፣ ፎቅ በፎቅ በጊዜው የደረሰ።") },
            { image: P.painting, subtitle: t("Office finishing · Bole", "የቢሮ ማጠናቀቂያ · ቦሌ"), title: t("Gypsum, paint and floors in six weeks", "ጂፕሰም፣ ቀለምና ወለል በስድስት ሳምንት"), description: t("Our finishing team, with materials from our own yard.", "በማጠናቀቂያ ቡድናችን፣ ከራሳችን ግቢ በመጡ ዕቃዎች።") },
          ],
          action: link("See all projects", "ሁሉንም ሥራዎች ይመልከቱ", "/projects"),
        },
        quoteForm,
        {
          type: "about",
          id: "licences",
          eyebrow: t("Licensed and registered", "ፈቃድና ምዝገባ"),
          heading: t("Buy with paperwork", "በሕጋዊ ሰነድ ይግዙ"),
          body: t("Every sale comes with a receipt carrying our TIN, so it counts for your project accounts. Our finishing team works under a contractor licence.", "እያንዳንዱ ሽያጭ የግብር ከፋይ መለያ ቁጥራችን ያለበት ደረሰኝ አለው፤ ለፕሮጀክትዎ ሒሳብ ያገለግላል። የማጠናቀቂያ ቡድናችን በሥራ ተቋራጭ ፈቃድ ይሠራል።"),
          image: P.crew,
          imageSide: "end",
          points: [t("Trade licence: [your licence number]", "የንግድ ፈቃድ፦ [የፈቃድ ቁጥርዎ]"), t("TIN: [your TIN]", "የግብር ከፋይ መለያ ቁጥር፦ [ቁጥርዎ]"), t("Contractor grade: [your grade]", "የሥራ ተቋራጭ ደረጃ፦ [ደረጃዎ]")],
        },
        {
          type: "cta",
          id: "end",
          heading: t("Need it on site tomorrow?", "ነገ ቦታው ላይ ይፈልጉታል?"),
          body: t("Order before noon for same-day delivery inside Addis Ababa.", "ከቀትር በፊት ካዘዙ በአዲስ አበባ ውስጥ በዕለቱ ይደርሳል።"),
          image: P.site,
          primaryAction: quote,
          secondaryAction: call,
        },
      ],
    },
    {
      path: "/prices",
      title: t("Prices", "ዋጋ"),
      nav: t("Prices", "ዋጋ"),
      description: t("Today's prices at Abebe Building Supply: cement by the quintal, reinforcing steel by the bar, tiles, paint and aluminium, in Birr.", "በአበበ የግንባታ ዕቃዎች የዛሬ ዋጋ፦ ሲሚንቶ በኩንታል፣ ብረት በፍሬ፣ ሴራሚክ፣ ቀለምና አሉሚኒየም፣ በብር።"),
      sections: [
        { type: "menu", id: "all-prices", layout: "table", eyebrow: t("Updated every morning", "በየጠዋቱ የሚታደስ"), heading: t("All prices", "ሁሉም ዋጋዎች"), intro: priceNote, categories: [cement, steel, finishing] },
        { ...quoteForm, id: "quote-prices" },
      ],
    },
    {
      path: "/projects",
      title: t("Projects", "ሥራዎች"),
      nav: t("Projects", "ሥራዎች"),
      description: t("Buildings Abebe Building Supply has supplied and finished across Addis Ababa.", "አበበ የግንባታ ዕቃዎች በአዲስ አበባ ዕቃ ያቀረበላቸውና ያጠናቀቃቸው ሕንፃዎች።"),
      sections: [
        { type: "hero", variant: "banner", eyebrow: t("Projects", "ሥራዎች"), heading: t("Work you can visit", "ሊጎበኙት የሚችሉት ሥራ"), subheading: t("Ask us for the address of a finished building near you.", "በአቅራቢያዎ ያለ የተጠናቀቀ ሕንፃ አድራሻ ይጠይቁን።"), image: P.site, primaryAction: quote },
        {
          type: "gallery",
          id: "photos",
          layout: "mosaic",
          heading: t("On site", "በግንባታ ቦታ"),
          images: [P.apartment, P.painting, P.tiles, P.crew, P.yard],
        },
      ],
    },
    {
      path: "/contact",
      title: t("Contact", "አድራሻ"),
      nav: t("Contact", "አድራሻ"),
      description: t("Find Abebe Building Supply in Merkato, Addis Ababa: phone, Telegram, opening hours and directions.", "አበበ የግንባታ ዕቃዎችን በመርካቶ ያግኙ፦ ስልክ፣ ቴሌግራም፣ የሥራ ሰዓትና አቅጣጫ።"),
      sections: [
        { type: "contact", id: "contact", heading: t("Visit the yard", "ግቢያችንን ይጎብኙ"), intro: t("Come and see the stock, or send your list and we bring it to you.", "ዕቃዎቹን መጥተው ይዩ፤ ወይም ዝርዝሩን ይላኩልን፣ እናመጣልዎታለን።") },
        { type: "map", id: "map", heading: t("Find us in Merkato", "በመርካቶ ያግኙን"), query: "Merkato, Addis Ababa" },
      ],
    },
  ],
});
