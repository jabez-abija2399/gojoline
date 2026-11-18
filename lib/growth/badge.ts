/**
 * The "Made with Gojoline" badge on Free sites links back to Gojoline itself (never a domain we
 * don't own), tagged so sign-ups from it are counted: ?ref=site_<slug> plus utm tags.
 * "{lang}" stays in the URL; the site fills in each page's language.
 */
export const BADGE_UTM = { utm_source: "gojoline_badge", utm_medium: "referral", utm_campaign: "made_with" } as const;

export function badgeUrl(appUrl: string, slug: string): string {
  const origin = new URL(appUrl).origin;
  const params = new URLSearchParams({ ref: `site_${slug}`, ...BADGE_UTM });
  return `${origin}/{lang}?${params.toString()}`;
}

/** Whether the built pages still carry the badge (every page has the footer). */
export function badgeIssues(files: { path: string; data: Buffer }[], styles: string | undefined): { file: string; rule: string; detail: string }[] {
  const issues: { file: string; rule: string; detail: string }[] = [];
  for (const f of files) {
    if (!f.path.endsWith("index.html")) continue;
    if (!f.data.toString("utf8").includes("data-gojoline-badge")) issues.push({ file: f.path, rule: "badge-missing", detail: "The Made with Gojoline badge is missing" });
  }
  // The site's own styles may not target the badge (it stays visible on Free plans).
  if (styles && /gojoline-badge|made-?with/i.test(styles)) issues.push({ file: "src/styles.css", rule: "badge-hidden", detail: "Styles may not change the Made with Gojoline badge" });
  return issues;
}
