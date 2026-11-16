import { t, img, link, birr, save } from "./lib.mjs";

const order = link("Order on Telegram", "በቴሌግራም ይዘዙ", "https://t.me/yourbusiness");
const orderThis = link("Order this", "ይህን ይዘዙ", "/#order");
const seeProducts = link("See products", "ምርቶቹን ይመልከቱ", "#new");

const products = [
  {
    image: img("shop-card-habesha-kemis", "A woman in a white cotton habesha kemis with black and gold tibeb embroidery and silver jewellery", "ጥቁርና ወርቃማ ጥበብ ያለው ነጭ የሀበሻ ቀሚስ የለበሰች ሴት፣ ከብር ጌጥ ጋር"),
    subtitle: t("Habesha kemis", "የሀበሻ ቀሚስ"),
    title: t("Holiday kemis with tibeb", "የበዓል ቀሚስ ከጥበብ ጋር"),
    badge: t("Best seller", "በብዛት የሚሸጥ"),
    meta: [t("Handwoven cotton", "በእጅ የተሸመነ ጥጥ"), t("Netela included", "ከነጠላ ጋር"), t("S to XXL", "ከS እስከ XXL")],
    description: t("Soft menen cotton with a wide hand-picked tibeb on the chest, hem and sleeves. Small adjustments are free.", "ለስላሳ የመነን ጥጥ፤ በደረት፣ በጫፍና በእጅጌ ላይ ሰፊ የእጅ ጥበብ። ትንሽ ማስተካከያ በነፃ ነው።"),
    price: birr(15000),
    action: orderThis,
  },
  {
    image: img("shop-card-woven-scarves", "Four folded hand-woven cotton scarves in blue, tan, pink and purple with fringed ends", "በሰማያዊ፣ በቡናማ፣ በሮዝና በወይን ጠጅ ቀለም የተሸመኑ አራት የታጠፉ የጥጥ ስካርፎች"),
    subtitle: t("Scarves", "ስካርፍ"),
    title: t("Handwoven cotton scarf", "በእጅ የተሸመነ የጥጥ ስካርፍ"),
    meta: [t("100% cotton", "100% ጥጥ"), t("180 × 60 cm", "180 × 60 ሳ.ሜ"), t("4 colours", "4 ቀለሞች")],
    description: t("Light enough for every day, warm enough for Addis mornings. Each one is finished with a hand-knotted fringe.", "ለዘወትር የሚቀል፣ ለአዲስ አበባ ጠዋት የሚሞቅ። ጫፉ በእጅ የተቋጠረ ዘርፍ አለው።"),
    price: birr(1200),
    action: orderThis,
  },
  {
    image: img("shop-card-leather-tote", "A tan hand-stitched leather tote bag hanging on a white cupboard", "በነጭ ቁም ሳጥን ላይ የተሰቀለ በእጅ የተሰፋ ቡናማ የቆዳ ቦርሳ"),
    subtitle: t("Leather", "የቆዳ ሥራ"),
    title: t("Hand-stitched leather tote", "በእጅ የተሰፋ የቆዳ ቦርሳ"),
    badge: t("New", "አዲስ"),
    meta: [t("Ethiopian leather", "የኢትዮጵያ ቆዳ"), t("38 × 34 cm", "38 × 34 ሳ.ሜ"), t("Fits a laptop", "ላፕቶፕ ይይዛል")],
    description: t("Thick highland leather that softens and darkens with use. Stitched by hand, with one inside pocket.", "እየተጠቀሙበት የሚለሰልስና የሚጠቁር ወፍራም የደጋ ቆዳ። በእጅ የተሰፋ፣ አንድ የውስጥ ኪስ ያለው።"),
    price: birr(4800),
    action: orderThis,
  },
  {
    image: img("shop-card-jebena-pottery", "A red clay bottle with white hand-painted patterns among glossy black clay jebena coffee pots", "በነጭ ቀለም በእጅ ያጌጠ ቀይ የሸክላ ጠርሙስ፣ በሚያብረቀርቁ ጥቁር ጀበናዎች መካከል"),
    subtitle: t("Pottery", "የሸክላ ሥራ"),
    title: t("Jebena and painted clay", "ጀበና እና ያጌጠ ሸክላ"),
    meta: [t("Black clay", "ጥቁር ሸክላ"), t("Hand painted", "በእጅ ያጌጠ"), t("3 sizes", "3 መጠኖች")],
    description: t("Jebenas that pour well and painted bottles for the shelf, made by potters we have bought from for years.", "በደንብ የሚቀዱ ጀበናዎች እና ለመደርደሪያ የሚሆኑ ያጌጡ ጠርሙሶች፤ ለዓመታት ከምንገዛቸው ሸክላ ሠሪዎች።"),
    price: birr(650),
    priceNote: t("from", "ጀምሮ"),
    action: orderThis,
  },
  {
    image: img("shop-gallery-handwoven-textile", "A hand holding the fringed edge of white hand-woven cotton with blue patterned bands", "ሰማያዊ ጥለት ያለው ነጭ የሸማ ጨርቅ ዘርፍ የያዘ እጅ"),
    subtitle: t("Netela", "ነጠላ"),
    title: t("Netela with a blue tibeb", "ሰማያዊ ጥበብ ያለው ነጠላ"),
    badge: t("New", "አዲስ"),
    meta: [t("Two-layer cotton", "ባለ ሁለት ድርብ ጥጥ"), t("Hand-knotted fringe", "በእጅ የተቋጠረ ዘርፍ")],
    description: t("Fine, light cotton straight from the loom, with a woven blue border at both ends.", "በቀጥታ ከሸማው የወጣ ስስና ቀላል ጥጥ፤ በሁለቱም ጫፍ የተሸመነ ሰማያዊ ጥበብ ያለው።"),
    price: birr(1500),
    action: orderThis,
  },
  {
    image: img("shop-hero-woven-baskets-wall", "A wall of round woven basket trays, some brightly coloured and some natural straw", "በግድግዳ ላይ የተሰቀሉ ክብ ስፌቶች፤ ከፊሉ ባለ ደማቅ ቀለም፣ ከፊሉ የተፈጥሮ ሣር"),
    subtitle: t("Baskets", "ስፌት"),
    title: t("Woven basket trays", "የሣር ስፌቶች"),
    badge: t("Best seller", "በብዛት የሚሸጥ"),
    meta: [t("Coiled grass", "ከሣር የተሰፋ"), t("40 cm across", "40 ሳ.ሜ ስፋት"), t("Bright or natural", "ደማቅ ወይም የተፈጥሮ")],
    description: t("For the wall, the table or bread. Every colour pattern is a little different.", "ለግድግዳ፣ ለገበታ ወይም ለዳቦ። እያንዳንዱ የቀለም ጥለት ትንሽ ይለያያል።"),
    price: birr(1800),
    action: orderThis,
  },
];

