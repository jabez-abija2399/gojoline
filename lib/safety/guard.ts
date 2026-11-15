import type { PublishFile } from "@/lib/providers/publish/types";
import type { PublishGuard } from "@/lib/publish/service";
import type { ContentClassifier } from "./classifier";
import { keywordCheck } from "./keywords";
import type { SafetyReason } from "./reasons";

/** Removes tricks that hide words from the checks: look-alike forms and invisible characters. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[​-‏‪-‮⁠-⁤﻿­]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'" };
const decode = (s: string) => s.replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (_, e: string) => ENTITIES[e] ?? "");

/** Visible text of the built pages, plus words in attributes people see (alt, title, placeholders...). */
export function visibleText(files: PublishFile[]): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const f of files) {
    if (!f.path.endsWith(".html")) continue;
    const html = f.data.toString("utf8").replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ");
    const attrs = [...html.matchAll(/\s(?:alt|title|placeholder|aria-label|value|content|label)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)].map((m) => m[1] ?? m[2] ?? "");
    const text = normalizeText(decode(`${html.replace(/<[^>]+>/g, " ")} ${attrs.join(" ")}`));
    if (text && !seen.has(text)) {
      seen.add(text);
      parts.push(text);
    }
  }
  return parts.join("\n");
}

/** Every string in site.json: the source of all the words a site can ever show. */
export function sourceText(source: Record<string, string>): string {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  try {
    walk(JSON.parse(source["src/site.json"] ?? "{}"));
  } catch {
    /* an unreadable site.json never builds, so there is nothing to check */
  }
  return normalizeText(out.join("\n"));
}

const CREDENTIAL_FIELD = /\b(pin|otp|password|passcode|passwd|cvv|cvc|card[\s_-]?number|secret[\s_-]?code)\b|ፒን|የይለፍ\s?ቃል|ሚስጥር\s?ቁጥር/i;

/** Forms must never ask visitors for passwords, PINs or card details. */
export function credentialFields(source: Record<string, string>): boolean {
  try {
    const site = JSON.parse(source["src/site.json"] ?? "{}") as { pages?: { sections?: { type?: string; fields?: { name?: string; label?: Record<string, string> }[] }[] }[] };
    return (site.pages ?? []).some((p) =>
      (p.sections ?? []).some((s) => s.type === "form" && (s.fields ?? []).some((f) => CREDENTIAL_FIELD.test(normalizeText([f.name ?? "", ...Object.values(f.label ?? {})].join(" ").replace(/_/g, " "))))),
    );
  } catch {
    return false;
  }
}

/** Blocks publishing when the site's words are harmful: rules first (free), then the AI check. */
export class ContentGuard implements PublishGuard {
  constructor(private readonly classifier: ContentClassifier | null) {}

  async check(input: { files: PublishFile[]; source: Record<string, string>; projectId: string; ownerId: string }) {
    const source = sourceText(input.source);
    const text = [visibleText(input.files), source].filter(Boolean).join("\n");
    const reasons = new Set<SafetyReason>(keywordCheck(text));
    if (credentialFields(input.source)) reasons.add("phishing");
    if (reasons.size) return { ok: false as const, reasons: [...reasons] };
    if (!this.classifier) return { ok: true as const };
    // The AI reads site.json's text once (rendered pages repeat the same words in two languages).
    return this.classifier.classify(source || text, { userId: input.ownerId, projectId: input.projectId });
  }
}
