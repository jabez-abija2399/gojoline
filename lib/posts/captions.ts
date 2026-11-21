import { z } from "zod";
import type { LLMProvider, ToolDefinition } from "@/lib/providers/llm/types";
import type { UsageLogger } from "@/lib/providers/llm/usage-log";
import { DEFAULT_HASHTAGS, plainCaption } from "./plan";

/** Writes a post's caption in both languages; behind an interface so tests never call the AI. */
export interface CaptionWriter {
  write(facts: { en: string; am: string }, ctx: { adminId: string; kind: string }): Promise<{ captionEn: string; captionAm: string; hashtags: string }>;
}

/** Without an AI key (dev, e2e): the facts as they are, with the call to action. */
export class PlainCaptionWriter implements CaptionWriter {
  async write(facts: { en: string; am: string }) {
    return plainCaption(facts);
  }
}

const SYSTEM = `You write one short social media post for Gojoline, an AI website builder made in Ethiopia: people describe what they want in a chat (Amharic or English) and get a live website; they pay in Birr.
Write from the facts given, nothing else: never invent prices, numbers, customers, quotes or features.
Each caption: 1 to 3 short sentences, warm and plain, at most one emoji, ending with a gentle call to action such as "Start free". No hashtags or links inside the captions (they are added separately).
captionAm is natural, everyday Amharic written for Ethiopian readers (not a word-for-word translation). captionEn is plain English.
hashtags: 3 to 5, space separated, always including #Gojoline.`;

const tool: ToolDefinition = {
  name: "post",
  description: "The post in both languages.",
  input_schema: {
    type: "object",
    properties: { captionEn: { type: "string" }, captionAm: { type: "string" }, hashtags: { type: "string" } },
    required: ["captionEn", "captionAm", "hashtags"],
  },
};

const answer = z.object({ captionEn: z.string().trim().min(10).max(600), captionAm: z.string().trim().min(5).max(600), hashtags: z.string().trim().max(200) });

/** Hashtags as we print them: #word tokens only, at most 6, always #Gojoline. */
export function cleanHashtags(raw: string): string {
  const tags = [...new Set((raw.match(/#[\p{L}\p{N}_]{2,40}/gu) ?? []).map((t) => t))];
  if (!tags.some((t) => t.toLowerCase() === "#gojoline")) tags.unshift("#Gojoline");
  return tags.slice(0, 6).join(" ") || DEFAULT_HASHTAGS;
}

/** Claude Haiku writes the caption (a few hundred tokens, a fraction of a cent, logged as "post_caption"). */
export class LLMCaptionWriter implements CaptionWriter {
  constructor(
    private readonly llm: LLMProvider,
    private readonly usage: UsageLogger,
    private readonly model = "claude-haiku-5-5",
  ) {}

  async write(facts: { en: string; am: string }, ctx: { adminId: string; kind: string }) {
    const res = await this.llm.complete({
      model: this.model,
      system: [{ type: "text", text: SYSTEM }],
      tools: [tool],
      toolChoice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: `Kind of post: ${ctx.kind}\n<facts_en>${facts.en}</facts_en>\n<facts_am>${facts.am}</facts_am>` }],
      maxTokens: 600,
      purpose: "post_caption",
      timeoutMs: 30_000,
      maxRetries: 1,
    });
    let ok = false;
    try {
      const call = res.content.find((b) => b.type === "tool_use");
      const parsed = answer.parse(call?.type === "tool_use" ? call.input : null);
      ok = true;
      return { captionEn: parsed.captionEn, captionAm: parsed.captionAm, hashtags: cleanHashtags(parsed.hashtags) };
    } finally {
      await this.usage
        .log({ userId: ctx.adminId, projectId: null, purpose: "post_caption", model: res.model, ...res.usage, costNanoUsd: res.costNanoUsd, durationMs: res.durationMs, firstTokenMs: res.firstTokenMs, stopReason: res.stopReason, ok, createdAt: new Date() })
        .catch(() => undefined);
    }
  }
}
