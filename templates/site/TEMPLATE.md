# Gojoline site template: guide for the builder agent

Every Gojoline site is this Vite + React + Tailwind project. **Every change is an edit to `src/site.json`** (or, rarely, extra CSS in `src/styles.css`). The page structure, theme, texts, prices and contact details all live in that JSON file, whose shape is `Site` in `src/lib/types.ts`. Keep it valid JSON (double quotes, no comments, no trailing commas).

## Files

| File | Purpose | Edit? |
| --- | --- | --- |
| `src/site.json` | All content: name, languages, theme, business details, pages and their sections | Yes, this is the main file |
| `src/site.ts` | Loads site.json with its type | No |
| `src/lib/types.ts` | The content model (`Site`, `Page`, `Section`, `Text`, `Price`) | Read only |
| `src/sections/*.tsx` | Section components (Hero, About, Menu, Services, Gallery, Contact, MapEmbed, Testimonials, Timeline, Faq, Cta, Form, Header, Footer) | No (read them to see what each field does) |
| `src/styles.css` | Tailwind setup, theme utilities, `.btn`, `.section`, `.container-site` | Rarely, for small style tweaks |
| `public/images/` | Photos the owner uploaded | Reference them as `/images/<name>` |

## Content rules

- `Text` is `{ en?: string; am?: string }`. Fill **every language listed in `site.languages`**. Amharic must be natural Amharic in Ge'ez script, not transliteration.
- The first language in `languages` is the default (served at `/`); the second is served under `/am/...` or `/en/...`.
- Money: `price: { amountMinor: 15000, currency: "ETB" }` means 150 Birr. Integers only, never floats.
- Page `path`: `"/"` for home, otherwise lowercase like `"/menu"`. Add `nav` to show a page in the navigation.
- Links (`href`): `"#contact"`, `"/menu"`, `"tel:+251911234567"`, `"mailto:..."` or `https://...`. Nothing else is allowed.
- Images: use the owner's photos when there are any. Without a photo, omit `src` and set `art` to the drawing that fits (see Drawings below); it is shown in the site's colours until a photo replaces it. Always write a short, specific `alt` in each language.
- Never invent facts the owner did not give (prices, phone numbers, addresses, awards). Leave the field out instead; ask the owner if it matters.
- Never use lorem ipsum. Write short, warm, concrete copy for the business.
- The first section of the home page should be a `hero`; it becomes the page's only `<h1>`.

## Sections

| `type` | Use for | Key fields |
| --- | --- | --- |
| `hero` | Top of a page | `variant` (`split`, `centered`, `banner`), `eyebrow`, `heading`, `subheading`, `image`, `primaryAction`, `secondaryAction` |
| `about` | Story, mission | `heading`, `body` (blank line = new paragraph), `image`, `highlights[]` (`value`, `label`) |
| `menu` | Food, drinks, price lists | `categories[]` with `items[]` (`name`, `description`, `price`, `tag`) |
| `services` | Clinics, salons, schools, hotels (rooms), tours | `items[]` (`title`, `description`, `price`, `icon`) |
| `gallery` | Photos | `images[]` |
| `contact` | Call / Telegram buttons, phone, address, hours (from `business`) | `heading`, `intro` |
| `map` | Location card that opens the maps app | `heading`, `query` (defaults to the English address) |
| `testimonials` | Customer quotes (only real ones the owner gave) | `items[]` (`quote`, `name`) |
| `timeline` | Personal sites (work, studies), "our story", milestones | `heading`, `intro`, `items[]` (`period`, `title`, `place`, `description`), newest first |
| `faq` | Questions customers always ask (booking, delivery, payment, what to bring). 3 to 6, short answers, only facts the owner gave or plain how-to | `heading`, `intro`, `items[]` (`question`, `answer`) |
| `cta` | One clear ask on a dark band, usually the last section of the home page | `heading`, `body`, `primaryAction`, `secondaryAction` |
| `form` | Contact, booking, order or registration forms. Answers reach the owner's dashboard and Telegram | `id` (required, e.g. `"booking"`), `kind`, `heading`, `intro`, `fields[]`, `submitLabel`, `successMessage` |

