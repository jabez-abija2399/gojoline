import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { costNanoUsd } from "./pricing";
import type { LLMProvider, LLMRequest, LLMResponse, SystemBlock, ToolDefinition } from "./types";

/** Models that accept the server-side refusal fallback (`fallbacks: "default"`). */
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);

export class AnthropicLLMProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    // The SDK does not read SAYSITE_ANTHROPIC_API_KEY itself; it is passed explicitly.
    this.client = new Anthropic({ apiKey, maxRetries: 2 });
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const started = Date.now();
    let firstTokenAt: number | null = null;

    const stream = this.client.beta.messages.stream(
      {
        model: req.model,
        max_tokens: req.maxTokens,
        system: withCacheBreakpoint(req.system),
        tools: req.tools.map(withEagerStreaming),
        ...(req.toolChoice ? { tool_choice: req.toolChoice } : {}),
        messages: req.messages,
        // Caches the growing conversation between agent-loop turns.
        cache_control: { type: "ephemeral" },
        output_config: req.effort ? { effort: req.effort } : undefined,
        ...(FALLBACK_MODELS.has(req.model)
          ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
          : {}),
      },
      { signal: req.signal, ...(req.timeoutMs ? { timeout: req.timeoutMs } : {}), ...(req.maxRetries !== undefined ? { maxRetries: req.maxRetries } : {}) },
    );

    stream.on("text", (delta) => {
      firstTokenAt ??= Date.now();
      req.onText?.(delta);
    });
    stream.on("streamEvent", (event) => {
      if (event.type === "content_block_delta") {
        firstTokenAt ??= Date.now();
        if (event.delta.type === "input_json_delta") req.onToolInput?.(event.delta.partial_json);
      }
      if (event.type === "content_block_start") {
        const b = event.content_block;
        if (b.type === "tool_use") req.onBlockStart?.({ type: "tool_use", name: b.name });
        else if (b.type === "thinking" || b.type === "redacted_thinking") req.onBlockStart?.({ type: "thinking" });
        else if (b.type === "text") req.onBlockStart?.({ type: "text" });
      }
    });

    const message = await stream.finalMessage();
    const usage = {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
    };
    return {
      content: message.content,
      stopReason: message.stop_reason,
      model: message.model,
      usage,
      costNanoUsd: costNanoUsd(message.model, usage),
      durationMs: Date.now() - started,
      firstTokenMs: firstTokenAt === null ? null : firstTokenAt - started,
    };
  }
}

/** One cache breakpoint at the end of the system prompt caches tools + system together. */
function withCacheBreakpoint(system: SystemBlock[]): SystemBlock[] {
  if (system.length === 0) return system;
  return system.map((block, i) =>
    i === system.length - 1 ? { ...block, cache_control: { type: "ephemeral" } } : block,
  );
}

/** Stream large tool inputs (file contents) as they are generated; the agent validates them. */
function withEagerStreaming(tool: ToolDefinition): ToolDefinition {
  return { ...tool, eager_input_streaming: true };
}
