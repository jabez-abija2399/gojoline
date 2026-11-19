import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { en } from "@/lib/i18n/messages/en";
import { am } from "@/lib/i18n/messages/am";
import { SECTION_TYPES } from "@/lib/agent/progress";
import { BuildTimeline, nextTimeline, startTimeline } from "./build-timeline";
import { stepLabels } from "./timeline-label";

const writing = ["menu", "gallery", "form", "contact"].reduce((tl, name) => nextTimeline(tl, { type: "section", name }), nextTimeline(startTimeline(0), { type: "tool_start", name: "write_file" }));

describe("build timeline labels", () => {
  it("names the sections being written, newest three, in English and Amharic", () => {
    expect(renderToStaticMarkup(<BuildTimeline t={en.builder} timeline={writing} />)).toContain("Writing your gallery, form and contact sections and one more");
    expect(renderToStaticMarkup(<BuildTimeline t={am.builder} timeline={writing} />)).toContain("«የፎቶ ማዕከል»፣ «ቅጽ»፣ «አድራሻ» እና አንድ ተጨማሪ ክፍሎችን በመጻፍ ላይ");
  });

  it("announces only the current step, without the changing section names", () => {
    const html = renderToStaticMarkup(<BuildTimeline t={en.builder} timeline={writing} />);
    expect(html).toContain('<p role="status" class="sr-only">Writing your site</p>');
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).toContain('<ol aria-live="off"');
    expect(html).toContain('role="group" aria-label="Building your site"');
  });

  it("shows only step labels and section names, never the model's notes", () => {
    const noisy = nextTimeline(nextTimeline(writing, { type: "text" }), { type: "section", name: "#B85C7A (contrast vs #FCF7F6…)" });
    for (const t of [en.builder, am.builder]) {
      const html = renderToStaticMarkup(<BuildTimeline t={t} timeline={noisy} />);
      expect(html).not.toMatch(/B85C7A|FCF7F6|contrast/);
      // Every piece of text on the card is a fixed label from the messages.
      const allowed = new Set([t.tlTitle, t.tlElapsed.replace("{s}", "0"), t.tlWriting, ...Object.values(stepLabels(t, noisy)), `(${t.tlDone})`, `(${t.tlNow})`]);
      const pieces = html.split(/<[^>]+>/).map((p) => p.trim()).filter(Boolean);
      for (const piece of pieces) expect(allowed).toContain(piece);
    }
  });

  it("has a name for every section type in both languages", () => {
    for (const s of SECTION_TYPES) {
      expect(en.builder.tlSection[s]).toBeTruthy();
      expect(am.builder.tlSection[s]).toBeTruthy();
    }
  });
});
