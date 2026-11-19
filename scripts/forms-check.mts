// Lists live sites whose published forms aren't registered with the Data API (visitors' answers
// would fail): a form missing from site_forms, or saved in a shape the current form schema no
// longer accepts. Read only: one READ ONLY transaction, it changes nothing. Such a site needs
// one more publish.
//   DATABASE_URL=... node --experimental-strip-types scripts/forms-check.mts
// Prints one slug per line with the form ids to fix; exits 1 when any site needs a republish.
import { pathToFileURL } from "node:url";
// The Data API's own form schema (lib/cloud/forms.ts uses the same one), by relative path so
// this runs under plain Node.
import { formSectionSchema } from "../templates/site/src/lib/schema.ts";

export interface SavedForm {
  formKey: string;
  definition: unknown;
}

/** Form ids a site.json shows that have no saved definition the Data API can read. */
export function missingForms(siteJson: string | null | undefined, saved: SavedForm[]): string[] {
  const registered = saved.filter((f) => formSectionSchema.safeParse(f.definition).success).map((f) => f.formKey);
  let site: unknown;
  try {
    site = JSON.parse(siteJson ?? "");
  } catch {
    return [];
  }
  const pages = (site as { pages?: unknown } | null)?.pages;
  const ids: string[] = [];
  for (const page of Array.isArray(pages) ? pages : []) {
    const sections = (page as { sections?: unknown } | null)?.sections;
    for (const s of Array.isArray(sections) ? sections : []) {
      const sec = s as { type?: unknown; id?: unknown } | null;
      if (sec?.type !== "form") continue;
      const id = typeof sec.id === "string" ? sec.id : "?";
      if (!registered.includes(id) && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_URL (a read-only role is enough).");
    process.exit(2);
  }
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  const [rows] = (await sql.transaction(
    [
      sql`
        select s.slug, v.files->>'src/site.json' as site_json,
          coalesce(json_agg(json_build_object('formKey', f.form_key, 'definition', f.definition)) filter (where f.form_key is not null), '[]') as saved
        from sites s
        join project_versions v on v.project_id = s.project_id and v.number = s.published_version
        left join site_forms f on f.site_id = s.id
        where s.status = 'published'
        group by s.slug, v.files
        order by s.slug`,
    ],
    { readOnly: true },
  )) as [{ slug: string; site_json: string | null; saved: SavedForm[] }[]];
  let broken = 0;
  for (const r of rows) {
    const missing = missingForms(r.site_json, r.saved);
    if (missing.length) {
      broken++;
      console.log(`${r.slug}\t${missing.join(",")}`);
    }
  }
  console.error(`${rows.length} live sites checked, ${broken} need a republish.`);
  process.exit(broken ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
