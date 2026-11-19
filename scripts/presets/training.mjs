import { t, img, link, birr, save } from "./lib.mjs";

// Training centre: exam prep, languages and computer courses. Art direction "brutal"
// (docs/research/new-templates-design-plan.md): thick ink borders and hard shadows, labels on
// marker yellow, a turning "next class" stamp, courses with fees and intakes, the route to the
// certificate as steps, and a weekly timetable.
const register = link("Register", "ይመዝገቡ", "/register");
const courses = link("See courses", "ኮርሶቹን ይመልከቱ", "/courses");

const P = {
  uniform: img("training-hero-instructor-uniformed-class", "An instructor teaching a class of students in uniform", "ዩኒፎርም ለለበሱ ተማሪዎች የሚያስተምር መምህር"),
  board: img("training-hero-teacher-whiteboard-class", "A teacher at a whiteboard in front of a class", "በነጭ ሰሌዳ ፊት ለክፍሉ የምታስተምር መምህርት"),
  helping: img("training-about-teacher-helping-pupils", "A teacher helping two pupils with their work", "መምህርት ሁለት ተማሪዎችን ስታግዝ"),
  computers: img("training-card-computer-lab", "Adults learning in a computer lab", "በኮምፒውተር ክፍል የሚማሩ አዋቂዎች"),
  driving: img("training-card-driving-lesson", "An instructor beside a learner at the wheel of a car", "መሪ ከያዘች ተማሪ አጠገብ ያለ የማሽከርከር አሠልጣኝ"),
  english: img("training-card-english-class", "An English lesson with words on the whiteboard", "በነጭ ሰሌዳው ላይ ቃላት ያሉበት የእንግሊዝኛ ትምህርት"),
  graduate: img("training-card-graduate-diploma", "A smiling graduate holding a diploma", "ዲፕሎማ የያዘ ፈገግተኛ ተመራቂ"),
  studying: img("training-card-students-studying", "Students studying together at a desk", "በጠረጴዛ ዙሪያ አብረው የሚያጠኑ ተማሪዎች"),
  discussion: img("training-gallery-group-discussion", "Students in a group discussion", "በቡድን የሚወያዩ ተማሪዎች"),
  library: img("training-gallery-library-study", "A quiet library with students reading", "ተማሪዎች የሚያነቡበት ጸጥ ያለ ቤተ መጻሕፍት"),
};

const month = t("per month", "በወር");
const courseCards = [
  { image: P.studying, badge: t("Exam prep", "የፈተና ዝግጅት"), title: t("Grade 12 national exam prep", "የ12ኛ ክፍል ብሔራዊ ፈተና ዝግጅት"), meta: [t("4 months", "4 ወር"), t("Weekends", "ቅዳሜና እሑድ"), t("Next class 12 January", "ቀጣይ ክፍል ጥር 4")], price: birr(2500), priceNote: month, action: register },
  { image: P.english, badge: t("Languages", "ቋንቋ"), title: t("IELTS and English", "አይኤልቲኤስና እንግሊዝኛ"), meta: [t("8 weeks", "8 ሳምንት"), t("Evenings", "ምሽት"), t("Next class 5 January", "ቀጣይ ክፍል ታኅሣሥ 27")], price: birr(6000), priceNote: t("whole course", "ለሙሉ ኮርሱ"), action: register },
  { image: P.computers, badge: t("Computers", "ኮምፒውተር"), title: t("Computer basics and Excel", "የኮምፒውተር መሠረታዊና ኤክሴል"), meta: [t("6 weeks", "6 ሳምንት"), t("Mornings or evenings", "ጠዋት ወይም ምሽት"), t("Certificate", "ሰርተፊኬት")], price: birr(4500), priceNote: t("whole course", "ለሙሉ ኮርሱ"), action: register },
  { image: P.driving, badge: t("Driving", "መንጃ"), title: t("Driving lessons, automatic", "የማሽከርከር ትምህርት፣ አውቶማቲክ"), meta: [t("20 lessons", "20 ትምህርቶች"), t("Theory and road", "ቲዎሪና መንገድ")], price: birr(9000), priceNote: t("whole course", "ለሙሉ ኮርሱ"), action: register },
];

