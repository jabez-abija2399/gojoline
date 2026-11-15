#!/usr/bin/env python3
"""One-off: gives the 12 starter sites the template's newer pieces.

Each home page gets a drawing in its hero and "about" (image.art), a short questions
section and a closing call-to-action band. Safe to run twice: it replaces what it added.
Run from the repository root:  python3 scripts/upgrade-presets.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "templates" / "site" / "presets"

def T(en, am):
    return {"en": en, "am": am}

# id: hero variant, hero art + alt, about art + alt, questions, call to action
DATA = {
    "cafe": dict(
        hero=("split", "coffee", T("A clay coffee pot and two small cups", "ጀበና እና ሁለት ሲኒዎች")),
        about=("food", T("A shared plate with injera and stews", "እንጀራ እና ወጥ ያለበት ማዕድ")),
        faq=(T("Good to know", "ማወቅ ያለብዎት"), [
            (T("Do I need to book a table?", "ጠረጴዛ አስቀድሞ መያዝ ያስፈልጋል?"), T("No, you can walk in. For groups or the full coffee ceremony, book ahead so we can prepare.", "አያስፈልግም፤ በቀጥታ መምጣት ይችላሉ። ለቡድን ወይም ለሙሉ የቡና ሥነ ሥርዓት ግን እንድንዘጋጅ አስቀድመው ይያዙ።")),
            (T("Do you serve fasting food?", "የጾም ምግብ አላችሁ?"), T("Ask us which fasting dishes we have today; we are glad to help you choose.", "ዛሬ የትኞቹ የጾም ምግቦች እንዳሉ ይጠይቁን፤ ለመምረጥ በደስታ እንረዳዎታለን።")),
            (T("Can I order to take away?", "ይዤ መሄድ እችላለሁ?"), T("Yes. Call us with your order and it will be ready when you arrive.", "አዎ። ደውለው ያዝዙ፤ ሲደርሱ ተዘጋጅቶ ይጠብቅዎታል።")),
        ]),
        cta=(T("Come for the coffee, stay for the ceremony", "ለቡና ይምጡ፤ ለሥነ ሥርዓቱ ይቆዩ"), T("Book a table or just walk in. We are open every day.", "ጠረጴዛ ያስይዙ ወይም በቀጥታ ይምጡ። በየቀኑ ክፍት ነን።"), (T("Book a table", "ጠረጴዛ ያስይዙ"), "#booking"), (T("See the menu", "ምናሌውን ይመልከቱ"), "/menu")),
    ),
    "clinic": dict(
        hero=("split", "clinic", T("A medical cross and a heartbeat line", "የሕክምና መስቀል እና የልብ ምት መስመር")),
        about=("people", T("A family standing together", "አብሮ የቆመ ቤተሰብ")),
        faq=(T("Before you visit", "ከመምጣትዎ በፊት"), [
            (T("Do I need an appointment?", "ቀጠሮ ያስፈልጋል?"), T("You can book with the form or call us, and we will tell you when to come.", "በቅጹ ቀጠሮ መያዝ ወይም መደወል ይችላሉ፤ መቼ እንደሚመጡ እንነግርዎታለን።")),
            (T("What should I bring?", "ምን ይዤ ልምጣ?"), T("Bring any earlier test results and the medicines you take now.", "ከዚህ በፊት ያደረጓቸውን የምርመራ ውጤቶች እና አሁን የሚወስዷቸውን መድኃኒቶች ይዘው ይምጡ።")),
            (T("Can I come with my child?", "ከልጄ ጋር መምጣት እችላለሁ?"), T("Yes. Tell us when you book so we can prepare.", "አዎ። እንድንዘጋጅ ቀጠሮ ሲይዙ ይንገሩን።")),
        ]),
        cta=(T("Feeling unwell? See a doctor today", "ሕመም ይሰማዎታል? ዛሬውኑ ሐኪም ይዩ"), T("Book a time that suits you, or call us and we will help.", "የሚመችዎትን ሰዓት ይያዙ፤ ወይም ይደውሉልን፤ እንረዳዎታለን።"), (T("Book an appointment", "ቀጠሮ ይያዙ"), "/appointments"), (T("Contact us", "ያግኙን"), "/contact")),
    ),
    "events": dict(
        hero=("centered", "event", T("A stage with flags and lights", "ባንዲራ እና መብራት ያለው መድረክ")),
        about=("people", T("Guests gathered at an event", "በዝግጅት ላይ የተሰበሰቡ እንግዶች")),
        faq=(T("Planning your day", "ዝግጅትዎን ሲያቅዱ"), [
            (T("How early should I book?", "ምን ያህል ቀደም ብዬ ልያዝ?"), T("As early as you can, so your date is still free.", "ቀንዎ ሳይያዝ በተቻለ መጠን ቀደም ብለው ይያዙ።")),
            (T("Can you work with my budget?", "በበጀቴ መሥራት ትችላላችሁ?"), T("Yes. Tell us your budget and guest number and we will suggest a package.", "አዎ። በጀትዎን እና የእንግዶችዎን ብዛት ይንገሩን፤ የሚስማማ ፓኬጅ እናቀርባለን።")),
            (T("Do you travel outside the city?", "ከከተማ ውጭ ትሠራላችሁ?"), T("Tell us the place and the date and we will let you know.", "ቦታውን እና ቀኑን ይንገሩን፤ እናሳውቅዎታለን።")),
        ]),
        cta=(T("Let's plan a day people remember", "የማይረሳ ቀን አብረን እናቅድ"), T("Tell us the date and the number of guests and we will get back to you.", "ቀኑን እና የእንግዶቹን ብዛት ይንገሩን፤ መልሰን እናገኝዎታለን።"), (T("Book your date", "ቀንዎን ያስይዙ"), "/book"), (T("See packages", "ፓኬጆችን ይመልከቱ"), "/packages")),
    ),
    "hotel": dict(
        hero=("split", "hotel", T("A lodge beside the water", "በውኃ ዳር ያለ ሎጅ")),
        about=("room", T("A made bed under a window", "በመስኮት ሥር የተነጠፈ አልጋ")),
        faq=(T("Before you arrive", "ከመምጣትዎ በፊት"), [
            (T("What time is check-in?", "መግቢያ ሰዓት መቼ ነው?"), T("Tell us your arrival time when you book and we will have your room ready.", "ክፍል ሲይዙ የሚደርሱበትን ሰዓት ይንገሩን፤ ክፍልዎን አዘጋጅተን እንጠብቅዎታለን።")),
            (T("How do I book a room?", "ክፍል እንዴት እይዛለሁ?"), T("Use the booking form or call us. We confirm your room by phone.", "የማስያዣ ቅጹን ይሙሉ ወይም ይደውሉልን። ክፍልዎን በስልክ እናረጋግጥልዎታለን።")),
            (T("Can you pick me up from the airport?", "ከአውሮፕላን ማረፊያ ትቀበሉኛላችሁ?"), T("Ask us when you book and send your flight time.", "ክፍል ሲይዙ ይጠይቁን፤ የበረራ ሰዓትዎንም ይላኩልን።")),
        ]),
        cta=(T("Your room by the lake is waiting", "በሐይቁ ዳር ያለው ክፍልዎ ይጠብቅዎታል"), T("Book directly with us and we confirm by phone.", "በቀጥታ ከእኛ ይያዙ፤ በስልክ እናረጋግጥልዎታለን።"), (T("Book a room", "ክፍል ያስይዙ"), "/rooms#booking"), (T("Contact us", "ያግኙን"), "/contact")),
    ),
    "mosque": dict(
        hero=("split", "mosque", T("A mosque with a dome and a minaret", "ጉልላት እና ሚናራ ያለው መስጊድ")),
        about=("people", T("People of the community together", "የማኅበረሰቡ አባላት በአንድነት")),
        faq=(T("Visiting us", "ሲጎበኙን"), [
            (T("I am new here. Who can I ask?", "አዲስ ነኝ። ማንን ልጠይቅ?"), T("You are welcome. Ask anyone at the mosque or write to us and we will help you.", "እንኳን ደህና መጡ። በመስጂዱ ያለን ማንኛውንም ሰው ይጠይቁ ወይም ይጻፉልን፤ እንረዳዎታለን።")),
            (T("Can children join the classes?", "ልጆች ትምህርቱን መከታተል ይችላሉ?"), T("Yes. Ask us about ages and times.", "አዎ። ስለ ዕድሜ እና ሰዓት ይጠይቁን።")),
            (T("How can I give?", "እንዴት መስጠት እችላለሁ?"), T("You can give at the mosque or ask us for the account details.", "በመስጂዱ መስጠት ወይም የሒሳብ ቁጥሩን ከእኛ መጠየቅ ይችላሉ።")),
        ]),
        cta=(T("Everyone is welcome", "ሁሉም እንኳን ደህና መጡ"), T("Join us for prayer, learning and community.", "ለሶላት፣ ለትምህርት እና ለማኅበረሰባዊ አንድነት ይቀላቀሉን።"), (T("Prayer times", "የሶላት ሰዓቶች"), "/prayer-times"), (T("Contact us", "ያግኙን"), "/contact")),
    ),
    "ngo": dict(
        hero=("split", "people", T("Three people standing together", "አብረው የቆሙ ሦስት ሰዎች")),
        about=("school", T("An open book and a pencil", "የተከፈተ መጽሐፍ እና እርሳስ")),
        faq=(T("How you can help", "እንዴት መርዳት ይችላሉ"), [
            (T("Do I need experience to volunteer?", "በጎ ፈቃደኛ ለመሆን ልምድ ያስፈልጋል?"), T("No. We show you what to do and you work beside our team.", "አያስፈልግም። ምን እንደሚሠሩ እናሳይዎታለን፤ ከቡድናችን ጋር አብረው ይሠራሉ።")),
            (T("How is my gift used?", "ልገሳዬ እንዴት ጥቅም ላይ ይውላል?"), T("It goes to our programs. Ask us and we will explain how gifts are used.", "ለፕሮግራሞቻችን ይውላል። ከጠየቁን ልገሳዎች እንዴት እንደሚውሉ እናስረዳዎታለን።")),
            (T("Can my company or school take part?", "ድርጅቴ ወይም ትምህርት ቤቴ መሳተፍ ይችላል?"), T("Yes. Write to us and we will plan a day together.", "አዎ። ይጻፉልን፤ አንድ ቀን አብረን እናቅዳለን።")),
        ]),
        cta=(T("A few hours of your time changes a life", "ጥቂት ሰዓታትዎ የአንድን ሰው ሕይወት ይቀይራሉ"), T("Join as a volunteer or write to us about giving.", "በጎ ፈቃደኛ ሆነው ይቀላቀሉን፤ ወይም ስለ ልገሳ ይጻፉልን።"), (T("Volunteer with us", "በጎ ፈቃደኛ ይሁኑ"), "/volunteer"), (T("Contact us", "ያግኙን"), "/contact")),
    ),
    "personal": dict(
        hero=("split", "portrait", T("A portrait", "የቁም ምስል")),
        about=("work", T("Finished work in frames", "በፍሬም ያሉ የተጠናቀቁ ሥራዎች")),
        gallery=["work", "people", "work", "event", "portrait"],
        faq=(T("Working with me", "ከእኔ ጋር ሲሠሩ"), [
            (T("How do we start?", "እንዴት እንጀምራለን?"), T("Send me a short message about what you need. I reply with questions and a price.", "ስለሚፈልጉት ነገር አጭር መልዕክት ይላኩልኝ። ከጥያቄዎች እና ከዋጋ ጋር እመልሳለሁ።")),
            (T("How long does a project take?", "አንድ ሥራ ምን ያህል ጊዜ ይወስዳል?"), T("It depends on the work. I give you a date before we start and keep to it.", "እንደ ሥራው ይለያያል። ከመጀመራችን በፊት ቀን እሰጥዎታለሁ፤ እጠብቀዋለሁም።")),
            (T("Can I ask for changes?", "ለውጥ መጠየቅ እችላለሁ?"), T("Yes. Tell me what you would like changed and we agree on it together.", "አዎ። ምን እንዲቀየር እንደሚፈልጉ ይንገሩኝ፤ አብረን እንስማማበታለን።")),
        ]),
        cta=(T("Have a project in mind?", "በልብዎ ያለ ሥራ አለ?"), T("Tell me about it and I will reply with ideas and a price.", "ይንገሩኝ፤ ከሐሳቦች እና ከዋጋ ጋር እመልሳለሁ።"), (T("Start a project", "ሥራ እናስጀምር"), "/contact"), (T("See my work", "ሥራዎቼን ይመልከቱ"), "/work")),
    ),
    "real-estate": dict(
        hero=("split", "home", T("Homes on a street", "በአንድ መንገድ ያሉ ቤቶች")),
        about=("room", T("A bright room in a home", "ብሩህ የቤት ክፍል")),
        faq=(T("Buying and renting", "ስለ መግዛት እና መከራየት"), [
            (T("Can I visit a home before deciding?", "ከመወሰኔ በፊት ቤቱን ማየት እችላለሁ?"), T("Yes. Ask for a viewing and we take you there ourselves.", "አዎ። ጉብኝት ይጠይቁ፤ እኛው ራሳችን እናስጎበኝዎታለን።")),
            (T("Do you help with the papers?", "በሰነዶቹ ትረዳላችሁ?"), T("Yes. Ask us and we will explain each step.", "አዎ። ይጠይቁን፤ እያንዳንዱን ደረጃ እናስረዳዎታለን።")),
            (T("I want to sell or rent out my home. What now?", "ቤቴን መሸጥ ወይም ማከራየት እፈልጋለሁ። ምን ላድርግ?"), T("Ask for a valuation. We tell you a fair price and look for buyers or tenants.", "ግምት ይጠይቁ። ተገቢውን ዋጋ እንነግርዎታለን፤ ገዢ ወይም ተከራይም እንፈልጋለን።")),
        ]),
        cta=(T("Find the home that fits your life", "ለሕይወትዎ የሚስማማ ቤት ያግኙ"), T("See what is available now, or tell us what you are looking for.", "አሁን ያሉትን ቤቶች ይመልከቱ፤ ወይም የሚፈልጉትን ይንገሩን።"), (T("See homes", "ቤቶችን ይመልከቱ"), "/listings"), (T("Talk to us", "ያነጋግሩን"), "/contact")),
    ),
    "school": dict(
        hero=("split", "school", T("An open book, a pencil and a star", "የተከፈተ መጽሐፍ፣ እርሳስ እና ኮከብ")),
        about=("people", T("Children and a teacher together", "ተማሪዎች ከመምህራቸው ጋር")),
        faq=(T("Parents often ask", "ወላጆች ብዙ ጊዜ የሚጠይቁት"), [
            (T("When can I register my child?", "ልጄን መቼ ማስመዝገብ እችላለሁ?"), T("Fill in the form on the admissions page and we will call you.", "በምዝገባ ገጹ ላይ ያለውን ቅጽ ይሙሉ፤ እንደውልልዎታለን።")),
            (T("Can we visit the school first?", "መጀመሪያ ትምህርት ቤቱን መጎብኘት እንችላለን?"), T("Yes. Call us and we will show you the classrooms and answer your questions.", "አዎ። ይደውሉልን፤ ክፍሎቹን እናሳይዎታለን፤ ጥያቄዎችዎንም እንመልሳለን።")),
            (T("How will I know how my child is doing?", "የልጄን ውጤት እንዴት አውቃለሁ?"), T("Teachers meet parents every term, and you can ask to talk at any time.", "መምህራን በየተርሙ ከወላጆች ጋር ይገናኛሉ፤ በማንኛውም ጊዜ ለመነጋገር መጠየቅም ይችላሉ።")),
        ]),
        cta=(T("Give your child a strong start", "ለልጅዎ ጠንካራ ጅማሬ ይስጡ"), T("Registration is open. Come and see the school for yourself.", "ምዝገባ ተጀምሯል። መጥተው ትምህርት ቤቱን በዓይንዎ ይመልከቱ።"), (T("Register your child", "ልጅዎን ያስመዝግቡ"), "/admissions"), (T("Ask a question", "ጥያቄ ይጠይቁ"), "/contact")),
    ),
    "shop": dict(
        hero=("split", "fashion", T("A dress with a woven band", "ጥለት ያለው ቀሚስ")),
        about=("shopping", T("A shopping bag and parcels", "የገበያ ከረጢት እና ጥቅሎች")),
        faq=(T("Ordering from us", "ከእኛ ሲያዝዙ"), [
            (T("Do you deliver?", "ታደርሳላችሁ?"), T("Yes, we deliver in the city. Tell us where you are when you order.", "አዎ፤ በከተማ ውስጥ እናደርሳለን። ሲያዝዙ ያሉበትን ቦታ ይንገሩን።")),
            (T("Can you make it to my size?", "በልኬ ትሠሩልኛላችሁ?"), T("Yes. Come for a fitting or send us your measurements.", "አዎ። ለልኬት ይምጡ ወይም ልክዎን ይላኩልን።")),
            (T("How do I pay?", "እንዴት እከፍላለሁ?"), T("Ask us when you order and we will tell you the ways to pay.", "ሲያዝዙ ይጠይቁን፤ የክፍያ መንገዶቹን እንነግርዎታለን።")),
        ]),
        cta=(T("Find the dress for your day", "ለልዩ ቀንዎ የሚሆን ልብስ ያግኙ"), T("Order now, or visit us to see and try the dresses.", "አሁኑኑ ይዘዙ፤ ወይም መጥተው ልብሶቹን ይመልከቱ፣ ይለኩ።"), (T("Order now", "አሁን ይዘዙ"), "/order"), (T("See our products", "ምርቶቻችንን ይመልከቱ"), "/products")),
    ),
    "tours": dict(
        hero=("centered", "mountains", T("Highland peaks with a path and the sun", "የደጋ ተራሮች፣ መንገድ እና ፀሐይ")),
        about=("people", T("Travellers with their guide", "ተጓዦች ከአስጎብኚያቸው ጋር")),
        faq=(T("Before you travel", "ከመጓዝዎ በፊት"), [
            (T("Are the tours private or in a group?", "ጉዞዎቹ የግል ናቸው ወይስ የቡድን?"), T("Both. Tell us how many you are and we will suggest the best way.", "ሁለቱም አሉ። ስንት እንደሆናችሁ ይንገሩን፤ የተሻለውን እናቀርባለን።")),
            (T("What is included in the price?", "በዋጋው ውስጥ ምን ተካትቷል?"), T("Each tour lists what is included. Ask us if anything is unclear.", "እያንዳንዱ ጉዞ የተካተተውን ይዘረዝራል። ግልጽ ያልሆነ ነገር ካለ ይጠይቁን።")),
            (T("Can you plan a trip just for me?", "ለእኔ ብቻ የተዘጋጀ ጉዞ ማቀድ ትችላላችሁ?"), T("Yes. Tell us your dates and what you want to see.", "አዎ። ቀናትዎን እና ማየት የሚፈልጉትን ይንገሩን።")),
        ]),
        cta=(T("Ready to see Ethiopia?", "ኢትዮጵያን ለማየት ዝግጁ ነዎት?"), T("Send us your dates. We reply with a plan and a price.", "ቀናትዎን ይላኩልን። ከዕቅድ እና ከዋጋ ጋር እንመልሳለን።"), (T("Book a tour", "ጉዞ ያስይዙ"), "/book"), (T("See all tours", "ሁሉንም ጉዞዎች ይመልከቱ"), "/tours")),
    ),
    "worship": dict(
        hero=("split", "church", T("A church with a cross", "መስቀል ያለው ቤተ ክርስቲያን")),
        about=("people", T("People of the congregation together", "የምእመናን አንድነት")),
        faq=(T("Visiting us", "ሲጎበኙን"), [
            (T("I am new. Can I just come?", "አዲስ ነኝ። በቀጥታ መምጣት እችላለሁ?"), T("Yes, you are welcome. Come a little early and someone will greet you.", "አዎ፤ እንኳን ደህና መጡ። ትንሽ ቀደም ብለው ይምጡ፤ የሚቀበልዎ ሰው ይኖራል።")),
            (T("Is there something for children?", "ለልጆች የሚሆን ፕሮግራም አለ?"), T("Yes. See the programs page for days and times.", "አዎ። ቀንና ሰዓቱን በፕሮግራሞች ገጽ ይመልከቱ።")),
            (T("How can I talk to someone?", "ከአንድ ሰው ጋር እንዴት ልነጋገር?"), T("Write to us or call. We are glad to listen and to pray with you.", "ይጻፉልን ወይም ይደውሉ። ለመስማትና አብረን ለመጸለይ ደስተኞች ነን።")),
        ]),
        cta=(T("You are welcome here", "እንኳን ደህና መጡ"), T("Join us this week, or write to us with any question.", "በዚህ ሳምንት ይቀላቀሉን፤ ወይም ማንኛውንም ጥያቄ ይጻፉልን።"), (T("Contact us", "ያግኙን"), "/contact"), (T("Our programs", "ፕሮግራሞቻችን"), "/programs")),
    ),
}

# The hero now shows the opening hours itself, so these eyebrows say where the business is instead.
EYEBROW = {"cafe": T("Bole, near Edna Mall", "ቦሌ፣ ኤድና ሞል አጠገብ"), "clinic": T("Megenagna, Addis Ababa", "መገናኛ፣ አዲስ አበባ")}

for pid, d in DATA.items():
    path = ROOT / f"{pid}.json"
    site = json.loads(path.read_text(encoding="utf8"))
    home = next(p for p in site["pages"] if p["path"] == "/")
    # Remove what an earlier run added.
    home["sections"] = [s for s in home["sections"] if s.get("id") not in ("questions", "next-step")]
    hero = next(s for s in home["sections"] if s["type"] == "hero")
    if pid in EYEBROW:
        hero["eyebrow"] = EYEBROW[pid]
    variant, art, alt = d["hero"]
    hero["variant"] = variant
    hero["image"] = {**{k: v for k, v in (hero.get("image") or {}).items() if k not in ("art",)}, "art": art, "alt": (hero.get("image") or {}).get("alt") or alt}
    about = next((s for s in home["sections"] if s["type"] == "about"), None)
    if about:
        art, alt = d["about"]
        about["image"] = {**(about.get("image") or {}), "art": art, "alt": (about.get("image") or {}).get("alt") or alt}
    # Gallery tiles keep the calm abstract shapes unless a preset names drawings for them.
    for page in site["pages"]:
        for s in page["sections"]:
            if s["type"] == "gallery" and "gallery" not in d:
                for img in s["images"]:
                    img.pop("art", None)
    if "gallery" in d:
        for page in site["pages"]:
            for s in page["sections"]:
                if s["type"] == "gallery":
                    for img, art in zip(s["images"], d["gallery"]):
                        if art:
                            img["art"] = art
    heading, items = d["faq"]
    faq = {"type": "faq", "id": "questions", "heading": heading, "items": [{"question": q, "answer": a} for q, a in items]}
    ch, cb, (pl, ph), (sl, sh) = d["cta"]
    cta = {"type": "cta", "id": "next-step", "heading": ch, "body": cb, "primaryAction": {"label": pl, "href": ph}, "secondaryAction": {"label": sl, "href": sh}}
    # Questions go before the contact block (or at the end); the band closes the page.
    at = next((i for i, s in enumerate(home["sections"]) if s["type"] in ("contact", "map")), len(home["sections"]))
    home["sections"].insert(at, faq)
    home["sections"].append(cta)
    path.write_text(json.dumps(site, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print("updated", pid)
