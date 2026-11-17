import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatMarkdown } from "./markdown";
import { parseMarkdown, toPlainText, toTelegramHtml } from "@/lib/chat/markdown";

const html = (text: string) => renderToStaticMarkup(<ChatMarkdown text={text} />);

describe("chat markdown", () => {
  it("renders bold, italic, code and line breaks", () => {
    expect(html("Hi **Selam**, *welcome*.\nSee `menu`.")).toBe(
      '<div class="chat-md flex flex-col gap-2 [overflow-wrap:anywhere]"><p>Hi <strong class="font-semibold">Selam</strong>, <em>welcome</em>.<br/>See <code class="rounded border border-line px-1 py-0.5 font-mono text-[0.9em]">menu</code>.</p></div>',
    );
  });

  it("renders the recorded reply's bullet list without stray asterisks", () => {
    const out = html("I need two things:\n- **Your Telegram username**\n- **Your phone number**\n\nThen I add them.");
    expect(out).toContain("<ul");
    expect(out).toContain('<li><strong class="font-semibold">Your Telegram username</strong></li>');
    expect(out).not.toContain("*");
  });

  it("renders numbered lists from their first number", () => {
    const blocks = parseMarkdown("3. Menu\n4) Gallery");
    expect(blocks).toEqual([{ type: "numbers", start: 3, items: [[{ type: "text", text: "Menu" }], [{ type: "text", text: "Gallery" }]] }]);
    expect(html("1. a\n2. b")).toContain('<ol start="1"');
  });

  it("leaves lone or unmatched markers as text", () => {
    expect(toPlainText("2 * 3 = 6 and a_b_c and **open")).toBe("2 * 3 = 6 and a_b_c and **open");
    expect(toPlainText("price * 2")).toBe("price * 2");
  });

  it("drops heading markers but keeps the words (bold)", () => {
    expect(html("## Menu")).toContain('<strong class="font-semibold">Menu</strong>');
  });

  it("never lets HTML through (XSS)", () => {
    const attacks = [
      "<script>alert(1)</script>",
      "**<img src=x onerror=alert(1)>**",
      "- <a href=\"javascript:alert(1)\">x</a>",
      "`</code><script>alert(1)</script>`",
      "[click](javascript:alert(1))",
      "*\"><svg onload=alert(1)>*",
    ];
    for (const a of attacks) {
      const out = html(a);
      expect(out).not.toMatch(/<(script|img|a|svg)\b/i);
      expect(out).not.toMatch(/<[^>]*\s(href|on\w+)=/i);
      if (a.includes("<")) expect(out).toContain("&lt;");
      const tg = toTelegramHtml(a);
      expect(tg).not.toMatch(/<(script|img|a|svg)\b/i);
      expect(tg).not.toMatch(/<(?!\/?(b|i|code)>)/);
    }
  });

  it("makes Telegram HTML with bullets and only b, i and code tags", () => {
    expect(toTelegramHtml("Done!\n- **Telegram** & phone\n1. *Menu*")).toBe("Done!\n\n• <b>Telegram</b> &#38; phone\n\n1. <i>Menu</i>");
  });

  it("keeps Amharic text intact", () => {
    expect(toPlainText("**ሰላም ቡና** ተዘጋጅቷል።\n- ምናሌ")).toBe("ሰላም ቡና ተዘጋጅቷል።\n\n• ምናሌ");
  });
});
