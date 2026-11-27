import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { publishedSiteHeaders } from "@/lib/publish/scan";

const caddyfile = readFileSync(new URL("./Caddyfile", import.meta.url), "utf8");

/** The `header { … }` lines of a snippet, as name → value. */
function snippetHeaders(name: string): Record<string, string> {
  const block = new RegExp(`\\(${name}\\) \\{\\n\\theader \\{\\n([\\s\\S]*?)\\n\\t\\}\\n\\}`).exec(caddyfile)?.[1];
  if (!block) throw new Error(`snippet ${name} not found`);
  const out: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const m = /^\s*([A-Za-z-]+) "(.*)"$/.exec(line);
    if (m) out[m[1]!] = m[2]!;
  }
  return out;
}

describe("Caddyfile: customer sites", () => {
  it("sends the same security headers as publishing does on other hosts", () => {
    const want = Object.fromEntries(publishedSiteHeaders({ dataApiOrigin: "{$SITES_API_ORIGIN}" }).map((h) => [h.key, h.value]));
    expect(snippetHeaders("site_headers")).toEqual(want);
  });

  it("serves sites read-only from the volume, with on-demand certificates checked by the runner", () => {
    expect(caddyfile).toMatch(/ask http:\/\/runner:7070\/ask/);
    const block = caddyfile.slice(caddyfile.indexOf("*.{$PUBLISH_BASE_DOMAIN} {"));
    expect(block).toContain("import sites-tls/{$SITES_TLS}.caddy");
    const tls = (f: string) => readFileSync(new URL(`./caddy/${f}`, import.meta.url), "utf8");
    expect(tls("tls.caddy")).toMatch(/tls \{\n\ton_demand\n\}/);
    expect(tls("tls-wildcard.caddy")).toContain("dns cloudflare {env.CLOUDFLARE_DNS_API_TOKEN}");
    const compose = readFileSync(new URL("./compose.yml", import.meta.url), "utf8");
    expect(compose).toContain("SITES_TLS: tls${CLOUDFLARE_DNS_API_TOKEN:+-wildcard}");
    expect(compose).toContain("CADDY_FLAVOR: plain${CLOUDFLARE_DNS_API_TOKEN:+-dns}");
    expect(tls("Dockerfile")).toMatch(/FROM caddy:2 AS plain-dns[\s\S]*FROM caddy:2 AS plain\n/);
    expect(block).toContain("import site_headers");
    expect(block).toContain("try_files /{site}/takedown.flag");
    expect(block).toContain("status 503");
    // The slug comes only from a valid single label; anything else maps to "-" (no folder).
    expect(caddyfile).toContain('~^([a-z0-9][a-z0-9-]{1,38}[a-z0-9])\\. "${1}"');
  });
});
