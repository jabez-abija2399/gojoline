import { describe, expect, it } from "vitest";
import { PublicSiteCache, type PublicEntry } from "./site-cache";

const entry = (offline: boolean): PublicEntry => ({ site: { siteId: "s", projectId: "p", ownerId: "o", siteKey: "k", status: "published", url: "https://a.b", customDomain: null, offline }, business: null });

describe("PublicSiteCache", () => {
  it("reads once a minute, and again at once after invalidate", async () => {
    let now = 0;
    let loads = 0;
    let offline = false;
    const cache = new PublicSiteCache(async () => (loads++, entry(offline)), 60_000, 2, () => now);
    await cache.get("p");
    await cache.get("p");
    expect(loads).toBe(1);
    offline = true;
    cache.invalidate("p");
    expect((await cache.get("p"))?.site.offline).toBe(true);
    now += 60_001;
    await cache.get("p");
    expect(loads).toBe(3);
    // Bounded: the oldest entry goes first.
    await cache.get("q");
    await cache.get("r");
    await cache.get("p");
    expect(loads).toBe(6);
  });
});
