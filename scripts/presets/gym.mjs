import { t, img, link, birr, save } from "./lib.mjs";

// Gym and fitness studio. Art direction "kinetic" (docs/research/new-templates-design-plan.md):
// condensed capitals that slide in, a full-screen photo, memberships side by side, a weekly
// class timetable with women-only sessions marked, and a free first visit. Trainers are listed
// by what they coach, without sample photos that would look like real named people.
const join = link("Book a free first visit", "ነጻ የመጀመሪያ ጉብኝት ይያዙ", "/join");
const plans = link("See memberships", "አባልነቶችን ይመልከቱ", "/memberships");
const month = t("a month", "በወር");

const P = {
  deadlift: img("gym-hero-deadlift", "A man lifting a heavy barbell off the floor", "ከባድ ባርቤል ከወለል የሚያነሳ ሰው"),
  press: img("gym-hero-dumbbell-press", "A woman pressing dumbbells on a bench", "በወንበር ላይ ዳምቤል የምትገፋ ሴት"),
  floor: img("gym-about-gym-floor-benches", "A gym floor with benches and racks", "ወንበሮችና መደርደሪያዎች ያሉት የጂም ወለል"),
  boxing: img("gym-card-boxing", "Boxing gloves hitting pads", "የቦክስ ጓንቶች ፓድ ሲመቱ"),
  group: img("gym-card-group-outdoor-class", "A group class training outdoors", "ከቤት ውጭ የሚሠራ የቡድን ስፖርት"),
  stretch: img("gym-card-stretching", "A woman stretching on a mat", "በምንጣፍ ላይ የምትለጠጥ ሴት"),
  coach: img("gym-card-trainer-coaching", "A trainer coaching someone through a lift", "አሠልጣኝ አንድን ሰው በማንሳት ሲያግዝ"),
  squat: img("gym-card-woman-barbell-squat", "A woman squatting with a barbell", "በባርቤል ስኳት የምትሠራ ሴት"),
  ropes: img("gym-gallery-battle-ropes", "Battle ropes in motion", "በእንቅስቃሴ ላይ ያሉ የስፖርት ገመዶች"),
  rack: img("gym-gallery-dumbbell-rack", "A rack of dumbbells", "የዳምቤል መደርደሪያ"),
};

const tiers = [
  { title: t("Day pass", "የቀን ማለፊያ"), subtitle: t("Try a day, any day", "አንድ ቀን ይሞክሩ"), price: birr(300), priceNote: t("a day", "በቀን"), meta: [t("Gym floor", "የጂም ወለል"), t("Lockers and showers", "ቁም ሣጥንና ሻወር")], action: join },
  { title: t("Monthly", "ወርሃዊ"), subtitle: t("Everything, every day", "ሁሉንም፣ በየቀኑ"), badge: t("Most chosen", "በብዛት የሚመረጥ"), price: birr(2500), priceNote: month, meta: [t("Gym floor, 5:30 am to 10 pm", "የጂም ወለል፣ ከ11:30 እስከ 4 ሰዓት"), t("All group classes", "ሁሉም የቡድን ክፍሎች"), t("A plan from a trainer", "ከአሠልጣኝ የሚዘጋጅ ዕቅድ"), t("Lockers and showers", "ቁም ሣጥንና ሻወር")], action: join },
  { title: t("Three months", "ሦስት ወር"), subtitle: t("For a real change", "ለእውነተኛ ለውጥ"), price: birr(6500), priceNote: t("for 3 months", "ለ3 ወር"), meta: [t("Everything in monthly", "የወርሃዊው ሁሉ"), t("Two personal sessions", "ሁለት የግል ልምምዶች"), t("Body check every month", "በየወሩ የሰውነት ምርመራ")], action: join },
];

