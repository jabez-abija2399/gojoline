// Pictures of every section of every page of every starter template, for the template preview
// pages (/[lang]/templates/<id>): visitors see the whole site, section by section, before they pick it.
//
// Builds each preset (templates/site/presets) exactly as a customer site is built, opens every page
// in English and Amharic at desktop (1280 px) and phone (390 px) width, and cuts the full-page picture
// at the section boundaries. Writes public/templates/<id>/*.webp and lib/landing/template-sections.json.
//
//   node scripts/template-sections.mjs [id ...]          (copies the template to a temp folder, installs, builds)
//   SHOWCASE_WORKDIR=/path/with/node_modules node scripts/template-sections.mjs   (reuse an installed copy)
import { execFileSync } from "node:child_process";
import { cpSync, createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const root = process.cwd();
const outRoot = join(root, "public", "templates");
const manifestFile = join(root, "lib", "landing", "template-sections.json");
const VIEWS = { d: { width: 1280, height: 800, scale: 1, quality: 52 }, m: { width: 390, height: 844, scale: 1.5, quality: 50 } };
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".txt": "text/plain", ".xml": "application/xml" };

let work = process.env.SHOWCASE_WORKDIR;
if (!work) {
  work = join(mkdtempSync(join(tmpdir(), "gojoline-sections-")), "site");
  cpSync(join(root, "templates", "site"), work, { recursive: true, filter: (p) => !/node_modules|dist/.test(p) });
  execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: work, stdio: "inherit" });
}
// The library is needed by the build; the build keeps only the photos the site uses.
if (!existsSync(join(work, "public", "stock"))) cpSync(join(root, "templates", "site", "public", "stock"), join(work, "public", "stock"), { recursive: true });
for (const dir of ["src", "scripts"]) cpSync(join(root, "templates", "site", dir), join(work, dir), { recursive: true });
cpSync(join(root, "templates", "site", "stock.json"), join(work, "stock.json"));

function serve(dir) {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    let file = join(dir, path);
    if (!file.startsWith(dir)) return res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function build(json) {
  writeFileSync(join(work, "src", "site.json"), json);
  execFileSync("npm", ["run", "build", "--silent"], { cwd: work, stdio: "pipe" });
  return serve(join(work, "dist"));
}

/** Full-page picture of one page, and where each part of it starts and ends (CSS px). */
async function capture(browser, url, view) {
  const page = await browser.newPage({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: view.scale, reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: ".sticky-actions{display:none!important}" });
  // Photos below the first screen load lazily: walk down once so every photo is in the picture.
  const tall = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < tall; y += 700) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(40);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => Promise.race([Promise.all([...document.images].filter((i) => i.complete).map((i) => i.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 3000))]));
  await page.evaluate(() => document.fonts.ready);
  const parts = await page.evaluate(() => {
    const top = (el) => el.getBoundingClientRect().top + window.scrollY;
    const sections = [...document.querySelectorAll("main > section")];
    const footer = document.querySelector("footer");
    const height = document.documentElement.scrollHeight;
    // The header belongs to the first section (it sits on it, or just above it); the footer is its own part.
    return sections.map((s, i) => ({ y: i === 0 ? 0 : Math.round(top(s)), end: Math.round(i + 1 < sections.length ? top(sections[i + 1]) : footer ? top(footer) : height) })).concat(footer ? [{ y: Math.round(top(footer)), end: height, footer: true }] : []);
  });
  const png = await page.screenshot({ fullPage: true });
  await page.close();
  return { png, parts };
}

const browser = await chromium.launch();
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : {};
const only = process.argv.slice(2);
const presets = readdirSync(join(root, "templates", "site", "presets")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).filter((id) => !only.length || only.includes(id)).sort();

for (const id of presets) {
  const json = readFileSync(join(root, "templates", "site", "presets", `${id}.json`), "utf8");
  const site = JSON.parse(json);
  const outDir = join(outRoot, id);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const server = await build(json);
  const port = server.address().port;
  manifest[id] = {};
  for (const lang of site.languages) {
    manifest[id][lang] = [];
    for (const [pi, p] of site.pages.entries()) {
      const url = `http://127.0.0.1:${port}${lang === site.languages[0] ? p.path : `/${lang}${p.path === "/" ? "" : p.path}`}`;
      const shots = {};
      for (const [key, view] of Object.entries(VIEWS)) {
        const { png, parts } = await capture(browser, url, view);
        if (parts.filter((x) => !x.footer).length !== p.sections.length) throw new Error(`${id} ${lang} ${p.path}: ${parts.length} parts for ${p.sections.length} sections`);
        const meta = await sharp(png).metadata();
        shots[key] = [];
        for (const [i, part] of parts.entries()) {
          const top = Math.round(part.y * view.scale);
          const height = Math.min(Math.round((part.end - part.y) * view.scale), meta.height - top);
          const file = `${lang}-${pi}-${i}-${key}.webp`;
          const info = await sharp(png).extract({ left: 0, top, width: meta.width, height }).webp({ quality: view.quality, effort: 6 }).toFile(join(outDir, file));
          shots[key].push({ src: `/templates/${id}/${file}`, width: info.width, height: info.height });
        }
      }
      manifest[id][lang].push({ path: p.path, parts: shots.d.map((d, i) => ({ d, m: shots.m[i] })) });
      process.stdout.write(".");
    }
  }
  server.close();
  const kb = readdirSync(outDir).reduce((sum, f) => sum + statSync(join(outDir, f)).size, 0) / 1024;
  console.log(` ${id}: ${readdirSync(outDir).length} pictures, ${Math.round(kb)} KB`);
}
await browser.close();
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(manifestFile, `${JSON.stringify(sorted)}\n`);

// The card picture for the templates page: the top of the home page at computer width, 16:10.
await makeCards(only.length ? only : Object.keys(sorted));

async function makeCards(ids) {
  for (const id of ids) {
    for (const [lang, pages] of Object.entries(sorted[id] ?? {})) {
      // The top of the home page. A hero shorter than 16:10 fills the card by losing a little at both sides.
      const hero = join(root, "public", pages[0].parts[0].d.src);
      const { width, height } = await sharp(hero).metadata();
      const h = Math.min(height, Math.round(width / 1.6));
      const w = Math.round(h * 1.6);
      // A full-screen photo hero has its words low down: take its lower part. Others: the top.
      const preset = JSON.parse(readFileSync(join(root, "templates", "site", "presets", `${id}.json`), "utf8"));
      const first = preset.pages[0].sections[0];
      const low = first?.type === "hero" && (first.variant === "immersive" || first.variant === "banner");
      await sharp(hero).extract({ left: Math.round((width - w) / 2), top: low ? height - h : 0, width: w, height: h }).resize(640, 400).webp({ quality: 62, effort: 6 }).toFile(join(outRoot, id, `${lang}-card.webp`));
    }
  }
  console.log(`Card pictures for ${ids.length} template(s).`);
}
