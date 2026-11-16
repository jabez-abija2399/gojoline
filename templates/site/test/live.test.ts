import { describe, expect, it } from "vitest";
import { mergeLive, shouldCount } from "../src/lib/live";
import { seoMeta } from "../src/lib/meta";
import { site } from "../src/site";

describe("live details", () => {
  it("puts the owner's details over the built-in ones and keeps the rest", () => {
    const merged = mergeLive(site, { business: { phone: "0911 22 33 44", hours: [{ days: { en: "Mon–Fri" }, time: { en: "08:00–18:00" } }] }, announcement: [{ en: "Closed today" }] });
    expect(merged.business.phone).toBe("0911 22 33 44");
    expect(merged.business.hours).toEqual([{ days: { en: "Mon–Fri" }, time: { en: "08:00–18:00" } }]);
    expect(merged.business.address).toEqual(site.business.address);
    expect(merged.announcement).toEqual([{ en: "Closed today" }]);
    expect(merged.pages).toBe(site.pages);
    expect(mergeLive(site, {}).announcement).toEqual(site.announcement);
  });
});

describe("visit counting", () => {
  const ok = { webdriver: false, host: "selam.afridea.et", owner: false, configured: true };
  it("counts real visitors on the published site", () => {
    expect(shouldCount(ok)).toBe(true);
    expect(shouldCount({ ...ok, host: "www.selamcafe.com" })).toBe(true);
  });
  it("skips the owner, robots, previews and unpublished builds", () => {
    expect(shouldCount({ ...ok, owner: true })).toBe(false);
    expect(shouldCount({ ...ok, webdriver: true })).toBe(false);
    expect(shouldCount({ ...ok, host: "sb-abc.vercel.run" })).toBe(false);
    expect(shouldCount({ ...ok, host: "localhost" })).toBe(false);
    expect(shouldCount({ ...ok, host: "gojoline.afridea.et" })).toBe(false);
    expect(shouldCount({ ...ok, configured: false })).toBe(false);
  });
});

describe("share preview", () => {
  it("reads the owner's preview and only allows the site's own photos", () => {
    expect(seoMeta(undefined)).toEqual({});
    expect(seoMeta("not json")).toEqual({});
    expect(seoMeta(JSON.stringify({ title: { en: "Selam" }, image: "/images/front.webp", icon: "https://evil.example/x.png" }))).toEqual({ title: { en: "Selam" }, description: undefined, image: "/images/front.webp", icon: undefined });
  });
});

describe("baked details and late changes", () => {
  it("reads the details baked in at publish", async () => {
    const { bakedLive } = await import("../src/lib/live");
    expect(bakedLive(undefined)).toEqual({});
    expect(bakedLive("nope")).toEqual({});
    expect(bakedLive(JSON.stringify({ business: { phone: "0911" }, announcement: [{ en: "Hi" }], offline: true }))).toEqual({ business: { phone: "0911" }, announcement: [{ en: "Hi" }] });
  });
  it("finds nothing to do when the runtime answer matches, and late lines when it doesn't", async () => {
    const { liveChange } = await import("../src/lib/live");
    const baked = { business: { phone: "0911" }, announcement: [{ en: "Free delivery" }] };
    expect(liveChange(baked, { offline: false, ...baked })).toBeNull();
    expect(liveChange(baked, { business: { phone: "0911" }, announcement: [{ en: "Closed today" }, { en: "Free delivery" }] })).toEqual({ keep: [{ en: "Free delivery" }], late: [{ en: "Closed today" }] });
    expect(liveChange(baked, { business: { phone: "0922" }, announcement: [] })).toEqual({ business: { phone: "0922" }, keep: [], late: [] });
    expect(liveChange({}, {})).toBeNull();
  });
});
