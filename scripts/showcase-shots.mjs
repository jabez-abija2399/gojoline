// Takes the pictures of real Gojoline sites shown on the landing page.
// Builds every starter template (templates/site/presets) exactly as a customer site is built,
// opens it at phone width in English and Amharic, and saves the whole page as WebP in
// public/showcase/ (with a small top-of-page crop for the gallery), plus lib/landing/showcase-shots.json (sizes, for layout without shift).
//
//   node scripts/showcase-shots.mjs            (copies the template to a temp folder, installs, builds)
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
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml" };

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
const manifest = {};
const presets = readdirSync(join(root, "templates", "site", "presets")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
for (const id of presets) {
  const json = readFileSync(join(root, "templates", "site", "presets", `${id}.json`), "utf8");
  writeFileSync(join(work, "src", "site.json"), json);
  run(["vite", "build"]);
  run(["vite", "build", "--ssr", "src/entry-server.tsx", "--outDir", "dist-ssr"]);
  execFileSync("node", ["scripts/prerender.mjs"], { cwd: work, stdio: "pipe" });
  const languages = JSON.parse(json).languages ?? ["en"];
  const server = await serve(join(work, "dist"));
  const port = server.address().port;
  manifest[id] = {};
  for (const lang of ["en", "am"]) {
    if (!languages.includes(lang)) continue;
    // The first language lives at "/", the other under its code.
    const path = languages[0] === lang ? "/" : `/${lang}/`;
    const page = await browser.newPage({ viewport: { width: WIDTH, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
    await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const full = await page.evaluate(() => document.documentElement.scrollHeight);
    const height = Math.min(full, MAX_HEIGHT);
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height }, fullPage: true });
    await page.close();
    const file = `${id}-${lang}.webp`;
    const info = await sharp(png).webp({ quality: 60, effort: 6 }).toFile(join(outDir, file));
    // The gallery shows only the top of each page: a small crop keeps phones from downloading
    // a whole page they will never scroll.
    const topFile = `${id}-${lang}-top.webp`;
    const top = await sharp(png).extract({ left: 0, top: 0, width: info.width, height: Math.min(info.height, TOP_HEIGHT * 2) }).resize({ width: 520 }).webp({ quality: 62, effort: 6 }).toFile(join(outDir, topFile));
    manifest[id][lang] = { src: `/showcase/${file}`, width: info.width, height: info.height, top: { src: `/showcase/${topFile}`, width: top.width, height: top.height } };
    console.log(file, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
  }
  server.close();
}
await browser.close();
writeFileSync(join(root, "lib", "landing", "showcase-shots.json"), `${JSON.stringify(manifest, null, 2)}\n`);
