import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PRESET_IDS } from "@/lib/template/presets";

const pub = join(process.cwd(), "public");
const pages = (dir: string): string[] => readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".html")).map((f) => join(dir, f));

// The demos are built by scripts/template-demos.mjs and committed; a stale build once shipped
// pages whose photos were missing, so every picture a page names must be on disk.
describe("template demos", () => {
  it.each([...PRESET_IDS])("%s: every picture its pages use is on disk", (id) => {
    const dir = join(pub, "demo", id);
    expect(existsSync(join(dir, "index.html"))).toBe(true);
    const missing = new Set<string>();
    for (const page of pages(dir)) {
      const html = readFileSync(page, "utf8");
      const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]!).concat([...html.matchAll(/srcSet="([^"]+)"|srcset="([^"]+)"/g)].flatMap((m) => (m[1] ?? m[2]!).split(",").map((s) => s.trim().split(" ")[0]!)));
      for (const url of urls) if (url.startsWith(`/demo/${id}/`) && /\.(webp|jpg|png|avif|svg|woff2)$/.test(url) && !existsSync(join(pub, url))) missing.add(url);
    }
    expect([...missing]).toEqual([]);
  });
});
