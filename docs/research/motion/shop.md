# Shop (boutique / crafts): motion and interaction

## Sites visited (1280x800 + 390x844, 9 shots each; shop/<site>-d|m<n>.jpg + .json)
- **oflyn.fr** (Awwwards SOTD, French streetwear): all 18 shots. Shopify + Lenis + Three.js 3D gallery hero; 37 MB (34 MB video).
- **outfit.hellohello.is** (Awwwards SOTD May 2026): all 18 shots. Next + Lenis, 0.6 MB; 0-100 counter preloader.
- **stinegoya.com** (SOTD 2018, Shopify): all 18 shots after 2nd run (consent + newsletter popup dismissed).
- **kotn.com** (admired brand): all 18 shots after 2nd run (15%-off popup closed on desktop; first 2 shots still show it).
- aesop.com returned 403.

## Patterns, ranked by impact
1. **Product rows as swipe carousels with arrows** (Kotn "Our Top Picks / Shop New Arrivals" with arrows, "New" badges, colour swatches, hover "XS S M L XL Quick View"; Stine Goya "Nyheder" row with dots). Scroll-snap strip, arrows for desktop. Phone: swipe, 2 cards visible. Reduced motion: no change.
2. **Rotating announcement bar** (Stine Goya "1-2 dages levering / Gratis ombytning / Fri fragt"; Kotn "Free carbon offset shipping / Shop the Gift Guide / FW26" changed between shots; Oflyn looping "Livraison offerte" marquee). CSS keyframes. Ideal for "Order on Telegram · Pay on delivery". Reduced motion: show first message.
3. **Category tiles with label over photo** (Kotn "Gifts for Her / Him / Home", "Womenswear / Menswear / Home"; Stine Goya "Shop efter kategori" 6 tiles; "KJOLER / STRIK" split). Static; hover zoom is desktop-only.
4. **Image reveal / scale-in on scroll for product grid** (Outfit: cards fade/rise with staggered offsets and a scattered editorial grid; 15-20 hidden at load). IntersectionObserver, <1 KB. Content visible by default.
5. **Shop-the-look: sticky large photo beside 3 product cards** (Stine Goya "Shop looket": red outfit photo + top/trousers/jacket cards; Oflyn lookbook photo with hotspot dots on each garment). CSS sticky + positioned buttons; hotspots open the product card on tap.
6. **Story / impact band with number** (Kotn "25 schools funded. 5,127 farms supported." with sticky text). Static; optional count-up.
7. **Category icon chips filtering products** (Oflyn "Nos produits" bottom icon tabs: hoodie, T-shirt, cap, socks). Small JS filter; good at 360 px.
8. **Rotating circular text badge** (Stine Goya `rotating-circular-text` 18 s SVG). CSS only; tiny; stop under reduced motion.

## Avoid
3D WebGL hero (Oflyn 129 KB three.js + 34 MB video), counter preloaders (Outfit: first two shots are only the loader), newsletter popups that cover the first screen (Kotn, Stine Goya).

## Hover-only
Kotn size row + Quick View, second image on hover; Oflyn 26 hover transforms; Outfit link-hover underlines.
