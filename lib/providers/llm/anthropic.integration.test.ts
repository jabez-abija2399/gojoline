import { describe, expect, it } from "vitest";
import { AnthropicLLMProvider } from "./anthropic";
import { DEFAULT_MODEL } from "./pricing";

const key = process.env.SAYSITE_ANTHROPIC_API_KEY;
const enabled = !!key && process.env.RUN_LLM_TESTS === "1";

// Costs real money: runs only with RUN_LLM_TESTS=1 and SAYSITE_ANTHROPIC_API_KEY set.
describe.skipIf(!enabled)("AnthropicLLMProvider (live API)", () => {
  it("streams, uses tools, caches the stable prefix and reports cost", async () => {
    const llm = new AnthropicLLMProvider(key!);
    // Long enough to pass the minimum cacheable prefix.
    const stable = "You are a test assistant for Gojoline. ".repeat(400);
    const tools = [
      {
        name: "get_price",
        description: "Get a menu price in Birr.",
        input_schema: { type: "object" as const, properties: { item: { type: "string" } }, required: ["item"] },
      },
    ];
    const deltas: string[] = [];
    const first = await llm.complete({
      model: DEFAULT_MODEL,
      system: [{ type: "text", text: stable }],
      tools,
      messages: [{ role: "user", content: "Use the get_price tool for 'macchiato'. Do not answer without it." }],
      maxTokens: 2000,
      effort: "low",
      onText: (d) => deltas.push(d),
      purpose: "test",
    });
    expect(first.content.some((b) => b.type === "tool_use")).toBe(true);
    expect(first.costNanoUsd).toBeGreaterThan(0);
    expect(Number.isInteger(first.costNanoUsd)).toBe(true);

    const second = await llm.complete({
      model: DEFAULT_MODEL,
      system: [{ type: "text", text: stable }],
      tools,
      messages: [{ role: "user", content: "Say only: ok" }],
      maxTokens: 500,
      effort: "low",
      onText: (d) => deltas.push(d),
      purpose: "test",
    });
    console.log("usage", first.usage, second.usage, "ttft", second.firstTokenMs, "ms");
    expect(second.usage.cacheReadTokens).toBeGreaterThan(0);
    expect(deltas.join("").length).toBeGreaterThan(0);
  }, 120_000);
});
