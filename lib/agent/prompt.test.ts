import { describe, expect, it } from "vitest";
import { userTurn } from "./prompt";

describe("userTurn", () => {
  it("passes the languages the owner chose, and nothing when not chosen", () => {
    expect(userTurn("Café in Bole", null, [], ["en"])).toContain('<site_languages>["en"] (English, chosen by the owner)</site_languages>');
    expect(userTurn("Café", null, [], ["am", "en"])).toContain("Amharic and English");
    expect(userTurn("Make it green", "{}")).not.toContain("site_languages");
  });
});
