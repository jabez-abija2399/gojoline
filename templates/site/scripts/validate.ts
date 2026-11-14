// Validates src/site.ts against the schema and checks theme contrast.
// Output is written for the AI agent: one problem per line, with the path to fix.
import { siteSchema, themeWarnings } from "../src/lib/schema.ts";
import { site } from "../src/site.ts";

const result = siteSchema.safeParse(site);
const problems: string[] = [];
if (!result.success) {
  for (const issue of result.error.issues) {
    problems.push(`site.${issue.path.join(".")}: ${issue.message}`);
  }
}
if (result.success) problems.push(...themeWarnings(site.theme));

if (problems.length) {
  console.error(`site.ts has ${problems.length} problem(s):`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log("site.ts is valid.");
