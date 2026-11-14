// Validates src/site.json against the schema and checks theme contrast.
// Output is written for the AI agent: one problem per line, with the path to fix.
import { readFileSync } from "node:fs";
import { siteSchema, themeWarnings } from "../src/lib/schema.ts";

const raw = readFileSync(new URL("../src/site.json", import.meta.url), "utf8");
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
}

if (problems.length) {
  console.error(`src/site.json has ${problems.length} problem(s):`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log("src/site.json is valid.");
