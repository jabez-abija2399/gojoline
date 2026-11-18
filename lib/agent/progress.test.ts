import { describe, expect, it } from "vitest";
import { SectionSpotter } from "./progress";

describe("SectionSpotter", () => {
  it("finds sections in JSON-escaped tool input split across fragments, once each", () => {
    const input = JSON.stringify({ path: "src/site.json", content: JSON.stringify({ sections: [{ type: "hero" }, { type: "gallery" }, { type: "hero" }] }, null, 2) });
    const spotter = new SectionSpotter();
    const found = [];
    for (let i = 0; i < input.length; i += 7) found.push(...spotter.feed(input.slice(i, i + 7)));
    expect(found).toEqual(["hero", "gallery"]);
  });

  it("ignores form field types and unknown names", () => {
    const spotter = new SectionSpotter();
    expect(spotter.feed('{"type": "text"} {"type": "tel"} {"type": "evil"} {"type": "faq"}')).toEqual(["faq"]);
    spotter.reset();
    expect(spotter.feed('"type":"faq"')).toEqual(["faq"]);
  });
});
