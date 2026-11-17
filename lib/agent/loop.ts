import type { Effort, LLMProvider, MessageParam, SystemBlock } from "@/lib/providers/llm/types";
import { usageRecord, type UsageLogger } from "@/lib/providers/llm/usage-log";
import { priceOf } from "@/lib/providers/llm/pricing";
import { agentTools, runTool } from "./tools";
import type { Workspace } from "./workspace";
import { SectionSpotter, type SectionType } from "./progress";

export const MAX_FIX_ATTEMPTS = 3;
const MAX_TURNS = 16;
const MAX_OUTPUT_TOKENS = 32_000;
/** Fewer output tokens than this aren't worth a turn (a tool call with a small edit). */
const MIN_USEFUL_TOKENS = 1024;
/** Rough characters per token, used only to estimate what the next turn's input will cost. */
const CHARS_PER_TOKEN = 3;
/** Past this share of the budget the model is told to wrap up (finish a coherent site now). */
export const WRAP_UP_SHARE = 0.6;
/**
 * Also wrap up when the next turn could write fewer output tokens than this: enough for a few
 * small edits and a build, not for another rewrite of the site.
 */
export const WRAP_UP_TOKENS = 6000;
/** Margin on the estimate of the next turn's input (cache reads plus the new part). */
const INPUT_MARGIN = 1.2;
export const WRAP_UP_NOTE =
  "Budget low: finish now. Gojoline will stop this request soon. Keep what works. If a section the owner asked for is still missing, add a short version of it with search_replace (no full rewrites). Then call run_build and reply in one or two sentences. Never leave the site half-done.";

export type AgentEvent =
  | { type: "text"; delta: string }
  /** The model started thinking or writing a reply before acting (progress: planning). */
  | { type: "plan" }
  /** A tool call started streaming (progress: writing starts before the call completes). */
  | { type: "tool_start"; name: string }
  /** A site section the model is writing right now, in the order it writes them. */
  | { type: "section"; name: SectionType }
  /** The budget is nearly used: the model was told to finish now. */
  | { type: "wrap_up" }
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
  const price = priceOf(input.model);
  const fixedChars = JSON.stringify(input.system).length + JSON.stringify(agentTools).length;
  let lastPromptTokens = 0;
  let lastChars = 0;
  /**
   * What the next turn's input will cost. The first turn is priced at the plain input price
   * (the system prompt may or may not be cached). After that, everything the last request
   * sent is cached (automatic caching), so it is read at the cache price; only the new part
   * (the reply and tool results) is written at the cache-write price.
   */
  const estimateInputCost = () => {
    const chars = JSON.stringify(messages).length;
    if (lastPromptTokens === 0) return Math.ceil(((chars + fixedChars) / CHARS_PER_TOKEN) * price.input);
    const fresh = Math.max(0, chars - lastChars) / CHARS_PER_TOKEN;
    return Math.ceil((lastPromptTokens * price.cacheRead + fresh * price.cacheWrite) * INPUT_MARGIN);
  };
  /** Adds the wrap-up note to the next user turn, once, and tells the owner's screen. */
  const wrapUp = () => {
    if (warned) return;
    warned = true;
    const last = messages.at(-1);
    if (last?.role !== "user") return;
    if (typeof last.content === "string") last.content = [{ type: "text", text: last.content }];
    last.content.push({ type: "text", text: WRAP_UP_NOTE });
    emit({ type: "wrap_up" });
  };
  const spotter = new SectionSpotter();

  while (turns < maxTurns) {
    if (input.signal?.aborted) break;
    // Each turn may only write what the remaining budget pays for, so one long answer can't
    // blow far past the cap (at most MIN_USEFUL_TOKENS over). Not enough left for its input: wrap up.
    let maxTokens = MAX_OUTPUT_TOKENS;
    if (Number.isFinite(budget)) {
      const left = budget - cost - estimateInputCost();
      if (left < 0) {
        stoppedForBudget = true;
        break;
      }
      // Nearly used: tell the model to finish a coherent site now, while it can still afford to.
      if (turns > 0 && (cost >= budget * WRAP_UP_SHARE || left < WRAP_UP_TOKENS * price.output)) wrapUp();
      maxTokens = Math.max(MIN_USEFUL_TOKENS, Math.min(MAX_OUTPUT_TOKENS, Math.floor(left / price.output)));
    }
    turns += 1;
    let planned = false;
    const response = await input.llm.complete({
      model: input.model,
      system: input.system,
      tools: agentTools,
      messages,
      maxTokens,
      effort: input.effort ?? "medium",
      onText: (delta) => emit({ type: "text", delta }),
      onBlockStart: (block) => {
        if (block.type === "tool_use") {
          spotter.reset();
          emit({ type: "tool_start", name: block.name ?? "" });
        } else if (!planned) {
          planned = true;
          emit({ type: "plan" });
        }
      },
      onToolInput: (partial) => {
        for (const name of spotter.feed(partial)) emit({ type: "section", name });
      },
      signal: input.signal,
      purpose: "agent",
    });
    cost += response.costNanoUsd;
    lastPromptTokens = response.usage.inputTokens + response.usage.cacheReadTokens + response.usage.cacheWriteTokens;
    lastChars = JSON.stringify(messages).length;
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
