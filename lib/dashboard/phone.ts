/**
 * Phone numbers visitors type into forms, made tappable for the owner: call, SMS, WhatsApp,
 * Telegram. Ethiopian numbers come in many shapes (0911 22 33 44, 911223344, 251911223344,
 * +251 911 223 344); all become +251 and 9 digits.
 */

export interface PhoneLinks {
  /** The number in one form: "+251911223344" (Ethiopia) or "+44…" (other countries). */
  e164: string;
  tel: string;
  sms: string;
  /** Mobile numbers only: landlines have no WhatsApp or Telegram. */
  whatsapp: string | null;
  telegram: string | null;
}

/** An Ethiopian or international number in +digits form, or null when it isn't a phone number. */
export function normalizePhone(raw: string): { e164: string; mobile: boolean } | null {
  const trimmed = raw.trim();
  if (!/^[+\d][\d\s\-().]{5,22}$/.test(trimmed)) return null;
  const plus = trimmed.startsWith("+") || trimmed.startsWith("00");
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  // Ethiopia: 9 national digits after the country code (or after the leading 0 at home).
  let national: string | null = null;
  if (digits.startsWith("251") && digits.length === 12) national = digits.slice(3);
  else if (!plus && digits.startsWith("0") && digits.length === 10) national = digits.slice(1);
  else if (!plus && digits.length === 9 && /^[1-9]/.test(digits)) national = digits;
  if (national) {
    if (!/^[1-9]\d{8}$/.test(national)) return null;
    // 9… is Ethio telecom mobile, 7… Safaricom; 11…, 22…, 46… and so on are landlines.
    return { e164: `+251${national}`, mobile: /^[79]/.test(national) };
  }
  // Another country: needs its country code (+ or 00); 10 to 15 digits.
  if (plus && digits.length >= 10 && digits.length <= 15 && !digits.startsWith("0")) return { e164: `+${digits}`, mobile: true };
  return null;
}

/** One-tap links for a phone number, or null when the text isn't one. */
export function phoneLinks(raw: string): PhoneLinks | null {
  const n = normalizePhone(raw);
  if (!n) return null;
  const digits = n.e164.slice(1);
  return {
    e164: n.e164,
    tel: `tel:${n.e164}`,
    sms: `sms:${n.e164}`,
    whatsapp: n.mobile ? `https://wa.me/${digits}` : null,
    telegram: n.mobile ? `https://t.me/${n.e164}` : null,
  };
}
