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
 * small edits and a build, not for another rewrite of the site. Scaled down for small budgets
 * (at most WRAP_UP_BUDGET_SHARE of the budget), so a routine paid edit never gets the note.
 */
export const WRAP_UP_TOKENS = 6000;
export const WRAP_UP_BUDGET_SHARE = 0.3;
/** Margin on the estimate of the next turn's input (cache reads plus the new part). */
const INPUT_MARGIN = 1.2;
export const WRAP_UP_NOTE =
  "Budget low: finish now. Gojoline will stop this request soon. Keep what works. If a section the owner asked for is still missing, add a short version of it with search_replace (no full rewrites). Call run_build only if you changed files since the last build, then reply in one or two sentences. Never leave the site half-done.";
/** How the note is marked inside a tool result, so it can't be confused with the owner's words. */
export const WRAP_UP_PREFIX = "[Gojoline budget] ";

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
  /** A tool call ran (no file path: the browser only needs the tool's name). */
  | { type: "tool"; name: string }
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
  /**
   * Decide whether another turn fits by pricing the cached prompt as if the cache missed
   * (cache-write price), so the budget holds even then. For free first builds, whose budget
   * fits that; a paid small edit's whole cap is about one missed prompt, so it uses the
   * expected (cache-read) price and could otherwise never auto-fix or reply.
   */
  strictBudget?: boolean;
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
  const estimateInputCost = (cacheMiss: boolean) => {
    const chars = JSON.stringify(messages).length;
    if (lastPromptTokens === 0) return Math.ceil(((chars + fixedChars) / CHARS_PER_TOKEN) * price.input);
    const fresh = Math.max(0, chars - lastChars) / CHARS_PER_TOKEN;
    const cached = cacheMiss ? Math.max(price.cacheRead, price.cacheWrite) : price.cacheRead;
    return Math.ceil((lastPromptTokens * cached + fresh * price.cacheWrite) * INPUT_MARGIN);
  };
  const wrapUpTokens = Number.isFinite(budget) ? Math.min(WRAP_UP_TOKENS, Math.floor((WRAP_UP_BUDGET_SHARE * budget) / price.output)) : WRAP_UP_TOKENS;
  /**
   * Adds the wrap-up note, once, inside the newest tool result (never as owner-like text, so
   * an owner's message can't pose as it), and tells the owner's screen. The note goes in the
   * newest message, which isn't cached yet, so the cached prefix stays the same.
   */
  const wrapUp = () => {
    if (warned) return;
    const last = messages.at(-1);
    if (last?.role !== "user" || !Array.isArray(last.content)) return;
    const result = last.content.findLast((b) => b.type === "tool_result");
    const note = `${WRAP_UP_PREFIX}${WRAP_UP_NOTE}`;
    if (result?.type === "tool_result") {
      result.content = typeof result.content === "string" || result.content === undefined ? `${result.content ?? ""}\n\n${note}` : [...result.content, { type: "text", text: note }];
    } else {
      // The loop's own "does not build yet" message (never the owner's): the note goes with it.
      last.content.push({ type: "text", text: note });
    }
    warned = true;
    emit({ type: "wrap_up" });
  };
  const spotter = new SectionSpotter();

  while (turns < maxTurns) {
    if (input.signal?.aborted) break;
    // Each turn may only write what the remaining budget pays for, so one long answer can't
    // blow far past the cap (at most MIN_USEFUL_TOKENS over). Not enough left for its input: wrap up.
    let maxTokens = MAX_OUTPUT_TOKENS;
    if (Number.isFinite(budget)) {
      // Strict: what is left if the cached prompt missed the cache; otherwise the expected cost.
      const left = budget - cost - estimateInputCost(input.strictBudget === true);
      if (left < 0) {
        stoppedForBudget = true;
        break;
      }
      // Nearly used (expected cost): tell the model to finish a coherent site now, while it can still afford to.
      const expectedLeft = budget - cost - estimateInputCost(false);
      if (turns > 0 && (cost >= budget * WRAP_UP_SHARE || expectedLeft < wrapUpTokens * price.output)) wrapUp();
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
      emit({ type: "tool", name: block.name });
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
