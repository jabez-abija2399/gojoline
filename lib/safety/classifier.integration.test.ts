import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { AnthropicLLMProvider } from "@/lib/providers/llm/anthropic";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import { LLMContentClassifier } from "./classifier";

const key = process.env.SAYSITE_ANTHROPIC_API_KEY;
const enabled = !!key && process.env.RUN_LLM_TESTS === "1";

// Costs real money (well under a cent): runs only with RUN_LLM_TESTS=1 and SAYSITE_ANTHROPIC_API_KEY set.
describe.skipIf(!enabled)("LLMContentClassifier (live API)", () => {
  it("passes ordinary businesses and blocks obvious abuse, in both languages", async () => {
    const usage = new MemoryUsageLogger();
    const c = new LLMContentClassifier(new AnthropicLLMProvider(key!), usage, process.env.SAFETY_MODEL || "claude-haiku-5-5");
    const ctx = { userId: "u", projectId: "p" };
    const ok = [
      "Selam Coffee, Bole. Macchiato 45 Birr, injera with tibs 250 Birr. Pay with Telebirr 0911000000 or CBE account 1000123456. Book a table below.",
      "ቅድስት ማርያም ቤተ ክርስቲያን። የእሁድ ቅዳሴ ከጠዋቱ 2 ሰዓት። ለበጎ አድራጎት ሥራችን መለገስ ይችላሉ።",
    ];
    const bad = [
      "Ethio Telecom official account center. Your SIM will be blocked today. To keep it, sign in with your phone number and Telebirr PIN below.",
      "Join our investment club: deposit 1000 Birr today and receive 3000 Birr in one week. Bring 3 friends for a bonus.",
    ];
    for (const text of ok) expect(await c.classify(text, ctx), text).toEqual({ ok: true });
    for (const text of bad) expect((await c.classify(text, ctx)).ok, text).toBe(false);
    const total = usage.records.reduce((n, r) => n + r.costNanoUsd, 0);
    console.log(`safety classifier: ${usage.records.length} calls, ${(total / 1e9).toFixed(5)} USD, model ${usage.records[0]?.model}`);
    expect(usage.records.every((r) => r.ok)).toBe(true);
  }, 120_000);

  it("reads words inside photos", async () => {
    const usage = new MemoryUsageLogger();
    const c = new LLMContentClassifier(new AnthropicLLMProvider(key!), usage, process.env.SAFETY_MODEL || "claude-haiku-5-5");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#fff"/><text x="40" y="90" font-size="44" font-family="sans-serif" fill="#0a3">telebirr</text><text x="40" y="180" font-size="30" font-family="sans-serif">Your account is locked.</text><text x="40" y="240" font-size="30" font-family="sans-serif">Enter your phone number and PIN to unlock:</text><rect x="40" y="280" width="600" height="60" fill="none" stroke="#333"/><text x="55" y="320" font-size="26" font-family="sans-serif" fill="#888">PIN ****</text></svg>`;
    const fake = await sharp(Buffer.from(svg)).png().toBuffer();
    const plain = await sharp({ create: { width: 800, height: 500, channels: 3, background: "#c8a165" } }).jpeg().toBuffer();
    const ctx = { userId: "u", projectId: "p" };
    expect(await c.classifyImages([{ name: "images/coffee.jpg", data: plain }], ctx)).toEqual({ ok: true });
    expect((await c.classifyImages([{ name: "images/login.png", data: fake }], ctx)).ok).toBe(false);
    const total = usage.records.reduce((n, r) => n + r.costNanoUsd, 0);
    console.log(`photo check: ${usage.records.length} calls, ${(total / 1e9).toFixed(5)} USD`);
  }, 120_000);
});
