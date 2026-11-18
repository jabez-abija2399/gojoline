import { randomInt } from "node:crypto";

/**
 * Referral rules (2026-11-18). An owner's invite link is /?ref=u_<code>. When the invited owner's
 * first real payment is approved, both get one month of Starter's AI changes as a credit grant.
 */

/** Rewards an inviter can earn per calendar month (UTC); past it the invited owner is still thanked. */
export const REFERRAL_MONTHLY_CAP = 5;

/** No 0/o, 1/l/i: codes are read aloud and typed from screenshots. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const CODE_LENGTH = 8;

export function newReferralCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function referralLink(appUrl: string, lang: "en" | "am", code: string): string {
  return `${new URL(appUrl).origin}/${lang}?ref=u_${code}`;
}

/** Shared mail services: owners on the same one are not the same business. */
const PUBLIC_MAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com",
  "proton.me", "protonmail.com", "aol.com", "mail.com", "gmx.com", "yandex.com", "zoho.com", "ethionet.et", "phone.gojoline.invalid",
]);

export interface Person {
  id: string;
  email: string | null;
  phone: string | null;
}

/** One mailbox however it is written: lower case, no +tag, and no dots for Gmail. */
export function mailbox(email: string): string {
  const [rawLocal = "", rawDomain = ""] = email.trim().toLowerCase().split("@");
  const domain = rawDomain === "googlemail.com" ? "gmail.com" : rawDomain;
  let local = rawLocal.split("+")[0]!;
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

const digits = (p: string | null) => (p ?? "").replace(/\D/g, "").replace(/^251/, "0");

export type SelfReferral = "same_user" | "same_email" | "same_domain" | "same_phone";

/** Why an invite is the inviter inviting themselves, or null when it looks like a real other owner. */
export function selfReferral(referrer: Person, referred: Person): SelfReferral | null {
  if (referrer.id === referred.id) return "same_user";
  if (referrer.email && referred.email) {
    const a = mailbox(referrer.email);
    const b = mailbox(referred.email);
    if (a === b) return "same_email";
    const domain = a.split("@")[1]!;
    if (domain && domain === b.split("@")[1] && !PUBLIC_MAIL.has(domain)) return "same_domain";
  }
  const pa = digits(referrer.phone);
  if (pa.length >= 9 && pa === digits(referred.phone)) return "same_phone";
  return null;
}

export const monthStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
