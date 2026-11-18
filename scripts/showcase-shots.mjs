// Takes the pictures of real Gojoline sites shown on the landing page.
// Builds every starter template (templates/site/presets) exactly as a customer site is built,
// opens it at phone width in English and Amharic, and saves the whole page as WebP in
// public/showcase/ (with a small top-of-page crop for the gallery), plus lib/landing/showcase-shots.json (sizes, for layout without shift).
//
//   node scripts/showcase-shots.mjs [id ...]   (copies the template to a temp folder, installs, builds)
//   SHOWCASE_WORKDIR=/path/with/node_modules node scripts/showcase-shots.mjs   (reuse an installed copy)
import { execFileSync } from "node:child_process";
import { cpSync, createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const root = process.cwd();
const outDir = join(root, "public", "showcase");
const WIDTH = 390;
// Enough to show the whole home page of most sites; longer pages are cut here.
const MAX_HEIGHT = 3600;
// The part of the page a gallery card shows (CSS px at phone width).
const TOP_HEIGHT = 700;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".txt": "text/plain", ".xml": "application/xml" };

let work = process.env.SHOWCASE_WORKDIR;
if (!work) {
  work = join(mkdtempSync(join(tmpdir(), "gojoline-showcase-")), "site");
  cpSync(join(root, "templates", "site"), work, { recursive: true, filter: (p) => !/node_modules|dist/.test(p) });
  execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: work, stdio: "inherit" });
}
const run = (args) => execFileSync("npx", args, { cwd: work, stdio: "pipe" });

function serve(dir) {
  const server = createServer((req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    let file = join(dir, path);
    if (!file.startsWith(dir)) return res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
// Keeps the pictures of templates not rebuilt this time.
const manifestFile = join(root, "lib", "landing", "showcase-shots.json");
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : {};
// Ids on the command line rebuild only those templates; the others keep their pictures.
const only = process.argv.slice(2);
const presets = readdirSync(join(root, "templates", "site", "presets")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).filter((id) => !only.length || only.includes(id)).sort();
// The landing page shows a few of these sites dressed in Gojoline's own colours, so the page
// stays within the brand palette. Same content, only the theme differs.
const BRAND_THEME = { primary: "#FF5B35", accent: "#121212", background: "#FBF9F6", text: "#121212" };
const BRAND_IDS = ["cafe", "hotel", "clinic", "shop", "personal"];

async function build(json) {
  writeFileSync(join(work, "src", "site.json"), json);
  run(["vite", "build"]);
  run(["vite", "build", "--ssr", "src/entry-server.tsx", "--outDir", "dist-ssr"]);
  execFileSync("node", ["scripts/prerender.mjs"], { cwd: work, stdio: "pipe" });
  return serve(join(work, "dist"));
}

async function shoot(port, languages, lang) {
  // The first language lives at "/", the other under its code.
  const path = languages[0] === lang ? "/" : `/${lang}/`;
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: "networkidle" });
  // The phone call bar is fixed to the screen; in a picture of the whole page it would sit mid-page.
  await page.addStyleTag({ content: ".sticky-actions{display:none!important}" });
  // Photos below the first screen load lazily: walk down the page once so they are all in the picture.
  const tall = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < Math.min(tall, MAX_HEIGHT + 800); y += 600) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState("networkidle");
  // Wait for the photos that did load to be drawn; ones far below the cut never load, so don't wait long.
  await page.evaluate(() => Promise.race([Promise.all([...document.images].filter((i) => i.complete).map((i) => i.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 3000))]));
  await page.evaluate(() => document.fonts.ready);
  const full = await page.evaluate(() => document.documentElement.scrollHeight);
  const height = Math.min(full, MAX_HEIGHT);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height }, fullPage: true });
  await page.close();
  return png;
}

const topCrop = (png, file) =>
  sharp(png)
    .metadata()
    .then((m) => sharp(png).extract({ left: 0, top: 0, width: m.width, height: Math.min(m.height, TOP_HEIGHT * 2) }).resize({ width: 520 }).webp({ quality: 62, effort: 6 }).toFile(join(outDir, file)));

for (const id of presets) {
  const json = readFileSync(join(root, "templates", "site", "presets", `${id}.json`), "utf8");
  const languages = JSON.parse(json).languages ?? ["en"];
  const server = await build(json);
  manifest[id] = {};
  for (const lang of ["en", "am"]) {
    if (!languages.includes(lang)) continue;
    const png = await shoot(server.address().port, languages, lang);
    const file = `${id}-${lang}.webp`;
    const info = await sharp(png).webp({ quality: 60, effort: 6 }).toFile(join(outDir, file));
    // The gallery shows only the top of each page: a small crop keeps phones from downloading
    // a whole page they will never scroll.
    const topFile = `${id}-${lang}-top.webp`;
    const top = await topCrop(png, topFile);
    manifest[id][lang] = { src: `/showcase/${file}`, width: info.width, height: info.height, top: { src: `/showcase/${topFile}`, width: top.width, height: top.height } };
    console.log(file, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
  }
  server.close();
  if (!BRAND_IDS.includes(id)) continue;
  const site = JSON.parse(json);
  site.theme = { ...site.theme, ...BRAND_THEME };
  const branded = await build(JSON.stringify(site));
  for (const lang of ["en", "am"]) {
    if (!languages.includes(lang)) continue;
    const brandFile = `${id}-${lang}-brand.webp`;
    const b = await topCrop(await shoot(branded.address().port, languages, lang), brandFile);
    manifest[id][lang].brand = { src: `/showcase/${brandFile}`, width: b.width, height: b.height };
    console.log(brandFile, `${Math.round(b.size / 1024)} KB`);
  }
  branded.close();
}
await browser.close();
writeFileSync(join(root, "lib", "landing", "showcase-shots.json"), `${JSON.stringify(manifest, null, 2)}\n`);
