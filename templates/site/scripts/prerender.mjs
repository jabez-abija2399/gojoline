// Turns the client build (dist/) + SSR bundle (dist-ssr/) into static HTML for every page and language.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const dist = join(root, "dist");
const template = readFileSync(join(dist, "index.html"), "utf8");
const { render, routes, site } = await import(pathToFileURL(join(root, "dist-ssr", "entry-server.js")).href);

const escapeAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const urls = routes();
for (const url of urls) {
  const page = render(url);
  if (!page) throw new Error(`No page for ${url}`);
  const html = template
    .replace(`lang="<!--app-lang-->"`, `lang="${page.htmlAttrs.lang}" style="${escapeAttr(page.htmlAttrs.style)}"`)
    .replace("<!--app-head-->", page.head)
    .replace("<!--app-html-->", page.html);
  const file = url === "/" ? join(dist, "index.html") : join(dist, url.slice(1), "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const base = site.meta?.url?.replace(/\/$/, "");
if (base) {
  const entries = urls.map((u) => `  <url><loc>${base}${u === "/" ? "/" : u}</loc></url>`).join("\n");
  writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
  writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
} else {
  writeFileSync(join(dist, "robots.txt"), "User-agent: *\nAllow: /\n");
}

rmSync(join(root, "dist-ssr"), { recursive: true, force: true });
console.log(`Prerendered ${urls.length} page(s).`);
