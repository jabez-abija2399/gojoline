import { describe, expect, it } from "vitest";
import { classifyClick, clickKey, nameOf, pageOf, parseClickKey } from "./clicks";
import { addisStart, bucketEnd, bucketOf, buckets, change, fill } from "./periods";
import { MemoryEventStore } from "./store";
import { MemoryAnalytics } from "./report";

const ORIGIN = "https://gojoline.afridea.et";

describe("analytics periods (Addis Ababa time)", () => {
  it("names day, week (Monday) and month buckets by their first day", () => {
    expect(bucketOf("2026-11-20", "day")).toBe("2026-11-20");
    expect(bucketOf("2026-11-20", "week")).toBe("2026-11-16"); // Friday → Monday
    expect(bucketOf("2026-11-16", "week")).toBe("2026-11-16");
    expect(bucketOf("2026-11-22", "week")).toBe("2026-11-16"); // Sunday belongs to the week before
    expect(bucketOf("2026-11-20", "month")).toBe("2026-11-01");
  });

  it("lists the last buckets oldest first, ending with today's in Addis Ababa", () => {
    // 22:30 UTC on the 19th is already 01:30 on the 20th in Addis Ababa.
    const now = new Date("2026-11-19T22:30:00Z");
    const days = buckets("day", now);
    expect(days).toHaveLength(14);
    expect(days.at(-1)).toBe("2026-11-20");
    expect(days[0]).toBe("2026-11-07");
    const weeks = buckets("week", now);
    expect(weeks).toHaveLength(12);
    expect(weeks.at(-1)).toBe("2026-11-16");
    expect(weeks.at(-2)).toBe("2026-11-09");
    const months = buckets("month", now);
    expect(months.at(-1)).toBe("2026-11-01");
    expect(months[0]).toBe("2025-12-01");
  });

  it("knows where buckets end and when Addis Ababa days start", () => {
    expect(bucketEnd("2026-11-16", "week")).toBe("2026-11-23");
    expect(bucketEnd("2026-12-01", "month")).toBe("2027-01-01");
    expect(addisStart("2026-11-20").toISOString()).toBe("2026-11-19T21:00:00.000Z");
  });

  it("works out the change in whole percent, none without a previous value", () => {
    expect(change(15, 10)).toBe(50);
    expect(change(5, 10)).toBe(-50);
    expect(change(5, 0)).toBeNull();
  });

  it("fills empty buckets with 0 and sums repeats", () => {
    expect(fill([{ bucket: "b", value: "2" }, { bucket: "b", value: 3 }], ["a", "b"])).toEqual([{ day: "a", value: 0 }, { day: "b", value: 5 }]);
  });
});

describe("click names", () => {
  it("names a page by its path, never the admin", () => {
    expect(pageOf("/en")).toBe("landing");
    expect(pageOf("/am/templates/cafe")).toBe("templates");
    expect(pageOf("/en/website-for/salon")).toBe("sector");
    expect(pageOf("/en/build/x")).toBe("builder");
    expect(pageOf("/en/admin")).toBeNull();
  });

  it("names a link by where it goes; ordinary app navigation isn't counted", () => {
    expect(nameOf("/en/sign-in?next=/en/build", "landing", ORIGIN)).toBe("start");
    expect(nameOf("/en/build", "landing", ORIGIN)).toBe("start");
    expect(nameOf("/en/build", "dashboard", ORIGIN)).toBeNull();
    expect(nameOf("/en/templates/cafe", "landing", ORIGIN)).toBe("template");
    expect(nameOf("https://t.me/share/url?url=x", "billing", ORIGIN)).toBe("share_telegram");
    expect(nameOf("https://t.me/gojoline_bot", "guide", ORIGIN)).toBe("telegram");
    expect(nameOf("https://example.com/", "landing", ORIGIN)).toBeNull();
    expect(nameOf("javascript:alert(1)", "landing", ORIGIN)).toBeNull();
  });

  it("takes a data-track name only from the list", () => {
    expect(classifyClick({ track: "use_template" }, "/en/templates", ORIGIN)).toEqual({ name: "use_template", page: "templates" });
    expect(classifyClick({ track: "evil<script>" }, "/en", ORIGIN)).toBeNull();
    expect(classifyClick({ href: "/en/pricing" }, "/en/admin", ORIGIN)).toBeNull();
  });

  it("stores and reads back only known keys", () => {
    expect(parseClickKey(clickKey("pricing", "landing"))).toEqual({ name: "pricing", page: "landing" });
    expect(parseClickKey("pricing:nowhere")).toBeNull();
    expect(parseClickKey("<x>:landing")).toBeNull();
  });
});

describe("analytics report (memory)", () => {
  it("counts this period's clicks by link and page, and publishes by kind", async () => {
    const events = new MemoryEventStore();
    const now = new Date("2026-11-20T09:00:00Z");
    for (let i = 0; i < 3; i++) await events.bump("2026-11-20", "click", clickKey("start", "landing"));
    await events.bump("2026-11-20", "click", clickKey("start", "guide"));
    await events.bump("2026-11-20", "click", clickKey("pricing", "landing"));
    await events.bump("2026-11-19", "click", clickKey("pricing", "landing"));
    await events.bump("2026-11-20", "publish", "update");
    const report = await new MemoryAnalytics(events, () => [{ createdAt: new Date("2026-11-20T08:00:00Z") }]).report("day", now);
    expect(report.clicks[0]).toEqual({ name: "start", total: 4, pages: [{ page: "landing", n: 3 }, { page: "guide", n: 1 }] });
    expect(report.clicks[1]).toMatchObject({ name: "pricing", total: 1 });
    expect(report.series.clicks.at(-1)).toEqual({ day: "2026-11-20", value: 5 });
    expect(report.series.clicks.at(-2)).toEqual({ day: "2026-11-19", value: 1 });
    expect(report.series.republished.at(-1)!.value).toBe(1);
    expect(report.series.signups.at(-1)!.value).toBe(1);
    expect(report.funnel.signedUp).toBe(1);
    const weekly = await new MemoryAnalytics(events, () => []).report("week", now);
    expect(weekly.series.clicks.at(-1)).toEqual({ day: "2026-11-16", value: 6 });
  });
});