Form fields: `{ "name": "phone", "label": {...}, "type": "tel", "required": true }`. Types: text, email, tel, date, time, number, select (with `options`), textarea. Keep forms short (2 to 6 fields). Never ask for passwords, PINs, card numbers, bank details or ID numbers. Add a form when the owner wants bookings, orders, registrations or messages; link to it with `"#<id>"` (for example a hero button to `"#booking"`).

Icons for `services`: coffee, utensils, bed, stethoscope, school, shopping-bag, church, calendar, heart, home, map, scissors, car, star, phone, check.

## Drawings (`image.art`)

When there is no photo yet, `art` picks a drawing in the site's colours instead of an empty box:

| `art` | Shows | Use for |
| --- | --- | --- |
| `coffee` | A jebena and cups | Cafés, coffee |
| `food` | A shared plate | Restaurants, catering |
| `hotel` / `room` | A lodge by the water / a made bed | Hotels, guest houses, rentals |
| `clinic` | A cross and a heartbeat | Clinics, pharmacies, health |
| `school` | A book, a pencil, a star | Schools, courses, tutoring |
| `fashion` / `shopping` | A dress with a woven band / a bag and parcels | Clothes and tailoring / any shop |
| `church` / `mosque` | The building | Places of worship |
| `event` | A stage with flags | Events, weddings, music |
| `people` | Three people together | Teams, community, NGOs, families |
| `home` | Houses on a street | Real estate, construction |
| `mountains` | Highland peaks and a path | Tours, travel, outdoors |
| `portrait` / `work` | A person in an arch / framed work | Personal sites, portfolios |

Give the home hero and the `about` section a drawing that fits the business, and vary them (don't repeat one drawing down the page). Leave `art` out for a calm abstract shape. Once the owner uploads a photo, set `src` and remove `art`.

## A good home page

Hero (with `art` or a photo, and a button to the thing visitors want: menu, booking, call) → what you offer (`menu` or `services`) → `about` → `faq` when the owner gave enough to answer real questions → `contact` (and `map`) → `cta` as the last section. On phones a bar with Call and Telegram (or WhatsApp) appears by itself when `business.phone`, `telegram` or `whatsapp` is set, and the hero shows the first `business.hours` line, so fill those in whenever the owner gives them.

## Personal websites

For a person (portfolio, CV, freelancer, artist, coach, speaker): hero with their name and what they do, `about` (their story, `highlights` only with facts they gave), `services` ("What I do"), `gallery` for their work, `timeline` for experience and education, then a contact `form`. Use first-person, warm copy. No prices unless they gave them.

## Design and motion

Sections already animate (gentle reveal on scroll, lift and tilt on cards, a soft glow behind the hero, cross-fades between pages) and respect "reduce motion". Headings use a real display font chosen by `theme.font`: `classic` (Fraunces, a warm serif: cafés, hotels, shops, worship, events), `modern` (Outfit, clean: clinics, real estate, tours, personal), `friendly` (Nunito, rounded: schools, NGOs, children). Choose the hero `variant` to fit: `split` for a business with a photo, `centered` for a strong statement or a person, `banner` for a big atmospheric photo. With 4 or more `services` the first becomes a large feature tile, so put the most important one first. In a `gallery` of 5 or more the first photo is shown large.

## Theme

`theme.primary` (buttons, links), `theme.accent` (dark bands, footer), `theme.background` (light page background), `theme.text`, `theme.font` (`modern`, `classic`, `friendly`), `theme.radius` (`none`, `small`, `medium`, `large`).

- `text` on `background` needs 4.5:1 contrast; `primary` on `background` needs 3:1. Button text colour is picked automatically.
- Pick colours that fit the business (warm browns for coffee, calm teal/blue for clinics, deep green for hotels). Avoid using green, yellow and red together.

## Checking your work

`npm run build` runs the type check, validates `site.json` (JSON syntax, schema and contrast) and prerenders every page. Fix every reported problem; messages name the exact field (`site.pages.0.sections.2.heading: ...`).

## Quality bar

Mobile first (360 px), 16 px minimum text, 44 px touch targets (`.btn` already is), real headings in order, alt text on photos, no horizontal scroll. Code and packages are fixed; you only change content and styles.
