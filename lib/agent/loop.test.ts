import { describe, expect, it } from "vitest";
import { ScriptedLLMProvider, textBlock, toolUseBlock } from "@/lib/providers/llm/fake";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import { costNanoUsd } from "@/lib/providers/llm/pricing";
import type { LLMProvider } from "@/lib/providers/llm/types";
import { MAX_FIX_ATTEMPTS, runAgent } from "./loop";
import { MemoryWorkspace } from "./workspace";

const base = { system: [{ type: "text" as const, text: "rules" }], history: [], model: "claude-opus-5-5", context: { userId: "u1", projectId: "p1" } };

describe("runAgent", () => {
  it("edits, builds and replies", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "name: 'Old'" });
    const llm = new ScriptedLLMProvider([
      { content: [toolUseBlock("search_replace", { path: "src/site.json", old_string: "Old", new_string: "New" }), toolUseBlock("run_build", {})] },
      { content: [textBlock("I renamed your café.")] },
    ]);
    const usage = new MemoryUsageLogger();
    const events: string[] = [];
    const result = await runAgent({ ...base, llm, workspace: ws, usage, userContent: "rename", onEvent: (e) => events.push(e.type) });
    expect(result.status).toBe("changed");
    expect(result.reply).toBe("I renamed your café.");
    expect(await ws.readFile("src/site.json")).toBe("name: 'New'");
    expect(usage.records).toHaveLength(2);
    expect(usage.records.every((r) => r.projectId === "p1" && Number.isInteger(r.costNanoUsd))).toBe(true);
    expect(result.costNanoUsd).toBe(usage.records.reduce((s, r) => s + r.costNanoUsd, 0));
    expect(events).toContain("build");
    // Tool results go back in one user message, in order.
    const toolResults = llm.requests[1]!.messages.at(-1)!;
    expect(Array.isArray(toolResults.content) && toolResults.content.map((c) => c.type)).toEqual(["tool_result", "tool_result"]);
  });

  it("builds automatically if the model forgets", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "a" });
    const llm = new ScriptedLLMProvider([
      { content: [toolUseBlock("write_file", { path: "src/site.json", content: "b" })] },
      { content: [textBlock("Done.")] },
    ]);
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "x" });
    expect(ws.builds).toBe(1);
    expect(result.status).toBe("changed");
  });

  it(`stops after ${MAX_FIX_ATTEMPTS} fix attempts and restores the files`, async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "good" }, () => ({ ok: false, output: "site.pages: broken" }));
    const steps = Array.from({ length: 10 }, (_, i) => ({
      content: [toolUseBlock("write_file", { path: "src/site.json", content: `bad ${i}` }), toolUseBlock("run_build", {})],
    }));
    const llm = new ScriptedLLMProvider(steps);
    const events: string[] = [];
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "x", onEvent: (e) => events.push(e.type) });
    expect(result.status).toBe("failed");
    expect(ws.builds).toBe(MAX_FIX_ATTEMPTS + 1);
    expect(await ws.readFile("src/site.json")).toBe("good");
    expect(events).toContain("reverted");
  });

  it("restores new files created by a failed run", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "good" }, (files) => ({ ok: !files.has("src/styles.css"), output: "nope" }));
    const steps = Array.from({ length: 6 }, () => ({ content: [toolUseBlock("write_file", { path: "src/styles.css", content: "x" }), toolUseBlock("run_build", {})] }));
    const result = await runAgent({ ...base, llm: new ScriptedLLMProvider(steps), workspace: ws, usage: new MemoryUsageLogger(), userContent: "x" });
    expect(result.status).toBe("failed");
    expect(await ws.readFile("src/styles.css")).toBeNull();
  });

  it("answers questions without building", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "a" });
    const llm = new ScriptedLLMProvider([{ content: [textBlock("What is your café called?")] }]);
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "make me a site" });
    expect(result.status).toBe("answered");
    expect(ws.builds).toBe(0);
  });

  it("does not run tools from a reply cut off by max_tokens", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "a" });
    const llm = new ScriptedLLMProvider([
      { content: [toolUseBlock("write_file", { path: "src/site.json", content: "trunc" })], stopReason: "max_tokens" },
      { content: [textBlock("ok")] },
    ]);
    await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "x" });
    expect(await ws.readFile("src/site.json")).toBe("a");
  });
});

