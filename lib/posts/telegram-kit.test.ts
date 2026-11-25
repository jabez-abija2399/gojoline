import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MemorySettingsStore } from "@/lib/billing/settings";
import { BotApiClient } from "@/lib/telegram/client";
import { KitStore } from "./kit-store";
import { KIT_IDS, TELEGRAM_KIT, kitText } from "./telegram-kit";

describe("Telegram starter posts", () => {
  it("have unique ids, existing media, captions Telegram accepts and quizzes with a right answer", () => {
    expect(new Set(KIT_IDS).size).toBe(KIT_IDS.length);
    for (const p of TELEGRAM_KIT) {
      for (const m of p.media) expect(existsSync(join(process.cwd(), "public", "kit", "telegram", m.file)), m.file).toBe(true);
      expect(p.media.length).toBeLessThanOrEqual(10);
      expect(kitText(p, "https://gojoline.afridea.et/r/tg").length).toBeLessThanOrEqual(1024);
      expect(kitText(p, "x")).not.toContain("{link}");
      if (p.quiz) {
        expect(p.quiz.options[p.quiz.correct]).toBeTruthy();
        expect(p.quiz.question.length).toBeLessThanOrEqual(300);
      }
    }
  });

  it("remembers which are posted, and only known ones", async () => {
    const store = new KitStore(new MemorySettingsStore());
    await store.mark("welcome", true, "admin", new Date("2026-11-25T09:00:00Z"));
    await store.mark("not-a-post", true, "admin");
    expect(await store.posted()).toEqual({ welcome: "2026-11-25T09:00:00.000Z" });
    await store.mark("welcome", false, "admin");
    expect(await store.posted()).toEqual({});
  });

  it("sends an album as one media group with the caption on the first photo, and a quiz as a quiz poll", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const f = (async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), body: init?.body });
      return new Response(JSON.stringify({ ok: true, result: String(url).includes("sendMediaGroup") ? [{ message_id: 7 }, { message_id: 8 }] : { message_id: 9 } }));
    }) as typeof fetch;
    const tg = new BotApiClient("TOKEN", f);
    expect(await tg.album("@g", { html: "Hello", photos: [{ data: Buffer.from("a"), name: "1.jpg" }, { data: Buffer.from("b"), name: "2.jpg" }] })).toBe("7");
    const form = calls[0].body as FormData;
    const media = JSON.parse(String(form.get("media"))) as { media: string; caption?: string }[];
    expect(media.map((m) => m.media)).toEqual(["attach://p0", "attach://p1"]);
    expect(media[0].caption).toBe("Hello");
    expect(media[1].caption).toBeUndefined();
    expect(await tg.quiz("@g", { question: "Q?", options: ["a", "b"], correct: 1, explanation: "b it is" })).toBe("9");
    const poll = JSON.parse(String(calls[1].body)) as Record<string, unknown>;
    expect(poll).toMatchObject({ chat_id: "@g", type: "quiz", correct_option_id: 1, options: [{ text: "a" }, { text: "b" }] });
  });
});
