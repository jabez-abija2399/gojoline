import { describe, expect, it } from "vitest";
import { answerPreview, answerStats, setupSteps, weekTrend } from "./stats";

const now = Date.UTC(2026, 10, 16, 12);
const ago = (days: number, read = true) => ({ createdAt: new Date(now - days * 86_400_000), readAt: read ? new Date(now) : null });

describe("answerStats", () => {
  it("counts this week, last week, unread and per day", () => {
    const s = answerStats([ago(0, false), ago(0.2), ago(3, false), ago(8), ago(13), ago(40)], { total: 812, unread: 2 }, now);
    // Totals are the exact database counts, not the rows that were read.
    expect(s).toMatchObject({ total: 812, unread: 2, thisWeek: 3, lastWeek: 2 });
    expect(s.perDay).toHaveLength(14);
    expect(s.perDay.at(-1)).toEqual({ day: "2026-11-16", value: 2 });
    expect(s.perDay.reduce((n, d) => n + d.value, 0)).toBe(5); // the 40-day-old one is outside
    expect(s.lastAt?.getTime()).toBe(now);
  });
  it("counts by Addis Ababa days", () => {
    // 22:30 UTC on the 15th is 01:30 on the 16th in Addis Ababa.
    const late = { createdAt: new Date(Date.UTC(2026, 10, 15, 22, 30)), readAt: null };
    expect(answerStats([late], { total: 1, unread: 1 }, now).perDay.at(-1)).toEqual({ day: "2026-11-16", value: 1 });
  });
  it("is empty without answers", () => {
    const s = answerStats([], { total: 0, unread: 0 }, now);
    expect(s).toMatchObject({ total: 0, unread: 0, thisWeek: 0, lastWeek: 0, lastAt: null });
    expect(s.perDay.every((d) => d.value === 0)).toBe(true);
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
    const steps = setupSteps({ hasVersion: true, live: false, photos: 2, telegram: false, ownDomain: false });
    expect(steps.map((s) => s.id)).toEqual(["build", "publish", "photos", "telegram", "domain"]);
    expect(steps.filter((s) => s.done).map((s) => s.id)).toEqual(["build", "photos"]);
  });
});

describe("answerPreview", () => {
  it("joins the first values and shortens long ones", () => {
    expect(answerPreview({ name: "Abebe", phone: " 0911 000 000 ", people: "2", note: "x" })).toBe("Abebe · 0911 000 000 · 2");
    expect(answerPreview({ msg: "a".repeat(60) })).toBe(`${"a".repeat(39)}…`);
    expect(answerPreview({ a: "", b: "  " })).toBe("");
  });
});
