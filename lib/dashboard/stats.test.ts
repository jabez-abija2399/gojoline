import { describe, expect, it } from "vitest";
import { addisDay, answerStats, messagePreview, nextStep, setupSteps, weekTrend } from "./stats";

const now = Date.UTC(2026, 10, 16, 12);

describe("answerStats", () => {
  it("builds 14 Addis days, the last 7 against the 7 before, with exact totals", () => {
    const s = answerStats([{ day: "2026-11-16", count: 2 }, { day: "2026-11-13", count: 1 }, { day: "2026-11-08", count: 1 }, { day: "2026-11-03", count: 1 }, { day: "2026-10-01", count: 9 }], { total: 812, waiting: 2 }, now);
    // Totals are the exact database counts, not the rows that were read.
    expect(s).toMatchObject({ total: 812, waiting: 2, thisWeek: 3, lastWeek: 2 });
    expect(s.perDay).toHaveLength(14);
    expect(s.perDay[0]?.day).toBe("2026-11-03");
    expect(s.perDay.at(-1)).toEqual({ day: "2026-11-16", value: 2 });
  });
  it("is empty without answers", () => {
    const s = answerStats([], { total: 0, waiting: 0 }, now);
    expect(s).toMatchObject({ total: 0, waiting: 0, thisWeek: 0, lastWeek: 0 });
    expect(s.perDay.every((d) => d.value === 0)).toBe(true);
  });
});

describe("addisDay", () => {
  it("counts by Addis Ababa days", () => {
    // 22:30 UTC on the 15th is 01:30 on the 16th in Addis Ababa.
    expect(addisDay(Date.UTC(2026, 10, 15, 22, 30))).toBe("2026-11-16");
    expect(addisDay(Date.UTC(2026, 10, 15, 20, 59))).toBe("2026-11-15");
  });
});

describe("weekTrend", () => {
  it("words the change", () => {
    expect(weekTrend({ thisWeek: 5, lastWeek: 2, total: 9 })).toEqual({ kind: "up", n: 3 });
    expect(weekTrend({ thisWeek: 1, lastWeek: 4, total: 9 })).toEqual({ kind: "down", n: 3 });
    expect(weekTrend({ thisWeek: 2, lastWeek: 2, total: 9 })).toEqual({ kind: "same" });
    expect(weekTrend({ thisWeek: 0, lastWeek: 0, total: 9 })).toEqual({ kind: "same" });
    expect(weekTrend({ thisWeek: 0, lastWeek: 0, total: 0 })).toEqual({ kind: "none" });
    // "First answers" only when they really are the first ever.
    expect(weekTrend({ thisWeek: 3, lastWeek: 0, total: 3 })).toEqual({ kind: "first" });
    expect(weekTrend({ thisWeek: 3, lastWeek: 0, total: 40 })).toEqual({ kind: "new" });
  });
});

describe("setupSteps", () => {
  it("lists the steps in order with what is done", () => {
    const steps = setupSteps({ hasVersion: true, live: false, info: false, photos: 2, telegram: false, ownDomain: false });
    expect(steps.map((s) => s.id)).toEqual(["build", "publish", "info", "photos", "telegram", "domain"]);
    expect(steps.filter((s) => s.done).map((s) => s.id)).toEqual(["build", "photos"]);
    expect(nextStep(steps)?.id).toBe("publish");
    expect(nextStep(setupSteps({ hasVersion: true, live: true, info: true, photos: 1, telegram: true, ownDomain: true }))).toBeNull();
  });
});


describe("messagePreview", () => {
  it("shows the name and the phone only (no unlabelled numbers)", () => {
    expect(messagePreview({ name: "Abebe Kebede", phone: "0911000000", people: "2" })).toBe("Abebe Kebede · 0911000000");
    expect(messagePreview({ guests: "4", note: "Window seat please" })).toBe("Window seat please");
    expect(messagePreview({ phone: "0911000000" })).toBe("0911000000");
  });
});
