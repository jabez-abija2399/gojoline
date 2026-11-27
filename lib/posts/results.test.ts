import { describe, expect, it } from "vitest";
import { postVisitKey, summarize } from "./results";

describe("post results", () => {
  it("only counts post campaigns, with known networks", () => {
    const today = "2026-11-21";
    expect(postVisitKey("post-2026-11-21", "telegram", today)).toBe("post-2026-11-21|telegram");
    expect(postVisitKey("post-2026-10-10", "evil<script>", today)).toBe("post-2026-10-10|other");
    expect(postVisitKey("launch", "telegram", today)).toBeNull();
    expect(postVisitKey("post-2026-11-21x", "telegram", today)).toBeNull();
    expect(postVisitKey(42, "telegram", today)).toBeNull();
    // Made-up, future and old days are not counted.
    expect(postVisitKey("post-2026-02-30", "telegram", today)).toBeNull();
    expect(postVisitKey("post-9999-99-99", "telegram", today)).toBeNull();
    expect(postVisitKey("post-2026-11-22", "telegram", today)).toBeNull();
    expect(postVisitKey("post-2026-09-01", "telegram", today)).toBeNull();
  });

  it("adds visits and sign-ups per post day and per network", () => {
    const r = summarize(
      [
        { day: "2026-11-21", event: "post_visit", key: "post-2026-11-20|telegram", n: 5 },
        { day: "2026-11-22", event: "post_visit", key: "post-2026-11-20|facebook", n: 2 },
        { day: "2026-11-22", event: "click", key: "start|home", n: 9 },
      ],
      [
        { campaign: "post-2026-11-20", source: "telegram", signups: 2, paid: 1 },
        { campaign: "post-2026-11-20", source: "Instagram", signups: 1, paid: 0 },
        { campaign: "post-2026-11-20", source: "fb", signups: 1, paid: 0 },
      ],
    );
    expect(r.byDay.get("2026-11-20")).toEqual({ visits: 7, signups: 4, paid: 1 });
    // Unknown networks share one "other" row.
    expect(r.byNetwork.get("other")).toEqual({ visits: 0, signups: 2, paid: 0 });
    expect([...r.byNetwork.keys()].sort()).toEqual(["facebook", "other", "telegram"]);
    expect(r.byNetwork.get("telegram")).toEqual({ visits: 5, signups: 2, paid: 1 });
    expect(r.byNetwork.get("facebook")).toEqual({ visits: 2, signups: 0, paid: 0 });
    expect(r.total).toEqual({ visits: 7, signups: 4, paid: 1 });
  });
});
