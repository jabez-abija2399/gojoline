import { describe, expect, it } from "vitest";
import { checkOwnerText } from "@/lib/safety/guard";
import { businessTexts, seoTexts } from "./owner-text";

const ctx = { userId: "alice", projectId: "p" };

describe("content check for dashboard text", () => {
  it("collects the free text of business details and the share preview", () => {
    expect(businessTexts({ phone: "0911", address: { en: "Bole", am: "ቦሌ" }, announcement: { on: false, text: { en: "Hi" } } })).toEqual(["Bole", "ቦሌ", "Hi"]);
    expect(seoTexts({ title: { en: "Selam" }, description: { am: "ቡና" } })).toEqual(["Selam", "ቡና"]);
  });

  it("blocks phishing and scam words with the keyword rules, even hidden with look-alike letters", async () => {
    expect(await checkOwnerText(["Fresh juice every morning"], null, ctx)).toEqual({ ok: true });
    expect(await checkOwnerText(["Please enter your PIN to confirm your account"], null, ctx)).toEqual({ ok: false, reasons: ["phishing"] });
    expect(await checkOwnerText(["Double your money in a week"], null, ctx)).toMatchObject({ ok: false, reasons: ["scam"] });
    expect(await checkOwnerText(["Еnter your pаssword here"], null, ctx)).toMatchObject({ ok: false });
  });

  it("asks the AI check when one is configured", async () => {
    const seen: string[] = [];
    const classifier = { classify: async (text: string) => (seen.push(text), text.includes("bank") ? { ok: false as const, reasons: ["impersonation" as const] } : { ok: true as const }) };
    expect(await checkOwnerText(["Official bank help desk"], classifier, ctx)).toEqual({ ok: false, reasons: ["impersonation"] });
    expect(await checkOwnerText(["Café"], classifier, ctx)).toEqual({ ok: true });
    expect(await checkOwnerText([], classifier, ctx)).toEqual({ ok: true });
    expect(seen).toEqual(["Official bank help desk", "Café"]);
  });
});