describe("runAgent cost budget", () => {
  // Each scripted turn costs 0.008 USD (8e6 nano-USD) on Opus 5.5.
  const turn = 8_000_000;

  it("asks the model to wrap up near the budget, stops past it, and keeps finished work that builds", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "a" });
    const llm = new ScriptedLLMProvider([
      { content: [toolUseBlock("write_file", { path: "src/site.json", content: "b" })] },
      { content: [toolUseBlock("write_file", { path: "src/site.json", content: "c" })] },
      { content: [textBlock("never reached")] },
    ]);
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "x", budgetNanoUsd: 2 * turn });
    expect(llm.requests).toHaveLength(2);
    expect(result.stoppedForBudget).toBe(true);
    // The edits weren't built yet: the loop built them once, and they are kept.
    expect(ws.builds).toBe(1);
    expect(result.status).toBe("changed");
    expect(await ws.readFile("src/site.json")).toBe("c");
    // After the first turn (half the budget) nothing was said; after the second the note was added.
    const lastUser = llm.requests[1]!.messages.at(-1)!;
    expect(JSON.stringify(lastUser.content)).not.toContain("Budget note");
  });

  it("adds the wrap-up note once past 70% of the budget", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "a" });
    const llm = new ScriptedLLMProvider([
      { content: [toolUseBlock("read_file", { path: "src/site.json" })] },
      { content: [textBlock("Done.")] },
    ]);
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "x", budgetNanoUsd: turn + 1 });
    expect(JSON.stringify(result.messages.at(-1)!.content)).toContain("Budget note");
  });

  it("limits each turn's output to what the budget pays for, so one turn can't blow past the cap", async () => {
    // A model that always writes as much as it is allowed to.
    const requests: number[] = [];
    let n = 0;
    const greedy: LLMProvider = {
      complete: async (req) => {
        requests.push(req.maxTokens);
        n += 1;
        const usage = { inputTokens: 3000, outputTokens: req.maxTokens, cacheReadTokens: 0, cacheWriteTokens: 0 };
        const content = n < 10 ? [toolUseBlock("read_file", { path: "src/site.json" })] : [textBlock("Done.")];
        return { content, stopReason: n < 10 ? "tool_use" : "end_turn", model: req.model, usage, costNanoUsd: costNanoUsd(req.model, usage), durationMs: 1, firstTokenMs: 1 };
      },
    };
    const budget = 150_000_000; // US$0.15, one small change
    const result = await runAgent({ ...base, llm: greedy, workspace: new MemoryWorkspace({ "src/site.json": "a" }), usage: new MemoryUsageLogger(), userContent: "x", budgetNanoUsd: budget });
    expect(requests[0]).toBeLessThan(32_000);
    expect(result.stoppedForBudget).toBe(true);
    // Over by at most the smallest useful answer (1,024 Opus output tokens, about 2 US cents) plus input estimate error.
    expect(result.costNanoUsd).toBeLessThanOrEqual(budget + 1024 * 20_000 + 3000 * 4000);
    // Without a budget a turn may use the full 32k.
    requests.length = 0;
    n = 0;
    await runAgent({ ...base, llm: greedy, workspace: new MemoryWorkspace({ "src/site.json": "a" }), usage: new MemoryUsageLogger(), userContent: "x" });
    expect(requests[0]).toBe(32_000);
  });

  it("undoes everything when the budget runs out and the site doesn't build", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "ok" }, (f) => ({ ok: f.get("src/site.json") === "ok", output: "broken" }));
    const llm = new ScriptedLLMProvider([{ content: [toolUseBlock("write_file", { path: "src/site.json", content: "half" })] }]);
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "x", budgetNanoUsd: turn });
    expect(result.stoppedForBudget).toBe(true);
    expect(result.status).toBe("failed");
    expect(await ws.readFile("src/site.json")).toBe("ok");
  });

  it("takes fewer turns for small requests", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "a" });
    const llm = new ScriptedLLMProvider(Array.from({ length: 5 }, () => ({ content: [toolUseBlock("read_file", { path: "src/site.json" })] })));
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "x", maxTurns: 3 });
    expect(result.turns).toBe(3);
    expect(result.stoppedForBudget).toBe(false);
  });
});
