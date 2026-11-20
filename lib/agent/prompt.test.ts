import { describe, expect, it } from "vitest";
import { agentSystemPrompt, userTurn } from "./prompt";
import { WRAP_UP_NOTE, WRAP_UP_PREFIX } from "./loop";

describe("userTurn", () => {
  it("passes the languages the owner chose, and nothing when not chosen", () => {
    expect(userTurn("Café in Bole", null, [], ["en"])).toContain('<site_languages>["en"] (English, chosen by the owner)</site_languages>');
    expect(userTurn("Café", null, [], ["am", "en"])).toContain("Amharic and English");
    expect(userTurn("Make it green", "{}")).not.toContain("site_languages");
  });

  it("never passes the starter as the owner's site: a new site gets it only as a labelled format example", () => {
    const starter = '{"name":{"en":"Bole Buna House"}}';
    const first = userTurn("Lalibela Sky Lodge, a hotel", null, [], ["en"], starter);
    expect(first).toContain("<new_site/>");
    expect(first).not.toContain("<current_site_json>");
    expect(first).toContain(`<format_example>\n${starter}\n</format_example>`);
    // An existing site is edited as it is, with no example.
    const later = userTurn("Make it green", '{"name":{"en":"Lalibela Sky Lodge"}}');
    expect(later).toContain("<current_site_json>");
    expect(later).not.toContain("format_example");
    expect(later).not.toContain("<new_site/>");
  });
});

describe("agentSystemPrompt", () => {
  it("tells the agent to build a new site in one go and how to finish when the budget is low", () => {
    const rules = agentSystemPrompt()[0]!.text;
    expect(rules).toContain("write the whole src/site.json in a single write_file");
    // Unrelated questions get a short, kind redirect and no edit (and no build).
    expect(rules).toContain("If the message is not about the owner's website");
    expect(rules).toContain("don't edit anything and don't answer the question itself");
    // The starter shown for format is never the owner's content.
    expect(rules).toContain("<format_example> is another business's site, given only to show the file format");
    // The rules name the loop's signal word for word, so the model recognises it.
    expect(WRAP_UP_NOTE.startsWith("Budget low: finish now")).toBe(true);
    expect(rules).toContain(`"${WRAP_UP_PREFIX}Budget low: finish now"`);
  });
});
