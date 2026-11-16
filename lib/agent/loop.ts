import type { Effort, LLMProvider, MessageParam, SystemBlock } from "@/lib/providers/llm/types";
import { usageRecord, type UsageLogger } from "@/lib/providers/llm/usage-log";
import { agentTools, runTool } from "./tools";
import type { Workspace } from "./workspace";

export const MAX_FIX_ATTEMPTS = 3;
const MAX_TURNS = 16;
/** Past this share of the budget the model is asked to finish what it is doing and stop. */
const BUDGET_WARN_SHARE = 0.7;
const BUDGET_NOTE =
  "Budget note from Gojoline: this request has nearly used its budget. Finish the step you are on, run the build if you changed files, and reply briefly. If parts of the request are not done, say which, so the owner can ask for them separately.";

export type AgentEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; name: string; path?: string }
  | { type: "build"; ok: boolean }
  | { type: "reverted" };

export interface AgentRunInput {
  llm: LLMProvider;
  workspace: Workspace;
  system: SystemBlock[];
  /** Earlier conversation (already includes prior assistant turns, replayed unchanged). */
  history: MessageParam[];
  /** The new user turn content. */
  userContent: string;
  model: string;
  usage: UsageLogger;
  context: { userId: string | null; projectId: string | null };
  onEvent?: (event: AgentEvent) => void;
  signal?: AbortSignal;
  /** Lower for small edits to an existing site (cheaper, faster); medium for first builds. */
  effort?: Effort;
  /** Fewer turns for small requests (default 16). */
  maxTurns?: number;
  /**
   * AI cost allowed for this request, in nano-USD. Near it the model is asked to wrap up; past
   * it no further model call is made, the site is built, and if it doesn't build every change
   * is undone (a site is never left half-written).
   */
  budgetNanoUsd?: number;
}

export interface AgentRunResult {
  status: "changed" | "answered" | "failed";
  /** Final text shown to the owner. */
  reply: string;
  /** Full message list to persist for the next turn. */
  messages: MessageParam[];
  changedPaths: string[];
  fixAttempts: number;
  costNanoUsd: number;
  turns: number;
  /** The run stopped because it reached its cost budget. */
  stoppedForBudget: boolean;
}

/**
 * Runs one owner request: the model edits files with tools, builds, and fixes build
 * failures at most MAX_FIX_ATTEMPTS times. If the site still doesn't build, every file
 * it touched is restored and the run reports "failed".
 */