// Home: a swipe row of pieces (the basket tray is left out there: the hero shows the same photo).
const [kemis, scarf, tote, jebena, netela, basket] = products;
const newRow = [kemis, netela, tote, scarf, jebena];

// Products page: a grid with pills by kind; the kemis card shows how it is worn.
const clothes = t("Clothes", "ልብስ");
const handmade = t("Handmade", "የእጅ ሥራ");
const productGrid = [
  {
    ...kemis,
    badge: clothes,
    photos: [
      img("shop-hero-habesha-dress-field", "A smiling woman in an embroidered traditional dress and silver jewellery standing in a golden field", "ጥልፍ ያለው ባህላዊ ልብስና የብር ጌጥ ያደረገች ፈገግተኛ ሴት በወርቃማ ማሳ መካከል"),
      img("shop-about-spinning-yarn", "A woman in an embroidered grey traditional dress and silver jewellery working thread in her hands", "ጥልፍ ያለው ግራጫ ባህላዊ ልብስና የብር ጌጥ ያደረገች ሴት ክር በእጇ ስትፈትል"),
    ],
  },
  { ...netela, badge: clothes },
  { ...scarf, badge: clothes },
  { ...tote, badge: handmade },
  { ...jebena, badge: handmade },
  { ...basket, badge: handmade },
];

const orderSteps = [
  { title: t("Choose a piece", "የሚፈልጉትን ይምረጡ"), description: t("Find it on this site, or ask us for photos of what is in the shop today.", "በዚህ ድረ ገጽ ይምረጡ፤ ወይም ዛሬ በሱቁ ያለውን በፎቶ እንድንልክልዎ ይጠይቁን።") },
  { title: t("Write or call", "ይጻፉልን ወይም ይደውሉ"), description: t("Send the name, size and colour on Telegram, by phone or with the order form.", "ስሙን፣ ልኩንና ቀለሙን በቴሌግራም፣ በስልክ ወይም በትዕዛዝ ቅጹ ይላኩልን።") },
  { title: t("Pay when it arrives", "ሲደርስዎ ይክፈሉ"), description: t("We deliver in Addis in 1 to 2 days. Pay the rider in cash or by Telebirr, or pick it up in Merkato.", "በአዲስ አበባ በ1 እስከ 2 ቀን እናደርሳለን። ለአድራሹ በጥሬ ገንዘብ ወይም በቴሌብር ይክፈሉ፤ አሊያም ከመርካቶ ይውሰዱ።") },
];

const nameField = { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true };
const phoneField = { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true };

