import { describe, expect, it } from "vitest";
import { ScriptedLLMProvider, textBlock } from "@/lib/providers/llm/fake";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import { LLMContentClassifier } from "./classifier";
import { ContentGuard, credentialFields, normalizeText, visibleText } from "./guard";
import { keywordCheck } from "./keywords";

const page = (body: string) => ({ path: "index.html", data: Buffer.from(`<html><head><script>var pin="enter your pin"</script></head><body>${body}</body></html>`) });

describe("keywordCheck", () => {
  it("lets ordinary businesses through", () => {
    for (const text of [
      "Selam Coffee. Macchiato 45 Birr. Pay with Telebirr to 0911 000 000 or CBE account 1000123456.",
      "Book a haircut. Enter your name and phone number.",
      "Our church welcomes everyone. Sunday service at 9.",
      "ቡና በ45 ብር። በቴሌብር ይክፈሉ።",
      "Pin the map to find us. We sell pistachio cakes.",
    ])
      expect(keywordCheck(text), text).toEqual([]);
  });

  it("catches phishing, scams, impersonation and illegal goods", () => {
    expect(keywordCheck("Your account is suspended. Please verify now: enter your PIN below")).toContain("phishing");
    expect(keywordCheck("Double your money in 7 days, guaranteed profit!")).toContain("scam");
    expect(keywordCheck("Official Telebirr login page")).toContain("impersonation");
    expect(keywordCheck("We sell fake passports fast")).toContain("illegal_goods");
    expect(keywordCheck("ፒን ቁጥርዎን ያስገቡ")).toContain("phishing");
  });
});

describe("ContentGuard", () => {
  it("reads only visible text (not scripts)", () => {
    expect(visibleText([page("<h1>Hi &amp; welcome</h1>")])).toBe("Hi & welcome");
    expect(keywordCheck(visibleText([page("<h1>Cafe</h1>")]))).toEqual([]);
  });

  it("blocks on keywords without calling the AI, and asks the AI otherwise", async () => {
    const llm = new ScriptedLLMProvider([{ content: [textBlock('{"ok": false, "reasons": ["violence_hate"]}')] }]);
    const usage = new MemoryUsageLogger();
    const guard = new ContentGuard(new LLMContentClassifier(llm, usage));
    const ctx = { projectId: "p", ownerId: "u", source: {} };
    expect(await guard.check({ files: [page("Guaranteed daily profit 30% daily returns")], ...ctx })).toMatchObject({ ok: false, reasons: ["scam"] });
    expect(usage.records).toHaveLength(0);
    expect(await guard.check({ files: [page("something hateful")], ...ctx })).toEqual({ ok: false, reasons: ["violence_hate"] });
    expect(usage.records[0]).toMatchObject({ purpose: "safety", userId: "u", ok: true });
    // Same text again: cached, no second AI call.
    expect(await guard.check({ files: [page("something hateful")], ...ctx })).toEqual({ ok: false, reasons: ["violence_hate"] });
    expect(usage.records).toHaveLength(1);
  });

  it("fails closed when the AI answer can't be read", async () => {
    const guard = new ContentGuard(new LLMContentClassifier(new ScriptedLLMProvider([{ content: [textBlock("sure!")] }]), new MemoryUsageLogger()));
    await expect(guard.check({ files: [page("Cafe")], source: {}, projectId: "p", ownerId: "u" })).rejects.toThrow();
  });
});

describe("guard hardening", () => {
  const json = (fields: { name: string; label: Record<string, string> }[], extra = "") =>
    ({ "src/site.json": JSON.stringify({ name: { en: `Cafe ${extra}` }, pages: [{ path: "/", sections: [{ type: "form", fields }] }] }) });

  it("finds hidden words and refuses forms that ask for PINs or passwords", async () => {
    expect(keywordCheck(normalizeText("enter your P\u200bIN"))).toContain("phishing");
    expect(credentialFields(json([{ name: "telebirr_pin", label: { en: "Telebirr PIN" } }]))).toBe(true);
    expect(credentialFields(json([{ name: "code", label: { am: "ፒን ቁጥር" } }]))).toBe(true);
    expect(credentialFields(json([{ name: "phone", label: { en: "Phone" } }]))).toBe(false);
    const guard = new ContentGuard(null);
    expect(await guard.check({ files: [page("Cafe")], source: json([{ name: "pin", label: { en: "PIN" } }]), projectId: "p", ownerId: "u" })).toMatchObject({ ok: false, reasons: ["phishing"] });
    // Words in site.json that the HTML doesn't show are checked too.
    expect(await guard.check({ files: [page("Cafe")], source: json([], "double your money"), projectId: "p", ownerId: "u" })).toMatchObject({ ok: false, reasons: ["scam"] });
    expect(visibleText([page('<input placeholder="Telebirr PIN">')])).toContain("Telebirr PIN");
  });

  it("catches words drawn by CSS and look-alike letters", async () => {
    const guard = new ContentGuard(null);
    const base = { files: [page("Cafe")], projectId: "p", ownerId: "u" };
    const css = (c: string) => ({ "src/site.json": JSON.stringify({ name: { en: "Cafe" } }), "src/styles.css": c });
    expect(await guard.check({ ...base, source: css('label::after{content:"Telebirr PIN"}') })).toMatchObject({ ok: false });
    expect(await guard.check({ ...base, source: css('li::before{content:"•"} a::after{content:" →"}') })).toEqual({ ok: true });
    expect(credentialFields({ "src/site.json": JSON.stringify({ pages: [{ sections: [{ type: "form", fields: [{ name: "x", label: { en: "\u0420IN" } }] }] }] }) })).toBe(true);
  });

  it("stays fast on malformed markup", () => {
    const evil = { path: "index.html", data: Buffer.from("<img alt=x".repeat(80_000) + "<script ".repeat(80_000)) };
    const started = Date.now();
    visibleText([evil]);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(visibleText([page('<p>a<script>enter your pin</script>b</p><style>x</style>c')])).toBe("a b c");
  });

  it("checks long sites in chunks and rejects answers with extra keys", async () => {
    const llm = new ScriptedLLMProvider([{ content: [textBlock('{"ok": true}')] }, { content: [textBlock('{"ok": false, "reasons": ["scam"]}')] }]);
    const c = new LLMContentClassifier(llm, new MemoryUsageLogger());
    expect(await c.classify("a".repeat(30_000), { userId: "u", projectId: "p" })).toEqual({ ok: false, reasons: ["scam"] });
    expect(llm.requests).toHaveLength(2);
    expect(String(llm.requests[0]!.messages[0]!.content)).toMatch(/<SITE_[0-9a-f]{16}>/);
    const sneaky = new LLMContentClassifier(new ScriptedLLMProvider([{ content: [textBlock('{"ok": true, "reasons": ["phishing"]}')] }]), new MemoryUsageLogger());
    await expect(sneaky.classify("x", { userId: "u", projectId: "p" })).rejects.toThrow();
  });
});
