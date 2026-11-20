import { t, img, link, birr, save } from "./lib.mjs";

// A fashion house's shop told like a magazine: the "monochrome" art direction (black and white,
// light serif, small capitals). The photographs carry the colour. Pieces and prices are examples.
const order = link("Order this piece", "ይህን ያዝዙ", "/order");
const sizes = t("Sizes XS to XL", "መጠን ከXS እስከ XL");

const season = [
  {
    image: img("fashion-card-habesha-dress-on-grass", "A woman sitting on grass in a white habesha dress with green, red and black embroidery down the front", "ፊት ለፊቱ አረንጓዴ፣ ቀይና ጥቁር ጥልፍ ያለው ነጭ የሀበሻ ቀሚስ ለብሳ በሣር ላይ የተቀመጠች ሴት"),
    title: t("Meskel dress", "የመስቀል ቀሚስ"),
    subtitle: sizes,
    price: birr(9800),
    action: order,
  },
  {
    image: img("fashion-card-netela-shawl", "A woman holding a white netela shawl with a woven border up to her face in a golden field", "በወርቃማ ማሳ ውስጥ ጥለት ያለው ነጭ ነጠላ ወደ ፊቷ ያስጠጋች ሴት"),
    title: t("Woven netela", "የተሸመነ ነጠላ"),
    subtitle: t("One size", "አንድ መጠን"),
    price: birr(2400),
    action: order,
  },
  {
    image: img("fashion-card-man-gabi-orange-wall", "A young man wrapped in a white cotton shawl with blue, orange and green stripes", "ሰማያዊ፣ ብርቱካናማና አረንጓዴ ሸንተረር ባለው ነጭ የጥጥ ጋቢ የተጠቀለለ ወጣት"),
    title: t("Striped gabi", "ሸንተረር ጋቢ"),
    subtitle: t("One size", "አንድ መጠን"),
    price: birr(3600),
    action: order,
  },
  {
    image: img("fashion-card-couple-matching-outfits", "A couple in matching white outfits with gold and green embroidered borders by the water", "በውኃ ዳር ወርቃማና አረንጓዴ ጥልፍ ያላቸው ተመሳሳይ ነጭ ልብሶች የለበሱ ጥንዶች"),
    title: t("Holiday set for two", "ለሁለት የበዓል ልብስ"),
    subtitle: t("Made to your sizes", "በመጠንዎ የሚሠራ"),
    price: birr(18500),
    action: order,
  },
  {
    image: img("fashion-hero-kemis-woman-green-field", "A woman in a white habesha dress with blue trim and a striped sash in a green field", "ሰማያዊ ጥልፍና ሸንተረር መቀነት ያለው ነጭ የሀበሻ ቀሚስ ለብሳ በአረንጓዴ መስክ ላይ የቆመች ሴት"),
    title: t("Highland kemis", "የደጋ ቀሚስ"),
    subtitle: sizes,
    price: birr(11200),
    action: order,
  },
];

const featured = [
  {
    image: img("personal-card-editorial-portrait", "A woman in a red hat and a red patterned dress holding a woven bag", "ቀይ ባርኔጣና ቀይ ጥለት ያለው ቀሚስ የለበሰች፣ የተሸመነ ቦርሳ የያዘች ሴት"),
    subtitle: t("The red edit", "ቀዩ ምርጫ"),
    title: t("Red cotton dress", "ቀይ የጥጥ ቀሚስ"),
    price: birr(8600),
    action: order,
  },
  {
    image: img("fashion-gallery-two-friends-headbands", "Two women with red and gold beaded headbands in white traditional dresses at dusk", "ሲመሽ ቀይና ወርቃማ ዶቃ ያለው የራስ ማሰሪያና ነጭ የባህል ልብስ የለበሱ ሁለት ሴቶች"),
    subtitle: t("Accessories", "ተጨማሪዎች"),
    title: t("Beaded headband", "የዶቃ የራስ ማሰሪያ"),
    price: birr(950),
    action: order,
  },
  {
    image: img("personal-hero-man-turtleneck", "A man with a short beard in a black turtleneck against a dark grey backdrop", "አጭር ጺም ያለውና ጥቁር ሹራብ የለበሰ ሰው በጥቁር ግራጫ ዳራ ፊት"),
    subtitle: t("For him", "ለወንዶች"),
    title: t("Black wool layer", "ጥቁር የሱፍ ሹራብ"),
    price: birr(4200),
    action: order,
  },
];

