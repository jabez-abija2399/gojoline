import { describe, expect, it } from "vitest";
import { AnthropicLLMProvider } from "@/lib/providers/llm/anthropic";
import { DEFAULT_MODEL, formatUsd } from "@/lib/providers/llm/pricing";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import { VercelSandboxProvider } from "@/lib/providers/sandbox/vercel";
import { runAgent } from "./loop";
import { agentSystemPrompt, userTurn } from "./prompt";

const env = process.env;
const enabled = env.RUN_LLM_TESTS === "1" && !!env.SAYSITE_ANTHROPIC_API_KEY && !!env.VERCEL_TOKEN && !!env.VERCEL_TEAM_ID && !!env.VERCEL_PROJECT_ID;

// Costs real money and creates a sandbox: RUN_LLM_TESTS=1 plus Anthropic and Vercel credentials.
describe.skipIf(!enabled)("agent end to end (live)", () => {
  it("builds a site from an Amharic prompt in a Vercel Sandbox", async () => {
    const started = Date.now();
    const sandboxes = new VercelSandboxProvider({ teamId: env.VERCEL_TEAM_ID!, projectId: env.VERCEL_PROJECT_ID!, token: env.VERCEL_TOKEN!, snapshotId: env.SANDBOX_SNAPSHOT_ID });
    const site = await sandboxes.open(`itest-${Date.now()}`, null);
    const openedMs = Date.now() - started;
    try {
      const usage = new MemoryUsageLogger();
      let firstText: number | null = null;
      const result = await runAgent({
        llm: new AnthropicLLMProvider(env.SAYSITE_ANTHROPIC_API_KEY!),
        workspace: site,
        system: agentSystemPrompt(),
        history: [],
        userContent: userTurn(
          "ሰላም! ፀሐይ የውበት ሳሎን እባላለሁ፣ መገናኛ አካባቢ ነን። የፀጉር ሥራ፣ ሜካፕ እና የጥፍር አገልግሎት እንሰጣለን። ስልክ 0912 345 678። ድረ-ገጹ በአማርኛ እና በእንግሊዝኛ ይሁን።",
          await site.readFile("src/site.ts"),
        ),
        model: DEFAULT_MODEL,
        usage,
        context: { userId: null, projectId: "itest" },
        onEvent: (e) => {
          if (e.type === "text" && firstText === null) firstText = Date.now() - started;
        },
      });
      const siteTs = (await site.readFile("src/site.ts")) ?? "";
      const html = await (await fetch(site.previewUrl)).text();
      console.log({
        status: result.status,
        reply: result.reply,
        turns: result.turns,
        fixAttempts: result.fixAttempts,
        cost: formatUsd(result.costNanoUsd),
        openedMs,
        totalMs: Date.now() - started,
        firstTextMs: firstText,
        cacheRead: usage.records.map((r) => r.cacheReadTokens),
      });
      expect(result.status).toBe("changed");
      expect(siteTs).toMatch(/912\D?345\D?678/);
      expect(siteTs).toMatch(/ፀሐይ/);
      expect(html).toContain('<div id="root">');
    } finally {
      await site.stop();
    }
  }, 300_000);
});
