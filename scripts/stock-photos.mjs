// Builds the sample-photo library of the site template from downloaded originals.
//
//   node scripts/stock-photos.mjs <folder>
//
// <folder>/<niche>/manifest.json lists the originals beside it:
//   [{ file, role: "hero"|"about"|"card"|"gallery", description, photographer, licence, source_page_url }]
// Each becomes templates/site/public/stock/<niche>-<role>-<slug>.webp, 800 px wide; hero photos
// also get a 1600 px file (<name>-1600.webp) for full-width use. The catalogue (what each photo
// shows and where it came from) is written to templates/site/stock.json.
// Only photos under licences that allow commercial use without credit (Unsplash, Pexels).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const src = process.argv[2];
if (!src) throw new Error("Usage: node scripts/stock-photos.mjs <folder>");
const out = join(process.cwd(), "templates", "site", "public", "stock");
const catalogueFile = join(process.cwd(), "templates", "site", "stock.json");
mkdirSync(out, { recursive: true });

const catalogue = existsSync(catalogueFile) ? JSON.parse(readFileSync(catalogueFile, "utf8")) : {};
const only = process.argv.slice(3);
for (const niche of readdirSync(src).sort()) {
  const manifestFile = join(src, niche, "manifest.json");
  if (!existsSync(manifestFile) || (only.length && !only.includes(niche))) continue;
  for (const key of Object.keys(catalogue)) if (key.startsWith(`${niche}-`)) delete catalogue[key];
  for (const p of JSON.parse(readFileSync(manifestFile, "utf8"))) {
    if (!["Unsplash", "Pexels"].includes(p.licence)) throw new Error(`${niche}/${p.file}: licence ${p.licence} is not allowed`);
    const slug = p.file.replace(/\.\w+$/, "").replace(/^\d+-/, "").replace(new RegExp(`^${p.role}-`), "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const name = `${niche}-${p.role}-${slug}`;
    const input = join(src, niche, p.file);
    // Tall photos are cut to 4:5 so no card downloads more than it shows.
    const meta = await sharp(input).metadata();
    const tall = meta.height / meta.width > 1.25;
    const base = (width) => sharp(input).rotate().resize(tall ? { width, height: Math.round(width * 1.25), fit: "cover", position: "attention" } : { width, withoutEnlargement: true });
    const info = await base(800).webp({ quality: 70, effort: 6 }).toFile(join(out, `${name}.webp`));
    if (p.role === "hero") await base(1600).webp({ quality: 62, effort: 6 }).toFile(join(out, `${name}-1600.webp`));
    catalogue[name] = { src: `/stock/${name}.webp`, width: info.width, height: info.height, shows: p.description, by: p.photographer, licence: p.licence, source: p.source_page_url };
  }
}
const sorted = Object.fromEntries(Object.entries(catalogue).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(catalogueFile, JSON.stringify(sorted, null, 2) + "\n");
console.log(`${Object.keys(sorted).length} photos in the library.`);

// The builder agent chooses photos from this list in TEMPLATE.md.
const guideFile = join(process.cwd(), "templates", "site", "TEMPLATE.md");
const list = Object.entries(sorted).map(([name, p]) => `- \`${name}\`: ${p.shows.replace(/\s+/g, " ").replace(/^Extra: /, "")}`).join("\n");
const guide = readFileSync(guideFile, "utf8");
writeFileSync(guideFile, guide.replace(/<!-- stock:start -->[\s\S]*<!-- stock:end -->/, () => `<!-- stock:start -->\n${list}\n<!-- stock:end -->`));
