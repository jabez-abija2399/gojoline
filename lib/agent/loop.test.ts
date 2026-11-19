import { describe, expect, it } from "vitest";
import { ScriptedLLMProvider, textBlock, toolUseBlock } from "@/lib/providers/llm/fake";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import { costNanoUsd } from "@/lib/providers/llm/pricing";
import type { LLMProvider } from "@/lib/providers/llm/types";
import { MAX_FIX_ATTEMPTS, runAgent, WRAP_UP_NOTE, WRAP_UP_PREFIX, WRAP_UP_SHARE, type AgentEvent } from "./loop";
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

  it("reports progress as the model works: planning, the tool it starts, the sections it writes", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "{}" });
    const site = JSON.stringify({ pages: [{ sections: [{ type: "hero" }, { type: "menu" }, { type: "gallery" }, { type: "form", fields: [{ type: "text" }] }, { type: "menu" }] }] }, null, 2);
    const llm = new ScriptedLLMProvider([
      { content: [textBlock("Building your café site."), toolUseBlock("write_file", { path: "src/site.json", content: site }), toolUseBlock("run_build", {})] },
      { content: [textBlock("Done.")] },
    ]);
    const events: AgentEvent[] = [];
    await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "x", onEvent: (e) => events.push(e) });
    const progress = events.filter((e) => e.type !== "text").map((e) => (e.type === "section" || e.type === "tool_start" || e.type === "tool" ? `${e.type}:${e.name}` : e.type));
    expect(progress).toEqual([
      "plan",
      "tool_start:write_file",
      "section:hero",
      "section:menu",
      "section:gallery",
      "section:form",
      "tool_start:run_build",
      "tool:write_file",
      "tool:run_build",
      "build",
      "plan",
    ]);
  });

  it("replies only with a final turn that ended on its own, never a mid-run note", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "name: 'Old'" });
    // The last turn is a tool call followed by an empty final turn: the earlier note is not the reply.
    const llm = new ScriptedLLMProvider([
      { content: [textBlock("Primary #B85C7A (contrast vs #FCF7F6)."), toolUseBlock("search_replace", { path: "src/site.json", old_string: "Old", new_string: "New" }), toolUseBlock("run_build", {})] },
      { content: [] },
    ]);
    const r = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "pink" });
    expect(r).toMatchObject({ status: "changed", reply: "" });
    // A final turn cut off at max_tokens is not a reply either.
    const cut = new ScriptedLLMProvider([{ content: [textBlock("Let me think about #B85C7A and")], stopReason: "max_tokens" }]);
    expect((await runAgent({ ...base, llm: cut, workspace: ws, usage: new MemoryUsageLogger(), userContent: "?" })).reply).toBe("");
    const done = new ScriptedLLMProvider([{ content: [textBlock("What is your business called?")] }]);
    expect((await runAgent({ ...base, llm: done, workspace: ws, usage: new MemoryUsageLogger(), userContent: "?" })).reply).toBe("What is your business called?");
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

  it("stops past the budget and keeps finished work that builds", async () => {
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
  });

  // Typical token counts of a paid small edit (warm cache): ~US$0.04 a turn against US$0.15.
  const warmEdit = { inputTokens: 4, outputTokens: 600, cacheReadTokens: 28_608, cacheWriteTokens: 4_000 };
  const reply = { inputTokens: 2, outputTokens: 150, cacheReadTokens: 32_600, cacheWriteTokens: 800 };

  it("never tells a routine paid edit to wrap up, even with a fix round", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "price 30" }, (f) => ({ ok: !f.get("src/site.json")!.includes("bad"), output: "bad" }));
    const llm = new ScriptedLLMProvider([
      { content: [toolUseBlock("search_replace", { path: "src/site.json", old_string: "30", new_string: "45 bad" }), toolUseBlock("run_build", {})], usage: warmEdit },
      { content: [toolUseBlock("search_replace", { path: "src/site.json", old_string: " bad", new_string: "" }), toolUseBlock("run_build", {})], usage: warmEdit },
      { content: [textBlock("Buna is now 45 Birr.")], usage: reply },
    ]);
    const events: string[] = [];
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "x", budgetNanoUsd: 15 * 10_000_000, onEvent: (e) => events.push(e.type) });
    expect(JSON.stringify(llm.requests.map((r) => r.messages))).not.toContain("Budget low");
    expect(events).not.toContain("wrap_up");
    expect(result).toMatchObject({ status: "changed", reply: "Buna is now 45 Birr.", stoppedForBudget: false, turns: 3 });
  });

  it("tells a first build near its cap to wrap up, inside the tool result, not as owner text", async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "starter" });
    const llm = new ScriptedLLMProvider([
      { content: [toolUseBlock("write_file", { path: "src/site.json", content: "site" })], usage: { inputTokens: 4, outputTokens: 4576, cacheReadTokens: 0, cacheWriteTokens: 28_608 } },
      // A long second write (12,000 tokens) takes it past 60% of US$0.75.
      { content: [toolUseBlock("write_file", { path: "src/site.json", content: "bigger site" })], usage: { inputTokens: 4, outputTokens: 12_000, cacheReadTokens: 33_000, cacheWriteTokens: 5_000 } },
      { content: [toolUseBlock("run_build", {})], usage: reply },
      { content: [textBlock("Your site is ready.")], usage: reply },
    ]);
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "Selam Coffee", budgetNanoUsd: 75 * 10_000_000, strictBudget: true });
    const newest = llm.requests[2]!.messages.at(-1)!;
    expect(newest.role).toBe("user");
    const blocks = newest.content as { type: string; content?: unknown }[];
    expect(blocks.map((b) => b.type)).toEqual(["tool_result"]);
    expect(String(blocks[0]!.content)).toContain(`${WRAP_UP_PREFIX}${WRAP_UP_NOTE}`);
    expect(JSON.stringify(llm.requests[1]!.messages)).not.toContain("Budget low");
    expect(result).toMatchObject({ status: "changed", reply: "Your site is ready.", stoppedForBudget: false });
  });

  it("with a strict budget, a prompt cache that misses every turn can't take a free build past its cap", async () => {
    // Every turn misses the cache: 30,000 prompt tokens written (US$0.15) plus 4,000 out (US$0.08).
    const miss = { inputTokens: 0, outputTokens: 4000, cacheReadTokens: 0, cacheWriteTokens: 30_000 };
    const steps = Array.from({ length: 10 }, () => ({ content: [toolUseBlock("read_file", { path: "src/site.json" })], usage: miss }));
    const run = (strictBudget: boolean) =>
      runAgent({ ...base, llm: new ScriptedLLMProvider(structuredClone(steps)), workspace: new MemoryWorkspace({ "src/site.json": "a" }), usage: new MemoryUsageLogger(), userContent: "x", budgetNanoUsd: 75 * 10_000_000, strictBudget });
    const strict = await run(true);
    expect(strict.stoppedForBudget).toBe(true);
    expect(strict.costNanoUsd).toBeLessThanOrEqual(75 * 10_000_000);
    // Priced as cache reads, the same run goes one turn too far.
    const loose = await run(false);
    expect(loose.costNanoUsd).toBeGreaterThan(75 * 10_000_000);
  });

  it(`tells the model to finish now, once, past ${WRAP_UP_SHARE * 100}% of the budget`, async () => {
    const ws = new MemoryWorkspace({ "src/site.json": "a" });
    // Each turn writes 10,000 tokens (US$0.20) against a US$0.60 budget.
    const usage = { inputTokens: 0, outputTokens: 10_000, cacheReadTokens: 0, cacheWriteTokens: 0 };
    const llm = new ScriptedLLMProvider([
      { content: [toolUseBlock("write_file", { path: "src/site.json", content: "b" })], usage },
      { content: [toolUseBlock("search_replace", { path: "src/site.json", old_string: "b", new_string: "c" }), toolUseBlock("run_build", {})], usage },
      { content: [textBlock("Done.")], usage },
    ]);
    const events: string[] = [];
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "x", budgetNanoUsd: 600_000_000, onEvent: (e) => events.push(e.type) });
    // Turns 1 and 2 start below 60%: no note. Turn 3 starts at two thirds: the note, in its newest message.
    expect(llm.requests.map((r) => JSON.stringify(r.messages.at(-1)).includes(WRAP_UP_NOTE))).toEqual([false, false, true]);
    expect(events.filter((e) => e === "wrap_up")).toHaveLength(1);
    expect(result.status).toBe("changed");
    expect(result.reply).toBe("Done.");
    expect(result.stoppedForBudget).toBe(false);
  });

  it("a cold first build with the recorded token counts finishes (cache reads are not priced as writes)", async () => {
    // 2026-11-17 recording: the first turn wrote the whole site (cold cache: 28,608 tokens written,
    // 4,576 out = US$0.235); the closing reply reads that from the cache (~US$0.03). The old
    // estimate priced the cached prompt at the write price again, saw no room under US$0.40 and
    // stopped with "stopped part-way" although the site was done.
    const ws = new MemoryWorkspace({ "src/site.json": "starter" });
    const llm = new ScriptedLLMProvider([
      { content: [toolUseBlock("write_file", { path: "src/site.json", content: `{"name":"Selam Coffee",${"x".repeat(14_000)}}` }), toolUseBlock("run_build", {})], usage: { inputTokens: 4, outputTokens: 4576, cacheReadTokens: 0, cacheWriteTokens: 28_608 } },
      { content: [textBlock("Your site is ready.")], usage: { inputTokens: 2, outputTokens: 159, cacheReadTokens: 28_608, cacheWriteTokens: 4_665 } },
    ]);
    const result = await runAgent({ ...base, llm, workspace: ws, usage: new MemoryUsageLogger(), userContent: "Selam Coffee", budgetNanoUsd: 40 * 10_000_000 });
    expect(result.stoppedForBudget).toBe(false);
    expect(result.reply).toBe("Your site is ready.");
    expect(result.turns).toBe(2);
    expect(result.costNanoUsd).toBeLessThan(40 * 10_000_000);
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
