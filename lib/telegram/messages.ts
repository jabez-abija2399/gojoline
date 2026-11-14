/** Bot replies in the owner's language. Plain words, no jargon. */
export const botText = {
  en: {
    welcome: "Hello! I'm the Gojoline bot. To connect, open your Gojoline dashboard and press “Connect Telegram”.",
    linked: "Connected! You'll get your site's form answers here. You can also send me changes, like “make the macchiato 60 birr”, or a photo.",
    badCode: "That link has expired. Please press “Connect Telegram” in your dashboard again.",
    stopped: "Disconnected. You won't get messages here any more.",
    otherAccount: "This chat is already connected to a Gojoline account. Send /stop first if you want to connect a different one.",
    planEdits: "Changing your site from Telegram is part of the Business plan. You can upgrade in Gojoline under Plan and payments.",
    notLinked: "This chat isn't connected yet. Open your Gojoline dashboard and press “Connect Telegram”.",
    noSites: "You don't have a site yet. Create one at gojoline.com first.",
    pickSite: "Which site should I change? Reply with its number:",
    siteChosen: "OK, I'll change “{name}”.",
    working: "Working on it...",
    done: "Done: {reply}",
    doneLive: "Done and live on your site: {reply}",
    failed: "I couldn't make that change, so your site is unchanged. Please try saying it another way.",
    busy: "I'm still working on your last change. Please wait a moment.",
    tooMany: "You've sent many changes. Please wait a little.",
    photoSaved: "Photo saved as {name}. Tell me where to use it, for example “put my new photo at the top”.",
    photoBad: "I couldn't use that photo. Please send a JPEG or PNG photo under 8 MB.",
    newAnswer: "New {kind} on {site}",
    help: "Send me a change in your own words, or a photo. Commands: /sites to choose a site, /stop to disconnect.",
  },
  am: {
    welcome: "ሰላም! እኔ የጎጆላይን ቦት ነኝ። ለማገናኘት የጎጆላይን ዳሽቦርድዎን ከፍተው «ቴሌግራም ያገናኙ»ን ይጫኑ።",
    linked: "ተገናኝቷል! የድረ-ገጽዎ ቅጽ መልሶች እዚህ ይደርሱዎታል። እንዲሁም ለውጦችን ሊልኩልኝ ይችላሉ፤ ለምሳሌ «ማኪያቶ 60 ብር አድርገው» ወይም ፎቶ።",
    badCode: "ይህ ሊንክ ጊዜው አልፏል። እባክዎ በዳሽቦርድዎ «ቴሌግራም ያገናኙ»ን እንደገና ይጫኑ።",
    otherAccount: "ይህ ውይይት አስቀድሞ ከአንድ የጎጆላይን መለያ ጋር ተገናኝቷል። ሌላ ማገናኘት ከፈለጉ መጀመሪያ /stop ይላኩ።",
    planEdits: "ድረ-ገጽዎን ከቴሌግራም መቀየር የቢዝነስ ዕቅድ አካል ነው። በጎጆላይን «ዕቅድ እና ክፍያ» ውስጥ ማሻሻል ይችላሉ።",
    stopped: "ተቋርጧል። ከዚህ በኋላ እዚህ መልዕክት አይደርስዎትም።",
    notLinked: "ይህ ውይይት ገና አልተገናኘም። የጎጆላይን ዳሽቦርድዎን ከፍተው «ቴሌግራም ያገናኙ»ን ይጫኑ።",
    noSites: "እስካሁን ድረ-ገጽ የለዎትም። መጀመሪያ በ gojoline.com አንድ ይፍጠሩ።",
    pickSite: "የትኛውን ድረ-ገጽ ልቀይር? ቁጥሩን ይመልሱ፦",
    siteChosen: "እሺ፣ «{name}»ን እቀይራለሁ።",
    working: "እየሠራሁበት ነው...",
    done: "ተጠናቋል፦ {reply}",
    doneLive: "ተጠናቋል፤ በድረ-ገጽዎ ላይም ወጥቷል፦ {reply}",
    failed: "ይህን ለውጥ ማድረግ አልቻልኩም፤ ድረ-ገጽዎ አልተቀየረም። እባክዎ በሌላ መንገድ ይግለጹት።",
    busy: "የቀደመውን ለውጥዎን እየሠራሁ ነው። እባክዎ ትንሽ ይጠብቁ።",
    tooMany: "ብዙ ለውጦች ልከዋል። እባክዎ ትንሽ ይጠብቁ።",
    photoSaved: "ፎቶው እንደ {name} ተቀምጧል። የት እንደምጠቀምበት ይንገሩኝ፤ ለምሳሌ «አዲሱን ፎቶዬን ከላይ አድርገው»።",
    photoBad: "ይህን ፎቶ መጠቀም አልቻልኩም። እባክዎ ከ8 ሜጋባይት በታች የሆነ JPEG ወይም PNG ፎቶ ይላኩ።",
    newAnswer: "አዲስ {kind} ከ{site}",
    help: "ለውጥ በራስዎ ቃላት ወይም ፎቶ ይላኩልኝ። ትዕዛዞች፦ /sites ድረ-ገጽ ለመምረጥ፣ /stop ለማቋረጥ።",
  },
} as const;

export const kindNames = {
  en: { contact: "message", booking: "booking", order: "order", registration: "registration" },
  am: { contact: "መልዕክት", booking: "ቀጠሮ", order: "ትዕዛዝ", registration: "ምዝገባ" },
} as const;

export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
}
