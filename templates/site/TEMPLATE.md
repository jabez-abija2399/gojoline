# Gojoline site template: guide for the builder agent

Every Gojoline site is this Vite + React + Tailwind project. **Every change is an edit to `src/site.json`** (or, rarely, extra CSS in `src/styles.css`). The page structure, theme, texts, prices and contact details all live in that JSON file, whose shape is `Site` in `src/lib/types.ts`. Keep it valid JSON (double quotes, no comments, no trailing commas).

## Files

| File | Purpose | Edit? |
| --- | --- | --- |
| `src/site.json` | All content: name, languages, theme, business details, pages and their sections | Yes, this is the main file |
| `src/site.ts` | Loads site.json with its type | No |
| `src/lib/types.ts` | The content model (`Site`, `Page`, `Section`, `Text`, `Price`) | Read only |
| `src/sections/*.tsx` | Section components (Hero, About, Menu, Services, Gallery, Contact, MapEmbed, Testimonials, Header, Footer) | No (read them to see what each field does) |
| `src/styles.css` | Tailwind setup, theme utilities, `.btn`, `.section`, `.container-site` | Rarely, for small style tweaks |
| `public/images/` | Photos the owner uploaded | Reference them as `/images/<name>` |

## Content rules

- `Text` is `{ en?: string; am?: string }`. Fill **every language listed in `site.languages`**. Amharic must be natural Amharic in Ge'ez script, not transliteration.
- The first language in `languages` is the default (served at `/`); the second is served under `/am/...` or `/en/...`.
- Money: `price: { amountMinor: 15000, currency: "ETB" }` means 150 Birr. Integers only, never floats.
- Page `path`: `"/"` for home, otherwise lowercase like `"/menu"`. Add `nav` to show a page in the navigation.
- Links (`href`): `"#contact"`, `"/menu"`, `"tel:+251911234567"`, `"mailto:..."` or `https://...`. Nothing else is allowed.
- Images: omit `src` to get a tasteful placeholder in theme colours. Always write a short, specific `alt` in each language.
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
| `form` | Contact, booking, order or registration forms. Answers reach the owner's dashboard and Telegram | `id` (required, e.g. `"booking"`), `kind`, `heading`, `intro`, `fields[]`, `submitLabel`, `successMessage` |

Form fields: `{ "name": "phone", "label": {...}, "type": "tel", "required": true }`. Types: text, email, tel, date, time, number, select (with `options`), textarea. Keep forms short (2 to 6 fields). Never ask for passwords, PINs, card numbers, bank details or ID numbers. Add a form when the owner wants bookings, orders, registrations or messages; link to it with `"#<id>"` (for example a hero button to `"#booking"`).

Icons for `services`: coffee, utensils, bed, stethoscope, school, shopping-bag, church, calendar, heart, home, map, scissors, car, star, phone, check.

## Theme

`theme.primary` (buttons, links), `theme.accent` (dark bands, footer), `theme.background` (light page background), `theme.text`, `theme.font` (`modern`, `classic`, `friendly`), `theme.radius` (`none`, `small`, `medium`, `large`).

- `text` on `background` needs 4.5:1 contrast; `primary` on `background` needs 3:1. Button text colour is picked automatically.
- Pick colours that fit the business (warm browns for coffee, calm teal/blue for clinics, deep green for hotels). Avoid using green, yellow and red together.

## Checking your work

`npm run build` runs the type check, validates `site.json` (JSON syntax, schema and contrast) and prerenders every page. Fix every reported problem; messages name the exact field (`site.pages.0.sections.2.heading: ...`).

## Quality bar

Mobile first (360 px), 16 px minimum text, 44 px touch targets (`.btn` already is), real headings in order, alt text on photos, no horizontal scroll. Code and packages are fixed; you only change content and styles.
