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

const MAX_PAGE_CHARS = 1_000_000;
const ATTR = /\s(?:alt|title|placeholder|aria-label|value|content|label)\s*=\s*(?:"([^"]{0,2000})"|'([^']{0,2000})')/gi;

/**
 * Text and readable attributes of one HTML page. A single forward scan (no backtracking), so
 * malformed markup can't make it slow: an unclosed <script> or tag simply ends the page.
 */
function pageText(html: string): string {
  const out: string[] = [];
  const lower = html.toLowerCase();
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      out.push(html.slice(i));
      break;
    }
    out.push(html.slice(i, lt), " ");
    const gt = html.indexOf(">", lt + 1);
    if (gt === -1) break;
    const tag = html.slice(lt, gt + 1);
    if (tag.length <= 4096) for (const m of tag.matchAll(ATTR)) out.push(m[1] ?? m[2] ?? "", " ");
    const name = /^<([a-z]+)/i.exec(tag)?.[1]?.toLowerCase();
    if (name === "script" || name === "style" || name === "noscript") {
      const close = lower.indexOf(`</${name}`, gt + 1);
      if (close === -1) break;
      i = lower.indexOf(">", close);
      if (i === -1) break;
      i += 1;
      continue;
    }
    i = gt + 1;
  }
  return out.join("");
}

/** Visible text of the built pages, plus words in attributes people see (alt, title, placeholders...). */
export function visibleText(files: PublishFile[]): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const f of files) {
    if (!f.path.endsWith(".html")) continue;
    const text = normalizeText(decode(pageText(f.data.toString("utf8", 0, MAX_PAGE_CHARS))));
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