const timetable = {
  type: "schedule",
  id: "classes",
  layout: "week",
  eyebrow: t("Classes", "ክፍሎች"),
  heading: t("This week on the floor", "የዚህ ሳምንት ክፍሎች"),
  items: [
    { day: t("Monday", "ሰኞ"), time: t("6:30 am", "12:30"), title: t("Strength", "ጥንካሬ") },
    { day: t("Monday", "ሰኞ"), time: t("6:00 pm", "12:00"), title: t("Boxing", "ቦክስ") },
    { day: t("Tuesday", "ማክሰኞ"), time: t("7:00 am", "1:00"), title: t("Aerobics", "ኤሮቢክስ"), note: t("Women only", "ለሴቶች ብቻ") },
    { day: t("Tuesday", "ማክሰኞ"), time: t("6:00 pm", "12:00"), title: t("Circuit", "ሰርኪት") },
    { day: t("Thursday", "ሐሙስ"), time: t("6:30 am", "12:30"), title: t("Strength", "ጥንካሬ") },
    { day: t("Thursday", "ሐሙስ"), time: t("6:00 pm", "12:00"), title: t("Boxing", "ቦክስ") },
    { day: t("Saturday", "ቅዳሜ"), time: t("8:00 am", "2:00"), title: t("Outdoor run", "የውጪ ሩጫ"), note: t("From the gym door", "ከጂሙ በር") },
    { day: t("Saturday", "ቅዳሜ"), time: t("10:00 am", "4:00"), title: t("Stretch and mobility", "መለጠጥና እንቅስቃሴ"), note: t("Women only", "ለሴቶች ብቻ") },
  ],
};

