// Validates src/site.json against the schema and checks theme contrast.
// Output is written for the AI agent: one problem per line, with the path to fix.
import { readFileSync } from "node:fs";
import { siteSchema, themeWarnings } from "../src/lib/schema.ts";

// A path may be given to check another file (a preset); the default is the site itself.
const raw = readFileSync(process.argv[2] ?? new URL("../src/site.json", import.meta.url), "utf8");
let site: unknown;
try {
  site = JSON.parse(raw);
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  const pos = Number(/position (\d+)/.exec(msg)?.[1]);
  const where = Number.isFinite(pos) ? ` (line ${raw.slice(0, pos).split("\n").length})` : "";
  console.error(`src/site.json is not valid JSON${where}: ${msg}`);
  process.exit(1);
}

const result = siteSchema.safeParse(site);
const problems: string[] = [];
if (!result.success) {
  for (const issue of result.error.issues) problems.push(`site.${issue.path.join(".")}: ${issue.message}`);
} else {
  problems.push(...themeWarnings(result.data.theme));
  // Sample photos must be ones the library has (TEMPLATE.md lists them).
  const library = JSON.parse(readFileSync(new URL("../stock.json", import.meta.url), "utf8")) as Record<string, unknown>;
  const seen = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const src = (v as { src?: unknown }).src;
    if (typeof src === "string" && src.startsWith("/stock/") && !seen.has(src)) {
      seen.add(src);
      const name = /^\/stock\/([a-z0-9-]+)\.webp$/.exec(src)?.[1];
      if (!name || !(name in library)) problems.push(`"${src}" is not a photo in the library. Use a name from the "Sample photos" list in TEMPLATE.md, or a drawing (art).`);
    }
    Object.values(v).forEach(walk);
  };
  walk(result.data);
}

if (problems.length) {
  console.error(`src/site.json has ${problems.length} problem(s):`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log("src/site.json is valid.");
