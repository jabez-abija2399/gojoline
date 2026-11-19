import { costNanoUsd } from "./pricing";
import { textBlock, toolUseBlock } from "./fake";
import type { LLMProvider, LLMRequest, LLMResponse } from "./types";

/**
 * Deterministic stand-in used by e2e tests (E2E=1). Renames the site to the owner's message,
 * or writes a broken file when the message contains "break it", answers with markdown for
 * "telegram", asks a question (no change) for "question", and takes 1.5 s for "slowly" (6 s for "take your time"), so UI paths can be tested
 * without spending money.
 */
export class DemoLLMProvider implements LLMProvider {
  async complete(req: LLMRequest): Promise<LLMResponse> {
    const last = req.messages.at(-1);
    const lastText = typeof last?.content === "string" ? last.content : "";
    const isToolResult = Array.isArray(last?.content) && last.content.some((c) => c.type === "tool_result");
    const owner = /<owner_message>\n([\s\S]*?)\n<\/owner_message>/.exec(lastText)?.[1] ?? "";
    const current = /<current_site_json>\n([\s\S]*?)\n<\/current_site_json>/.exec(lastText)?.[1] ?? "";

    let content;
    if (isToolResult || !owner) {
      content = [textBlock("Done. I updated your site.")];
    } else if (owner.toLowerCase().includes("question")) {
      content = [textBlock("What is your business called?")];
    } else if (owner.toLowerCase().includes("telegram")) {
      // A reply with a little markdown, as the real model writes them.
      content = [textBlock("To add Telegram I need:\n- **Your Telegram username**\n- *Your phone number*")];
    } else if (owner.toLowerCase().includes("break it")) {
      content = [toolUseBlock("write_file", { path: "src/site.json", content: "BROKEN" }), toolUseBlock("run_build", {})];
    } else {
      const name = owner.replace(/["\\\n]/g, "").slice(0, 40);
      const match = /"name": \{\s*"en": "([^"]*)"/.exec(current);
      // "slowly" also writes a working note first, as the real model does between tool calls:
      // e2e checks it never reaches the owner's screen.
      const note = /\bslowly\b/i.test(owner) ? [textBlock("Primary #B85C7A (contrast vs #FCF7F6 is 4.9:1).")] : [];
      content = match
        ? [...note, toolUseBlock("search_replace", { path: "src/site.json", old_string: match[0], new_string: match[0].replace(match[1]!, name) }), toolUseBlock("run_build", {})]
        : [textBlock("I could not find the site name.")];
    }
    // Reports its blocks like a streamed reply, so the progress card moves in e2e too.
    for (const block of content) {
      if (block.type === "text") {
        req.onBlockStart?.({ type: "text" });
        req.onText?.(block.text);
      } else if (block.type === "tool_use") {
        req.onBlockStart?.({ type: "tool_use", name: block.name });
        req.onToolInput?.(JSON.stringify(block.input));
      }
    }
    // "slowly" holds the tool turn for a moment, so e2e can see the progress card move.
    // "take your time" holds it long enough to check the first-build placeholder (axe, layout).
    const pause = /take your time/i.test(owner) ? 6000 : /\bslowly\b/i.test(owner) ? 1500 : 0;
    if (pause && !isToolResult) await new Promise((r) => setTimeout(r, pause));
    const usage = { inputTokens: 100, outputTokens: 20, cacheReadTokens: 0, cacheWriteTokens: 0 };
    return {
      content,
      stopReason: content.some((b) => b.type === "tool_use") ? "tool_use" : "end_turn",
      model: req.model,
      usage,
      costNanoUsd: costNanoUsd(req.model, usage),
      durationMs: 5,
      firstTokenMs: 5,
    };
  }
}
