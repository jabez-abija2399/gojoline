// Turns the client build (dist/) + SSR bundle (dist-ssr/) into static HTML for every page and language.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const dist = join(root, "dist");
const template = readFileSync(join(dist, "index.html"), "utf8");
const { render, routes, siteUrl } = await import(pathToFileURL(join(root, "dist-ssr", "entry-server.js")).href);

const escapeAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const urls = routes();
for (const url of urls) {
  const page = render(url);
  if (!page) throw new Error(`No page for ${url}`);
  // The owner's own tab icon (dashboard → Settings) replaces the default one.
  const base = page.head.includes('rel="icon"') ? template.replace(/<link rel="icon" href="\/favicon\.svg"[^>]*>\s*/, "") : template;
  const html = base
    .replace(`lang="<!--app-lang-->"`, `lang="${page.htmlAttrs.lang}" style="${escapeAttr(page.htmlAttrs.style)}"`)
    .replace("<!--app-head-->", page.head)
    .replace("<!--app-html-->", page.html);
  const file = url === "/" ? join(dist, "index.html") : join(dist, url.slice(1), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const base = siteUrl();
if (base) {
  const entries = urls.map((u) => `  <url><loc>${base}${u === "/" ? "/" : u}</loc></url>`).join("\n");
  writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
  writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
} else {
  writeFileSync(join(dist, "robots.txt"), "User-agent: *\nAllow: /\n");
}

// The published site carries only the sample photos it uses, not the whole library.
const stockDir = join(dist, "stock");
if (existsSync(stockDir)) {
  const siteJson = readFileSync(join(root, "src", "site.json"), "utf8");
  const used = new Set([...siteJson.matchAll(/\/stock\/([a-z0-9-]+)\.webp/g)].flatMap((m) => [`${m[1]}.webp`, `${m[1]}-480.webp`, `${m[1]}-1600.webp`]));
  for (const file of readdirSync(stockDir)) if (!used.has(file)) rmSync(join(stockDir, file));
}

rmSync(join(root, "dist-ssr"), { recursive: true, force: true });
console.log(`Prerendered ${urls.length} page(s).`);
