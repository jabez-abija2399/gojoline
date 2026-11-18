import { t, img, link, birr, save } from "./lib.mjs";

// Garage and car rental. Art direction "bento" (docs/research/new-templates-design-plan.md):
// the first screen as tiles (heading on the photo, hours, two actions, facts), fixed service
// prices in a table, the fleet as side-on cards to swipe, booking with the car and plate.
const book = link("Book a service", "ቀጠሮ ይያዙ", "/#booking");
const rent = link("Rent with a driver", "መኪና ከሹፌር ጋር ይከራዩ", "/rental");
const call = link("Call the workshop", "ይደውሉልን", "tel:+251911000000");

const P = {
  bay: img("garage-hero-car-on-lift-clean-bay", "A car raised on a lift in a clean, bright workshop bay", "በንጹሕና ብሩህ የጥገና ክፍል ውስጥ በማንሻ ላይ የተሰቀለ መኪና"),
  bonnet: img("garage-hero-mechanic-under-bonnet", "A mechanic in overalls working under an open bonnet", "ሰማያዊ የሥራ ልብስ የለበሰ መካኒክ በተከፈተ ኮፈን ሥር ሲሠራ"),
  team: img("garage-about-mechanics-team-engine", "Two young mechanics working on an engine together", "ሁለት ወጣት መካኒኮች አብረው ሞተር ሲጠግኑ"),
  oil: img("garage-card-oil-check-dipstick", "A mechanic checking the engine oil with the dipstick", "መካኒክ የሞተሩን ዘይት በመለኪያው ሲያይ"),
  brakes: img("garage-card-brake-repair", "A mechanic repairing the brakes behind a front wheel", "መካኒክ ከፊት ጎማ ጀርባ ያለውን ፍሬን ሲጠግን"),
  diag: img("garage-card-engine-diagnostics", "A technician reading engine data on a diagnostic tablet", "ባለሙያ የሞተሩን መረጃ በመመርመሪያ ታብሌት ሲያነብ"),
  tyres: img("garage-card-tyre-wheel-service", "Two mechanics changing tyres on the workshop floor", "ሁለት መካኒኮች በጥገና ክፍሉ ወለል ላይ ጎማ ሲቀይሩ"),
  suv: img("garage-card-fleet-suv-side", "A silver seven-seat SUV seen from the side", "ከጎን የሚታይ ብር ቀለም ያለው ባለ ሰባት መቀመጫ መኪና"),
  minibus: img("garage-card-fleet-minibus-side", "A white minibus parked at an airport drop-off", "በአውሮፕላን ማረፊያ መውረጃ ላይ የቆመ ነጭ ሚኒባስ"),
  saloon: img("garage-card-fleet-saloon-side", "A silver saloon car parked beside a brick building", "ከጡብ ሕንፃ አጠገብ የቆመ ብር ቀለም ያለው መኪና"),
};

