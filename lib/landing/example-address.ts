import { z } from "zod";

const hostname = z.string().trim().toLowerCase().regex(/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/);

/**
 * The address a template's example site would have, for the preview's address bar, or null to
 * show none. Only a domain we control is used: PUBLISH_BASE_DOMAIN when it is set, or the
 * stand-in publisher in tests (an example.* domain). A shared host such as *.vercel.app is never
 * shown: that address could belong to someone else.
 */
export function exampleHost(slug: string, env: { PUBLISH_BASE_DOMAIN?: string }, publisher: { name: string; urlFor(slug: string): string } | null): string | null {
  const base = hostname.safeParse(env.PUBLISH_BASE_DOMAIN ?? "");
  if (base.success) return `${slug}.${base.data}`;
  if (publisher?.name === "memory") return new URL(publisher.urlFor(slug)).host;
  return null;
}
