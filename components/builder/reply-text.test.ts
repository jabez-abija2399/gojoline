import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/messages/en";
import { am } from "@/lib/i18n/messages/am";
import { replyText } from "./reply-text";

describe("replyText", () => {
  it("shows the reply, or a fixed message when the AI left none", () => {
    expect(replyText(en.builder, "answered", "What is your business called?")).toBe("What is your business called?");
    expect(replyText(en.builder, "changed", "")).toBe(en.builder.replyChanged);
    expect(replyText(am.builder, "answered", " ")).toBe(am.builder.replyMissing);
    expect(replyText(en.builder, "failed", "note")).toBe(en.builder.reverted);
  });
});
