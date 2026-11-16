import { t, img, link, birr, save } from "./lib.mjs";

const quote = link("Request a quote", "ዋጋ ይጠይቁ", "/#quote");

const services = [
  { icon: "chart", title: t("Feasibility studies", "የአዋጭነት ጥናት"), description: t("Market, technical and financial study of a new project, in the format banks and the investment commission ask for.", "ለአዲስ ፕሮጀክት የገበያ፣ የቴክኒክና የፋይናንስ ጥናት፤ ባንኮችና የኢንቨስትመንት ኮሚሽን በሚጠይቁት ቅርጸት።"), price: birr(180000) },
  { icon: "briefcase", title: t("Business plans", "የቢዝነስ ዕቅድ"), description: t("A clear plan with five-year figures, ready for a loan or an investor.", "የአምስት ዓመት አኃዝ ያለው ግልጽ ዕቅድ፤ ለብድር ወይም ለባለሀብት ዝግጁ።"), price: birr(60000) },
  { icon: "users", title: t("Market research", "የገበያ ጥናት"), description: t("Surveys, competitor checks and demand estimates from the field, not from a desk.", "ከቢሮ ሳይሆን ከመስክ የተሰበሰበ የደንበኛ ዳሰሳ፣ የተወዳዳሪ ቅኝት እና የፍላጎት ግምት።"), price: birr(120000) },
  { icon: "book", title: t("Accounting and tax", "የሂሳብ አያያዝና ግብር"), description: t("Monthly books, VAT and payroll filed on time, so there are no penalties.", "ወርሃዊ የሂሳብ መዝገብ፣ ተ.እ.ታ እና የደመወዝ ግብር በጊዜው ይገባል፤ ቅጣት የለም።"), price: birr(12000) },
  { icon: "key", title: t("Licences and permits", "ንግድ ፈቃድና ምዝገባ"), description: t("Company registration, trade licence and investment permit, handled from start to finish.", "የድርጅት ምዝገባ፣ የንግድ ፈቃድ እና የኢንቨስትመንት ፈቃድ ከመጀመሪያ እስከ መጨረሻ እንጨርሳለን።"), price: birr(25000) },
  { icon: "handshake", title: t("People and structure", "የሰው ኃይልና አደረጃጀት"), description: t("Job descriptions, salary scales and a staff manual that fit the labour law.", "ከአሠሪና ሠራተኛ ሕግ ጋር የሚስማማ የሥራ መዘርዝር፣ የደመወዝ ስኬል እና የሠራተኛ መመሪያ።"), price: birr(45000) },
];
const plain = services.map(({ price, ...s }) => s);

