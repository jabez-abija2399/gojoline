import { describe, expect, it } from "vitest";
import { agentSystemPrompt, userTurn } from "./prompt";
import { WRAP_UP_NOTE } from "./loop";

describe("userTurn", () => {
  it("passes the languages the owner chose, and nothing when not chosen", () => {
    expect(userTurn("Café in Bole", null, [], ["en"])).toContain('<site_languages>["en"] (English, chosen by the owner)</site_languages>');
    expect(userTurn("Café", null, [], ["am", "en"])).toContain("Amharic and English");
    expect(userTurn("Make it green", "{}")).not.toContain("site_languages");
  });
});

describe("agentSystemPrompt", () => {
  it("tells the agent to build a new site in one go and how to finish when the budget is low", () => {
    const rules = agentSystemPrompt()[0]!.text;
    expect(rules).toContain("write the whole src/site.json in a single write_file");
    // The rules name the loop's signal word for word, so the model recognises it.
    expect(WRAP_UP_NOTE.startsWith("Budget low: finish now")).toBe(true);
    expect(rules).toContain('"Budget low: finish now"');
  });
});