const timetable = {
  type: "schedule",
  id: "week",
  layout: "week",
  eyebrow: t("This term", "በዚህ ተርም"),
  heading: t("Weekly timetable", "ሳምንታዊ የጊዜ ሰሌዳ"),
  items: [
    { day: t("Monday", "ሰኞ"), time: t("5:30 pm", "11:30"), title: t("IELTS, room 2", "አይኤልቲኤስ፣ ክፍል 2") },
    { day: t("Monday", "ሰኞ"), time: t("7:00 pm", "1:00"), title: t("Excel, lab", "ኤክሴል፣ ላብ") },
    { day: t("Wednesday", "ረቡዕ"), time: t("5:30 pm", "11:30"), title: t("IELTS, room 2", "አይኤልቲኤስ፣ ክፍል 2") },
    { day: t("Wednesday", "ረቡዕ"), time: t("7:00 pm", "1:00"), title: t("Computer basics, lab", "የኮምፒውተር መሠረታዊ፣ ላብ") },
    { day: t("Saturday", "ቅዳሜ"), time: t("8:30 am", "2:30"), title: t("Maths, grade 12", "ሂሳብ፣ 12ኛ ክፍል"), note: t("Mock exam", "የሙከራ ፈተና") },
    { day: t("Saturday", "ቅዳሜ"), time: t("11:00 am", "5:00"), title: t("Physics, grade 12", "ፊዚክስ፣ 12ኛ ክፍል") },
    { day: t("Sunday", "እሑድ"), time: t("8:30 am", "2:30"), title: t("English, grade 12", "እንግሊዝኛ፣ 12ኛ ክፍል") },
    { day: t("Sunday", "እሑድ"), time: t("11:00 am", "5:00"), title: t("Biology, grade 12", "ባዮሎጂ፣ 12ኛ ክፍል") },
  ],
  footnote: t("Amharic times use the Ethiopian clock.", "ሰዓቶቹ በኢትዮጵያ አቆጣጠር ናቸው።"),
};

const registerForm = {
  type: "form",
  id: "register",
  kind: "registration",
  heading: t("Register for a course", "ለኮርስ ይመዝገቡ"),
  intro: t("Pick a course. We call to confirm your place and how to pay the first month.", "ኮርስ ይምረጡ። ቦታዎን ለማረጋገጥና የመጀመሪያውን ወር ክፍያ ለመንገር እንደውላለን።"),
  fields: [
    { name: "name", label: t("Student's name", "የተማሪው ስም"), type: "text", required: true },
    { name: "phone", label: t("Phone", "ስልክ"), type: "tel", required: true },
    { name: "course", label: t("Course", "ኮርስ"), type: "select", required: true, options: [t("Grade 12 exam prep", "የ12ኛ ክፍል ፈተና ዝግጅት"), t("IELTS and English", "አይኤልቲኤስና እንግሊዝኛ"), t("Computer basics and Excel", "የኮምፒውተር መሠረታዊና ኤክሴል"), t("Driving lessons", "የማሽከርከር ትምህርት")] },
    { name: "time", label: t("Mornings, evenings or weekends?", "ጠዋት፣ ምሽት ወይስ ቅዳሜና እሑድ?"), type: "select", options: [t("Mornings", "ጠዋት"), t("Evenings", "ምሽት"), t("Weekends", "ቅዳሜና እሑድ")] },
  ],
  submitLabel: t("Register", "ይመዝገቡ"),
  successMessage: t("Thank you. We will call you to confirm your place.", "እናመሰግናለን። ቦታዎን ለማረጋገጥ እንደውልልዎታለን።"),
};

