/**
 * What the "building from a template" reveal lists: the home page's own sections, in order
 * (each kind once), read from the site's real site.json, so every step names something on the page.
 */
export function setupSections(siteJson: string, known: readonly string[], max = 7): string[] {
  try {
    const site = JSON.parse(siteJson) as { pages?: { path?: string; sections?: { type?: unknown }[] }[] };
    const home = site.pages?.find((p) => p.path === "/") ?? site.pages?.[0];
    const kinds: string[] = [];
    for (const s of home?.sections ?? []) {
      if (typeof s.type === "string" && known.includes(s.type) && !kinds.includes(s.type)) kinds.push(s.type);
    }
    return kinds.slice(0, max);
  } catch {
    return [];
  }
}
