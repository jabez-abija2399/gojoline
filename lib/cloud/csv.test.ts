import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("quotes, escapes and neutralises formulas", () => {
    const csv = toCsv([
      { id: "1", siteId: "s", projectId: "p", ownerId: "o", formKey: "booking", kind: "booking", data: { name: 'A "B"', note: "=HYPERLINK(1)", tel: "+251911" }, lang: "am", readAt: null, status: "replied", createdAt: new Date("2026-11-14T10:00:00Z") },
    ]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('"date","form","status","name","note","tel"');
    expect(csv).toContain('"booking","replied"');
    expect(csv).toContain('"A ""B"""');
    expect(csv).toContain(`"'=HYPERLINK(1)"`);
    expect(csv).toContain(`"'+251911"`);
  });
});
