// Builds every starter template as a live demo site that Gojoline serves at /demo/<id>/ and shows
// on the template's preview page: the real site, every page, motion and interaction included.
// Each preset is built exactly as a customer site, with the site's base set to /demo/<id>/, and
// the result is copied to public/demo/<id>/.
//
//   node scripts/template-demos.mjs [id ...]
//   SHOWCASE_WORKDIR=/path/with/node_modules node scripts/template-demos.mjs   (reuse an installed copy)
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const template = join(root, "templates", "site");
let work = process.env.SHOWCASE_WORKDIR;
if (!work) {
  work = join(mkdtempSync(join(tmpdir(), "gojoline-demos-")), "site");
  cpSync(template, work, { recursive: true, filter: (p) => !/node_modules|dist/.test(p) });
  execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: work, stdio: "inherit" });
}
for (const dir of ["src", "scripts"]) cpSync(join(template, dir), join(work, dir), { recursive: true });
cpSync(join(template, "stock.json"), join(work, "stock.json"));
// Always synced: a reused work folder would otherwise miss photos added since.
cpSync(join(template, "public", "stock"), join(work, "public", "stock"), { recursive: true, force: true });

const only = process.argv.slice(2);
const ids = readdirSync(join(template, "presets")).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).filter((id) => !only.length || only.includes(id)).sort();
const size = (dir) => readdirSync(dir, { recursive: true }).reduce((n, f) => n + (statSync(join(dir, f)).isFile() ? statSync(join(dir, f)).size : 0), 0);
for (const id of ids) {
  const base = `/demo/${id}/`;
  writeFileSync(join(work, "src", "site.json"), readFileSync(join(template, "presets", `${id}.json`)));
  const run = (args) => execFileSync("npx", args, { cwd: work, stdio: "pipe" });
  execFileSync("node", ["--experimental-strip-types", "scripts/validate.ts"], { cwd: work, stdio: "pipe" });
  run(["vite", "build", "--base", base]);
  run(["vite", "build", "--ssr", "src/entry-server.tsx", "--outDir", "dist-ssr", "--base", base]);
  execFileSync("node", ["scripts/prerender.mjs"], { cwd: work, stdio: "pipe" });
  const out = join(root, "public", "demo", id);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(join(work, "dist"), out, { recursive: true });
  // Demos are not real businesses: search engines are kept out (also by a header).
  writeFileSync(join(out, "robots.txt"), "User-agent: *\nDisallow: /\n");
  console.log(`${id}: ${Math.round(size(out) / 1024)} KB`);
}
