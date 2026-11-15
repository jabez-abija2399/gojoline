import { describe, expect, it } from "vitest";
import { MemoryEmailSender, ResendEmailSender, simpleEmail } from "./email";
import { EmailOtpSender } from "./otp";

describe("email", () => {
  it("sends through Resend's API with the sender address", async () => {
    const calls: { url: string; body: Record<string, unknown>; auth: string | null }[] = [];
    const fake = (async (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body)), auth: new Headers(init?.headers).get("authorization") });
      return new Response(JSON.stringify({ id: "e1" }), { status: 200 });
    }) as typeof fetch;
    await new ResendEmailSender("re_test", "Gojoline <login@afridea.et>", fake).send({ to: "a@b.c", subject: "Hi", text: "t", html: "<p>t</p>" });
    expect(calls[0]).toMatchObject({ url: "https://api.resend.com/emails", auth: "Bearer re_test", body: { from: "Gojoline <login@afridea.et>", to: ["a@b.c"], subject: "Hi" } });
  });

  it("reports Resend errors without leaking the key", async () => {
    const fake = (async () => new Response('{"message":"domain not verified"}', { status: 403 })) as unknown as typeof fetch;
    await expect(new ResendEmailSender("re_secret", "x@afridea.et", fake).send({ to: "a@b.c", subject: "s", text: "t", html: "h" })).rejects.toThrow(/403.*domain not verified/);
    await expect(new ResendEmailSender("re_secret", "x@afridea.et", fake).send({ to: "a@b.c", subject: "s", text: "t", html: "h" })).rejects.not.toThrow(/re_secret/);
  });

  it("sends bilingual sign-in codes by email only", async () => {
    const mail = new MemoryEmailSender();
    const otp = new EmailOtpSender(mail);
    expect(otp.supports("email")).toBe(true);
    expect(otp.supports("sms")).toBe(false);
    await otp.send({ channel: "email", to: "a@b.c", code: "123456", locale: "en" });
    expect(mail.sent[0]!.subject).toContain("123456");
    expect(mail.sent[0]!.html).toContain("የጎጆላይን መግቢያ ኮድዎ");
    await expect(otp.send({ channel: "sms", to: "+251911000000", code: "1", locale: "en" })).rejects.toThrow();
  });

  it("escapes text in the HTML", () => {
    expect(simpleEmail({ en: ["<script>"], am: [] }).html).not.toContain("<script>");
  });
});
