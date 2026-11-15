/**
 * Generates the industry starter sites in templates/site/presets/ with Claude, validating each
 * against the template's schema and contrast rules (up to 3 tries with the errors fed back).
 * One-off authoring tool: outputs are committed and reviewed like any other content.
 *
 *   node --experimental-strip-types scripts/generate-presets.mts [id ...]
 *
 * Needs SAYSITE_ANTHROPIC_API_KEY. Prints tokens and cost per preset.
 */
import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { siteSchema, themeWarnings } from "../templates/site/src/lib/schema.ts";

const PRESETS: Record<string, string> = {
  hotel: "a mid-size hotel in Bahir Dar by Lake Tana: rooms (as a menu-style list with prices per night), restaurant, airport pickup, a booking form (check-in date, nights, guests, room type select)",
  clinic: "a family medical clinic in Addis Ababa (Megenagna): general practice, children's health, lab tests, ultrasound; opening hours; an appointment booking form (date, time, reason select). No medical claims or guarantees.",
  school: "a private primary school (KG to grade 8) in Adama: programs, facilities, fees per term in a services list, a registration form for new students (child name, grade select, parent phone)",
  shop: "a clothing and traditional dress (habesha kemis) shop in Merkato: product list with prices, custom tailoring service, an order form (item, size select, phone, delivery address)",
  personal: "a personal website for a freelance graphic designer and photographer in Addis Ababa (fictional name Hana Bekele): hero (variant centered) with her name and what she does, an about section in first person, services titled 'What I do' (brand design, event photography, social media design), a gallery titled 'Selected work' with 5 images that have ONLY alt text (no src), a timeline section with her experience and education (newest first), and a contact form for project enquiries. EXCEPTION to the rules below: this site may include that one gallery and its images (alt only, no src).",
  mosque: "a neighbourhood mosque in Addis Ababa (Kolfe): the five daily prayer times and Jumu'ah, Quran classes for children and adults, community programs and support for families in need, a page about giving (bank account placeholder), a contact form. Respectful, simple tone.",
  worship: "a church in Addis Ababa: service and prayer times, community programs, youth choir, a page about giving (bank account placeholder for donations), a contact form. Respectful, simple tone.",
  events: "an event planning company in Addis Ababa: weddings, graduations, corporate events, decoration and catering packages with prices, a booking form (event date, event type select, guests)",
  ngo: "a local NGO in Hawassa supporting girls' education and clean water: programs, impact numbers, how to volunteer, a registration form for volunteers",
  "real-estate": "a real estate agency in Addis Ababa: apartments and houses for rent and sale (list with prices), services (property management, valuation), a contact form for viewings",
  tours: "a tour operator: Lalibela, Simien Mountains, Danakil Depression, Omo Valley trips (packages with prices in USD and ETB), a booking form (tour select, date, group size, email)",
};

const SYSTEM = `You write starter website content for Gojoline, an Ethiopian website builder. Output ONLY one JSON object (no prose, no code fences) that is a valid src/site.json for the template schema below.

Rules:
- Every text field has BOTH "en" and "am". Amharic must be natural, correct, everyday Ethiopian Amharic in Ge'ez script (not word-for-word translation). Keep business names transliterated in Amharic.
- "languages": ["en", "am"].
- The business is fictional but realistic for Ethiopia; use the placeholder phone "+251 911 000 000" and no real brands, people or emails. You may include a Telegram handle like "yourbusiness" only as a placeholder.
- Prices: integer minor units (ETB cents: 450 Birr = 45000). Use realistic 2026 Addis prices.
- Do NOT include any "image" objects or "gallery" sections (the owner adds photos later). No "meta" key.
- 3 to 5 pages, each with 2 to 5 sections. Home page path "/". Include exactly one "form" section appropriate to the business with 3 to 7 fields; field names lowercase_with_underscores.
- No "testimonials" sections and no made-up statistics or achievements (no "500 students", "20 years"): this is example content the owner replaces, and invented reviews or numbers must never go live. For account numbers use the placeholder "[account number]".
- Choose a theme that suits the industry: theme.text on theme.background contrast >= 4.5:1, theme.text on #ffffff >= 4.5:1, theme.primary on theme.background >= 3:1. Background should be light.
- Use icons only from the schema's icon list. Keep each text short and useful.

Schema (Zod, TypeScript):
${readFileSync("templates/site/src/lib/schema.ts", "utf8")}

Example of a valid site.json (a café):
${readFileSync("templates/site/src/site.json", "utf8")}`;

// Opus 5.5 prices in USD per million tokens (see lib/providers/llm/pricing.ts).
const PRICE = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 };

const key = process.env.SAYSITE_ANTHROPIC_API_KEY;
if (!key) throw new Error("Set SAYSITE_ANTHROPIC_API_KEY");
const client = new Anthropic({ apiKey: key });
const model = process.env.PRESET_MODEL || "claude-opus-5-5";

function check(json: string): string[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return [`Not valid JSON: ${(e as Error).message}`];
  }
  const parsed = siteSchema.safeParse(data);
  if (!parsed.success) return parsed.error.issues.slice(0, 15).map((i) => `${i.path.join(".")}: ${i.message}`);
  const problems = [...themeWarnings(parsed.data.theme)];
  const walk = (v: unknown, path: string) => {
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if ("en" in o && !("am" in o)) problems.push(`${path}: missing "am"`);
      if ("am" in o && !("en" in o)) problems.push(`${path}: missing "en"`);
      for (const [k, x] of Object.entries(o)) walk(x, `${path}.${k}`);
    }
  };
  walk(parsed.data, "site");
  return problems.slice(0, 15);
}

async function generate(id: string, brief: string) {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: `Write the starter site for: ${brief}` }];
  let cost = 0;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const stream = client.messages.stream({
      model,
      max_tokens: 16000,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages,
    });
    const res = await stream.finalMessage();
    const u = res.usage;
    cost += ((u.input_tokens ?? 0) * PRICE.input + (u.output_tokens ?? 0) * PRICE.output + (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead + (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite) / 1e6;
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const problems = check(json);
    if (problems.length === 0) {
      writeFileSync(`templates/site/presets/${id}.json`, `${JSON.stringify(JSON.parse(json), null, 2)}\n`);
      console.log(`${id}: ok on try ${attempt}, $${cost.toFixed(3)}`);
      return cost;
    }
    console.log(`${id}: try ${attempt} had ${problems.length} problems: ${problems.slice(0, 3).join("; ")}`);
    messages.push({ role: "assistant", content: res.content }, { role: "user", content: `Fix these problems and output the whole JSON again:\n${problems.join("\n")}` });
  }
  throw new Error(`${id}: failed after 3 tries`);
}

mkdirSync("templates/site/presets", { recursive: true });
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PRESETS);
const results = await Promise.allSettled(ids.map((id) => generate(id, PRESETS[id]!)));
const total = results.reduce((n, r) => n + (r.status === "fulfilled" ? r.value : 0), 0);
for (const r of results) if (r.status === "rejected") console.error(String(r.reason));
console.log(`total $${total.toFixed(3)}`);
