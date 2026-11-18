import { describe, expect, it } from "vitest";
import { badgeIssues, badgeUrl } from "./badge";

describe("badgeUrl", () => {
  it("links to the app's own origin with the site's ref and utm tags", () => {
    const url = badgeUrl("https://gojoline.afridea.et/some/path", "bole-bakery");
    expect(url).toBe("https://gojoline.afridea.et/{lang}?ref=site_bole-bakery&utm_source=gojoline_badge&utm_medium=referral&utm_campaign=made_with");
    expect(url).not.toContain("gojoline.com");
    const am = new URL(url.replace("{lang}", "am"));
    expect(am.pathname).toBe("/am");
    expect(am.searchParams.get("ref")).toBe("site_bole-bakery");
  });
});

describe("badgeIssues", () => {
  const page = (html: string) => ({ path: "index.html", data: Buffer.from(html) });
  it("passes pages with the badge", () => {
    expect(badgeIssues([page('<a data-gojoline-badge="">Made with Gojoline</a>'), { path: "assets/a.js", data: Buffer.from("") }], ".x{}")).toEqual([]);
  });
  it("flags pages without it and styles that target it", () => {
    expect(badgeIssues([page("<footer></footer>")], undefined).map((i) => i.rule)).toEqual(["badge-missing"]);
    expect(badgeIssues([page("<a data-gojoline-badge>")], "[data-gojoline-badge]{display:none}").map((i) => i.rule)).toEqual(["badge-hidden"]);
  });
});