const row = (en, am, price, den, dam, tag) => ({ name: t(en, am), price: birr(price), ...(den ? { description: t(den, dam) } : {}), ...(tag ? { tag } : {}) });
const sameDay = t("Same day", "በዕለቱ");
const service = {
  name: t("Service and repairs", "አገልግሎትና ጥገና"),
  items: [
    row("Oil and filter change", "የዘይትና የማጣሪያ ቅየራ", 2500, "Small car, oil included", "ለትንሽ መኪና፣ ዘይቱን ጨምሮ", sameDay),
    row("Full service", "ሙሉ ሰርቪስ", 6500, "Oil, filters, plugs, brakes checked, 30-point check", "ዘይት፣ ማጣሪያዎች፣ ፕላግ፣ የፍሬን ፍተሻ፣ 30 ነጥብ ምርመራ"),
    row("Brake pads, front", "የፊት ፍሬን ሸራ", 3200, "Parts and labour", "ዕቃና ሥራ", sameDay),
    row("Engine diagnosis", "የሞተር ምርመራ", 1200, "Computer check with a written report", "በኮምፒውተር ምርመራ ከጽሑፍ ሪፖርት ጋር", sameDay),
  ],
};
const tyresCat = {
  name: t("Tyres and wheels", "ጎማና ተሽከርካሪ"),
  items: [
    row("Tyre change, per wheel", "የጎማ ቅየራ፣ ለአንድ", 300, "", "", sameDay),
    row("Wheel balancing, four wheels", "የጎማ ሚዛን፣ ለአራቱ", 1200),
    row("Wheel alignment", "አላይንመንት", 1500),
  ],
};
const fleet = [
  { image: P.suv, title: t("Seven-seat SUV", "ባለ 7 መቀመጫ"), subtitle: t("Automatic · four-wheel drive", "አውቶማቲክ · ፎር ዊል"), meta: [t("7 seats", "7 መቀመጫ"), t("With driver", "ከሹፌር ጋር"), t("Airport pickup", "ከኤርፖርት መቀበል"), t("Out of town", "ከከተማ ውጭ")], price: birr(9500), priceNote: t("per day", "በቀን"), action: link("Book this car", "ይህን መኪና ይያዙ", "/rental#rent") },
  { image: P.minibus, title: t("Minibus", "ሚኒባስ"), subtitle: t("For weddings, groups and airport runs", "ለሠርግ፣ ለቡድንና ለኤርፖርት"), meta: [t("14 seats", "14 መቀመጫ"), t("With driver", "ከሹፌር ጋር"), t("Airport pickup", "ከኤርፖርት መቀበል")], price: birr(8000), priceNote: t("per day", "በቀን"), action: link("Book this car", "ይህን መኪና ይያዙ", "/rental#rent") },
  { image: P.saloon, title: t("Saloon car", "ሴዳን መኪና"), subtitle: t("Comfortable for the city", "ለከተማ ምቹ"), meta: [t("4 seats", "4 መቀመጫ"), t("With driver", "ከሹፌር ጋር"), t("Automatic", "አውቶማቲክ")], price: birr(5500), priceNote: t("per day", "በቀን"), action: link("Book this car", "ይህን መኪና ይያዙ", "/rental#rent") },
];

