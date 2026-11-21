import { describe, expect, it } from "vitest";
import { postVisitKey, summarize } from "./results";

describe("post results", () => {
  it("only counts post campaigns, with known networks", () => {
    expect(postVisitKey("post-2026-11-21", "telegram")).toBe("post-2026-11-21|telegram");
    expect(postVisitKey("post-2026-11-21", "evil<script>")).toBe("post-2026-11-21|other");
    expect(postVisitKey("launch", "telegram")).toBeNull();
    expect(postVisitKey("post-2026-11-21x", "telegram")).toBeNull();
    expect(postVisitKey(42, "telegram")).toBeNull();
  });

  it("adds visits and sign-ups per post day and per network", () => {
    const r = summarize(
      [
        { day: "2026-11-21", event: "post_visit", key: "post-2026-11-20|telegram", n: 5 },
        { day: "2026-11-22", event: "post_visit", key: "post-2026-11-20|facebook", n: 2 },
        { day: "2026-11-22", event: "click", key: "start|home", n: 9 },
      ],
      [{ campaign: "post-2026-11-20", source: "telegram", signups: 2, paid: 1 }],
    );
    expect(r.byDay.get("2026-11-20")).toEqual({ visits: 7, signups: 2, paid: 1 });
    expect(r.byNetwork.get("telegram")).toEqual({ visits: 5, signups: 2, paid: 1 });
    expect(r.byNetwork.get("facebook")).toEqual({ visits: 2, signups: 0, paid: 0 });
    expect(r.total).toEqual({ visits: 7, signups: 2, paid: 1 });
  });
});
