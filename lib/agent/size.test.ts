import { describe, expect, it } from "vitest";
import { ScriptedLLMProvider, textBlock, toolUseBlock } from "@/lib/providers/llm/fake";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import type { LLMProvider } from "@/lib/providers/llm/types";
import { heuristicSize, LLMRequestSizer } from "./size";

const ctx = { userId: "u", projectId: "p" };

describe("heuristicSize (fallback)", () => {
  it.each([
    ["Make the macchiato 60 birr", "small"],
    ["Change the phone number to 0911 223344", "small"],
    ["Use my new photo at the top", "small"],
    ["Make the colours warmer", "small"],
    ["ማኪያቶ 60 ብር አድርገው", "small"],
    ["Add a new page for our catering menu", "medium"],
    ["Add a gallery section with our photos", "medium"],
    ["Restyle the header", "medium"],
    ["አዲስ ገጽ ለምግብ ዝርዝራችን ጨምር", "medium"],
    ["Redesign the whole website", "large"],
    ["Start over from scratch with a modern look", "large"],
    ["Add three new pages: rooms, events and contact", "large"],
    ["ሙሉውን ድረ-ገጽ እንደገና ሥራ", "large"],
    ["አዲስ ዲዛይን ስጠው", "large"],
  ] as const)("%s → %s", (text, size) => {
    expect(heuristicSize(text)).toBe(size);
  });

  it("treats long, detailed requests as bigger", () => {
    expect(heuristicSize("a".repeat(700))).toBe("medium");
    expect(heuristicSize("a ".repeat(900))).toBe("large");
  });
});

describe("LLMRequestSizer", () => {
  it("uses the model's forced tool answer, logs its cost as 'size', and remembers it", async () => {
    const llm = new ScriptedLLMProvider([{ content: [toolUseBlock("size_request", { size: "large" })] }]);
    const usage = new MemoryUsageLogger();
    const sizer = new LLMRequestSizer(llm, usage);
    expect(await sizer.size("make it nicer everywhere", ctx)).toBe("large");
    expect(await sizer.size("make it nicer everywhere", ctx)).toBe("large");
    expect(llm.requests).toHaveLength(1);
    const req = llm.requests[0]!;
    expect(req.model).toBe("claude-haiku-5-5");
    expect(req.toolChoice).toEqual({ type: "tool", name: "size_request" });
    expect(req.timeoutMs).toBeLessThanOrEqual(2000);
    // The request is wrapped in random markers, never sent as bare instructions.
    expect(String(req.messages[0]!.content)).toMatch(/^<REQ_[0-9a-f]{16}>\nmake it nicer everywhere\n<\/REQ_[0-9a-f]{16}>$/);
    expect(usage.records).toMatchObject([{ purpose: "size", ok: true, userId: "u", projectId: "p" }]);
  });

  it("falls back to the word list when the answer is wrong or the call fails", async () => {
    const usage = new MemoryUsageLogger();
    const bad = new LLMRequestSizer(new ScriptedLLMProvider([{ content: [textBlock("I think it's huge")] }]), usage);
    expect(await bad.size("Redesign the whole website", ctx)).toBe("large");
    expect(usage.records[0]).toMatchObject({ purpose: "size", ok: false });
    const failing: LLMProvider = { complete: async () => Promise.reject(new Error("timeout")) };
    expect(await new LLMRequestSizer(failing, usage).size("Add a new page for events", ctx)).toBe("medium");
  });

  it("never calls a long request small", async () => {
    const sizer = new LLMRequestSizer(new ScriptedLLMProvider([{ content: [toolUseBlock("size_request", { size: "small" })] }]), new MemoryUsageLogger());
    expect(await sizer.size("x ".repeat(800), ctx)).toBe("medium");
  });
});