const bookingForm = {
  type: "form",
  id: "booking",
  kind: "booking",
  heading: t("Book a service", "የአገልግሎት ቀጠሮ ይያዙ"),
  intro: t("We call you with the price before any work starts. Nothing is done without your yes.", "ማንኛውም ሥራ ከመጀመሩ በፊት ዋጋውን ደውለን እንነግርዎታለን። ያለ እርስዎ ፈቃድ ምንም አይሠራም።"),
  fields: [
    { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
    { name: "phone", label: t("Phone", "ስልክ"), type: "tel", required: true },
    { name: "car", label: t("Car make, model and year", "የመኪናው ዓይነት፣ ሞዴልና ዓመት"), type: "text", required: true },
    { name: "plate", label: t("Plate number", "የሰሌዳ ቁጥር"), type: "text" },
    { name: "service", label: t("What does it need?", "ምን ያስፈልገዋል?"), type: "select", required: true, options: [t("Service", "ሰርቪስ"), t("Brakes", "ፍሬን"), t("Engine or warning light", "ሞተር ወይም የማስጠንቀቂያ መብራት"), t("Tyres", "ጎማ"), t("Something else", "ሌላ")] },
    { name: "date", label: t("Preferred day", "የሚመችዎ ቀን"), type: "date" },
  ],
  submitLabel: t("Send booking", "ቀጠሮውን ላክ"),
  successMessage: t("Thank you. We will call you to confirm the time.", "እናመሰግናለን። ሰዓቱን ለማረጋገጥ እንደውልልዎታለን።"),
};
const rentForm = {
  type: "form",
  id: "rent",
  kind: "booking",
  heading: t("Rent a car with a driver", "መኪና ከሹፌር ጋር ይከራዩ"),
  intro: t("Tell us the dates and where to pick you up. We confirm the car and the price on Telegram.", "ቀኖቹንና የምንቀበልዎትን ቦታ ይንገሩን። መኪናውንና ዋጋውን በቴሌግራም እናረጋግጣለን።"),
  fields: [
    { name: "name", label: t("Your name", "ስምዎ"), type: "text", required: true },
    { name: "phone", label: t("Phone or Telegram", "ስልክ ወይም ቴሌግራም"), type: "tel", required: true },
    { name: "car", label: t("Car", "መኪና"), type: "select", required: true, options: [t("Seven-seat SUV", "ባለ 7 መቀመጫ"), t("Minibus", "ሚኒባስ"), t("Saloon car", "ሴዳን መኪና")] },
    { name: "start", label: t("From", "ከ"), type: "date", required: true },
    { name: "end", label: t("Until", "እስከ"), type: "date", required: true },
    { name: "pickup", label: t("Pickup place or flight number", "የመቀበያ ቦታ ወይም የበረራ ቁጥር"), type: "text" },
  ],
  submitLabel: t("Ask for this car", "ይህን መኪና ጠይቅ"),
  successMessage: t("Thank you. We will confirm on Telegram shortly.", "እናመሰግናለን። በቅርቡ በቴሌግራም እናረጋግጣለን።"),
};

save("garage", {
  name: t("Kaleb Auto Service", "ካሌብ የመኪና አገልግሎት"),
  tagline: t("Repairs at fixed prices and cars with a driver, in Gerji, Addis Ababa", "በቋሚ ዋጋ ጥገናና መኪና ከሹፌር ጋር፣ ገርጂ፣ አዲስ አበባ"),
  languages: ["en", "am"],
  theme: { primary: "#C4161C", accent: "#16191E", background: "#F3F4F6", text: "#111418", highlight: "#FFB000", font: "condensed", radius: "large", style: "bento" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Gerji, behind Unity University, Addis Ababa", "ገርጂ፣ ከዩኒቲ ዩኒቨርሲቲ ጀርባ፣ አዲስ አበባ"),
    hours: [
      { days: t("Monday to Saturday", "ከሰኞ እስከ ቅዳሜ"), time: t("8:00 am to 6:00 pm", "ከጠዋቱ 2 እስከ ምሽቱ 12 ሰዓት") },
      { days: t("Rental, every day", "ኪራይ፣ በየቀኑ"), time: t("24 hours", "24 ሰዓት") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Car repairs at fixed prices and cars with a driver in Gerji, Addis Ababa. We call with the price before any work.", "በገርጂ፣ አዲስ አበባ በቋሚ ዋጋ የመኪና ጥገናና መኪና ከሹፌር ጋር። ከሥራ በፊት ዋጋውን ደውለን እንነግርዎታለን።"),
      sections: [
        {
          type: "hero",
          variant: "bento",
          id: "top",
          eyebrow: t("Gerji · Addis Ababa", "ገርጂ · አዲስ አበባ"),
          heading: t("Honest repairs. Fixed prices.", "ታማኝ ጥገና፣ ቋሚ ዋጋ።"),
          subheading: t("We call you with the price before any work starts.", "ሥራ ከመጀመሩ በፊት ዋጋውን ደውለን እንነግርዎታለን።"),
          image: P.bay,
          primaryAction: book,
          secondaryAction: rent,
          facts: [{ value: t("3 months", "3 ወር"), label: t("warranty on every repair", "ዋስትና በእያንዳንዱ ጥገና") }],
        },
        {
          type: "menu",
          id: "prices",
          layout: "table",
          eyebrow: t("No surprises", "ያልተጠበቀ ክፍያ የለም"),
          heading: t("Service prices", "የአገልግሎት ዋጋ"),
          intro: t("Prices in Birr for a small car. Bigger cars and imported parts can cost more: we tell you before we start.", "ዋጋዎቹ በብር ለትንሽ መኪና ናቸው። ለትልቅ መኪናና ለውጭ ዕቃ ሊጨምር ይችላል፤ ከመጀመራችን በፊት እንነግርዎታለን።"),
          categories: [service, tyresCat],
        },
        {
          type: "steps",
          id: "how",
          eyebrow: t("How it works", "እንዴት ይሠራል"),
          heading: t("Your car, without the worry", "መኪናዎ፣ ያለ ጭንቀት"),
          items: [
            { title: t("Book here or on Telegram", "እዚህ ወይም በቴሌግራም ይያዙ"), description: t("Choose a day that suits you.", "የሚመችዎትን ቀን ይምረጡ።") },
            { title: t("Drop it off, or we collect it", "ያምጡት፣ ወይም መጥተን እንወስዳለን"), description: t("Collection in Bole, CMC and Gerji.", "ከቦሌ፣ ከሲኤምሲና ከገርጂ እንወስዳለን።") },
            { title: t("We call with the price first", "መጀመሪያ ዋጋውን እንደውላለን"), description: t("With photos of what needs fixing.", "መጠገን ያለበትን ፎቶ ጨምረን።") },
            { title: t("Collect it with a warranty", "በዋስትና ይውሰዱት"), description: t("Three months on parts and work.", "በዕቃና በሥራ ላይ የሦስት ወር ዋስትና።") },
          ],
          action: book,
        },
        {
          type: "cards",
          id: "fleet",
          layout: "scroll",
          eyebrow: t("Car rental", "የመኪና ኪራይ"),
          heading: t("Cars with a driver", "መኪና ከሹፌር ጋር"),
          intro: t("Airport pickups, weddings, trips out of town. Fuel and driver included in town.", "ከኤርፖርት መቀበል፣ ሠርግ፣ ከከተማ ውጭ ጉዞ። በከተማ ውስጥ ነዳጅና ሹፌር ይጨምራል።"),
          items: fleet,
          action: rent,
        },
        {
          type: "services",
          id: "work",
          variant: "bento",
          eyebrow: t("In the workshop", "በጥገና ክፍሉ"),
          heading: t("What we fix every day", "በየቀኑ የምንጠግነው"),
          items: [
            { icon: "wrench", title: t("Service and oil", "ሰርቪስና ዘይት"), description: t("Done while you wait, about an hour. Oil, filters and a 30-point check.", "እየጠበቁ ይሠራል፣ አንድ ሰዓት ያህል። ዘይት፣ ማጣሪያዎችና 30 ነጥብ ፍተሻ።") },
            { icon: "shield", title: t("Brakes and suspension", "ፍሬንና ሞሞርታይዘር"), description: t("Pads, discs and shocks, checked on every visit.", "ሸራ፣ ዲስክና ሞሞርታይዘር፣ በየጉብኝቱ ይፈተሻሉ።") },
            { icon: "chart", title: t("Engine and electrics", "ሞተርና ኤሌክትሪክ"), description: t("Warning lights read by computer, with a written report.", "የማስጠንቀቂያ መብራቶች በኮምፒውተር ይነበባሉ፣ ከጽሑፍ ሪፖርት ጋር።") },
            { icon: "car", title: t("Tyres and alignment", "ጎማና አላይንመንት"), description: t("New and used tyres, balancing and alignment.", "አዲስና ያገለገሉ ጎማዎች፣ ሚዛንና አላይንመንት።") },
          ],
        },
        {
          type: "testimonials",
          id: "reviews",
          eyebrow: t("Customers say", "ደንበኞች ምን ይላሉ"),
          heading: t("2,400 cars and counting", "2,400 መኪኖች እና ገና"),
          items: [
            { quote: t("They sent me a photo of the worn pads and the price before touching anything.", "ምንም ሳይነኩ ያለቀውን ሸራ ፎቶና ዋጋውን ላኩልኝ።"), name: "Dawit G.", role: t("Brakes", "ፍሬን") },
            { quote: t("The minibus was at the airport before our flight landed.", "አውሮፕላናችን ከማረፉ በፊት ሚኒባሱ ኤርፖርት ደርሶ ነበር።"), name: "Meron A.", role: t("Airport pickup", "ከኤርፖርት መቀበል") },
          ],
        },
        bookingForm,
        {
          type: "cta",
          id: "end",
          heading: t("A warning light on?", "የማስጠንቀቂያ መብራት በርቷል?"),
          body: t("Book a diagnosis today. Most cars are checked the same day.", "ዛሬ ምርመራ ይያዙ። አብዛኞቹ መኪኖች በዕለቱ ይፈተሻሉ።"),
          image: P.bonnet,
          primaryAction: book,
          secondaryAction: call,
        },
      ],
    },
    {
      path: "/services",
      title: t("Services", "አገልግሎቶች"),
      nav: t("Services", "አገልግሎቶች"),
      description: t("Every service price at Kaleb Auto Service in Birr: oil change, full service, brakes, diagnosis, tyres and alignment.", "የካሌብ የመኪና አገልግሎት ሁሉም ዋጋዎች በብር፦ ዘይት፣ ሙሉ ሰርቪስ፣ ፍሬን፣ ምርመራ፣ ጎማና አላይንመንት።"),
      sections: [
        { type: "menu", id: "all-prices", layout: "table", eyebrow: t("Fixed prices", "ቋሚ ዋጋ"), heading: t("All service prices", "ሁሉም የአገልግሎት ዋጋዎች"), intro: t("Prices in Birr for a small car, parts and labour included unless noted.", "ዋጋዎቹ በብር ለትንሽ መኪና ናቸው፤ ካልተገለጸ ዕቃና ሥራን ይጨምራሉ።"), categories: [service, tyresCat] },
        { ...bookingForm, id: "booking-services" },
      ],
    },
    {
      path: "/rental",
      title: t("Car rental", "የመኪና ኪራይ"),
      nav: t("Rental", "ኪራይ"),
      description: t("Rent a car with a driver in Addis Ababa from Kaleb Auto Service: SUV, minibus or saloon, airport pickup included.", "ከካሌብ የመኪና አገልግሎት መኪና ከሹፌር ጋር ይከራዩ፦ ባለ 7 መቀመጫ፣ ሚኒባስ ወይም ሴዳን፣ ከኤርፖርት መቀበልን ጨምሮ።"),
      sections: [
        { type: "cards", id: "cars", layout: "grid", eyebrow: t("With a driver", "ከሹፌር ጋር"), heading: t("Choose a car", "መኪና ይምረጡ"), intro: t("Prices per day in Addis Ababa, driver and fuel included. Trips out of town are priced by distance.", "ዋጋዎቹ በአዲስ አበባ ውስጥ በቀን፣ ሹፌርና ነዳጅን ጨምሮ። ከከተማ ውጭ ጉዞ በርቀት ይሰላል።"), items: fleet },
        rentForm,
        {
          type: "faq",
          id: "questions",
          heading: t("Before you rent", "ከመከራየትዎ በፊት"),
          items: [
            { question: t("Can I drive the car myself?", "ራሴ መንዳት እችላለሁ?"), answer: t("Our cars come with a driver who knows the roads. It is safer and the price is the same.", "መኪኖቻችን መንገዱን ከሚያውቅ ሹፌር ጋር ይመጣሉ። ይበልጥ አስተማማኝ ሲሆን ዋጋውም ያው ነው።") },
            { question: t("Do you meet flights at night?", "ማታ በረራ ትቀበላላችሁ?"), answer: t("Yes, at any hour. Send us your flight number and the driver will wait with your name.", "አዎ፣ በማንኛውም ሰዓት። የበረራ ቁጥርዎን ይላኩ፤ ሹፌሩ ስምዎን ይዞ ይጠብቃል።") },
            { question: t("How do I pay?", "እንዴት እከፍላለሁ?"), answer: t("Telebirr or bank transfer, half when you book and half on the day.", "በቴሌብር ወይም በባንክ፤ ግማሹን ሲይዙ፣ ግማሹን በዕለቱ።") },
          ],
        },
      ],
    },
    {
      path: "/visit",
      title: t("Visit", "ይጎብኙን"),
      nav: t("Visit", "ይጎብኙን"),
      description: t("Find Kaleb Auto Service in Gerji, Addis Ababa: opening hours, phone and directions.", "ካሌብ የመኪና አገልግሎትን በገርጂ ያግኙ፦ የሥራ ሰዓት፣ ስልክና አቅጣጫ።"),
      sections: [
        { type: "contact", id: "contact", heading: t("Bring your car in", "መኪናዎን ያምጡ"), intro: t("Walk in for a quick check, or book a time and skip the queue.", "ለፈጣን ፍተሻ ያለ ቀጠሮ ይምጡ፤ ወይም ቀጠሮ ይዘው ወረፋ ይለፉ።") },
        { type: "map", id: "map", heading: t("Find us in Gerji", "በገርጂ ያግኙን"), query: "Gerji, Addis Ababa" },
      ],
    },
  ],
});