save("shop", {
  name: t("Tibeb Merkato", "ጥበብ መርካቶ"),
  tagline: t("Handwoven habesha clothes and handmade goods from Merkato, Addis Ababa", "በእጅ የተሸመኑ የሀበሻ ልብሶችና የእጅ ሥራዎች፣ ከመርካቶ አዲስ አበባ"),
  announcement: [
    t("Order on Telegram", "በቴሌግራም ይዘዙ"),
    t("Pay on delivery", "ሲደርስዎ ይክፈሉ"),
    t("Delivery in Addis in 1 to 2 days", "በአዲስ አበባ በ1–2 ቀን እናደርሳለን"),
    t("Free delivery above 10,000 Birr", "ከ10,000 ብር በላይ ማድረሻ ነፃ"),
  ],
  languages: ["en", "am"],
  theme: { primary: "#1F3A5F", accent: "#14202E", background: "#FAF7F0", text: "#2A2A28", font: "classic", radius: "small", style: "editorial" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Merkato, near Anwar Mosque, Addis Ababa", "መርካቶ፣ አንዋር መስጊድ አጠገብ፣ አዲስ አበባ"),
    hours: [
      { days: t("Monday to Saturday", "ከሰኞ እስከ ቅዳሜ"), time: t("8:30 am to 7:00 pm", "ከጠዋቱ 2:30 እስከ ምሽቱ 1 ሰዓት") },
      { days: t("Sunday", "እሑድ"), time: t("10:00 am to 4:00 pm", "ከጠዋቱ 4 እስከ ቀኑ 10 ሰዓት") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Handwoven habesha kemis, netela, scarves, leather and pottery from Merkato. Order by phone or Telegram, pay on delivery in Addis Ababa.", "በእጅ የተሸመነ የሀበሻ ቀሚስ፣ ነጠላ፣ ስካርፍ፣ የቆዳና የሸክላ ሥራ ከመርካቶ። በስልክ ወይም በቴሌግራም ይዘዙ፤ በአዲስ አበባ ሲደርስዎ ይክፈሉ።"),
      sections: [
        {
          type: "hero",
          id: "top",
          variant: "split",
          eyebrow: t("Merkato · Addis Ababa", "መርካቶ · አዲስ አበባ"),
          stamp: t("Woven by hand · Merkato", "በእጅ የተሸመነ · መርካቶ"),
          heading: t("Woven by hand, worn with pride", "በእጅ የተሸመነ፣ በኩራት የሚለበስ"),
          subheading: t("Habesha kemis, netela and handmade goods from weavers we know by name. Order by message and pay when it reaches you.", "በስም ከምናውቃቸው ሸማኔዎች የተገኙ የሀበሻ ቀሚስ፣ ነጠላና የእጅ ሥራዎች። በመልእክት ይዘዙ፤ ሲደርስዎ ይክፈሉ።"),
          image: img("shop-hero-woven-baskets-wall", "A wall of round woven basket trays, some brightly coloured and some natural straw", "በግድግዳ ላይ የተሰቀሉ ክብ ስፌቶች፤ ከፊሉ ባለ ደማቅ ቀለም፣ ከፊሉ የተፈጥሮ ሣር"),
          primaryAction: seeProducts,
          secondaryAction: order,
          facts: [
            { value: t("2010", "2010"), label: t("in Merkato since", "ጀምሮ በመርካቶ") },
            { value: t("14", "14"), label: t("weavers and tailors", "ሸማኔዎችና ልብስ ሰፊዎች") },
            { value: t("1 to 2 days", "1–2 ቀን"), label: t("delivery in Addis", "በአዲስ አበባ ማድረሻ") },
          ],
        },
        {
          // Centrepiece: a product row to swipe on phones and step through with arrows on computers.
          type: "cards",
          id: "new",
          layout: "scroll",
          filters: false,
          eyebrow: t("In the shop now", "አሁን በሱቁ ያሉ"),
          heading: t("Pieces people ask for", "ተፈላጊ ሥራዎች"),
          intro: t("Prices are in Birr. Tap a piece to order it; delivery in Addis is 200 Birr, free above 10,000 Birr.", "ዋጋዎቹ በብር ናቸው። ለማዘዝ የሚፈልጉትን ይንኩ፤ በአዲስ አበባ ማድረሻ 200 ብር ሲሆን ከ10,000 ብር በላይ ነፃ ነው።"),
          items: newRow,
          action: link("See all products and prices", "ሁሉንም ምርቶችና ዋጋዎች ይመልከቱ", "/products"),
        },
        {
          type: "cards",
          id: "collections",
          layout: "grid",
          eyebrow: t("Shop by kind", "በዓይነት ይምረጡ"),
          heading: t("What we make and gather", "የምንሠራውና የምንሰበስበው"),
          intro: t("Clothes from our own looms, and handmade pieces from makers across the country.", "ከራሳችን ሸማ የወጡ ልብሶች እና ከመላ አገሪቱ የእጅ ባለሙያዎች የተገኙ ሥራዎች።"),
          items: [
            { image: img("shop-hero-habesha-dress-field", "A smiling woman in an embroidered traditional dress and silver jewellery standing in a golden field", "ጥልፍ ያለው ባህላዊ ልብስና የብር ጌጥ ያደረገች ፈገግተኛ ሴት በወርቃማ ማሳ መካከል"), title: t("Habesha kemis", "የሀበሻ ቀሚስ"), subtitle: t("Everyday, holiday and wedding", "የዘወትር፣ የበዓልና የሠርግ"), action: link("See the dresses", "ቀሚሶቹን ይመልከቱ", "/products") },
            { image: img("shop-about-spinning-yarn", "A woman in an embroidered grey traditional dress and silver jewellery working thread in her hands", "ጥልፍ ያለው ግራጫ ባህላዊ ልብስና የብር ጌጥ ያደረገች ሴት ክር በእጇ ስትፈትል"), title: t("Netela and gabi", "ነጠላና ጋቢ"), subtitle: t("Straight from the loom", "በቀጥታ ከሸማው"), action: link("See netela and gabi", "ነጠላና ጋቢ ይመልከቱ", "/products") },
            { image: img("cafe-gallery-bread-baskets", "Hands cutting round bread in a woven basket, with more woven baskets around", "በስፌት ውስጥ ያለ ክብ ድፎ ዳቦ የሚቆርሱ እጆች፣ በዙሪያው ሌሎች ስፌቶች"), title: t("Home and kitchen", "ለቤትና ለማዕድ ቤት"), subtitle: t("Mesob, baskets, jebena", "መሶብ፣ ስፌት፣ ጀበና"), action: link("See handmade goods", "የእጅ ሥራዎቹን ይመልከቱ", "/products") },
          ],
        },
        {
          type: "steps",
          id: "how",
          eyebrow: t("How to order", "አስተዛዘዝ"),
          heading: t("No cart. Just tell us", "ቀላል ነው፤ ብቻ ይንገሩን"),
          intro: t("A person answers every message, usually within the hour during shop hours.", "እያንዳንዱን መልእክት ሰው ይመልሳል፤ በሥራ ሰዓት ብዙውን ጊዜ በአንድ ሰዓት ውስጥ።"),
          items: orderSteps,
          action: order,
        },
        {
          type: "about",
          id: "makers",
          eyebrow: t("The makers", "ባለሙያዎቹ"),
          heading: t("Every piece has a weaver behind it", "ከእያንዳንዱ ሥራ ጀርባ ሸማኔ አለ"),
          body: t(
            "Our cloth is woven on wooden looms in Shiro Meda and Gullele, by families who have done this work for generations. A holiday kemis takes one weaver about five days.\n\nWe pay our weavers on the day they deliver, and our tailors finish every dress in the Merkato shop, where you can come and watch.",
            "ጨርቃችን በሽሮ ሜዳና በጉለሌ በእንጨት ሸማ ይሸመናል፤ ሥራውን ከትውልድ ትውልድ በወረሱ ቤተሰቦች። አንድ የበዓል ቀሚስ አንድን ሸማኔ አምስት ቀን ገደማ ይወስድበታል።\n\nሸማኔዎቻችን ሥራቸውን ባስረከቡበት ቀን ይከፈላቸዋል። እያንዳንዱን ቀሚስ ልብስ ሰፊዎቻችን በመርካቶ ሱቃችን ያጠናቅቃሉ፤ መጥተው ማየትም ይችላሉ።",
          ),
          image: img("shop-about-loom-weaving-hands", "A weaver's hands measuring red and teal checked cloth on a wooden hand loom", "በእንጨት ሸማ ላይ ቀይና አረንጓዴ ባለ ካሬ ጨርቅ የሚለካ የሸማኔ እጅ"),
          imageSide: "start",
          highlights: [
            { value: t("14", "14"), label: t("weavers and tailors", "ሸማኔዎችና ልብስ ሰፊዎች") },
            { value: t("5 days", "5 ቀን"), label: t("to weave one kemis", "አንድ ቀሚስ ለመሸመን") },
          ],
          action: link("Have one made for you", "በልክዎ ያሠሩ", "/tailoring"),
        },
        {
          type: "testimonials",
          id: "reviews",
          eyebrow: t("Customers say", "ደንበኞች ምን ይላሉ"),
          heading: t("Worn at weddings, holidays and graduations", "በሠርግ፣ በበዓልና በምረቃ የተለበሱ"),
          items: [
            { quote: t("I ordered on Telegram on Monday and wore my kemis to Meskel on Wednesday. The tibeb is even nicer than in the photo.", "ሰኞ በቴሌግራም አዝዤ ረቡዕ ለመስቀል ቀሚሴን ለበስኩ። ጥበቡ ከፎቶው የበለጠ ያምራል።"), name: "Hanna T.", role: t("Holiday kemis", "የበዓል ቀሚስ") },
            { quote: t("They made matching outfits for eleven of us in two weeks, and every one fitted.", "ለአሥራ አንዳችን ተመሳሳይ ልብስ በሁለት ሳምንት ሠሩልን፤ ሁሉም ልክ ነበር።"), name: "Meron A.", role: t("Wedding order", "የሠርግ ትዕዛዝ") },
            { quote: t("I send their scarves to my sister abroad every year. Good cotton, honest prices.", "ስካርፎቻቸውን በየዓመቱ ውጭ ላለችው እህቴ እልካለሁ። ጥሩ ጥጥ፣ ትክክለኛ ዋጋ።"), name: "Yonas K.", role: t("Regular customer", "የዘወትር ደንበኛ") },
          ],
        },
        {
          type: "form",
          id: "order",
          kind: "order",
          heading: t("Send an order", "ትዕዛዝ ይላኩ"),
          intro: t("Tell us what you want and where to bring it. We call to confirm the size and the price before anything is sent.", "የሚፈልጉትንና የሚደርስበትን ቦታ ይንገሩን። ከመላካችን በፊት ልኩንና ዋጋውን ለማረጋገጥ እንደውላለን።"),
          fields: [
            nameField,
            phoneField,
            {
              name: "item",
              label: t("What would you like?", "ምን ይፈልጋሉ?"),
              type: "select",
              required: true,
              options: [t("Holiday kemis with tibeb", "የበዓል ቀሚስ ከጥበብ ጋር"), t("Everyday kemis", "የዘወትር ቀሚስ"), t("Netela or gabi", "ነጠላ ወይም ጋቢ"), t("Cotton scarf", "የጥጥ ስካርፍ"), t("Leather tote", "የቆዳ ቦርሳ"), t("Jebena or pottery", "ጀበና ወይም የሸክላ ሥራ"), t("Basket", "ስፌት ወይም መሶብ"), t("Something else", "ሌላ")],
            },
            { name: "size", label: t("Size and colour", "ልክና ቀለም"), type: "text" },
            { name: "delivery_address", label: t("Delivery area, or \"pick up\"", "የሚደርስበት ሰፈር፣ ወይም \"ራሴ እወስዳለሁ\""), type: "text", required: true },
            { name: "notes", label: t("Anything else we should know", "ሌላ ማወቅ ያለብን ነገር"), type: "textarea" },
          ],
          submitLabel: t("Send order", "ትዕዛዙን ላክ"),
          successMessage: t("Thank you. We will call you shortly to confirm your order.", "እናመሰግናለን። ትዕዛዝዎን ለማረጋገጥ በቅርቡ እንደውልልዎታለን።"),
        },
        { type: "contact", id: "contact", heading: t("Come and try it on", "መጥተው ይለኩ"), intro: t("The shop is open every day. Bring a friend; there is always coffee.", "ሱቁ በየቀኑ ክፍት ነው። ጓደኛ ይዘው ይምጡ፤ ቡና አይጠፋም።") },
        { type: "map", id: "map", heading: t("Find us in Merkato", "በመርካቶ ያገኙናል"), query: "Anwar Mosque, Merkato, Addis Ababa" },
        {
          type: "cta",
          id: "end",
          heading: t("Seen something you like?", "የወደዱት ነገር አለ?"),
          body: t("Send us its name or a screenshot. We will tell you the price, the sizes we have and when it can reach you.", "ስሙን ወይም ፎቶውን ይላኩልን። ዋጋውን፣ ያሉንን ልኮችና መቼ እንደሚደርስዎ እንነግርዎታለን።"),
          primaryAction: order,
          secondaryAction: link("Call the shop", "ወደ ሱቁ ይደውሉ", "tel:+251911000000"),
        },
      ],
    },
    {
      path: "/products",
      title: t("Products and prices", "ምርቶችና ዋጋዎች"),
      nav: t("Products", "ምርቶች"),
      description: t("Habesha kemis, netela, gabi, scarves, leather bags, baskets and pottery with prices in Birr.", "የሀበሻ ቀሚስ፣ ነጠላ፣ ጋቢ፣ ስካርፍ፣ የቆዳ ቦርሳ፣ ስፌትና የሸክላ ሥራ ከነዋጋቸው በብር።"),
      sections: [
        {
          type: "hero",
          variant: "banner",
          eyebrow: t("Products and prices", "ምርቶችና ዋጋዎች"),
          heading: t("Everything in the shop", "በሱቁ ያለው ሁሉ"),
          subheading: t("Every price is written here. Order by message, pay when it arrives.", "ዋጋው ሁሉ እዚሁ ተጽፏል። በመልእክት ይዘዙ፤ ሲደርስዎ ይክፈሉ።"),
          image: img("shop-gallery-boutique-rack", "Cream and blue dresses hanging from a wooden rail in a bright shop", "በብሩህ ሱቅ ውስጥ በእንጨት ዘንግ ላይ የተሰቀሉ ነጣ ያሉና ሰማያዊ ቀሚሶች"),
          primaryAction: order,
        },
        {
          type: "cards",
          id: "all",
          layout: "grid",
          eyebrow: t("Favourites", "ተወዳጆች"),
          heading: t("Six pieces to start with", "ለመጀመር ስድስት ሥራዎች"),
          intro: t("Choose clothes or handmade goods. Swipe the dress photos to see how it is worn.", "ልብስ ወይም የእጅ ሥራ ይምረጡ። ቀሚሱ እንዴት እንደሚለበስ ለማየት ፎቶዎቹን ያንሸራትቱ።"),
          items: productGrid,
        },
        {
          type: "menu",
          id: "prices",
          eyebrow: t("Price list", "የዋጋ ዝርዝር"),
          heading: t("The full list", "ሙሉ ዝርዝር"),
          intro: t("Prices change a little with the cloth and the width of the tibeb. Ask us for photos of what is in the shop today.", "ዋጋው እንደ ጨርቁና እንደ ጥበቡ ስፋት በጥቂቱ ይለያያል። ዛሬ በሱቁ ያለውን በፎቶ እንድንልክልዎ ይጠይቁን።"),
          categories: [
            {
              name: t("Habesha kemis", "የሀበሻ ቀሚስ"),
              items: [
                { name: t("Everyday kemis", "የዘወትር ቀሚስ"), description: t("Light cotton with a narrow tibeb", "ቀጭን ጥበብ ያለው ቀላል ጥጥ"), price: birr(8000) },
                { name: t("Holiday kemis", "የበዓል ቀሚስ"), description: t("Wide tibeb, netela included", "ሰፊ ጥበብ፣ ከነጠላ ጋር"), price: birr(15000), tag: t("Best seller", "በብዛት የሚሸጥ") },
                { name: t("Wedding kemis", "የሠርግ ቀሚስ"), description: t("Full hand embroidery with gold thread, made to measure", "በወርቃማ ክር ሙሉ የእጅ ጥልፍ፣ በልክ የሚሠራ"), price: birr(35000) },
                { name: t("Girls' kemis", "የልጆች ቀሚስ"), description: t("Ages 3 to 12", "ከ3 እስከ 12 ዓመት"), price: birr(3000) },
              ],
            },
            {
              name: t("Netela, gabi and scarves", "ነጠላ፣ ጋቢና ስካርፍ"),
              items: [
                { name: t("Netela", "ነጠላ"), description: t("Fine two-layer cotton with a tibeb border", "ጥበብ ያለው ስስ ባለ ሁለት ድርብ ጥጥ"), price: birr(1500) },
                { name: t("Gabi", "ጋቢ"), description: t("Thick, warm four-layer cotton", "ወፍራም፣ ሙቅ ባለ አራት ድርብ ጥጥ"), price: birr(3500), tag: t("For cold nights", "ለብርድ") },
                { name: t("Cotton scarf", "የጥጥ ስካርፍ"), description: t("Four colours, hand-knotted fringe", "አራት ቀለሞች፣ በእጅ የተቋጠረ ዘርፍ"), price: birr(1200) },
              ],
            },
            {
              name: t("For men", "ለወንዶች"),
              items: [
                { name: t("Traditional shirt and trousers", "ባህላዊ ሸሚዝና ሱሪ"), description: t("Tibeb on the collar and cuffs", "በአንገትጌና በእጅጌ ጥበብ"), price: birr(4500) },
                { name: t("Kuta", "ኩታ"), price: birr(2000) },
                { name: t("Couple set", "የጥንዶች ልብስ"), description: t("Matching kemis and men's outfit", "ተመሳሳይ ቀሚስና የወንድ ልብስ"), price: birr(22000), tag: t("For weddings", "ለሠርግ") },
              ],
            },
            {
              name: t("Handmade goods", "የእጅ ሥራዎች"),
              items: [
                { name: t("Leather tote", "የቆዳ ቦርሳ"), description: t("Hand stitched, fits a laptop", "በእጅ የተሰፋ፣ ላፕቶፕ የሚይዝ"), price: birr(4800), tag: t("New", "አዲስ") },
                { name: t("Clay jebena", "የሸክላ ጀበና"), description: t("Small, medium or large", "ትንሽ፣ መካከለኛ ወይም ትልቅ"), price: birr(650) },
                { name: t("Painted clay bottle", "ያጌጠ የሸክላ ጠርሙስ"), price: birr(900) },
                { name: t("Woven basket tray", "ስፌት"), description: t("Coiled grass, 40 cm across", "ከሣር የተሰፋ፣ 40 ሳ.ሜ ስፋት"), price: birr(1800) },
                { name: t("Mesob", "መሶብ"), description: t("Table size, with lid", "የገበታ መጠን፣ ከነክዳኑ"), price: birr(6500) },
              ],
            },
          ],
        },
        {
          type: "services",
          variant: "list",
          eyebrow: t("Good to know", "ማወቅ ያለብዎ"),
          heading: t("Delivery, payment and exchange", "ማድረሻ፣ ክፍያና ቅያሬ"),
          items: [
            { icon: "truck", title: t("Delivery in Addis", "በአዲስ አበባ ማድረሻ"), description: t("1 to 2 days, 200 Birr. Free above 10,000 Birr.", "በ1 እስከ 2 ቀን፣ 200 ብር። ከ10,000 ብር በላይ ነፃ።") },
            { icon: "bus", title: t("Other towns", "ወደ ክልል ከተሞች"), description: t("Sent by bus or post. You pay the carrier's fee.", "በአውቶቡስ ወይም በፖስታ እንልካለን፤ የመላኪያውን ክፍያ እርስዎ ይከፍላሉ።") },
            { icon: "handshake", title: t("Pay on delivery", "ሲደርስዎ ይክፈሉ"), description: t("Cash or Telebirr. Nothing to pay before you see it.", "በጥሬ ገንዘብ ወይም በቴሌብር። ዕቃውን ሳያዩ የሚከፍሉት የለም።") },
            { icon: "scissors", title: t("Free adjustments", "ነፃ ማስተካከያ"), description: t("We shorten or take in any dress you buy from us.", "ከእኛ የገዙትን ቀሚስ በነፃ እናሳጥራለን ወይም እናጠባለን።") },
            { icon: "check", title: t("Exchange within 7 days", "በ7 ቀን ውስጥ ቅያሬ"), description: t("Unworn, with the receipt. Made-to-measure pieces are adjusted instead.", "ካልተለበሰና ደረሰኙ ካለ። በልክ የተሠሩ ልብሶች ግን ይስተካከላሉ እንጂ አይቀየሩም።") },
            { icon: "gift", title: t("Gift wrapping", "የስጦታ መጠቅለያ"), description: t("Free, in cotton cloth with a hand-written card.", "በነፃ፣ በጥጥ ጨርቅ ከእጅ ጽሑፍ ካርድ ጋር።") },
          ],
        },
        {
          type: "faq",
          heading: t("Questions before you order", "ከማዘዝዎ በፊት"),
          items: [
            { question: t("How do I know my size?", "ልኬን እንዴት አውቃለሁ?"), answer: t("Send us your height and the size you usually wear. If it does not fit, we adjust it free.", "ቁመትዎንና ብዙ ጊዜ የሚለብሱትን ልክ ይላኩልን። ካልሆነዎ በነፃ እናስተካክላለን።") },
            { question: t("Can I see it before I pay?", "ከመክፈሌ በፊት ማየት እችላለሁ?"), answer: t("Yes. You open the parcel with the rider and pay only if you are happy.", "አዎ። ጥቅሉን አድራሹ ባለበት ከፍተው ያያሉ፤ ከወደዱት ብቻ ይከፍላሉ።") },
            { question: t("Do you sell wholesale?", "በጅምላ ትሸጣላችሁ?"), answer: t("Yes, for ten pieces or more. Call the shop for the wholesale price.", "አዎ፣ ከአሥር በላይ ለሆነ። የጅምላ ዋጋውን ለማወቅ ወደ ሱቁ ይደውሉ።") },
            { question: t("Can you send abroad?", "ወደ ውጭ አገር ትልካላችሁ?"), answer: t("We hand your parcel to the courier you choose. You pay them directly.", "እርስዎ ለመረጡት መላኪያ ድርጅት ጥቅሉን እናስረክባለን፤ ክፍያውን በቀጥታ ለእነሱ ይከፍላሉ።") },
          ],
        },
        {
          type: "cta",
          heading: t("Found your piece?", "የሚፈልጉትን አገኙ?"),
          body: t("Send us its name. We answer within the hour during shop hours.", "ስሙን ይላኩልን። በሥራ ሰዓት በአንድ ሰዓት ውስጥ እንመልሳለን።"),
          primaryAction: order,
          secondaryAction: link("Use the order form", "በቅጹ ይዘዙ", "/#order"),
        },
      ],
    },
    {
      path: "/tailoring",
      title: t("Made to measure", "በልክ ስፌት"),
      nav: t("Made to measure", "በልክ ስፌት"),
      description: t("Habesha kemis and wedding outfits woven and sewn to your measurements in Merkato.", "በልክዎ የሚሸመንና የሚሰፋ የሀበሻ ቀሚስና የሠርግ ልብስ፣ በመርካቶ።"),
      sections: [
        {
          type: "hero",
          variant: "split",
          eyebrow: t("Made to measure", "በልክ ስፌት"),
          heading: t("A kemis woven only for you", "ለእርስዎ ብቻ የተሸመነ ቀሚስ"),
          subheading: t("Choose the cloth, the colours and the tibeb. We weave it, sew it to your measurements and fit it until it is right.", "ጨርቁን፣ ቀለሙንና ጥበቡን ይምረጡ። እኛ እንሸምናለን፣ በልክዎ እንሰፋለን፣ እስኪሆንዎ ድረስ እናስተካክላለን።"),
          image: img("shop-about-spinning-yarn", "A woman in an embroidered grey traditional dress and silver jewellery working thread in her hands", "ጥልፍ ያለው ግራጫ ባህላዊ ልብስና የብር ጌጥ ያደረገች ሴት ክር በእጇ ስትፈትል"),
          primaryAction: link("Book a fitting", "ለልኬት ቀጠሮ ይያዙ", "#fitting"),
          secondaryAction: order,
        },
        {
          type: "services",
          variant: "bento",
          eyebrow: t("What we sew", "የምንሰፋው"),
          heading: t("Tailoring and prices", "የስፌት አገልግሎትና ዋጋ"),
          intro: t("Bring your own cloth or choose from ours. Most orders are ready in 7 to 10 days.", "የራስዎን ጨርቅ ይዘው ይምጡ ወይም ከእኛ ይምረጡ። አብዛኛው ሥራ በ7 እስከ 10 ቀን ይደርሳል።"),
          items: [
            { icon: "sparkles", title: t("Full custom kemis", "ሙሉ በሙሉ በትዕዛዝ የሚሠራ ቀሚስ"), description: t("You choose the cloth, colours and tibeb design. Woven and sewn from the first thread.", "ጨርቁን፣ ቀለሙንና የጥበቡን ንድፍ እርስዎ ይመርጣሉ። ከመጀመሪያው ክር ጀምሮ ተሸምኖ ይሰፋል።"), price: birr(18000) },
            { icon: "scissors", title: t("Kemis from your cloth", "ከራስዎ ጨርቅ ቀሚስ"), description: t("Cut and sewn to your measurements.", "በልክዎ ተቆርጦ ይሰፋል።"), price: birr(2500) },
            { icon: "heart", title: t("Wedding and melse outfits", "የሠርግና የመልስ ልብስ"), description: t("For the bride and groom, with gold or silver thread.", "ለሙሽሪትና ለሙሽራው፣ በወርቃማ ወይም በብርማ ክር።"), price: birr(35000) },
            { icon: "users", title: t("Family and group orders", "የቤተሰብና የቡድን ትዕዛዝ"), description: t("Matching outfits for bridesmaids, choirs or the whole family. Price depends on the number.", "ለሚዜዎች፣ ለመዘምራን ወይም ለመላው ቤተሰብ ተመሳሳይ ልብስ። ዋጋው እንደ ብዛቱ ነው።") },
            { icon: "ruler", title: t("Alterations", "ማስተካከያ"), description: t("Shorten, take in or let out any dress.", "ማሳጠር፣ ማጥበብ ወይም ማስፋት።"), price: birr(400) },
          ],
        },
        {
          type: "steps",
          eyebrow: t("How it works", "አሠራሩ"),
          heading: t("From thread to fitting", "ከክር እስከ ልኬት"),
          items: [
            { title: t("Visit and choose", "መጥተው ይምረጡ"), description: t("See cloth and tibeb samples in the shop. We take your measurements.", "የጨርቅና የጥበብ ናሙናዎችን በሱቁ ያያሉ። ልክዎን እንወስዳለን።") },
            { title: t("We weave and sew", "እንሸምናለን፣ እንሰፋለን"), description: t("You pay half to start. We send a photo when the cloth comes off the loom.", "ሥራው ሲጀመር ግማሹን ይከፍላሉ። ጨርቁ ከሸማው ሲወርድ ፎቶ እንልክልዎታለን።") },
            { title: t("Fitting", "ልኬት"), description: t("Try it on. Any change is done the same day, free.", "ለብሰው ያያሉ። የሚስተካከል ካለ በዚያው ቀን በነፃ እናስተካክላለን።") },
          ],
        },
        {
          type: "form",
          id: "fitting",
          kind: "booking",
          heading: t("Book a fitting", "ለልኬት ቀጠሮ ይያዙ"),
          intro: t("Choose a day to come to the shop. For weddings and holidays, come at least three weeks ahead.", "ወደ ሱቁ የሚመጡበትን ቀን ይምረጡ። ለሠርግና ለበዓል ቢያንስ ከሦስት ሳምንት በፊት ይምጡ።"),
          fields: [
            nameField,
            phoneField,
            { name: "date", label: t("Day you can come", "የሚመጡበት ቀን"), type: "date", required: true },
            { name: "service", label: t("What do you need?", "ምን ያስፈልግዎታል?"), type: "select", options: [t("Full custom kemis", "በትዕዛዝ የሚሠራ ቀሚስ"), t("Kemis from my cloth", "ከራሴ ጨርቅ ቀሚስ"), t("Wedding or melse outfit", "የሠርግ ወይም የመልስ ልብስ"), t("Family or group order", "የቤተሰብ ወይም የቡድን ትዕዛዝ"), t("Alterations", "ማስተካከያ")] },
            { name: "notes", label: t("Date of your event, or notes", "የዝግጅትዎ ቀን ወይም ማስታወሻ"), type: "textarea" },
          ],
          submitLabel: t("Book my fitting", "ቀጠሮ ያዝ"),
          successMessage: t("Thank you. We will call you to confirm the day and time.", "እናመሰግናለን። ቀኑንና ሰዓቱን ለማረጋገጥ እንደውልልዎታለን።"),
        },
      ],
    },
    {
      path: "/visit",
      title: t("Visit the shop", "ሱቁን ይጎብኙ"),
      nav: t("Visit", "አድራሻ"),
      description: t("Tibeb Merkato is near Anwar Mosque in Merkato, Addis Ababa. Opening hours, phone, Telegram and map.", "ጥበብ መርካቶ በአዲስ አበባ መርካቶ፣ አንዋር መስጊድ አጠገብ ይገኛል። የሥራ ሰዓት፣ ስልክ፣ ቴሌግራምና ካርታ።"),
      sections: [
        {
          type: "about",
          eyebrow: t("The shop", "ሱቁ"),
          heading: t("Two floors of cloth, near Anwar Mosque", "ባለ ሁለት ፎቅ የሸማ ሱቅ፣ አንዋር መስጊድ አጠገብ"),
          body: t(
            "Dresses and netela are downstairs; the tailors, the fitting room and the wedding pieces are upstairs.\n\nCome on a weekday morning if you want time to try things on. Saturdays are busy.",
            "ቀሚሶችና ነጠላዎች ታች ናቸው፤ ልብስ ሰፊዎቹ፣ የመለኪያ ክፍሉና የሠርግ ልብሶች ላይኛው ፎቅ ናቸው።\n\nረጋ ብለው ለመለካት ከፈለጉ በሥራ ቀን ጠዋት ይምጡ። ቅዳሜ ሰው ይበዛል።",
          ),
          image: img("shop-gallery-boutique-rack", "Cream and blue dresses hanging from a wooden rail in a bright shop, with accessories on white tables", "በብሩህ ሱቅ ውስጥ በእንጨት ዘንግ ላይ የተሰቀሉ ቀሚሶች፣ በነጭ ጠረጴዛዎች ላይ ጌጣጌጥ"),
          imageSide: "end",
          points: [t("Fitting room and free adjustments", "የመለኪያ ክፍልና ነፃ ማስተካከያ"), t("Cash and Telebirr accepted", "ጥሬ ገንዘብና ቴሌብር እንቀበላለን"), t("We speak Amharic, Afaan Oromo and English", "በአማርኛ፣ በአፋን ኦሮሞና በእንግሊዝኛ እናስተናግዳለን")],
        },
        { type: "contact", heading: t("Call, write or walk in", "ይደውሉ፣ ይጻፉ ወይም ይምጡ"), intro: t("We answer the phone and Telegram during shop hours.", "በሥራ ሰዓት ስልክና ቴሌግራም እንመልሳለን።") },
        { type: "map", heading: t("Find us in Merkato", "በመርካቶ ያገኙናል"), query: "Anwar Mosque, Merkato, Addis Ababa" },
        {
          type: "form",
          id: "message",
          kind: "contact",
          heading: t("Send a message", "መልእክት ይላኩ"),
          intro: t("Ask about a piece, a wholesale order or anything else.", "ስለ አንድ ሥራ፣ ስለ ጅምላ ትዕዛዝ ወይም ስለ ሌላ ነገር ይጠይቁን።"),
          fields: [nameField, phoneField, { name: "message", label: t("Message", "መልእክት"), type: "textarea", required: true }],
          submitLabel: t("Send", "ላክ"),
          successMessage: t("Thank you. We will answer soon.", "እናመሰግናለን። በቅርቡ እንመልሳለን።"),
        },
      ],
    },
  ],
});