save("training", {
  name: t("Lucy Academy", "ሉሲ አካዳሚ"),
  tagline: t("Exam prep, English and computer courses in Megenagna, Addis Ababa", "የፈተና ዝግጅት፣ እንግሊዝኛና የኮምፒውተር ኮርሶች፣ መገናኛ፣ አዲስ አበባ"),
  languages: ["en", "am"],
  theme: { primary: "#2445C8", accent: "#16204A", background: "#FAF9F6", text: "#17172B", highlight: "#FFC83D", font: "grotesk", radius: "medium", style: "brutal" },
  business: {
    phone: "+251 911 000 000",
    telegram: "yourbusiness",
    address: t("Megenagna, above the bank, 2nd floor, Addis Ababa", "መገናኛ፣ ከባንኩ በላይ፣ 2ኛ ፎቅ፣ አዲስ አበባ"),
    hours: [
      { days: t("Monday to Friday", "ከሰኞ እስከ ዓርብ"), time: t("8:00 am to 8:30 pm", "ከጠዋቱ 2 እስከ ምሽቱ 2:30") },
      { days: t("Saturday and Sunday", "ቅዳሜና እሑድ"), time: t("8:00 am to 5:00 pm", "ከጠዋቱ 2 እስከ ቀኑ 11 ሰዓት") },
    ],
  },
  pages: [
    {
      path: "/",
      title: t("Home", "መነሻ"),
      nav: t("Home", "መነሻ"),
      description: t("Grade 12 exam prep, IELTS, computer and driving courses in Megenagna, Addis Ababa, with fees, next intakes and a weekly timetable.", "የ12ኛ ክፍል ፈተና ዝግጅት፣ አይኤልቲኤስ፣ የኮምፒውተርና የማሽከርከር ኮርሶች በመገናኛ፣ አዲስ አበባ፤ ክፍያ፣ ቀጣይ ቅበላና ሳምንታዊ የጊዜ ሰሌዳ።"),
      sections: [
        {
          type: "hero",
          variant: "split",
          id: "top",
          eyebrow: t("Megenagna · Addis Ababa", "መገናኛ · አዲስ አበባ"),
          heading: t("Pass your exam with confidence", "ፈተናዎን በልበ ሙሉነት ይለፉ"),
          subheading: t("Small classes, weekly mock exams and teachers who know the national exam.", "አነስተኛ ክፍሎች፣ ሳምንታዊ የሙከራ ፈተናዎችና ብሔራዊ ፈተናውን የሚያውቁ መምህራን።"),
          image: P.board,
          stamp: t("Next class 5 January · ", "ቀጣይ ክፍል ታኅሣሥ 27 · "),
          primaryAction: register,
          secondaryAction: courses,
          hours: false,
        },
        {
          type: "stats",
          id: "results",
          tone: "dark",
          items: [
            { value: t("87%", "87%"), label: t("passed the national exam last year", "ባለፈው ዓመት ብሔራዊ ፈተናውን ያለፉ") },
            { value: t("1,200+", "1,200+"), label: t("students since 2016", "ከ2008 ጀምሮ ተማሪዎች") },
            { value: t("20", "20"), label: t("students per class at most", "በአንድ ክፍል ቢበዛ ተማሪዎች") },
          ],
        },
        {
          type: "cards",
          id: "courses",
          layout: "grid",
          eyebrow: t("Courses", "ኮርሶች"),
          heading: t("Pick your course", "ኮርስዎን ይምረጡ"),
          intro: t("Fees in Birr, paid by the month or for the whole course.", "ክፍያ በብር፣ በወር ወይም ለሙሉ ኮርሱ።"),
          items: courseCards,
        },
        {
          type: "steps",
          id: "route",
          eyebrow: t("Your route", "መንገድዎ"),
          heading: t("From the first class to the certificate", "ከመጀመሪያው ክፍል እስከ ሰርተፊኬቱ"),
          items: [
            { title: t("Placement test", "የደረጃ መለኪያ ፈተና"), description: t("Free, 30 minutes, so you start at the right level.", "በነጻ፣ 30 ደቂቃ፣ ከትክክለኛው ደረጃ እንዲጀምሩ።") },
            { title: t("Classes", "ክፍሎች"), description: t("With homework checked every week.", "የቤት ሥራ በየሳምንቱ እየታየ።") },
            { title: t("Mock exams", "የሙከራ ፈተናዎች"), description: t("Under real exam conditions, with marks.", "በእውነተኛ የፈተና ሁኔታ፣ ከውጤት ጋር።") },
            { title: t("Exam and certificate", "ፈተናና ሰርተፊኬት"), description: t("A certificate for every course you finish.", "ለጨረሱት እያንዳንዱ ኮርስ ሰርተፊኬት።") },
          ],
          action: register,
        },
        timetable,
        {
          type: "about",
          id: "teachers",
          eyebrow: t("Our teachers", "መምህራኖቻችን"),
          heading: t("Teachers who know the exam", "ፈተናውን የሚያውቁ መምህራን"),
          body: t("Our teachers have prepared students for the national exam for years. They know which questions come back, and they make time for the student who is stuck.", "መምህራኖቻችን ለዓመታት ተማሪዎችን ለብሔራዊ ፈተና አዘጋጅተዋል። የትኞቹ ጥያቄዎች እንደሚደጋገሙ ያውቃሉ፤ ለተቸገረ ተማሪም ጊዜ ይሰጣሉ።"),
          image: P.helping,
          points: [t("Accredited by the city education bureau: [your licence number]", "በከተማው ትምህርት ቢሮ ዕውቅና ያለው፦ [የፈቃድ ቁጥርዎ]"), t("Parents get a report every month", "ወላጆች በየወሩ ሪፖርት ያገኛሉ")],
        },
        {
          type: "testimonials",
          id: "words",
          eyebrow: t("Students say", "ተማሪዎች ምን ይላሉ"),
          heading: t("They passed", "አልፈዋል"),
          items: [
            { quote: t("The Saturday mock exams made the real one feel easy.", "የቅዳሜው የሙከራ ፈተናዎች እውነተኛውን ቀላል አደረጉት።"), name: "Meklit A.", role: t("Grade 12, 2025", "12ኛ ክፍል፣ 2017") },
            { quote: t("I got 7.5 in IELTS after eight weeks of evening classes.", "ከስምንት ሳምንት የምሽት ትምህርት በኋላ በአይኤልቲኤስ 7.5 አገኘሁ።"), name: "Henok T.", role: t("IELTS", "አይኤልቲኤስ") },
          ],
        },
        registerForm,
        {
          type: "faq",
          id: "questions",
          heading: t("Questions from parents", "የወላጆች ጥያቄዎች"),
          items: [
            { question: t("Can we pay by the month?", "በወር መክፈል እንችላለን?"), answer: t("Yes. Exam prep is paid monthly; short courses at the start.", "አዎ። የፈተና ዝግጅት በወር ይከፈላል፤ አጫጭር ኮርሶች ሲጀምሩ።") },
            { question: t("What if my child misses a class?", "ልጄ ክፍል ቢያመልጠውስ?"), answer: t("They can join the same lesson in another group that week.", "በዚያው ሳምንት ተመሳሳዩን ትምህርት በሌላ ቡድን መከታተል ይችላል።") },
          ],
        },
      ],
    },
    {
      path: "/courses",
      title: t("Courses", "ኮርሶች"),
      nav: t("Courses", "ኮርሶች"),
      description: t("All courses at Lucy Academy with fees in Birr and next intakes.", "በሉሲ አካዳሚ ያሉ ሁሉም ኮርሶች ከክፍያና ከቀጣይ ቅበላ ጋር።"),
      sections: [
        { type: "cards", id: "all", layout: "grid", eyebrow: t("Courses", "ኮርሶች"), heading: t("All courses", "ሁሉም ኮርሶች"), items: courseCards },
        { type: "gallery", id: "rooms", layout: "mosaic", heading: t("Our classrooms", "ክፍሎቻችን"), images: [P.uniform, P.library, P.discussion, P.graduate] },
      ],
    },
    {
      path: "/timetable",
      title: t("Timetable", "የጊዜ ሰሌዳ"),
      nav: t("Timetable", "የጊዜ ሰሌዳ"),
      description: t("The weekly timetable of Lucy Academy this term.", "የሉሲ አካዳሚ የዚህ ተርም ሳምንታዊ የጊዜ ሰሌዳ።"),
      sections: [{ ...timetable, id: "week-all" }],
    },
    {
      path: "/register",
      title: t("Register", "ምዝገባ"),
      nav: t("Register", "ምዝገባ"),
      description: t("Register for a course at Lucy Academy in Megenagna.", "በመገናኛ በሉሲ አካዳሚ ለኮርስ ይመዝገቡ።"),
      sections: [{ ...registerForm, id: "register-page" }, { type: "map", id: "map", heading: t("Find us in Megenagna", "በመገናኛ ያግኙን"), query: "Megenagna, Addis Ababa" }],
    },
  ],
});
