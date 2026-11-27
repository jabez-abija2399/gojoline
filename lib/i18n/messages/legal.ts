/**
 * Privacy policy and terms. Drafts written from what the product actually does; they must be
 * reviewed by a lawyer before launch (docs/ROADMAP.md, Blocked). Keep both languages in step.
 */
export interface LegalDoc {
  title: string;
  updated: string;
  draftNote: string;
  sections: { heading: string; body: string[] }[];
}

const UPDATED_EN = "Last updated: 25 November 2026";
const UPDATED_AM = "መጨረሻ የተሻሻለው፦ ኅዳር 16 ቀን 2019 ዓ.ም. (25 November 2026)";

export const legal: Record<"en" | "am", { privacy: LegalDoc; terms: LegalDoc }> = {
  en: {
    privacy: {
      title: "Privacy policy",
      updated: UPDATED_EN,
      draftNote: "This is a draft for our private beta and is being reviewed by a lawyer.",
      sections: [
        {
          heading: "What we collect",
          body: [
            "Your account: your phone number or email address, and your name if you give it.",
            "Your sites: what you tell the builder, the text and photos of your sites, and their versions.",
            "Answers to your sites' forms: what visitors send through your contact, booking, order and registration forms. You decide what your forms ask for.",
            "Payments: the plan you chose, the transaction number and the receipt photo you send.",
            "Telegram: if you connect it, your Telegram chat ID and username.",
            "Technical data: your network address is used to stop abuse (rate limits). For abuse reports we keep only a scrambled (hashed) form of the network, not the address itself.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "To build, publish and host your sites, deliver your form answers to you, and send sign-in codes.",
            "To check payments and run your plan.",
            "To keep Gojoline safe: checking sites for scams and harmful content, and handling reports.",
            "We do not sell your data and we do not show ads.",
          ],
        },
        {
          heading: "Who helps us",
          body: [
            "We use trusted services to run Gojoline: Anthropic (the AI that writes your site; it doesn't train on your content), Vercel (hosting), Neon (database, in Frankfurt, Germany), Upstash (rate limits), Sentry (error reports, without your personal details) and Telegram (only if you connect it).",
            "Your data may be processed outside Ethiopia by these services.",
          ],
        },
        {
          heading: "Your sites' visitors",
          body: [
            "You are responsible for what your forms collect and for using visitors' answers fairly. Only ask for what you need, and never for passwords, PINs or card numbers (Gojoline blocks such forms).",
          ],
        },
        {
          heading: "How long we keep it",
          body: [
            "We keep your account and sites while your account is open. Payment records are kept as long as the law requires. You can ask us to delete your account and its data.",
          ],
        },
        {
          heading: "Gojoline's own social media accounts",
          body: [
            "Our team connects Gojoline's own accounts (Telegram, Instagram and TikTok) in our private admin area, only to publish Gojoline's own posts and videos to those accounts.",
            "For TikTok we use TikTok's Login Kit and Content Posting API: we read our account's display name, username and profile picture to show who we post as, and we upload our own videos with the audience and settings we choose before each post. We don't read, collect or store data about other TikTok users or our viewers.",
            "The sign-in tokens these services give us are stored encrypted on our server, used only for this, and deleted when we disconnect the account.",
          ],
        },
        {
          heading: "Your choices",
          body: [
            "You can see and change your sites and answers in your dashboard, disconnect Telegram at any time, and ask us for a copy of your data or to delete it.",
          ],
        },
        {
          heading: "Contact",
          body: ["Questions about privacy: message us on Telegram at @gojoline_bot."],
        },
      ],
    },
    terms: {
      title: "Terms of use",
      updated: UPDATED_EN,
      draftNote: "This is a draft for our private beta and is being reviewed by a lawyer.",
      sections: [
        {
          heading: "Using Gojoline",
          body: [
            "Gojoline helps you make and publish websites by chatting. You need a verified phone number or email to publish.",
            "You are responsible for your account, your sites and what they say. Check what the AI writes before you publish: it can make mistakes.",
          ],
        },
        {
          heading: "What is not allowed",
          body: [
            "Sites that try to get passwords, PINs, card details or money by deceiving people.",
            "Scams, fake offers, pyramid schemes and fake prizes.",
            "Pretending to be a bank, telecom, government office, company or person you are not.",
            "Sexual content, and selling drugs, weapons, counterfeit money or fake documents.",
            "Threats, violence or hate against any group.",
            "Using other people's photos, names or work without permission.",
          ],
        },
        {
          heading: "Checks and takedowns",
          body: [
            "We check sites before they are published and review reports from the public. We may refuse to publish, or take down, a site that breaks these rules. If your site is taken down, contact us to find out why.",
          ],
        },
        {
          heading: "Plans and payments",
          body: [
            "Prices are in Ethiopian Birr. Paid plans start when we have confirmed your payment. Changes (AI edits) are counted each month; unused changes carry over for up to two months.",
            "If a change fails because of a problem on our side, the change is usually given back.",
          ],
        },
        {
          heading: "Your content",
          body: [
            "Your sites and their content belong to you. You allow us to store, show and host them so Gojoline can work.",
            "Free sites show a small “Made with Gojoline” badge.",
          ],
        },
        {
          heading: "Changes and ending",
          body: [
            "Gojoline is in beta: features may change. We will tell you about important changes to these terms. You can stop using Gojoline at any time.",
          ],
        },
        {
          heading: "Contact",
          body: ["Questions: message us on Telegram at @gojoline_bot. To report a site, use the “Report this site” link at the bottom of any Gojoline site."],
        },
      ],
    },
  },
  am: {
    privacy: {
      title: "የግላዊነት ፖሊሲ",
      updated: UPDATED_AM,
      draftNote: "ይህ ለሙከራ ጊዜያችን የተዘጋጀ ረቂቅ ነው፤ በሕግ ባለሙያ እየተገመገመ ነው።",
      sections: [
        {
          heading: "የምንሰበስበው መረጃ",
          body: [
            "መለያዎ፦ ስልክ ቁጥርዎ ወይም ኢሜይልዎ፣ ከሰጡን ስምዎ።",
            "ድረ-ገጾችዎ፦ ለገንቢው የሚነግሩት፣ የድረ-ገጾችዎ ጽሑፍ እና ፎቶዎች፣ እንዲሁም ስሪቶቻቸው።",
            "የድረ-ገጾችዎ ቅጾች መልሶች፦ ጎብኚዎች በመገናኛ፣ በቀጠሮ፣ በትዕዛዝ እና በምዝገባ ቅጾችዎ የሚልኩት። ቅጾችዎ ምን እንደሚጠይቁ እርስዎ ይወስናሉ።",
            "ክፍያዎች፦ የመረጡት ዕቅድ፣ የግብይት ቁጥሩ እና የሚልኩት የደረሰኝ ፎቶ።",
            "ቴሌግራም፦ ካገናኙት፣ የቴሌግራም ውይይት መለያዎ እና የተጠቃሚ ስምዎ።",
            "ቴክኒካዊ መረጃ፦ የኔትወርክ አድራሻዎ አላግባብ መጠቀምን ለመከላከል ይውላል። ለሪፖርቶች አድራሻው ወደማይመለስ ኮድ የተቀየረውን ቅጽ ብቻ እንይዛለን።",
          ],
        },
        {
          heading: "መረጃውን የምንጠቀምበት",
          body: [
            "ድረ-ገጾችዎን ለመሥራት፣ ለማተም እና ለማስተናገድ፣ የቅጽ መልሶችን ለእርስዎ ለማድረስ እና የመግቢያ ኮዶችን ለመላክ።",
            "ክፍያዎችን ለማረጋገጥ እና ዕቅድዎን ለማስኬድ።",
            "ጎጆላይንን ደኅንነቱ የተጠበቀ ለማድረግ፦ ድረ-ገጾችን ከማጭበርበር እና ጎጂ ይዘት ለመፈተሽ እና ሪፖርቶችን ለማስተናገድ።",
            "መረጃዎን አንሸጥም፤ ማስታወቂያም አናሳይም።",
          ],
        },
        {
          heading: "የሚረዱን አገልግሎቶች",
          body: [
            "ጎጆላይንን ለማስኬድ የታመኑ አገልግሎቶችን እንጠቀማለን፦ Anthropic (ድረ-ገጽዎን የሚጽፈው AI፤ በይዘትዎ አይሠለጥንም)፣ Vercel (ማስተናገጃ)፣ Neon (የመረጃ ቋት፣ በፍራንክፈርት፣ ጀርመን)፣ Upstash (የአጠቃቀም ገደቦች)፣ Sentry (የስህተት ሪፖርቶች፣ ያለ ግል መረጃዎ) እና ቴሌግራም (ካገናኙት ብቻ)።",
            "መረጃዎ በእነዚህ አገልግሎቶች ከኢትዮጵያ ውጭ ሊሠራበት ይችላል።",
          ],
        },
        {
          heading: "የድረ-ገጾችዎ ጎብኚዎች",
          body: [
            "ቅጾችዎ ለሚሰበስቡት መረጃ እና የጎብኚዎችን መልሶች በአግባቡ ለመጠቀም ኃላፊነቱ የእርስዎ ነው። የሚያስፈልግዎትን ብቻ ይጠይቁ፤ የይለፍ ቃል፣ ፒን ወይም የካርድ ቁጥር በፍጹም አይጠይቁ (ጎጆላይን እንደዚህ ያሉ ቅጾችን ያግዳል)።",
          ],
        },
        {
          heading: "መረጃውን ለምን ያህል ጊዜ እንይዛለን",
          body: [
            "መለያዎ ክፍት እስከሆነ ድረስ መለያዎን እና ድረ-ገጾችዎን እንይዛለን። የክፍያ መዝገቦች ሕጉ በሚጠይቀው ጊዜ ይቀመጣሉ። መለያዎ እና መረጃው እንዲሰረዝ መጠየቅ ይችላሉ።",
          ],
        },
        {
          heading: "የጎጆላይን የራሱ የማኅበራዊ ሚዲያ መለያዎች",
          body: [
            "ቡድናችን የጎጆላይንን የራሱን መለያዎች (ቴሌግራም፣ ኢንስታግራም እና ቲክቶክ) በግል የአስተዳዳሪ ክፍላችን ያገናኛል፤ ይህም የጎጆላይንን የራሱን ልጥፎችና ቪዲዮዎች ወደ እነዚያ መለያዎች ለመለጠፍ ብቻ ነው።",
            "ለቲክቶክ የቲክቶክን Login Kit እና Content Posting API እንጠቀማለን፦ በማን ስም እንደምንለጥፍ ለማሳየት የመለያችንን ስም፣ የተጠቃሚ ስም እና የመገለጫ ፎቶ እናነባለን፤ የራሳችንን ቪዲዮዎችም ከእያንዳንዱ ልጥፍ በፊት በምንመርጠው ተመልካችና ቅንብር እንጭናለን። ስለ ሌሎች የቲክቶክ ተጠቃሚዎች ወይም ስለ ተመልካቾቻችን መረጃ አናነብም፣ አንሰበስብም፣ አናስቀምጥም።",
            "እነዚህ አገልግሎቶች የሚሰጡን የመግቢያ ቶከኖች በሰርቨራችን ላይ ተመስጥረው ይቀመጣሉ፤ ለዚህ ብቻ ይውላሉ፤ መለያውን ስናላቅቅም ይሰረዛሉ።",
          ],
        },
        {
          heading: "ምርጫዎችዎ",
          body: [
            "ድረ-ገጾችዎን እና መልሶችን በዳሽቦርድዎ ማየት እና መቀየር፣ ቴሌግራምን በማንኛውም ጊዜ ማቋረጥ፣ የመረጃዎን ቅጂ ወይም እንዲሰረዝ መጠየቅ ይችላሉ።",
          ],
        },
        {
          heading: "ያግኙን",
          body: ["ስለ ግላዊነት ጥያቄ ካለዎት በቴሌግራም @gojoline_bot ላይ ይጻፉልን።"],
        },
      ],
    },
    terms: {
      title: "የአጠቃቀም ውሎች",
      updated: UPDATED_AM,
      draftNote: "ይህ ለሙከራ ጊዜያችን የተዘጋጀ ረቂቅ ነው፤ በሕግ ባለሙያ እየተገመገመ ነው።",
      sections: [
        {
          heading: "ጎጆላይንን መጠቀም",
          body: [
            "ጎጆላይን በውይይት ድረ-ገጾችን እንዲሠሩ እና እንዲያትሙ ይረዳዎታል። ለማተም የተረጋገጠ ስልክ ቁጥር ወይም ኢሜይል ያስፈልጋል።",
            "ለመለያዎ፣ ለድረ-ገጾችዎ እና በውስጣቸው ለሚገኘው ይዘት ኃላፊነቱ የእርስዎ ነው። AI ስህተት ሊሠራ ስለሚችል ከማተምዎ በፊት የጻፈውን ያረጋግጡ።",
          ],
        },
        {
          heading: "የማይፈቀዱ ነገሮች",
          body: [
            "ሰዎችን በማታለል የይለፍ ቃል፣ ፒን፣ የካርድ መረጃ ወይም ገንዘብ ለማግኘት የሚሞክሩ ድረ-ገጾች።",
            "ማጭበርበር፣ የውሸት ቅናሾች፣ የፒራሚድ ዘዴዎች እና የውሸት ሽልማቶች።",
            "ያልሆኑትን ባንክ፣ የቴሌኮም ድርጅት፣ የመንግሥት ቢሮ፣ ኩባንያ ወይም ሰው መስሎ መቅረብ።",
            "የወሲብ ይዘት፣ እንዲሁም አደንዛዥ ዕፅ፣ የጦር መሣሪያ፣ ሐሰተኛ ገንዘብ ወይም ሐሰተኛ ሰነዶችን መሸጥ።",
            "በማንኛውም ቡድን ላይ ዛቻ፣ ዓመፅ ወይም ጥላቻ።",
            "የሌሎችን ፎቶዎች፣ ስሞች ወይም ሥራዎች ያለፈቃድ መጠቀም።",
          ],
        },
        {
          heading: "ፍተሻ እና ማውረድ",
          body: [
            "ድረ-ገጾችን ከመታተማቸው በፊት እንፈትሻለን፤ ከሕዝብ የሚመጡ ሪፖርቶችንም እንመረምራለን። እነዚህን ደንቦች የሚጥስ ድረ-ገጽ ከማተም ልንከለክል ወይም ልናወርድ እንችላለን። ድረ-ገጽዎ ከወረደ ምክንያቱን ለማወቅ ያግኙን።",
          ],
        },
        {
          heading: "ዕቅዶች እና ክፍያዎች",
          body: [
            "ዋጋዎች በኢትዮጵያ ብር ናቸው። የሚከፈልባቸው ዕቅዶች ክፍያዎን ካረጋገጥን በኋላ ይጀምራሉ። ለውጦች (የAI ማስተካከያዎች) በየወሩ ይቆጠራሉ፤ ያልተጠቀሙባቸው ለውጦች እስከ ሁለት ወር ይተላለፋሉ።",
            "በእኛ በኩል በተፈጠረ ችግር ለውጥ ካልተሳካ፣ ብዙውን ጊዜ ለውጡ ይመለስልዎታል።",
          ],
        },
        {
          heading: "ይዘትዎ",
          body: [
            "ድረ-ገጾችዎ እና ይዘታቸው የእርስዎ ናቸው። ጎጆላይን እንዲሠራ እንድናከማቻቸው፣ እንድናሳያቸው እና እንድናስተናግዳቸው ይፈቅዱልናል።",
            "ነጻ ድረ-ገጾች ትንሽ «በጎጆላይን የተሠራ» ምልክት ያሳያሉ።",
          ],
        },
        {
          heading: "ለውጦች እና ማቋረጥ",
          body: [
            "ጎጆላይን በሙከራ ላይ ነው፤ አገልግሎቶቹ ሊቀየሩ ይችላሉ። በእነዚህ ውሎች ላይ ስለሚደረጉ አስፈላጊ ለውጦች እናሳውቅዎታለን። ጎጆላይንን መጠቀም በማንኛውም ጊዜ ማቆም ይችላሉ።",
          ],
        },
        {
          heading: "ያግኙን",
          body: ["ጥያቄ ካለዎት በቴሌግራም @gojoline_bot ላይ ይጻፉልን። ድረ-ገጽን ሪፖርት ለማድረግ በማንኛውም የጎጆላይን ድረ-ገጽ ግርጌ ያለውን «ይህን ድረ-ገጽ ሪፖርት ያድርጉ» ሊንክ ይጠቀሙ።"],
        },
      ],
    },
  },
};