const joinForm = {
  type: "form",
  id: "join",
  kind: "booking",
  heading: t("Your first visit is free", "የመጀመሪያ ጉብኝትዎ በነጻ ነው"),
  intro: t("Pick a time. A trainer shows you around, checks your goals and writes a first plan.", "ሰዓት ይምረጡ። አሠልጣኝ ያስጎበኝዎታል፣ ግብዎን ያያል፣ የመጀመሪያ ዕቅድም ያዘጋጃል።"),
  fields: [
    { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
    { name: "phone", label: t("Phone", "ስልክ"), type: "tel", required: true },
    { name: "date", label: t("Day", "ቀን"), type: "date", required: true },
    { name: "goal", label: t("Your goal", "ግብዎ"), type: "select", options: [t("Get stronger", "መጠንከር"), t("Lose weight", "ክብደት መቀነስ"), t("Get fit for a sport", "ለስፖርት መዘጋጀት"), t("Women-only classes", "የሴቶች ብቻ ክፍሎች")] },
  ],
  submitLabel: t("Book my free visit", "ነጻ ጉብኝቴን ይያዙ"),
  successMessage: t("See you soon. We will call to confirm the time.", "በቅርቡ እንገናኝ። ሰዓቱን ለማረጋገጥ እንደውላለን።"),
};

save("gym", {
  name: t("Iron Addis", "አይረን አዲስ"),
  tagline: t("Gym and classes in Sarbet, Addis Ababa", "ጂምና ክፍሎች በሳር ቤት፣ አዲስ አበባ"),
  languages: ["en", "am"],
  theme: { primary: "#C62E17", accent: "#121212", background: "#F2F2EE", text: "#111111", highlight: "#D4FF3A", font: "condensed", radius: "small", style: "kinetic" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Sarbet, near Canadian Embassy, Addis Ababa", "ሳር ቤት፣ ካናዳ ኤምባሲ አጠገብ፣ አዲስ አበባ"),
    hours: [
      { days: t("Monday to Saturday", "ከሰኞ እስከ ቅዳሜ"), time: t("5:30 am to 10:00 pm", "ከ11:30 እስከ ምሽቱ 4 ሰዓት") },
      { days: t("Sunday", "እሑድ"), time: t("7:00 am to 1:00 pm", "ከጠዋቱ 1 እስከ 7 ሰዓት") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Iron Addis gym in Sarbet, Addis Ababa: memberships from 2,500 Birr a month, strength, boxing and women-only classes, and a free first visit.", "አይረን አዲስ ጂም በሳር ቤት፣ አዲስ አበባ፦ አባልነት ከ2,500 ብር በወር፣ የጥንካሬ፣ የቦክስና የሴቶች ብቻ ክፍሎች፣ እና ነጻ የመጀመሪያ ጉብኝት።"),
      sections: [
        {
          type: "hero",
          variant: "immersive",
          id: "top",
          eyebrow: t("Sarbet · open from 5:30 am", "ሳር ቤት · ከ11:30 ጀምሮ ክፍት"),
          heading: t("Train harder", "ጠንክረው ይሥሩ"),
          subheading: t("Free weights, real coaches and classes every day. Your first visit is on us.", "ነጻ ክብደቶች፣ እውነተኛ አሠልጣኞችና በየቀኑ ክፍሎች። የመጀመሪያ ጉብኝትዎ በእኛ ነው።"),
          image: P.deadlift,
          primaryAction: join,
          secondaryAction: plans,
        },
        {
          type: "stats",
          id: "numbers",
          tone: "dark",
          items: [
            { value: t("600 m²", "600 ሜ²"), label: t("of training floor", "የልምምድ ወለል") },
            { value: t("24", "24"), label: t("classes a week", "ክፍሎች በሳምንት") },
            { value: t("5", "5"), label: t("certified trainers", "የተረጋገጡ አሠልጣኞች") },
          ],
        },
        {
          type: "cards",
          id: "train",
          layout: "grid",
          eyebrow: t("Ways to train", "የልምምድ መንገዶች"),
          heading: t("Find your thing", "የሚስማማዎትን ያግኙ"),
          items: [
            { image: P.squat, title: t("Strength", "ጥንካሬ"), description: t("Barbells, racks and a coach to check your form.", "ባርቤሎች፣ መደርደሪያዎችና አቋምዎን የሚያይ አሠልጣኝ።") },
            { image: P.boxing, title: t("Boxing", "ቦክስ"), description: t("Pads, bags and footwork, twice a week.", "ፓድ፣ ቦርሳና የእግር እንቅስቃሴ፣ በሳምንት ሁለቴ።") },
            { image: P.group, title: t("Group classes", "የቡድን ክፍሎች"), description: t("Circuit, aerobics and a Saturday run.", "ሰርኪት፣ ኤሮቢክስና የቅዳሜ ሩጫ።") },
            { image: P.coach, title: t("Personal training", "የግል ልምምድ"), description: t("One coach, your plan, your pace.", "አንድ አሠልጣኝ፣ የእርስዎ ዕቅድ፣ የእርስዎ ፍጥነት።"), price: birr(800), priceNote: t("a session", "በአንድ ልምምድ") },
          ],
        },
        { type: "cards", id: "memberships", layout: "pricing", eyebrow: t("Memberships", "አባልነት"), heading: t("No joining fee", "የመመዝገቢያ ክፍያ የለም"), items: tiers },
        timetable,
        {
          type: "testimonials",
          id: "members",
          heading: t("From our members", "ከአባሎቻችን"),
          items: [
            { quote: t("The women-only mornings got me started. Six months later I lift with everyone.", "የሴቶች ብቻ ጠዋቶች አስጀመሩኝ። ከስድስት ወር በኋላ ከሁሉም ጋር አነሳለሁ።"), name: "Selam A.", role: t("Member since 2025", "ከ2025 ጀምሮ አባል") },
            { quote: t("Coaches who actually watch your form. Best gym in Sarbet.", "አቋምዎን በእውነት የሚያዩ አሠልጣኞች። በሳር ቤት ምርጡ ጂም።"), name: "Dawit K.", role: t("Strength", "ጥንካሬ") },
          ],
        },
        joinForm,
      ],
    },
    {
      path: "/memberships",
      title: t("Memberships", "አባልነት"),
      nav: t("Memberships", "አባልነት"),
      description: t("Iron Addis memberships and prices: day pass, monthly and three months.", "የአይረን አዲስ አባልነትና ዋጋ፦ የቀን ማለፊያ፣ ወርሃዊና ሦስት ወር።"),
      sections: [
        { type: "cards", id: "plans", layout: "pricing", eyebrow: t("Memberships", "አባልነት"), heading: t("Pick a plan", "ዕቅድ ይምረጡ"), intro: t("Pay by Telebirr, bank transfer or cash. Freeze your membership for up to a month when you travel.", "በቴሌብር፣ በባንክ ዝውውር ወይም በጥሬ ይክፈሉ። ሲጓዙ አባልነትዎን እስከ አንድ ወር ማቆየት ይችላሉ።"), items: tiers },
        {
          type: "services",
          id: "coaches",
          variant: "numbered",
          eyebrow: t("Coaches", "አሠልጣኞች"),
          heading: t("Who coaches you", "ማን ያሠለጥንዎታል"),
          image: P.floor,
          items: [
            { title: t("Head coach, strength", "ዋና አሠልጣኝ፣ ጥንካሬ"), description: t("[Name]: ten years of powerlifting.", "[ስም]፦ የአሥር ዓመት የፓወርሊፍቲንግ ልምድ።") },
            { title: t("Boxing coach", "የቦክስ አሠልጣኝ"), description: t("[Name]: former national team.", "[ስም]፦ የቀድሞ የብሔራዊ ቡድን አባል።") },
            { title: t("Women's classes", "የሴቶች ክፍሎች"), description: t("[Name]: aerobics and mobility.", "[ስም]፦ ኤሮቢክስና እንቅስቃሴ።") },
          ],
        },
        {
          type: "faq",
          id: "questions",
          heading: t("Before you join", "ከመመዝገብዎ በፊት"),
          items: [
            { question: t("Is there a joining fee?", "የመመዝገቢያ ክፍያ አለ?"), answer: t("No. You pay the membership and that is all.", "የለም። አባልነቱን ብቻ ይከፍላሉ።") },
            { question: t("Are there women-only times?", "የሴቶች ብቻ ሰዓት አለ?"), answer: t("Yes: Tuesday at 7 am and Saturday at 10 am, with a woman coach.", "አዎ፦ ማክሰኞ ከጠዋቱ 1 ሰዓትና ቅዳሜ ከጠዋቱ 4 ሰዓት፣ ከሴት አሠልጣኝ ጋር።") },
            { question: t("Can I bring a friend?", "ጓደኛ ማምጣት እችላለሁ?"), answer: t("Yes, once a month for free on a monthly membership.", "አዎ፣ ወርሃዊ አባል ከሆኑ በወር አንድ ጊዜ በነጻ።") },
          ],
        },
      ],
    },
    {
      path: "/classes",
      title: t("Classes", "ክፍሎች"),
      nav: t("Classes", "ክፍሎች"),
      description: t("The weekly class timetable at Iron Addis, with women-only sessions.", "የአይረን አዲስ ሳምንታዊ የክፍሎች ሰሌዳ፣ የሴቶች ብቻ ክፍሎችን ጨምሮ።"),
      sections: [
        { ...timetable, id: "classes-all" },
        { type: "gallery", id: "floor", layout: "mosaic", heading: t("The gym", "ጂሙ"), images: [P.ropes, P.rack, P.press, P.stretch] },
      ],
    },
    {
      path: "/join",
      title: t("Join", "ይመዝገቡ"),
      nav: t("Join", "ይመዝገቡ"),
      description: t("Book a free first visit at Iron Addis in Sarbet.", "በሳር ቤት በአይረን አዲስ ነጻ የመጀመሪያ ጉብኝት ይያዙ።"),
      sections: [{ ...joinForm, id: "join-page" }, { type: "contact", id: "contact", heading: t("Or just walk in", "ወይም በቀጥታ ይምጡ") }, { type: "map", id: "map", heading: t("Find us in Sarbet", "በሳር ቤት ያግኙን"), query: "Sarbet, Addis Ababa" }],
    },
  ],
});
