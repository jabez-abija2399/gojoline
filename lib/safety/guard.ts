import type { PublishFile } from "@/lib/providers/publish/types";
import type { PublishGuard } from "@/lib/publish/service";
import type { ContentClassifier } from "./classifier";
import { keywordCheck } from "./keywords";

/** Visible text of the built pages (tags, scripts and styles removed), deduplicated by page. */
export function visibleText(files: PublishFile[]): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const f of files) {
    if (!f.path.endsWith(".html")) continue;
    const text = f.data
      .toString("utf8")
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(?:meta|img)\b[^>]*?(?:content|alt)="([^"]*)"[^>]*>/gi, " $1 ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    if (text && !seen.has(text)) {
      seen.add(text);
      parts.push(text);
    }
  }
  return parts.join("\n");
}

/** Blocks publishing when the site's words are harmful: keywords first, then the AI check. */
export class ContentGuard implements PublishGuard {
  constructor(private readonly classifier: ContentClassifier | null) {}

  async check(input: { files: PublishFile[]; projectId: string; ownerId: string }) {
    const text = visibleText(input.files);
    const reasons = keywordCheck(text);
    if (reasons.length) return { ok: false as const, reasons };
    if (!this.classifier) return { ok: true as const };
    return this.classifier.classify(text, { userId: input.ownerId, projectId: input.projectId });
  }
}
