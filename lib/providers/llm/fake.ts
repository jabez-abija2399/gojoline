import { costNanoUsd } from "./pricing";
import type { ContentBlock, LLMProvider, LLMRequest, LLMResponse, TokenUsage } from "./types";

type Scripted = { content: ContentBlock[]; stopReason?: string; usage?: TokenUsage };
type Step = Scripted | ((req: LLMRequest) => Scripted);

/** Deterministic provider for tests: replays scripted turns and records every request. */
export class ScriptedLLMProvider implements LLMProvider {
  readonly requests: LLMRequest[] = [];
  constructor(private steps: Step[]) {}

  async complete(req: LLMRequest): Promise<LLMResponse> {
    this.requests.push(structuredClone({ ...req, onText: undefined, onBlockStart: undefined, onToolInput: undefined, signal: undefined }));
    const step = this.steps.shift();
    if (!step) throw new Error("ScriptedLLMProvider: no more scripted turns");
    const { content, stopReason, usage: scriptedUsage } = typeof step === "function" ? step(req) : step;
    for (const block of content) {
      if (block.type === "text") {
        req.onBlockStart?.({ type: "text" });
        req.onText?.(block.text);
      }
      if (block.type === "tool_use") {
        req.onBlockStart?.({ type: "tool_use", name: block.name });
        req.onToolInput?.(JSON.stringify(block.input));
      }
    }
    const usage = scriptedUsage ?? { inputTokens: 1000, outputTokens: 200, cacheReadTokens: 0, cacheWriteTokens: 0 };
    return {
      content,
      stopReason: stopReason ?? (content.some((b) => b.type === "tool_use") ? "tool_use" : "end_turn"),
      model: req.model,
      usage,
      costNanoUsd: costNanoUsd(req.model, usage),
      durationMs: 1,
      firstTokenMs: 1,
    };
  }
}

let idCounter = 0;
export function textBlock(text: string): ContentBlock {
  return { type: "text", text, citations: null } as ContentBlock;
}
export function toolUseBlock(name: string, input: Record<string, unknown>): ContentBlock {
  idCounter += 1;
  return { type: "tool_use", id: `toolu_${idCounter}`, name, input } as ContentBlock;
}
