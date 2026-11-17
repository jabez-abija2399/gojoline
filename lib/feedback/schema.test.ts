import { describe, expect, it } from "vitest";
import { adminFeedbackInput, parseFeedback } from "./schema";

const base = { type: "idea", message: "Add a dark menu", locale: "en", device: "phone" };

describe("parseFeedback", () => {
  it("accepts a plain message and fills the optional parts with null", () => {
    const r = parseFeedback(base, null);
    expect(r).toEqual({ ok: true, data: { type: "idea", message: "Add a dark menu", rating: null, page: null, locale: "en", device: "phone", userAgent: null } });
  });

  it("needs 5 to 2000 characters after trimming", () => {
    expect(parseFeedback({ ...base, message: "  hi  " }, null)).toEqual({ ok: false, field: "message" });
    expect(parseFeedback({ ...base, message: "x".repeat(2001) }, null)).toEqual({ ok: false, field: "message" });
    expect(parseFeedback({ ...base, message: "x".repeat(2000) }, null).ok).toBe(true);
    expect(parseFeedback({ ...base, message: "ሰላም ጤና" }, null).ok).toBe(true);
  });

  it("drops control characters but keeps new lines", () => {
    const r = parseFeedback({ ...base, message: "Line one\r\nLine\u0000 two" }, null);
    expect(r.ok && r.data.message).toBe("Line one\nLine two");
  });

  it("knows only the four types and ratings 1 to 5", () => {
    expect(parseFeedback({ ...base, type: "bug" }, null)).toEqual({ ok: false, field: "type" });
    expect(parseFeedback({ ...base, rating: "6" }, null)).toEqual({ ok: false, field: "rating" });
    expect(parseFeedback({ ...base, rating: "2.5" }, null)).toEqual({ ok: false, field: "rating" });
    const r = parseFeedback({ ...base, rating: "4" }, null);
    expect(r.ok && r.data.rating).toBe(4);
    const empty = parseFeedback({ ...base, rating: "" }, null);
    expect(empty.ok && empty.data.rating).toBeNull();
  });

  it("keeps only a path on our own site as the page", () => {
    const page = (p: string) => {
      const r = parseFeedback({ ...base, page: p }, null);
      return r.ok ? r.data.page : "invalid";
    };
    expect(page("/en/build/0b8f3a8e-1111-4222-8333-944445555666")).toBe("/en/build/0b8f3a8e-1111-4222-8333-944445555666");
    expect(page("https://evil.example/x")).toBeNull();
    expect(page("//evil.example/x")).toBeNull();
    expect(page("/en/build?x=<script>")).toBeNull();
    expect(page("javascript:alert(1)")).toBeNull();
  });

  it("falls back to computer for an unknown device and trims the user agent to 200", () => {
    const r = parseFeedback({ ...base, device: "fridge" }, "M".repeat(500));
    expect(r.ok && r.data.device).toBe("computer");
    expect(r.ok && r.data.userAgent?.length).toBe(200);
  });

  it("needs a known language", () => {
    expect(parseFeedback({ ...base, locale: "fr" }, null)).toEqual({ ok: false, field: "locale" });
  });
});

describe("adminFeedbackInput", () => {
  it("checks the id, the status and the reply length", () => {
    const id = "0b8f3a8e-1111-4222-8333-944445555666";
    expect(adminFeedbackInput.safeParse({ id, status: "planned", reply: "Thanks!", lang: "en" }).success).toBe(true);
    expect(adminFeedbackInput.safeParse({ id, status: "closed", reply: "", lang: "en" }).success).toBe(false);
    expect(adminFeedbackInput.safeParse({ id: "1", status: "done", reply: "", lang: "en" }).success).toBe(false);
    expect(adminFeedbackInput.safeParse({ id, status: "done", reply: "x".repeat(2001), lang: "en" }).success).toBe(false);
  });
});
