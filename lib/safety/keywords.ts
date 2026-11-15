import type { SafetyReason } from "./reasons";

/**
 * Fast, free first line of defence. Patterns are narrow on purpose (phrases, not single words)
 * so ordinary cafés, salons and shops never trip them; the AI check catches the rest.
 */
const RULES: { reason: SafetyReason; patterns: RegExp[] }[] = [
  {
    reason: "phishing",
    patterns: [
      /\b(enter|confirm|verify|send|share|type)\b[^.\n]{0,40}\b(your\s+)?(pin|password|otp|one[-\s]?time\s+code|cvv|card\s+number|secret\s+code)\b/i,
      /\b(account|wallet)\b[^.\n]{0,30}\b(suspended|locked|blocked)\b[^.\n]{0,60}\b(verify|confirm|log\s?in)\b/i,
      /(ፒን|የይለፍ\s?ቃል|ሚስጥር\s?ቁጥር)[^።\n]{0,30}(ያስገቡ|ይላኩ|ያረጋግጡ)/,
    ],
  },
  {
    reason: "scam",
    patterns: [
      /\b(double|triple)\s+your\s+(money|investment|birr)\b/i,
      /\bguaranteed\s+(daily\s+|weekly\s+|monthly\s+)?(profit|returns?|income)\b/i,
      /\b(\d{2,4})\s?%\s+(daily|weekly)\s+(profit|returns?|interest)\b/i,
      /\b(you\s+have\s+won|claim\s+your\s+prize|lottery\s+winner)\b/i,
      /\b(send|pay)\b[^.\n]{0,30}\b(processing|release|clearance)\s+fee\b/i,
      /(ገንዘብዎን\s?በእጥፍ|የተረጋገጠ\s?ትርፍ|ሎተሪ\s?አሸንፈዋል)/,
    ],
  },
  {
    reason: "adult",
    patterns: [/\b(porn|xxx|escort\s+services?|sex\s+(chat|video|cam)s?|nude\s+(photos|videos))\b/i],
  },
  {
    reason: "illegal_goods",
    patterns: [
      /\b(buy|sell|order|selling)\b[^.\n]{0,30}\b(cocaine|heroin|meth(amphetamine)?|fentanyl|firearms?|ak-?47|kalashnikov|pistols?|ammunition|counterfeit\s+(money|birr|notes)|fake\s+(passports?|ids?|diplomas?|degrees?))\b/i,
      /\b(fake|forged)\s+(passports?|national\s+ids?|diplomas?|degree\s+certificates?)\b/i,
    ],
  },
  {
    reason: "impersonation",
    patterns: [
      /\b(official|login|log\s?in|sign\s?in)\b[^.\n]{0,25}\b(telebirr|commercial\s+bank\s+of\s+ethiopia|cbe\s?birr|awash\s+bank|dashen\s+bank|abyssinia\s+bank|ethio\s?telecom|safaricom|ethiopian\s+airlines|ministry\s+of)\b/i,
      /\b(telebirr|cbe\s?birr|commercial\s+bank\s+of\s+ethiopia|ethio\s?telecom)\b[^.\n]{0,25}\b(official\s+(site|website|page)|customer\s+login)\b/i,
    ],
  },
];

/** Returns the reasons the text trips, or an empty list. */
export function keywordCheck(text: string): SafetyReason[] {
  const found = new Set<SafetyReason>();
  for (const rule of RULES) if (rule.patterns.some((p) => p.test(text))) found.add(rule.reason);
  return [...found];
}
