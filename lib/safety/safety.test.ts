import { describe, expect, it } from "vitest";
import { ScriptedLLMProvider, textBlock } from "@/lib/providers/llm/fake";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import { LLMContentClassifier } from "./classifier";
import { ContentGuard, visibleText } from "./guard";
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
    const ctx = { projectId: "p", ownerId: "u" };
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
    await expect(guard.check({ files: [page("Cafe")], projectId: "p", ownerId: "u" })).rejects.toThrow();
  });
});
