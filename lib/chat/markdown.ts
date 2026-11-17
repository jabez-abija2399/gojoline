/**
 * A small, safe markdown subset for the AI's chat replies: **bold**, *italic* / _italic_,
 * `code`, bullet lists (- or *), numbered lists (1. or 1)) and line breaks. Nothing else is
 * interpreted: links, headings, images and HTML stay plain text. The parser returns plain
 * data; renderers (React elements, Telegram HTML) escape every piece of text themselves.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; children: Inline[] }
  | { type: "italic"; children: Inline[] }
  | { type: "code"; text: string };

export type Block =
  /** Lines of one paragraph; each line is a list of inlines (rendered with line breaks between). */
  | { type: "paragraph"; lines: Inline[][] }
  | { type: "bullets"; items: Inline[][] }
  | { type: "numbers"; start: number; items: Inline[][] };

/** Replies are short; longer input is cut so parsing stays cheap. */
const MAX_CHARS = 20_000;
const BULLET = /^\s{0,3}[-*•]\s+(.*)$/;
const NUMBER = /^\s{0,3}(\d{1,3})[.)]\s+(.*)$/;
/** A heading marker is dropped (the text is kept, shown bold). */
const HEADING = /^\s{0,3}#{1,6}\s+(.*)$/;

export function parseMarkdown(source: string): Block[] {
  const lines = source.slice(0, MAX_CHARS).replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: Inline[][] | null = null;
  const closePara = () => {
    if (para?.length) blocks.push({ type: "paragraph", lines: para });
    para = null;
  };
  for (const line of lines) {
    if (!line.trim()) {
      closePara();
      continue;
    }
    const bullet = BULLET.exec(line);
    const number = bullet ? null : NUMBER.exec(line);
    const last = blocks.at(-1);
    if (bullet) {
      closePara();
      const item = parseInline(bullet[1]!);
      if (last?.type === "bullets") last.items.push(item);
      else blocks.push({ type: "bullets", items: [item] });
      continue;
    }
    if (number) {
      closePara();
      const item = parseInline(number[2]!);
      if (last?.type === "numbers") last.items.push(item);
      else blocks.push({ type: "numbers", start: Number(number[1]), items: [item] });
      continue;
    }
    const heading = HEADING.exec(line);
    const inl = heading ? [{ type: "bold" as const, children: parseInline(heading[1]!) }] : parseInline(line.trim());
    (para ??= []).push(inl);
  }
  closePara();
  return blocks;
}

/**
 * Inline marks. A mark only opens when its closing marker exists later on the same line,
 * so a lone "*" or "2 * 3" stays text. Bold and italic may nest; code holds plain text.
 */
export function parseInline(text: string, depth = 0): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ type: "text", text: buf });
    buf = "";
  };
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > i + 1) {
        flush();
        out.push({ type: "code", text: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (depth < 3 && (text.startsWith("**", i) || text.startsWith("__", i))) {
      const mark = text.slice(i, i + 2);
      const end = text.indexOf(mark, i + 2);
      if (end > i + 2 && text[i + 2] !== " ") {
        flush();
        out.push({ type: "bold", children: parseInline(text.slice(i + 2, end), depth + 1) });
        i = end + 2;
        continue;
      }
    }
    if (depth < 3 && (ch === "*" || ch === "_") && text[i + 1] !== ch) {
      // Opens only before a non-space and, for "_", not inside a word (snake_case stays text).
      const prev = text[i - 1];
      const opens = text[i + 1] !== undefined && text[i + 1] !== " " && !(ch === "_" && prev && /\w/.test(prev));
      const end = opens ? findClosing(text, ch, i + 1) : -1;
      if (end > i + 1) {
        flush();
        out.push({ type: "italic", children: parseInline(text.slice(i + 1, end), depth + 1) });
        i = end + 1;
        continue;
      }
    }
    buf += ch;
    i += 1;
  }
  flush();
  return out;
}

/** The next single marker (not part of a double one) not preceded by a space. */
function findClosing(text: string, ch: string, from: number): number {
  for (let j = from; j < text.length; j++) {
    if (text[j] !== ch) continue;
    if (text[j + 1] === ch) {
      j += 1;
      continue;
    }
    if (text[j - 1] === " ") continue;
    if (ch === "_" && /\w/.test(text[j + 1] ?? "")) continue;
    return j;
  }
  return -1;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function inlineHtml(nodes: Inline[]): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return escapeHtml(n.text);
      if (n.type === "code") return `<code>${escapeHtml(n.text)}</code>`;
      if (n.type === "bold") return `<b>${inlineHtml(n.children)}</b>`;
      return `<i>${inlineHtml(n.children)}</i>`;
    })
    .join("");
}

/**
 * Telegram's HTML parse mode (b, i, code only; it has no list tags): bullets become "• ",
 * numbered items keep their numbers. All text is escaped.
 */
export function toTelegramHtml(source: string): string {
  return parseMarkdown(source)
    .map((b) => {
      if (b.type === "paragraph") return b.lines.map(inlineHtml).join("\n");
      if (b.type === "bullets") return b.items.map((it) => `• ${inlineHtml(it)}`).join("\n");
      return b.items.map((it, k) => `${b.start + k}. ${inlineHtml(it)}`).join("\n");
    })
    .join("\n\n");
}

/** Plain text without markers (for previews, notifications and screen-reader-free contexts). */
export function toPlainText(source: string): string {
  const plain = (nodes: Inline[]): string => nodes.map((n) => (n.type === "text" || n.type === "code" ? n.text : plain(n.children))).join("");
  return parseMarkdown(source)
    .map((b) => {
      if (b.type === "paragraph") return b.lines.map(plain).join("\n");
      if (b.type === "bullets") return b.items.map((it) => `• ${plain(it)}`).join("\n");
      return b.items.map((it, k) => `${b.start + k}. ${plain(it)}`).join("\n");
    })
    .join("\n\n");
}
