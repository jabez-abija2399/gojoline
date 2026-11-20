import { describe, expect, it } from "vitest";
import { formatFile, highlight } from "./code-view";

const join = (lines: { text: string }[][]) => lines.map((l) => l.map((t) => t.text).join("")).join("\n");

describe("formatFile", () => {
  it("indents JSON by two spaces", () => {
    expect(formatFile("src/site.json", '{"name":"Selam","open":true}')).toBe('{\n  "name": "Selam",\n  "open": true\n}');
  });
  it("leaves invalid JSON and other files as they are (minus trailing space)", () => {
    expect(formatFile("src/site.json", '{"a": \n')).toBe('{"a":');
    expect(formatFile("src/styles.css", "a{color:red}\r\n\n")).toBe("a{color:red}");
  });
});

describe("highlight", () => {
  it("keeps every character and marks keys, strings, numbers and literals", () => {
    const src = '{"name":"Bole \\"Buna\\"","rating":4.5,"open":false,"tags":["a",null]}';
    const lines = highlight("src/site.json", src);
    expect(join(lines)).toBe(formatFile("src/site.json", src));
    const all = lines.flat();
    expect(all).toContainEqual({ text: '"name"', kind: "key" });
    expect(all).toContainEqual({ text: '"Bole \\"Buna\\""', kind: "string" });
    expect(all).toContainEqual({ text: "4.5", kind: "number" });
    expect(all).toContainEqual({ text: "false", kind: "literal" });
    expect(all).toContainEqual({ text: "null", kind: "literal" });
  });

  it("marks CSS selectors, properties, values and comments, across lines", () => {
    const src = "/* brand\n colours */\n:root {\n  --accent: #ff5b35;\n}\n.hero h1 { font-weight: 700; }";
    const lines = highlight("src/styles.css", src);
    expect(join(lines)).toBe(src);
    const all = lines.flat();
    expect(all).toContainEqual({ text: " colours */", kind: "comment" });
    expect(all).toContainEqual({ text: "--accent", kind: "property" });
    expect(all).toContainEqual({ text: "#ff5b35", kind: "string" });
    expect(all).toContainEqual({ text: ".hero h1 ", kind: "selector" });
    expect(all).toContainEqual({ text: "font-weight", kind: "property" });
  });

  it("shows other files as plain lines", () => {
    expect(highlight("README.md", "# Hi\ntext")).toEqual([[{ text: "# Hi", kind: "text" }], [{ text: "text", kind: "text" }]]);
  });
});
