import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/messages/en";
import { am } from "@/lib/i18n/messages/am";
import type { SectionType } from "@/lib/agent/progress";
import { announcedStep, listOf, writingLabel } from "./timeline-label";
import { nextTimeline, startTimeline } from "./build-timeline";

const write = (t: typeof en.builder, ...s: SectionType[]) => writingLabel(t, s);

describe("section list labels", () => {
  it("joins names the English way, lower-cased inside the sentence", () => {
    expect(write(en.builder)).toBe("Writing your site");
    expect(write(en.builder, "about")).toBe("Writing your about section");
    expect(write(en.builder, "menu", "gallery")).toBe("Writing your menu and gallery sections");
    expect(write(en.builder, "about", "gallery", "form")).toBe("Writing your about, gallery and form sections");
  });

  it("shows the newest three and counts the rest, never starting with an ellipsis", () => {
    const label = write(en.builder, "hero", "menu", "about", "gallery", "form");
    expect(label).toBe("Writing your about, gallery, form and 2 more sections");
    expect(label).not.toContain("…");
  });

  it("joins names the Amharic way", () => {
    expect(write(am.builder, "about")).toBe("ስለ እኛ ክፍልን በመጻፍ ላይ");
    expect(write(am.builder, "menu", "gallery")).toBe("ምናሌ እና የፎቶ ማዕከል ክፍሎችን በመጻፍ ላይ");
    expect(write(am.builder, "about", "gallery", "form")).toBe("ስለ እኛ፣ የፎቶ ማዕከል እና ቅጽ ክፍሎችን በመጻፍ ላይ");
    expect(write(am.builder, "hero", "about", "gallery", "form")).toBe("ስለ እኛ፣ የፎቶ ማዕከል፣ ቅጽ እና 1 ተጨማሪ ክፍሎችን በመጻፍ ላይ");
  });

  it("lists one, two and many items", () => {
    expect(listOf(en.builder, [])).toBe("");
    expect(listOf(en.builder, ["a"])).toBe("a");
    expect(listOf(en.builder, ["a", "b", "c", "d"])).toBe("a, b, c and d");
    expect(listOf(am.builder, ["ሀ", "ለ", "ሐ"])).toBe("ሀ፣ ለ እና ሐ");
  });

  it("announces the step without section names", () => {
    const tl = nextTimeline(nextTimeline(startTimeline(0), { type: "tool_start", name: "write_file" }), { type: "section", name: "menu" });
    expect(announcedStep(en.builder, tl)).toBe("Writing your site");
    expect(announcedStep(am.builder, tl)).toBe("ድረ-ገጽዎን በመጻፍ ላይ");
  });
});