const projects = [
  {
    image: img("business-card-construction", "Curved multi-storey building under construction with scaffolding and a tower crane", "በግንባታ ላይ ያለ ባለ ብዙ ፎቅ ሕንፃ ከመወጣጫ እና ከክሬን ጋር"),
    badge: t("Real estate", "ሪል እስቴት"),
    subtitle: t("Bole, Addis Ababa", "ቦሌ፣ አዲስ አበባ"),
    title: t("Feasibility study for a 12-storey building", "ለባለ 12 ፎቅ ሕንፃ የአዋጭነት ጥናት"),
    meta: [t("Feasibility study", "የአዋጭነት ጥናት"), t("7 weeks", "7 ሳምንት")],
    description: t("The developer's bank approved 60% of the building cost on the first application.", "የአልሚው ባንክ በመጀመሪያው ማመልከቻ የግንባታ ወጪውን 60% ብድር ፈቀደ።"),
  },
  {
    image: img("business-card-warehouse", "Large warehouse aisle with orange pallet racking and workers in hi-vis vests", "ብርቱካናማ መደርደሪያዎች ያሉት ሰፊ መጋዘን እና አንጸባራቂ ሰደርያ የለበሱ ሠራተኞች"),
    badge: t("Import and trade", "አስመጪና ንግድ"),
    subtitle: t("Kality, Addis Ababa", "ቃሊቲ፣ አዲስ አበባ"),
    title: t("Stock system for a goods importer", "ለአስመጪ ድርጅት የክምችት ሥርዓት"),
    meta: [t("Operations", "አሠራር ማሻሻያ"), t("3 months", "3 ወር")],
    description: t("Orders now leave the warehouse in one day instead of three, with stock counted every week.", "ትዕዛዝ በሦስት ቀን ፋንታ በአንድ ቀን ከመጋዘን ይወጣል፤ ክምችቱም በየሳምንቱ ይቆጠራል።"),
  },
  {
    image: img("business-card-analytics", "A person in a navy blazer working on a laptop showing pie and bar charts", "ጥቁር ሰማያዊ ኮት የለበሰ ሰው ቻርቶችን በሚያሳይ ላፕቶፕ ላይ ሲሠራ"),
    badge: t("Manufacturing", "ማኑፋክቸሪንግ"),
    subtitle: t("Bishoftu, Oromia", "ቢሾፍቱ፣ ኦሮሚያ"),
    title: t("Financial model for a dairy plant", "ለወተት ማቀነባበሪያ የፋይናንስ ሞዴል"),
    meta: [t("Business plan", "የቢዝነስ ዕቅድ"), t("5 weeks", "5 ሳምንት")],
    description: t("The owners see cost per litre every month and raised 48 million Birr to add a second line.", "ባለቤቶቹ የአንድ ሊትር ወጪን በየወሩ ያያሉ፤ ሁለተኛ መስመር ለመጨመርም 48 ሚሊዮን ብር አግኝተዋል።"),
  },
  {
    image: img("business-card-addis-towers", "Glass high-rise towers in Addis Ababa above green trees under a blue sky", "በሰማያዊ ሰማይ ሥር ከአረንጓዴ ዛፎች በላይ የሚታዩ የአዲስ አበባ የመስታወት ሕንፃዎች"),
    badge: t("Retail", "ችርቻሮ ንግድ"),
    subtitle: t("Addis Ababa", "አዲስ አበባ"),
    title: t("Market study for a supermarket chain", "ለሱፐርማርኬት ሰንሰለት የገበያ ጥናት"),
    meta: [t("Market research", "የገበያ ጥናት"), t("6 weeks", "6 ሳምንት")],
    description: t("We surveyed 1,200 households in four sub-cities. The client opened in the two areas we ranked first.", "በአራት ክፍለ ከተሞች 1,200 አባወራዎችን ጠይቀናል። ደንበኛችን አንደኛ ባወጣናቸው ሁለት አካባቢዎች ቅርንጫፍ ከፍቷል።"),
  },
];

const steps = [
  { title: t("Free first meeting", "ነፃ የመጀመሪያ ውይይት"), description: t("One hour at your office or ours to understand the decision you face.", "ያለብዎትን ውሳኔ ለመረዳት በእርስዎ ወይም በእኛ ቢሮ የአንድ ሰዓት ውይይት።") },
  { title: t("Fixed price in writing", "የተቆረጠ ዋጋ በጽሑፍ"), description: t("Within three working days you get the scope, the price and the delivery date.", "በሦስት የሥራ ቀን ውስጥ የሥራውን ወሰን፣ ዋጋውንና የማስረከቢያ ቀኑን ያገኛሉ።") },
  { title: t("Field work and analysis", "የመስክ ሥራና ትንተና"), description: t("We collect the data ourselves and show you the first findings half way.", "መረጃውን ራሳችን እንሰበስባለን፤ በሥራው አጋማሽም የመጀመሪያ ግኝቶችን እናሳይዎታለን።") },
  { title: t("Report and follow-up", "ሪፖርትና ክትትል"), description: t("A report you can hand to the bank, and we come with you to present it.", "ለባንክ የሚቀርብ ሪፖርት እናስረክባለን፤ ሲያቀርቡትም አብረንዎ እንገኛለን።") },
];

const nameField = { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true };
const phoneField = { name: "phone", label: t("Phone number", "ስልክ ቁጥር"), type: "tel", required: true };