const categories = [
  { image: img("personal-hero-woman-orange-blazer", "A woman with natural hair in an orange blazer, arms crossed", "ብርቱካናማ ኮት የለበሰችና እጆቿን ያጣመረች ሴት"), title: t("Women", "ሴቶች"), subtitle: t("Dresses, kemis, tailoring", "ቀሚሶች፣ የሀበሻ ቀሚስ፣ ስፌት"), action: link("Shop women", "የሴቶች", "/shop") },
  { image: img("fashion-card-tailor-measuring-client", "A tailor measuring a young man in a white shirt and black waistcoat", "ነጭ ሸሚዝና ጥቁር ሰደርያ የለበሰን ወጣት የሚለካ ልብስ ሰፊ"), title: t("Men", "ወንዶች"), subtitle: t("Gabi, shirts, made to measure", "ጋቢ፣ ሸሚዝ፣ በልክ የሚሠራ"), action: link("Shop men", "የወንዶች", "/shop") },
  { image: img("studio-card-couple-portrait-addis", "A couple dressed all in white, the woman holding white flowers", "ሙሉ ነጭ የለበሱ ጥንዶች፣ ሴቷ ነጭ አበባ ይዛለች"), title: t("Weddings", "ሠርግ"), subtitle: t("Matching sets for two", "ለሁለት ተመሳሳይ ልብሶች"), action: link("Shop weddings", "የሠርግ", "/shop") },
  { image: img("personal-gallery-pattern", "A geometric repeat pattern in orange, grey-blue and yellow", "በብርቱካናማ፣ ግራጫ-ሰማያዊና ቢጫ የተሠራ ጂኦሜትሪክ ጥለት"), title: t("Shawls", "ነጠላና ጋቢ"), subtitle: t("Netela and gabi, woven by hand", "በእጅ የተሸመኑ ነጠላና ጋቢ"), action: link("Shop shawls", "ነጠላና ጋቢ", "/shop") },
];

