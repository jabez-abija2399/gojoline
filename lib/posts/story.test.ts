import { describe, expect, it } from "vitest";
import { factLines, storyFor } from "./story";

describe("text videos", () => {
  it("splits myths, steps, lists and sentences into short lines", () => {
    expect(factLines("Myth: a website is expensive. Fact: you can build it free.")).toEqual(["Myth: a website is expensive", "Fact: you can build it free"]);
    expect(factLines("How to make your first website in three steps: 1) describe your business in one message, 2) check the website Gojoline builds, 3) press Publish.")).toEqual(["Describe your business in one message", "Check the website Gojoline builds", "Press Publish"]);
    expect(factLines("A café: your menu with prices, opening hours and a map.")).toEqual(["Your menu with prices", "Opening hours", "A map"]);
    expect(factLines("Show your prices. People who already know the price are the ones who call.")).toEqual(["Show your prices", "People who already know the price are the ones who call"]);
  });

  it("uses the caption's hook as the title, drops emoji, and asks questions differently", () => {
    const tip = storyFor({ kind: "tip", subject: "tip-prices", captionEn: "Show your prices 💰\n\nPeople who know the price are the ones who call." });
    expect(tip).toMatchObject({ kicker: "Website tip", title: "Show your prices", cta: "Comment your business" });
    expect(tip!.lines).toEqual(["People who already know the price are the ones who call"]);
    expect(storyFor({ kind: "question", subject: "q-have-site", captionEn: "Quick one: does your business have a website?" })?.cta).toBe("Answer in the comments");
    expect(storyFor({ kind: "template", subject: "cafe", captionEn: "x" })).toBeNull();
    expect(storyFor({ kind: "moment", subject: "moment-meskel", captionEn: "x" })).toBeNull();
  });

  it("keeps a custom post's own words, short", () => {
    const s = storyFor({ kind: "custom", subject: null, captionEn: "Big news today!\n\nWe now support bookings. Customers can ask for a table. You see it in your dashboard." });
    expect(s?.title).toBe("Big news today!");
    expect(s?.lines).toEqual(["We now support bookings", "Customers can ask for a table", "You see it in your dashboard"]);
  });
});
