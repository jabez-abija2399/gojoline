/**
 * Runs the agent eval set against the real model and real Vercel Sandboxes.
 *   npm run evals                 (all cases)
 *   EVAL_ONLY=en-cafe,am-cafe npm run evals
 * Writes evals/.runs/<timestamp>.json (full outputs for Amharic review) and prints a summary
 * table to paste into evals/RESULTS.md. Costs real money (roughly $0.05-0.15 per case).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runAgent } from "@/lib/agent/loop";
import { agentSystemPrompt, userTurn } from "@/lib/agent/prompt";
import { AnthropicLLMProvider } from "@/lib/providers/llm/anthropic";
import { DEFAULT_MODEL, formatUsd } from "@/lib/providers/llm/pricing";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import type { MessageParam } from "@/lib/providers/llm/types";
import { VercelSandboxProvider } from "@/lib/providers/sandbox/vercel";
import { cases, type EvalCase } from "./cases";

const env = process.env;
const ready = !!env.SAYSITE_ANTHROPIC_API_KEY && !!env.VERCEL_TOKEN && !!env.VERCEL_TEAM_ID && !!env.VERCEL_PROJECT_ID;
const only = env.EVAL_ONLY?.split(",").map((s) => s.trim());
const selected = only ? cases.filter((c) => only.includes(c.id)) : cases;
const CONCURRENCY = Number(env.EVAL_CONCURRENCY) || 5;

interface StepResult {
  status: string;
  firstTry: boolean;
  success: boolean;
  checksPassed: boolean;
  missing: string[];
  costNanoUsd: number;
  ms: number;
  fixAttempts: number;
  reply: string;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  firstTokenMs: number | null;
}

interface CaseResult {
  id: string;
  lang: string;
  industry: string;
  first: StepResult;
  edit?: StepResult;
  siteTs: string;
  previewOpenMs: number;
}

function check(siteTs: string, must: string[], languages?: string[]): string[] {
  const missing = must.filter((m) => !new RegExp(m, "i").test(siteTs));
  if (languages) {
    const declared = /"languages":\s*\[([^\]]*)\]/.exec(siteTs)?.[1] ?? "";
    for (const l of languages) if (!declared.includes(`"${l}"`)) missing.push(`languages:${l}`);
  }
  return missing;
}

async function runCase(c: EvalCase): Promise<CaseResult> {
  const sandboxes = new VercelSandboxProvider({ teamId: env.VERCEL_TEAM_ID!, projectId: env.VERCEL_PROJECT_ID!, token: env.VERCEL_TOKEN!, snapshotId: env.SANDBOX_SNAPSHOT_ID });
  const llm = new AnthropicLLMProvider(env.SAYSITE_ANTHROPIC_API_KEY!);
  const usage = new MemoryUsageLogger();
  const t0 = Date.now();
  const site = await sandboxes.open(`eval-${c.id}-${Date.now()}`, null);
  const previewOpenMs = Date.now() - t0;
  try {
    const step = async (prompt: string, history: MessageParam[], must: string[], languages?: string[], siteLanguages?: ("en" | "am")[]) => {
      const start = Date.now();
      const before = usage.records.length;
      const r = await runAgent({
        llm,
        workspace: site,
        system: agentSystemPrompt(),
        history,
        userContent: userTurn(prompt, await site.readFile("src/site.json"), [], siteLanguages),
        model: env.AGENT_MODEL || DEFAULT_MODEL,
        usage,
        context: { userId: null, projectId: `eval-${c.id}` },
        effort: history.length ? "low" : "medium",
      });
      const siteTs = (await site.readFile("src/site.json")) ?? "";
      const vague = c.industry === "unknown";
      const missing = vague ? [] : check(siteTs, must, languages);
      // A vague prompt should get questions, not a made-up site.
      const success = vague ? r.status === "answered" : r.status === "changed" && missing.length === 0;
      const result: StepResult = {
        status: r.status,
        firstTry: success && r.fixAttempts === 0,
        success,
        checksPassed: missing.length === 0,
        missing,
        costNanoUsd: r.costNanoUsd,
        ms: Date.now() - start + (history.length === 0 ? previewOpenMs : 0),
        fixAttempts: r.fixAttempts,
        reply: r.reply,
        cacheReadTokens: usage.records.slice(before).reduce((n, u) => n + u.cacheReadTokens, 0),
        cacheWriteTokens: usage.records.slice(before).reduce((n, u) => n + u.cacheWriteTokens, 0),
        firstTokenMs: usage.records[before]?.firstTokenMs ?? null,
      };
      return { result, reply: r.reply };
    };
    const first = await step(c.prompt, [], c.mustContain, c.languages, c.siteLanguages);
    let edit: StepResult | undefined;
    if (c.edit) {
      const history: MessageParam[] = [
        { role: "user", content: `<owner_message>\n${c.prompt}\n</owner_message>` },
        { role: "assistant", content: first.reply || "(no reply)" },
      ];
      edit = (await step(c.edit.prompt, history, c.edit.mustContain)).result;
    }
    return { id: c.id, lang: c.lang, industry: c.industry, first: first.result, edit, siteTs: (await site.readFile("src/site.json")) ?? "", previewOpenMs };
  } finally {
    await site.stop().catch(() => undefined);
  }
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]!);
      }
    }),
  );
  return out;
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "n/a");
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : 0;
};

describe.skipIf(!ready)("agent eval set", () => {
  it(`runs ${selected.length} case(s)`, async () => {
    const results = await pool(selected, CONCURRENCY, async (c) => {
      try {
        return await runCase(c);
      } catch (error) {
        const failed: StepResult = { status: "error", firstTry: false, success: false, checksPassed: false, missing: [String(error).slice(0, 200)], costNanoUsd: 0, ms: 0, fixAttempts: 0, reply: "", cacheReadTokens: 0, cacheWriteTokens: 0, firstTokenMs: null };
        return { id: c.id, lang: c.lang, industry: c.industry, first: failed, siteTs: "", previewOpenMs: 0 } satisfies CaseResult;
      }
    });

    const firsts = results.map((r) => r.first);
    const edits = results.flatMap((r) => (r.edit ? [r.edit] : []));
    const summary = {
      date: new Date().toISOString(),
      model: env.AGENT_MODEL || DEFAULT_MODEL,
      cases: results.length,
      firstTrySuccess: pct(firsts.filter((f) => f.firstTry).length, firsts.length),
      successAfterFix: pct(firsts.filter((f) => f.success).length, firsts.length),
      editSuccess: pct(edits.filter((e) => e.success).length, edits.length),
      medianCostFirst: formatUsd(median(firsts.filter((f) => f.status === "changed").map((f) => f.costNanoUsd))),
      maxCostFirst: formatUsd(Math.max(0, ...firsts.map((f) => f.costNanoUsd))),
      medianCostEdit: formatUsd(median(edits.map((e) => e.costNanoUsd))),
      medianSecondsToPreview: (median(firsts.filter((f) => f.status === "changed").map((f) => f.ms)) / 1000).toFixed(1),
      maxSecondsToPreview: (Math.max(0, ...firsts.map((f) => f.ms)) / 1000).toFixed(1),
      cacheHitRate: pct(firsts.filter((f) => f.cacheReadTokens > 0).length, firsts.length),
      medianFirstTokenSeconds: (median(firsts.flatMap((f) => (f.firstTokenMs === null ? [] : [f.firstTokenMs]))) / 1000).toFixed(1),
      totalCost: formatUsd(results.reduce((s, r) => s + r.first.costNanoUsd + (r.edit?.costNanoUsd ?? 0), 0), 2),
    };

    const dir = join(process.cwd(), "evals", ".runs");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${summary.date.replace(/[:.]/g, "-")}.json`);
    writeFileSync(file, JSON.stringify({ summary, results }, null, 2));

    console.log("\n" + JSON.stringify(summary, null, 2));
    console.log("\n| Case | First try | Success | Fixes | Cost | Seconds | Edit | Edit cost | Missing |\n|---|---|---|---|---|---|---|---|---|");
    for (const r of results) {
      console.log(
        `| ${r.id} | ${r.first.firstTry ? "yes" : "no"} | ${r.first.success ? "yes" : "no"} | ${r.first.fixAttempts} | ${formatUsd(r.first.costNanoUsd)} | ${(r.first.ms / 1000).toFixed(0)} | ${r.edit ? (r.edit.success ? "yes" : "no") : "-"} | ${r.edit ? formatUsd(r.edit.costNanoUsd) : "-"} | ${[...r.first.missing, ...(r.edit?.missing ?? [])].join(", ")} |`,
      );
    }
    console.log(`\nFull outputs: ${file}`);
    expect(results.length).toBe(selected.length);
  }, 3_600_000);
});
