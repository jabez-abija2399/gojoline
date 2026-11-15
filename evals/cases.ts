/**
 * Agent eval set: 30 first-generation prompts (15 English, 15 Amharic) across the
 * Phase 1 industries, 10 of them followed by a chat edit. Checks are objective facts the
 * site must contain; Amharic quality is reviewed by a person from the saved outputs.
 */
export interface EvalCase {
  id: string;
  lang: "en" | "am";
  industry: string;
  prompt: string;
  /** Strings (or regex sources) src/site.ts must contain after the first generation. */
  mustContain: string[];
  /** Expected site.languages, if the prompt asks for specific ones. */
  languages?: ("en" | "am")[];
  edit?: { prompt: string; mustContain: string[] };
}

export const cases: EvalCase[] = [
  { id: "en-cafe", lang: "en", industry: "cafe", prompt: "Make a website for Selam Coffee in Piassa. We serve traditional buna, macchiato and pastries. Phone 0911 223 344. Open every day 7am to 8pm.", mustContain: ["Selam Coffee", "911\\D?223\\D?344"], edit: { prompt: "Add a menu with macchiato for 45 birr and buna for 30 birr.", mustContain: ["4500", "3000"] } },
  { id: "en-restaurant", lang: "en", industry: "restaurant", prompt: "Habesha Kitchen is a family restaurant in Bole serving kitfo, tibs and vegetarian beyaynetu on fasting days. Call 0922 100 200. Make the site in English and Amharic.", mustContain: ["Habesha Kitchen", "922\\D?100\\D?200"], languages: ["en", "am"] },
  { id: "en-hotel", lang: "en", industry: "hotel", prompt: "Lake View Lodge in Bahir Dar has 12 rooms facing Lake Tana, breakfast included, and boat trips to the monasteries. Double room 2500 birr per night. Email info@lakeviewlodge.et", mustContain: ["Lake View Lodge", "250000", "info@lakeviewlodge\\.et"], edit: { prompt: "Change the main colour to a deep blue.", mustContain: ["#"] } },
  { id: "en-clinic", lang: "en", industry: "clinic", prompt: "Tena Family Clinic in Hawassa offers general consultations, child vaccinations and lab tests. Open Mon-Sat 8:30 to 5:30. Phone 0462 123 456.", mustContain: ["Tena Family Clinic", "462\\D?123\\D?456"] },
  { id: "en-school", lang: "en", industry: "school", prompt: "Bright Future Academy is a KG to grade 8 private school in Adama. Registration for the new year is open in July and August. Call 0221 555 777.", mustContain: ["Bright Future Academy", "221\\D?555\\D?777"], edit: { prompt: "Add a section about our school bus service for all of Adama.", mustContain: ["bus"] } },
  { id: "en-shop", lang: "en", industry: "shop", prompt: "Meron Fashion sells habesha kemis, netela and modern dresses in Merkato. Telegram @meronfashion. We also deliver in Addis.", mustContain: ["Meron Fashion", "meronfashion"] },
  { id: "en-church", lang: "en", industry: "church", prompt: "Website for Debre Selam Kidist Mariam Church in Gondar. Sunday liturgy starts at 6am. We run Sunday school for children and a choir.", mustContain: ["Debre Selam"] },
  { id: "en-events", lang: "en", industry: "events", prompt: "Addis Jazz Nights is a monthly live jazz evening at the Hilton every last Friday. Tickets 500 birr. Contact 0930 404 040.", mustContain: ["Addis Jazz Nights", "50000", "930\\D?404\\D?040"], edit: { prompt: "Make the ticket price 600 birr.", mustContain: ["60000"] } },
  { id: "en-ngo", lang: "en", industry: "ngo", prompt: "Hope for Girls is an NGO in Mekelle that pays school fees and gives mentoring to 300 girls each year. We welcome volunteers and donors. Email hello@hopeforgirls.org", mustContain: ["Hope for Girls", "hello@hopeforgirls\\.org"] },
  { id: "en-realestate", lang: "en", industry: "real estate", prompt: "Sky Homes rents and sells apartments in CMC and Ayat. 2-bedroom apartments from 35,000 birr a month. Call 0944 700 800.", mustContain: ["Sky Homes", "944\\D?700\\D?800"] },
  { id: "en-tour", lang: "en", industry: "tour operator", prompt: "Simien Trek Tours runs 3 to 7 day hiking trips in the Simien Mountains with local guides and mule support. WhatsApp +251 918 333 222.", mustContain: ["Simien Trek Tours", "918\\D?333\\D?222"], edit: { prompt: "Add the Danakil Depression 4-day tour too.", mustContain: ["Danakil"] } },
  { id: "en-salon", lang: "en", industry: "salon", prompt: "Glow Beauty Salon in Sarbet: hair braiding, makeup for weddings and nails. Booking by phone 0913 456 789.", mustContain: ["Glow Beauty", "913\\D?456\\D?789"] },
  { id: "en-garage", lang: "en", industry: "garage", prompt: "Kality Auto Service: engine repair, oil change and tyre fitting for all cars. Open Monday to Saturday. 0911 000 111.", mustContain: ["Kality Auto", "911\\D?000\\D?111"] },
  { id: "en-bakery", lang: "en", industry: "bakery", prompt: "Sweet Bites Bakery bakes birthday cakes to order, bread and cookies in Gerji. Orders need 2 days notice. Telegram @sweetbitesaddis", mustContain: ["Sweet Bites", "sweetbitesaddis"] },
  { id: "en-vague", lang: "en", industry: "unknown", prompt: "I need a website", mustContain: [] },

  { id: "am-cafe", lang: "am", industry: "cafe", prompt: "ሰላም! ጀበና ካፌ እባላለሁ፣ ካዛንቺስ ነን። ባህላዊ ቡና፣ ሻይ እና ቁርስ እናቀርባለን። ስልክ 0911 765 432። ድረ-ገጹ በአማርኛ ይሁን።", mustContain: ["ጀበና", "911\\D?765\\D?432"], edit: { prompt: "የቡና ዋጋ 35 ብር እና የሻይ ዋጋ 20 ብር ጨምር።", mustContain: ["3500", "2000"] } },
  { id: "am-restaurant", lang: "am", industry: "restaurant", prompt: "የእማማ ምግብ ቤት በመርካቶ። ዶሮ ወጥ፣ ሽሮ እና ክትፎ እንሠራለን። በአማርኛ እና በእንግሊዝኛ ይሁን። ስልክ 0921 111 222።", mustContain: ["921\\D?111\\D?222"], languages: ["am", "en"] },
  { id: "am-hotel", lang: "am", industry: "hotel", prompt: "ላሊበላ ኢንን ሆቴል በላሊበላ ውቅር አብያተ ክርስቲያናት አጠገብ ነው። 20 ክፍሎች፣ ቁርስ ይካተታል። ኢሜይል booking@lalibelainn.et", mustContain: ["booking@lalibelainn\\.et"], edit: { prompt: "የክፍል ዋጋ በአዳር 3000 ብር መሆኑን ጨምር።", mustContain: ["300000"] } },
  { id: "am-clinic", lang: "am", industry: "clinic", prompt: "ሕይወት የጥርስ ክሊኒክ ጎተራ አካባቢ ይገኛል። የጥርስ ምርመራ፣ ማጽዳት እና ማስተካከያ እንሰጣለን። ከሰኞ እስከ ቅዳሜ ክፍት ነን። 0911 987 654።", mustContain: ["911\\D?987\\D?654"] },
  { id: "am-school", lang: "am", industry: "school", prompt: "ብርሃን ትምህርት ቤት በደሴ ከመዋዕለ ሕፃናት እስከ 6ኛ ክፍል ያስተምራል። ምዝገባ ተጀምሯል። ስልክ 0331 112 233።", mustContain: ["331\\D?112\\D?233"] },
  { id: "am-shop", lang: "am", industry: "shop", prompt: "አበባ የኤሌክትሮኒክስ ሱቅ ስልኮችን፣ ላፕቶፖችን እና መለዋወጫዎችን ይሸጣል። ፒያሳ እንገኛለን። ቴሌግራም @ababaelectronics", mustContain: ["ababaelectronics"], edit: { prompt: "ዋናውን ቀለም ወደ አረንጓዴ ቀይር።", mustContain: ["#"] } },
  { id: "am-mosque", lang: "am", industry: "mosque", prompt: "የአንዋር መስጊድ ማህበረሰብ ድረ-ገጽ ያስፈልገናል። የጁምዓ ሶላት፣ የቁርአን ትምህርት ለልጆች እና የበጎ አድራጎት ሥራዎች አሉን።", mustContain: [] },
  { id: "am-events", lang: "am", industry: "events", prompt: "የሠርግ እና የልደት ዝግጅቶችን እናዘጋጃለን። ስማችን ደስታ ኢቨንትስ ነው። የአዳራሽ ማስጌጫ፣ ፎቶ እና ምግብ እናቀርባለን። 0912 222 333።", mustContain: ["912\\D?222\\D?333"] },
  { id: "am-ngo", lang: "am", industry: "ngo", prompt: "ተስፋ ለሕፃናት በጅማ ወላጅ ለሌላቸው ሕፃናት ምግብ፣ ትምህርት እና ጤና እንክብካቤ የሚሰጥ ድርጅት ነው። በጎ ፈቃደኞችን እንቀበላለን።", mustContain: [] , edit: { prompt: "ኢሜይላችን info@tesfa.org ነው፣ ጨምረው።", mustContain: ["info@tesfa\\.org"] } },
  { id: "am-realestate", lang: "am", industry: "real estate", prompt: "ገነት ሪል እስቴት በለቡ እና በጀሞ አፓርትመንቶችን ያከራያል እና ይሸጣል። ስልክ 0915 678 901።", mustContain: ["915\\D?678\\D?901"] },
  { id: "am-tour", lang: "am", industry: "tour operator", prompt: "ኢትዮ ጉዞ አስጎብኚ ወደ ላሊበላ፣ አክሱም እና ጎንደር ጉዞዎችን ያዘጋጃል። ድረ-ገጹ በእንግሊዝኛ እና በአማርኛ ይሁን። +251 911 246 810", mustContain: ["911\\D?246\\D?810"], languages: ["en", "am"] },
  { id: "am-salon", lang: "am", industry: "salon", prompt: "ውብ የፀጉር ቤት በአያት። የሴቶች እና የወንዶች ፀጉር ሥራ። 0910 123 123 ደውሉ።", mustContain: ["910\\D?123\\D?123"], edit: { prompt: "የሥራ ሰዓት ከጠዋቱ 2 እስከ ምሽቱ 2 ሰዓት መሆኑን ጨምር።", mustContain: ["hours"] } },
  { id: "am-tailor", lang: "am", industry: "tailor", prompt: "ጥበብ የልብስ ስፌት ቤት የሀበሻ ቀሚስ እና ሱፍ በትዕዛዝ ይሰፋል። ሽሮ ሜዳ እንገኛለን።", mustContain: [] },
  { id: "am-pharmacy", lang: "am", industry: "pharmacy", prompt: "ፈውስ ፋርማሲ ለ24 ሰዓት ክፍት ነው። ሳሪስ አቦ አካባቢ። ስልክ 0114 400 500።", mustContain: ["114\\D?400\\D?500"] },
  { id: "am-vague", lang: "am", industry: "unknown", prompt: "ድረ-ገጽ እፈልጋለሁ", mustContain: [] },
];
