// Lists live sites whose published forms aren't registered with the Data API (visitors' answers
// would fail). Read only: it changes nothing. Such a site needs one more publish.
//   DATABASE_URL=... node --experimental-strip-types scripts/forms-check.mts
// Prints one slug per line with the missing form ids; exits 1 when any site needs a republish.
import { pathToFileURL } from "node:url";

/** Form ids a site.json shows that aren't among the registered form keys. */
export function missingForms(siteJson: string | null | undefined, registered: string[]): string[] {
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
  const rows = (await sql`
    select s.slug, v.files->>'src/site.json' as site_json,
      coalesce(array_agg(f.form_key) filter (where f.form_key is not null), '{}') as keys
    from sites s
    join project_versions v on v.project_id = s.project_id and v.number = s.published_version
    left join site_forms f on f.site_id = s.id
    where s.status = 'published'
    group by s.slug, v.files
    order by s.slug`) as { slug: string; site_json: string | null; keys: string[] }[];
  let broken = 0;
  for (const r of rows) {
    const missing = missingForms(r.site_json, r.keys);
    if (missing.length) {
      broken++;
      console.log(`${r.slug}\t${missing.join(",")}`);
    }
  }
  console.error(`${rows.length} live sites checked, ${broken} need a republish.`);
  process.exit(broken ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
