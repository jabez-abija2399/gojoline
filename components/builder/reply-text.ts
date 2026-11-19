import type { Messages } from "@/lib/i18n";

/**
 * What an AI message shows. The reply is only the model's final words; when there are none (the
 * run ended on a tool call, a cut-off turn or its budget), a fixed message stands in, never notes.
 */
export function replyText(t: Messages["builder"], status: string | null | undefined, text: string): string {
  if (status === "failed") return t.reverted;
  if (text.trim()) return text;
  return status === "changed" ? t.replyChanged : t.replyMissing;
}