save("business", {
  name: t("Kokeb Advisory", "ኮከብ አማካሪ"),
  tagline: t("Feasibility studies, business plans and market research in Addis Ababa", "በአዲስ አበባ የአዋጭነት ጥናት፣ የቢዝነስ ዕቅድ እና የገበያ ጥናት"),
  languages: ["en", "am"],
  theme: { primary: "#0F5B46", accent: "#0B2E26", background: "#F7F5EF", text: "#17211D", font: "grotesk", radius: "medium", style: "clean" },
  business: {
    phone: "+251 911 000 000",
    email: "hello@example.com",
    telegram: "yourbusiness",
    address: t("4th floor, Guinea Conakry Street, Kazanchis, Addis Ababa", "ካዛንቺስ፣ ጊኒ ኮናክሪ ጎዳና፣ 4ኛ ፎቅ፣ አዲስ አበባ"),
    hours: [
      { days: t("Monday to Friday", "ከሰኞ እስከ ዓርብ"), time: t("8:30 am to 5:30 pm", "ከጠዋቱ 2:30 እስከ ቀኑ 11:30") },
      { days: t("Saturday", "ቅዳሜ"), time: t("9:00 am to 1:00 pm", "ከጠዋቱ 3 እስከ ቀኑ 7 ሰዓት") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Kokeb Advisory prepares feasibility studies, business plans and market research for Ethiopian companies.", "ኮከብ አማካሪ ለኢትዮጵያ ድርጅቶች የአዋጭነት ጥናት፣ የቢዝነስ ዕቅድ እና የገበያ ጥናት ያዘጋጃል።"),
      sections: [
        {
          type: "hero",
          variant: "split",
          eyebrow: t("Business consulting · Addis Ababa · Since 2012", "የቢዝነስ አማካሪ · አዲስ አበባ · ከ2004 ዓ.ም. ጀምሮ"),
          heading: t("Decide with numbers, not guesses", "በግምት ሳይሆን በመረጃ ይወስኑ"),
          subheading: t("Feasibility studies, business plans and market research that Ethiopian banks and investors accept. For a first shop or a new factory.", "የኢትዮጵያ ባንኮችና ባለሀብቶች የሚቀበሏቸው የአዋጭነት ጥናቶች፣ የቢዝነስ ዕቅዶች እና የገበያ ጥናቶች። ለመጀመሪያ ሱቅም ሆነ ለአዲስ ፋብሪካ።"),
          image: img("business-gallery-three-colleagues", "Three men in smart-casual clothes discussing around a white table with laptops", "ሦስት ወንዶች ላፕቶፖች ባሉበት ነጭ ጠረጴዛ ዙሪያ ሲወያዩ"),
          primaryAction: quote,
          secondaryAction: link("Our projects", "ሥራዎቻችን", "/projects"),
        },
        {
          type: "stats",
          tone: "dark",
          items: [
            { value: t("14", "14"), label: t("years of practice", "ዓመታት በሥራ ላይ") },
            { value: t("320+", "320+"), label: t("studies and plans delivered", "የተረከቡ ጥናቶችና ዕቅዶች") },
            { value: t("2.1 bn Br", "2.1 ቢ ብር"), label: t("in loans our clients secured", "ደንበኞቻችን ያገኙት ብድር") },
            { value: t("9 of 10", "90%"), label: t("clients come back", "ደንበኞች ተመልሰው ይመጣሉ") },
          ],
        },
        {
          type: "services",
          variant: "bento",
          id: "services",
          eyebrow: t("What we do", "የምንሠራው"),
          heading: t("Six services, one team", "ስድስት አገልግሎት፣ አንድ ቡድን"),
          intro: t("From the first idea to the day the loan is approved, and the books that follow.", "ከመጀመሪያው ሐሳብ ብድሩ እስከሚፈቀድበት ቀን፣ ከዚያም በኋላ እስካለው የሂሳብ ሥራ።"),
          items: plain,
        },
        {
          type: "cards",
          id: "projects",
          layout: "grid",
          eyebrow: t("Recent projects", "የቅርብ ጊዜ ሥራዎች"),
          heading: t("Work that changed a decision", "ውሳኔን የቀየሩ ሥራዎች"),
          intro: t("We do not publish client names. We are glad to put you in touch with them.", "የደንበኞቻችንን ስም አናወጣም። ከፈለጉ ግን ልናገናኝዎ ደስተኞች ነን።"),
          items: projects.slice(0, 3),
          action: link("See all projects", "ሁሉንም ሥራዎች ይመልከቱ", "/projects"),
        },
        {
          type: "steps",
          id: "process",
          eyebrow: t("How we work", "አሠራራችን"),
          heading: t("Four steps, no surprises", "አራት እርምጃ፣ ያልተጠበቀ ነገር የለም"),
          items: steps,
          action: quote,
        },
        {
          type: "about",
          id: "about",
          eyebrow: t("About us", "ስለ እኛ"),
          heading: t("Small enough to know your business", "ሥራዎን በቅርበት የምናውቅ ቡድን"),
          body: t(
            "Kokeb Advisory began in 2012 with two economists and a borrowed desk in Kazanchis. We are now eleven: economists, accountants and an engineer.\n\nThe partner you meet on the first day writes your report. We say so when the numbers do not support a project, because that advice is worth the most.",
            "ኮከብ አማካሪ በ2004 ዓ.ም. ካዛንቺስ ውስጥ በሁለት የኢኮኖሚ ባለሙያዎችና በተውሶ ጠረጴዛ ተጀመረ። ዛሬ አሥራ አንድ ነን፤ የኢኮኖሚ ባለሙያዎች፣ የሂሳብ ባለሙያዎች እና አንድ መሐንዲስ።\n\nበመጀመሪያው ቀን ያገኙት አጋር ራሱ ሪፖርትዎን ይጽፋል። አኃዙ ፕሮጀክቱን ካልደገፈ በግልጽ እንነግርዎታለን፤ ከሁሉ የሚበልጠው ምክር ይህ ነውና።",
          ),
          image: img("business-about-office", "Modern office corridor with glass partition walls, pendant lamps and a lounge area", "የመስታወት ግድግዳዎች፣ ተንጠልጣይ መብራቶች እና የእንግዳ መቀመጫ ያለው ዘመናዊ ቢሮ"),
          imageSide: "end",
          points: [
            t("Fixed price agreed before we start", "ሥራ ከመጀመራችን በፊት የተስማማንበት ቋሚ ዋጋ"),
            t("Reports in English and Amharic", "ሪፖርቶች በእንግሊዝኛና በአማርኛ"),
            t("Your figures stay confidential", "መረጃዎ በምስጢር ይጠበቃል"),
          ],
        },
        {
          type: "cards",
          id: "team",
          layout: "people",
          eyebrow: t("Our team", "ቡድናችን"),
          heading: t("The partners you will work with", "አብረዋቸው የሚሠሩ አጋሮች"),
          items: [
            {
              image: img("personal-hero-man-turtleneck", "Studio portrait of a man with a short beard in a black turtleneck", "አጭር ጺም ያለው ጥቁር ሹራብ የለበሰ ወንድ የስቱዲዮ ፎቶ"),
              title: t("Samuel B.", "ሳሙኤል በ."),
              subtitle: t("Managing partner", "ዋና አጋር"),
              description: t("Economist. Feasibility studies and bank financing.", "የኢኮኖሚ ባለሙያ። የአዋጭነት ጥናትና የባንክ ብድር።"),
            },
            {
              image: img("personal-hero-woman-orange-blazer", "Confident young woman with natural hair, arms crossed, in an orange blazer", "እጆቿን አጣምራ የቆመች ብርቱካናማ ኮት የለበሰች በራስ የምትተማመን ወጣት ሴት"),
              title: t("Hanna T.", "ሐና ተ."),
              subtitle: t("Partner, research", "አጋር፣ የጥናት ክፍል"),
              description: t("Leads market surveys and field teams.", "የገበያ ዳሰሳዎችንና የመስክ ቡድኖችን ትመራለች።"),
            },
            {
              image: img("salon-card-afro", "Portrait of a woman with a round afro wearing a black jacket against a grey wall", "ጥቁር ጃኬት የለበሰች አፍሮ ጸጉር ያላት ሴት በግራጫ ግድግዳ ፊት"),
              title: t("Liya M.", "ሊያ መ."),
              subtitle: t("Partner, finance", "አጋር፣ የፋይናንስ ክፍል"),
              description: t("Accountant. Financial models, tax and audits.", "የሂሳብ ባለሙያ። የፋይናንስ ሞዴል፣ ግብር እና ኦዲት።"),
            },
          ],
        },
        {
          type: "testimonials",
          eyebrow: t("Clients say", "ደንበኞች ምን ይላሉ"),
          heading: t("Trusted with big decisions", "በትልልቅ ውሳኔዎች የታመንን"),
          items: [
            { quote: t("The bank asked two questions and approved the loan. Every answer was already in the study.", "ባንኩ ሁለት ጥያቄ ብቻ ጠይቆ ብድሩን ፈቀደ። መልሱ ሁሉ ጥናቱ ውስጥ ነበር።"), name: "Getachew W.", role: t("Developer, Bole", "አልሚ፣ ቦሌ") },
            { quote: t("They told us not to open the third branch. It saved us more than their fee many times over.", "ሦስተኛውን ቅርንጫፍ አትክፈቱ አሉን። ከከፈልናቸው ብዙ እጥፍ አድኖልናል።"), name: "Rahel D.", role: t("Owner, supermarket chain", "ባለቤት፣ የሱፐርማርኬት ሰንሰለት") },
            { quote: t("For the first time I know what one litre costs me. I look at the sheet every Monday.", "አንድ ሊትር ስንት እንደሚያስወጣኝ ለመጀመሪያ ጊዜ አወቅሁ። ሰንጠረዡን በየሰኞው አየዋለሁ።"), name: "Abdi H.", role: t("Director, dairy plant", "ሥራ አስኪያጅ፣ የወተት ማቀነባበሪያ") },
          ],
        },
        {
          type: "form",
          id: "quote",
          kind: "contact",
          heading: t("Request a quote", "ዋጋ ይጠይቁ"),
          intro: t("Tell us what you are planning. A partner calls you within one working day, and the first meeting is free.", "ያቀዱትን ይንገሩን። አንድ አጋራችን በአንድ የሥራ ቀን ውስጥ ይደውልልዎታል፤ የመጀመሪያው ውይይት ነፃ ነው።"),
          fields: [
            nameField,
            phoneField,
            { name: "company", label: t("Company (if any)", "ድርጅት (ካለ)"), type: "text" },
            { name: "service", label: t("Service", "አገልግሎት"), type: "select", required: true, options: [...services.map((s) => s.title), t("Not sure yet", "ገና አልወሰንኩም")] },
            { name: "message", label: t("Tell us about the project", "ስለ ፕሮጀክቱ በአጭሩ"), type: "textarea" },
          ],
          submitLabel: t("Send request", "ጥያቄውን ይላኩ"),
          successMessage: t("Thank you. A partner will call you within one working day.", "እናመሰግናለን። አጋራችን በአንድ የሥራ ቀን ውስጥ ይደውልልዎታል።"),
        },
        {
          type: "cta",
          heading: t("Planning something new?", "አዲስ ነገር አቅደዋል?"),
          body: t("Bring the idea. We will tell you honestly what it takes.", "ሐሳብዎን ይዘው ይምጡ። የሚጠይቀውን በግልጽ እንነግርዎታለን።"),
          image: img("business-hero-addis-street", "A busy Addis Ababa avenue lined with glass mid-rise buildings at dusk", "በምሽት የመስታወት ሕንፃዎች የተሰለፉበት የአዲስ አበባ ሰፊ ጎዳና"),
          primaryAction: quote,
          secondaryAction: link("Call us", "ይደውሉልን", "tel:+251911000000"),
        },
      ],
    },
    {
      path: "/services",
      title: t("Services", "አገልግሎቶች"),
      nav: t("Services", "አገልግሎቶች"),
      description: t("Feasibility studies, business plans, market research, accounting, licences and HR support, with starting prices in Birr.", "የአዋጭነት ጥናት፣ የቢዝነስ ዕቅድ፣ የገበያ ጥናት፣ የሂሳብ አያያዝ፣ ፈቃድ እና የሰው ኃይል ድጋፍ፤ ከመነሻ ዋጋቸው ጋር።"),
      sections: [
        {
          type: "hero",
          variant: "banner",
          eyebrow: t("Services and prices", "አገልግሎቶችና ዋጋ"),
          heading: t("Clear work for a clear price", "ግልጽ ሥራ በግልጽ ዋጋ"),
          subheading: t("Starting prices are below. Your exact price depends on the size of the project and is fixed before we begin.", "መነሻ ዋጋዎቹ ከታች አሉ። ትክክለኛው ዋጋ በፕሮጀክቱ ስፋት ይወሰናል፤ ሥራ ከመጀመራችን በፊትም ይቆረጣል።"),
          image: img("business-hero-addis-street", "A busy Addis Ababa avenue lined with glass mid-rise buildings at dusk", "በምሽት የመስታወት ሕንፃዎች የተሰለፉበት የአዲስ አበባ ሰፊ ጎዳና"),
          primaryAction: quote,
        },
        {
          type: "services",
          variant: "list",
          eyebrow: t("Starting prices", "መነሻ ዋጋዎች"),
          heading: t("What each service includes", "እያንዳንዱ አገልግሎት የሚያካትተው"),
          intro: t("Prices are the lowest we charge for each service, before VAT. Accounting is per month.", "ዋጋዎቹ ለእያንዳንዱ አገልግሎት የምናስከፍለው ዝቅተኛው ሲሆኑ ተ.እ.ታን አይጨምሩም። የሂሳብ አያያዝ በወር ነው።"),
          items: services,
        },
        {
          type: "about",
          eyebrow: t("How we charge", "የክፍያ አሠራር"),
          heading: t("One price, agreed with a handshake and a contract", "አንድ ዋጋ፣ በውል የጸና"),
          body: t(
            "We do not bill by the hour. You get one price for the whole job, and it does not change unless you change the scope.\n\nYou pay 40% to start and the rest when you have the final report in your hands.",
            "በሰዓት አናስከፍልም። ለሥራው በሙሉ አንድ ዋጋ ይሰጥዎታል፤ የሥራውን ወሰን እርስዎ ካልቀየሩ በቀር አይለወጥም።\n\nሥራ ሲጀመር 40%፣ ቀሪውን ደግሞ የመጨረሻው ሪፖርት እጅዎ ሲገባ ይከፍላሉ።",
          ),
          image: img("business-gallery-handshake", "Close-up of two businesspeople shaking hands in an office", "ሁለት የሥራ ሰዎች ቢሮ ውስጥ እጅ ለእጅ ሲጨባበጡ"),
          imageSide: "start",
          highlights: [
            { value: t("40%", "40%"), label: t("to start", "ሥራ ሲጀመር") },
            { value: t("60%", "60%"), label: t("on delivery", "ሲረከቡ") },
          ],
          action: quote,
        },
        {
          type: "faq",
          heading: t("Before you ask for a quote", "ዋጋ ከመጠየቅዎ በፊት"),
          items: [
            { question: t("How long does a feasibility study take?", "የአዋጭነት ጥናት ምን ያህል ጊዜ ይወስዳል?"), answer: t("Four to eight weeks, depending on how much field work the project needs.", "ፕሮጀክቱ እንደሚጠይቀው የመስክ ሥራ መጠን ከአራት እስከ ስምንት ሳምንት።") },
            { question: t("Will the bank accept your study?", "ባንኩ ጥናታችሁን ይቀበላል?"), answer: t("We write to the format each bank asks for and go with you to present it. The loan decision is the bank's.", "እያንዳንዱ ባንክ በሚጠይቀው ቅርጸት እንጽፋለን፤ ሲያቀርቡትም አብረንዎ እንገኛለን። ብድሩን የሚወስነው ግን ባንኩ ነው።") },
            { question: t("Do you work outside Addis Ababa?", "ከአዲስ አበባ ውጭ ትሠራላችሁ?"), answer: t("Yes. We have done field work in Oromia, Amhara, Sidama and Dire Dawa. Travel is included in the price.", "አዎ። በኦሮሚያ፣ በአማራ፣ በሲዳማ እና በድሬዳዋ የመስክ ሥራ ሠርተናል። የጉዞ ወጪ በዋጋው ውስጥ ተካትቷል።") },
            { question: t("My business is small. Is this for me?", "ሥራዬ አነስተኛ ነው። ለእኔ ይሆናል?"), answer: t("Yes. A business plan for a small shop or workshop starts at 60,000 Birr.", "አዎ። ለአነስተኛ ሱቅ ወይም ወርክሾፕ የቢዝነስ ዕቅድ ከ60,000 ብር ይጀምራል።") },
          ],
        },
        {
          type: "cta",
          heading: t("Not sure which service you need?", "የትኛው አገልግሎት እንደሚያስፈልግዎ አላወቁም?"),
          body: t("Describe the decision in a few lines. We will point you to the right one.", "ያለብዎትን ውሳኔ በጥቂት መስመር ይግለጹልን። ትክክለኛውን እንጠቁምዎታለን።"),
          primaryAction: quote,
          secondaryAction: link("Call us", "ይደውሉልን", "tel:+251911000000"),
        },
      ],
    },
    {
      path: "/projects",
      title: t("Projects", "ሥራዎች"),
      nav: t("Projects", "ሥራዎች"),
      description: t("Recent consulting projects by Kokeb Advisory: real estate, trade, manufacturing and retail.", "የኮከብ አማካሪ የቅርብ ጊዜ ሥራዎች፤ በሪል እስቴት፣ በንግድ፣ በማኑፋክቸሪንግ እና በችርቻሮ።"),
      sections: [
        {
          type: "cards",
          layout: "feature",
          eyebrow: t("Selected projects", "የተመረጡ ሥራዎች"),
          heading: t("Four projects, four results", "አራት ሥራ፣ አራት ውጤት"),
          intro: t("Each one started with a question the owner could not answer alone.", "እያንዳንዱ የጀመረው ባለቤቱ ብቻውን ሊመልሰው ባልቻለ ጥያቄ ነው።"),
          items: projects,
        },
        {
          type: "stats",
          tone: "soft",
          heading: t("Where our work has been", "ሥራችን የደረሰባቸው ዘርፎች"),
          items: [
            { value: t("96", "96"), label: t("real estate and construction", "ሪል እስቴትና ግንባታ") },
            { value: t("84", "84"), label: t("manufacturing and agro-processing", "ማኑፋክቸሪንግና አግሮ ፕሮሰሲንግ") },
            { value: t("77", "77"), label: t("import, trade and retail", "አስመጪ፣ ንግድና ችርቻሮ") },
            { value: t("63", "63"), label: t("hotels, health and education", "ሆቴል፣ ጤናና ትምህርት") },
          ],
        },
        {
          type: "quote",
          quote: t("A good study sometimes says no. That answer has saved our clients more money than any yes.", "ጥሩ ጥናት አንዳንዴ «አይሆንም» ይላል። ይህ መልስ ከየትኛውም «ይሆናል» በላይ ለደንበኞቻችን ገንዘብ አድኗል።"),
          name: t("Samuel B.", "ሳሙኤል በ."),
          role: t("Managing partner", "ዋና አጋር"),
        },
        {
          type: "about",
          eyebrow: t("After the report", "ከሪፖርቱ በኋላ"),
          heading: t("We stay until the deal is signed", "ስምምነቱ እስኪፈረም አብረንዎ ነን"),
          body: t(
            "Most of our clients need the study for someone else: a bank, a partner, a regulator. So we come to that meeting with you, answer the technical questions and revise the figures if the terms change.",
            "አብዛኞቹ ደንበኞቻችን ጥናቱን የሚፈልጉት ለሌላ አካል ነው፤ ለባንክ፣ ለሸሪክ ወይም ለተቆጣጣሪ መሥሪያ ቤት። ስለዚህ በዚያ ስብሰባ ላይ አብረንዎ እንገኛለን፣ የቴክኒክ ጥያቄዎችን እንመልሳለን፣ ሁኔታዎች ከተቀየሩም አኃዙን እናስተካክላለን።",
          ),
          image: img("business-about-handshake-team", "Three formally dressed men laughing and shaking hands outdoors", "ሙሉ ልብስ የለበሱ ሦስት ወንዶች ከቤት ውጭ እየሳቁ ሲጨባበጡ"),
          imageSide: "end",
          action: quote,
        },
      ],
    },
    {
      path: "/contact",
      title: t("Contact", "ያግኙን"),
      nav: t("Contact", "ያግኙን"),
      description: t("Call, write or visit Kokeb Advisory in Kazanchis, Addis Ababa.", "ኮከብ አማካሪን ይደውሉ፣ ይጻፉ ወይም ካዛንቺስ ቢሯችን ይምጡ።"),
      sections: [
        { type: "contact", heading: t("Talk to a partner", "ከአጋራችን ጋር ይነጋገሩ"), intro: t("Call or write on Telegram. For a meeting, tell us a day and we will keep an hour for you.", "ይደውሉ ወይም በቴሌግራም ይጻፉ። ለስብሰባ የሚመችዎትን ቀን ይንገሩን፤ አንድ ሰዓት እንይዝልዎታለን።") },
        {
          type: "form",
          id: "message",
          kind: "contact",
          heading: t("Send a message", "መልእክት ይላኩ"),
          fields: [nameField, phoneField, { name: "message", label: t("How can we help?", "ምን እንርዳዎ?"), type: "textarea", required: true }],
          submitLabel: t("Send", "ላክ"),
          successMessage: t("Thank you. We will answer within one working day.", "እናመሰግናለን። በአንድ የሥራ ቀን ውስጥ እንመልሳለን።"),
        },
        { type: "map", heading: t("Our office in Kazanchis", "የካዛንቺስ ቢሯችን"), query: "Kazanchis, Addis Ababa" },
      ],
    },
  ],
});
