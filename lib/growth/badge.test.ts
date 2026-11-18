import { describe, expect, it } from "vitest";
import { addBadge, badgeHref, badgeIssues, badgeMarkup } from "./badge";

describe("badgeHref", () => {
  it("links to the app's own origin in the page's language with the site's ref and utm tags", () => {
    const url = badgeHref("https://gojoline.afridea.et/some/path", "bole-bakery", "am");
    expect(url).toBe("https://gojoline.afridea.et/am?ref=site_bole-bakery&utm_source=gojoline_badge&utm_medium=referral&utm_campaign=made_with");
    expect(url).not.toContain("gojoline.com");
  });
});

describe("addBadge", () => {
  const page = (path: string, lang: string) => ({ path, data: Buffer.from(`<!doctype html><html lang="${lang}"><body><div id="root">x</div></body></html>`) });
  it("adds the badge after the app on every page, in the page's language, and leaves other files alone", () => {
    const out = addBadge([page("index.html", "en"), page("am/index.html", "am"), { path: "assets/a.js", data: Buffer.from("x") }], "https://app.example", "bole");
    const en = out[0]!.data.toString();
    expect(en).toMatch(/<div id="root">x<\/div><gojoline-badge style="[^"]*display:block!important[^"]*"><template shadowrootmode="open">/);
    expect(en).toContain('href="https://app.example/en?ref=site_bole&amp;utm_source=gojoline_badge');
    expect(en).toContain(">Made with Gojoline</a>");
    expect(out[1]!.data.toString()).toContain(">በጎጆላይን የተሠራ</a>");
    expect(out[2]!.data.toString()).toBe("x");
  });
  it("pins every way of hiding its box", () => {
    const style = /style="([^"]*)"/.exec(badgeMarkup("/en", "en"))![1]!;
    for (const d of ["display:block", "visibility:visible", "opacity:1", "transform:none", "clip-path:none", "max-height:none", "position:static", "scale:none"]) expect(style).toContain(`${d}!important`);
  });
});

describe("badgeIssues", () => {
  it("refuses styles that name the badge, but not owners' own classes", () => {
    expect(badgeIssues("gojoline-badge{display:none}").map((i) => i.rule)).toEqual(["badge-hidden"]);
    expect(badgeIssues(".made-with-love{color:red}")).toEqual([]);
    expect(badgeIssues(undefined)).toEqual([]);
  });
});
