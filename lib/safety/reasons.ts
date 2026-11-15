/** Why content was blocked. Shown to admins; owners see a plain-language message. */
export const SAFETY_REASONS = ["phishing", "scam", "adult", "illegal_goods", "violence_hate", "impersonation", "other"] as const;
export type SafetyReason = (typeof SAFETY_REASONS)[number];

export type SafetyVerdict = { ok: true } | { ok: false; reasons: SafetyReason[] };
