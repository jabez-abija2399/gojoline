import type { PublicSite } from "./types";
import { siteOrigins } from "./submit";

/** CORS headers for the public Data API: only a site's own origins, never "*". */
export function cors(origin: string | null, methods: string): Record<string, string> {
  return origin
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": `${methods}, OPTIONS`,
        "Access-Control-Allow-Headers": "Content-Type, X-Site-Key",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      }
    : { Vary: "Origin" };
}

/** The request's Origin when it is one of the site's own addresses, else null. */
export function allowedOrigin(site: Pick<PublicSite, "url" | "customDomain"> | null, origin: string | null): string | null {
  return site && origin && siteOrigins(site).includes(origin) ? origin : null;
}