export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const messages: MessageParam[] = [...input.history, { role: "user", content: input.userContent }];
  const originals = new Map<string, string | null>();
  const changed = new Set<string>();
  let failedBuilds = 0;
  let lastBuildOk: boolean | null = null;
  let editedSinceBuild = false;
  let cost = 0;
  let replyParts: string[] = [];
  let turns = 0;
  let stoppedForBudget = false;
  let warned = false;
  const budget = input.budgetNanoUsd ?? Infinity;
  const maxTurns = Math.min(MAX_TURNS, input.maxTurns ?? MAX_TURNS);

  const emit = (e: AgentEvent) => input.onEvent?.(e);
  /** Adds the wrap-up note to the next user turn, once, when the budget is nearly used. */
  const noteBudget = () => {
    if (warned || cost < budget * BUDGET_WARN_SHARE) return;
    warned = true;
    const last = messages.at(-1);
    if (last?.role === "user" && Array.isArray(last.content)) last.content.push({ type: "text", text: BUDGET_NOTE });
  };

  while (turns < maxTurns) {
    if (input.signal?.aborted) break;
    if (cost >= budget) {
      stoppedForBudget = true;
      break;
    }
    turns += 1;
    const response = await input.llm.complete({
      model: input.model,
      system: input.system,
      tools: agentTools,
      messages,
      maxTokens: 32_000,
      effort: input.effort ?? "medium",
      onText: (delta) => emit({ type: "text", delta }),
      signal: input.signal,
      purpose: "agent",
    });
    cost += response.costNanoUsd;
    await input.usage.log(usageRecord(response, { ...input.context, purpose: "agent" }));
    messages.push({ role: "assistant", content: response.content });

    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    if (text) replyParts = [text];

    if (response.stopReason === "refusal") break;
    const toolUses = response.content.filter((b) => b.type === "tool_use");
    // A tool input cut off by max_tokens may still parse; never run it.
    if (response.stopReason === "max_tokens" && toolUses.length) {
      // Every tool_use needs a tool_result, so answer each one with an error.
      messages.push({
        role: "user",
        content: toolUses.map((b) => ({
          type: "tool_result" as const,
          tool_use_id: b.type === "tool_use" ? b.id : "",
          content: "Not run: your reply was cut off before this call was complete. Make smaller edits.",
          is_error: true,
        })),
      });
      continue;
    }

    if (toolUses.length === 0) {
      // The model is done. If it edited without a successful build, build now.
      if (editedSinceBuild || lastBuildOk === false) {
        const build = await input.workspace.runBuild();
        emit({ type: "build", ok: build.ok });
        lastBuildOk = build.ok;
        editedSinceBuild = false;
        if (!build.ok) {
          failedBuilds += 1;
          if (failedBuilds > MAX_FIX_ATTEMPTS) break;
          messages.push({ role: "user", content: [{ type: "text", text: `The site does not build yet. Fix these problems:\n${build.output.slice(0, 8000)}` }] });
          noteBudget();
          continue;
        }
      }
      break;
    }

    const results = [];
    for (const block of toolUses) {
      if (block.type !== "tool_use") continue;
      const path = typeof (block.input as { path?: unknown })?.path === "string" ? (block.input as { path: string }).path : undefined;
      emit({ type: "tool", name: block.name, path });
      // Remember originals before the first change so a failed run can be undone.
      if ((block.name === "write_file" || block.name === "search_replace") && path) {
        const key = path.replace(/^\.\//, "");
        if (!originals.has(key)) originals.set(key, await input.workspace.readFile(key));
      }
      const outcome = await runTool(block.name, block.input, input.workspace);
      if (outcome.changedPath) {
        changed.add(outcome.changedPath);
        editedSinceBuild = true;
      }
      if (outcome.build) {
        emit({ type: "build", ok: outcome.build.ok });
        lastBuildOk = outcome.build.ok;
        editedSinceBuild = false;
        if (!outcome.build.ok) failedBuilds += 1;
      }
      results.push({ type: "tool_result" as const, tool_use_id: block.id, content: outcome.content, is_error: outcome.isError });
    }
    messages.push({ role: "user", content: results });
    noteBudget();
    if (failedBuilds > MAX_FIX_ATTEMPTS) break;
  }

  // Stopped early (budget or turns) with edits not yet built: build once now, so finished
  // work is kept when it builds and everything is undone when it doesn't.
  if (changed.size > 0 && editedSinceBuild && !input.signal?.aborted && failedBuilds <= MAX_FIX_ATTEMPTS) {
    const build = await input.workspace.runBuild();
    emit({ type: "build", ok: build.ok });
    lastBuildOk = build.ok;
    editedSinceBuild = false;
  }

  const buildBroken = changed.size > 0 && (lastBuildOk !== true || editedSinceBuild);
  if (buildBroken) {
    for (const [path, content] of originals) {
      if (content === null) await input.workspace.deleteFile(path);
      else await input.workspace.writeFile(path, content);
    }
    emit({ type: "reverted" });
    return {
      status: "failed",
      reply: "",
      messages,
      changedPaths: [],
      fixAttempts: Math.max(0, failedBuilds - 1),
      costNanoUsd: cost,
      turns,
      stoppedForBudget,
    };
  }

  return {
    status: changed.size > 0 ? "changed" : "answered",
    reply: replyParts.join("\n").trim(),
    messages,
    changedPaths: [...changed],
    fixAttempts: Math.max(0, failedBuilds),
    costNanoUsd: cost,
    turns,
    stoppedForBudget,
  };
}
