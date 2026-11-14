import { costNanoUsd } from "./pricing";
import type { ContentBlock, LLMProvider, LLMRequest, LLMResponse } from "./types";

type Step = { content: ContentBlock[]; stopReason?: string } | ((req: LLMRequest) => { content: ContentBlock[]; stopReason?: string });

/** Deterministic provider for tests: replays scripted turns and records every request. */
export class ScriptedLLMProvider implements LLMProvider {
  readonly requests: LLMRequest[] = [];
  constructor(private steps: Step[]) {}

  async complete(req: LLMRequest): Promise<LLMResponse> {
    this.requests.push(structuredClone({ ...req, onText: undefined, signal: undefined }));
    const step = this.steps.shift();
    if (!step) throw new Error("ScriptedLLMProvider: no more scripted turns");
    const { content, stopReason } = typeof step === "function" ? step(req) : step;
    for (const block of content) if (block.type === "text") req.onText?.(block.text);
    const usage = { inputTokens: 1000, outputTokens: 200, cacheReadTokens: 0, cacheWriteTokens: 0 };
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
