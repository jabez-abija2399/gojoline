/**
 * Turns what a reporter typed (a slug, a host, or a full URL) into the addresses we look up:
 * the slug itself, a custom domain, or the slug inside our hosting pattern.
 */
export function addressCandidates(input: string, urlFor: ((slug: string) => string) | null): string[] {
  const raw = input.trim().toLowerCase().slice(0, 300);
  if (!raw) return [];
  let host = raw;
  try {
    host = new URL(/^[a-z]+:\/\//.test(raw) ? raw : `https://${raw}`).hostname;
  } catch {
    return [];
  }
  host = host.replace(/^www\./, "");
  const out = new Set<string>([host]);
  if (urlFor) {
    const sample = new URL(urlFor("slugslot")).hostname;
    const [pre, post] = sample.split("slugslot") as [string, string];
    if (host.startsWith(pre) && host.endsWith(post) && host.length > pre.length + post.length) out.add(host.slice(pre.length, host.length - post.length));
  }
  return [...out].filter((x) => /^[a-z0-9.-]{1,253}$/.test(x));
}
