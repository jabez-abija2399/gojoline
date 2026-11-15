import { describe, expect, it } from "vitest";
import { ScriptedLLMProvider, textBlock, toolUseBlock } from "@/lib/providers/llm/fake";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
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
