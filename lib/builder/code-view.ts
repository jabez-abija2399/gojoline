/**
 * The editor's read-only file view: each file laid out the way people read code (JSON indented,
 * one token per colour) without a highlighting library. Plain functions so they're easy to test.
 */

export type TokenKind = "key" | "string" | "number" | "literal" | "punct" | "comment" | "selector" | "property" | "text";
export interface Token {
  text: string;
  kind: TokenKind;
}

const isJson = (path: string) => path.endsWith(".json");
const isCss = (path: string) => path.endsWith(".css");

/** JSON indented by two spaces (a file that isn't valid JSON is shown as it is); other files untouched. */
export function formatFile(path: string, text: string): string {
  const body = text.replace(/\r\n?/g, "\n");
  if (!isJson(path)) return body.replace(/\s+$/, "");
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body.replace(/\s+$/, "");
  }
}

// A string followed by a colon is a key; the rest of JSON is strings, numbers, true/false/null and punctuation.
const JSON_RE = /("(?:[^"\\\n]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])/g;

function jsonLine(line: string): Token[] {
  const out: Token[] = [];
  let at = 0;
  for (const m of line.matchAll(JSON_RE)) {
    if (m.index > at) out.push({ text: line.slice(at, m.index), kind: "text" });
    if (m[1] !== undefined) {
      out.push({ text: m[1], kind: m[2] ? "key" : "string" });
      if (m[2]) out.push({ text: m[2], kind: "punct" });
    } else if (m[3] !== undefined) out.push({ text: m[3], kind: "number" });
    else if (m[4] !== undefined) out.push({ text: m[4], kind: "literal" });
    else out.push({ text: m[5]!, kind: "punct" });
    at = m.index + m[0].length;
  }
  if (at < line.length) out.push({ text: line.slice(at), kind: "text" });
  return out;
}

/** CSS by line: comments, `property: value;` pairs, and selector lines ending in `{`. */
function cssLines(lines: string[]): Token[][] {
  let inComment = false;
  return lines.map((line) => {
    const out: Token[] = [];
    let rest = line;
    while (rest.length) {
      if (inComment) {
        const end = rest.indexOf("*/");
        if (end === -1) {
          out.push({ text: rest, kind: "comment" });
          rest = "";
        } else {
          out.push({ text: rest.slice(0, end + 2), kind: "comment" });
          rest = rest.slice(end + 2);
          inComment = false;
        }
        continue;
      }
      const start = rest.indexOf("/*");
      const code = start === -1 ? rest : rest.slice(0, start);
      out.push(...cssCode(code));
      if (start === -1) rest = "";
      else {
        rest = rest.slice(start);
        inComment = true;
      }
    }
    return out.filter((t) => t.text.length > 0);
  });
}

function cssCode(code: string): Token[] {
  const decl = /^(\s*)(--[\w-]+|[a-z-]+)(\s*:\s*)([^;{}]*)(;?)(.*)$/i.exec(code);
  if (decl && !code.trimEnd().endsWith("{")) {
    return [
      { text: decl[1]!, kind: "text" },
      { text: decl[2]!, kind: "property" },
      { text: decl[3]!, kind: "punct" },
      { text: decl[4]!, kind: "string" },
      { text: decl[5]!, kind: "punct" },
      { text: decl[6]!, kind: "text" },
    ];
  }
  const brace = code.search(/[{}]/);
  if (brace === -1) return [{ text: code, kind: code.trim() ? "selector" : "text" }];
  return [
    { text: code.slice(0, brace), kind: "selector" },
    { text: code.slice(brace, brace + 1), kind: "punct" },
    ...cssCode(code.slice(brace + 1)),
  ];
}

/** The formatted file split into lines of coloured tokens. */
export function highlight(path: string, text: string): Token[][] {
  const lines = formatFile(path, text).split("\n");
  if (isJson(path)) return lines.map(jsonLine);
  if (isCss(path)) return cssLines(lines);
  return lines.map((line) => [{ text: line, kind: "text" as const }]);
}