save("boutique", {
  name: t("KUTA", "ኩታ"),
  tagline: t("Ethiopian cotton, woven by hand and cut for now. Addis Ababa.", "በእጅ የተሸመነ፣ ለዛሬ የተቆረጠ የኢትዮጵያ ጥጥ። አዲስ አበባ።"),
  languages: ["en", "am"],
  theme: { primary: "#111111", accent: "#111111", background: "#FFFFFF", text: "#111111", font: "editorial", radius: "none", style: "monochrome" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Bole Medhanialem, Addis Ababa", "ቦሌ መድኃኔዓለም፣ አዲስ አበባ"),
    hours: [{ days: t("Studio, Tuesday to Sunday", "ስቱዲዮ፣ ከማክሰኞ እስከ እሁድ"), time: t("10:00 am to 7:00 pm", "ከጠዋቱ 4 እስከ ምሽቱ 1 ሰዓት") }],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Season", "ወቅቱ"),
      description: t("KUTA: hand-woven Ethiopian cotton, cut for now. The new season, made in Addis Ababa and sent abroad.", "ኩታ፦ በእጅ የተሸመነ፣ ለዛሬ የተቆረጠ የኢትዮጵያ ጥጥ። አዲሱ ወቅት፣ በአዲስ አበባ ተሠርቶ ወደ ውጭም ይላካል።"),
      sections: [
        {
          type: "hero",
          id: "top",
          variant: "immersive",
          eyebrow: t("Season 04 · The highland edit", "ወቅት 04 · የደጋው ምርጫ"),
          heading: t("Woven for now", "ለዛሬ የተሸመነ"),
          image: img("fashion-hero-kemis-woman-rooftop", "A woman with red braided hair in a white habesha kemis with black and green embroidery on a rooftop above Addis Ababa", "ቀይ ሹሩባ ያላትና ጥቁርና አረንጓዴ ጥልፍ ያለው ነጭ የሀበሻ ቀሚስ የለበሰች ሴት ከአዲስ አበባ በላይ በሚገኝ ጣሪያ ላይ"),
          primaryAction: link("Shop the season", "ወቅቱን ይግዙ", "#collection"),
          secondaryAction: link("Our story", "ታሪካችን", "#story"),
        },
        { type: "cards", id: "collection", layout: "scroll", eyebrow: t("The season", "ወቅቱ"), heading: t("New this season", "የዚህ ወቅት አዲሶች"), items: season, action: link("See everything", "ሁሉንም ይመልከቱ", "/shop") },
        {
          type: "about",
          id: "story",
          eyebrow: t("The story", "ታሪኩ"),
          heading: t("Four hands, one loom, ten days", "አራት እጆች፣ አንድ ሽመና፣ አሥር ቀናት"),
          body: t(
            "Every piece starts on a handloom in Shiro Meda, where two weavers work one length of cotton for up to ten days.\n\nWe cut it in our studio in Bole into shapes you can wear to work, to a wedding and on a Sunday afternoon, and we make each one only when you order it.",
            "እያንዳንዱ ልብስ የሚጀምረው በሽሮ ሜዳ በሚገኝ የእጅ ሽመና ላይ ነው፤ ሁለት ሸማኔዎች አንድን የጥጥ ርዝመት እስከ አሥር ቀን ይሠሩታል።\n\nበቦሌ ባለው ስቱዲዮአችን ለሥራ፣ ለሠርግና ለእሁድ ከሰዓት በሚለበሱ ቅርጾች እንቆርጠዋለን፤ እያንዳንዱንም የምንሠራው ሲያዝዙ ብቻ ነው።",
          ),
          image: img("fashion-gallery-loom-striped-threads", "Brightly coloured striped threads stretched across a wooden handloom under a blue sky", "በሰማያዊ ሰማይ ሥር በእንጨት ሽመና ላይ የተወጠሩ ደማቅ ቀለም ያላቸው ሸንተረር ክሮች"),
          imageSide: "start",
        },
        { type: "quote", id: "promise", quote: t("We make fewer things, and we make them to be kept.", "ጥቂት ነገሮችን እንሠራለን፤ የምንሠራቸውም እንዲቆዩ ነው።") },
        { type: "cards", id: "featured", layout: "grid", eyebrow: t("Chosen for you", "ለእርስዎ የተመረጡ"), heading: t("The pieces we love this month", "የዚህ ወር ተወዳጆቻችን"), items: featured },
        { type: "cards", id: "categories", layout: "index", eyebrow: t("Shop by", "በምድብ"), heading: t("Find your piece", "የእርስዎን ያግኙ"), items: categories },
        {
          type: "form",
          id: "letter",
          kind: "registration",
          eyebrow: t("Letters from the loom", "ከሽመናው የሚላኩ ደብዳቤዎች"),
          heading: t("New pieces, a few times a year", "አዳዲስ ልብሶች፣ በዓመት ጥቂት ጊዜ"),
          intro: t("No sales, no noise: we write when a new season is ready. We use your email for nothing else; write to us any time to be taken off the list.", "ቅናሽ የለም፣ ጫጫታ የለም፦ አዲስ ወቅት ሲደርስ እንጽፋለን። ኢሜይልዎን ለሌላ ነገር አንጠቀምም፤ ከዝርዝሩ ለመውጣት በማንኛውም ጊዜ ይጻፉልን።"),
          fields: [{ name: "email", label: t("Your email", "ኢሜይልዎ"), type: "email", required: true }],
          submitLabel: t("Sign up", "ይመዝገቡ"),
          successMessage: t("Thank you. You're on the list.", "እናመሰግናለን። በዝርዝሩ ውስጥ ገብተዋል።"),
        },
      ],
    },
    {
      path: "/shop",
      title: t("Shop", "ሱቅ"),
      nav: t("Shop", "ሱቅ"),
      description: t("Every KUTA piece with its price in Birr. Made when you order, sent anywhere.", "እያንዳንዱ የኩታ ልብስ ከዋጋው ጋር በብር። ሲያዝዙ ይሠራል፣ የትም ይላካል።"),
      sections: [
        {
          type: "cards",
          id: "all",
          layout: "grid",
          eyebrow: t("Shop", "ሱቅ"),
          heading: t("Everything, made to order", "ሁሉም፣ ሲታዘዝ የሚሠራ"),
          intro: t("Each piece takes two to three weeks. We send within Ethiopia and abroad.", "እያንዳንዱ ልብስ ከሁለት እስከ ሦስት ሳምንት ይወስዳል። በኢትዮጵያ ውስጥና ወደ ውጭ እንልካለን።"),
          items: [...season, ...featured].map((item, i) => ({ ...item, badge: [t("Women", "ሴቶች"), t("Shawls", "ነጠላና ጋቢ"), t("Men", "ወንዶች"), t("Couples", "ጥንዶች"), t("Women", "ሴቶች"), t("Women", "ሴቶች"), t("Accessories", "ተጨማሪዎች"), t("Men", "ወንዶች")][i] })),
        },
      ],
    },
    {
      path: "/order",
      title: t("Order", "ማዘዣ"),
      nav: t("Order", "ማዘዣ"),
      description: t("Order a KUTA piece. Tell us your size and where to send it; we confirm by phone or Telegram.", "የኩታ ልብስ ያዝዙ። መጠንዎንና የሚላክበትን ይንገሩን፤ በስልክ ወይም በቴሌግራም እናረጋግጣለን።"),
      sections: [
        {
          type: "form",
          id: "order",
          kind: "order",
          eyebrow: t("Made to order", "ሲታዘዝ የሚሠራ"),
          heading: t("Order a piece", "ልብስ ያዝዙ"),
          intro: t("We confirm the price, your size and delivery by phone or Telegram before we start. You pay when it is ready.", "ከመጀመራችን በፊት ዋጋውን፣ መጠንዎንና አላላኩን በስልክ ወይም በቴሌግራም እናረጋግጣለን። ክፍያው ሲደርስ ነው።"),
          fields: [
            { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
            { name: "phone", label: t("Phone or WhatsApp", "ስልክ ወይም ዋትስአፕ"), type: "tel", required: true },
            { name: "piece", label: t("Which piece?", "የትኛው ልብስ?"), type: "text", required: true },
            { name: "size", label: t("Size", "መጠን"), type: "select", options: [t("XS", "XS"), t("S", "S"), t("M", "M"), t("L", "L"), t("XL", "XL"), t("Made to measure", "በልክ")] },
            { name: "country", label: t("Where should we send it?", "ወዴት እንላክ?"), type: "text" },
            { name: "notes", label: t("Anything else", "ሌላ ነገር"), type: "textarea" },
          ],
          submitLabel: t("Send my order", "ትዕዛዜን ላክ"),
          successMessage: t("Thank you. We will call you to confirm before we start.", "እናመሰግናለን። ከመጀመራችን በፊት ለማረጋገጥ እንደውልልዎታለን።"),
        },
        { type: "contact", id: "studio", eyebrow: t("The studio", "ስቱዲዮው"), heading: t("Visit or write", "ይጎብኙን ወይም ይጻፉልን"), intro: t("Try pieces on at the studio in Bole, or write to us on Telegram.", "በቦሌ ባለው ስቱዲዮ ልብሶቹን ይሞክሩ፣ ወይም በቴሌግራም ይጻፉልን።") },
      ],
    },
  ],
});
