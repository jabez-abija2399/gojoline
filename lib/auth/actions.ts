"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseContact } from "@/lib/contact";
import { isLocale } from "@/lib/i18n/config";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";
import { auth, otpSender } from "./server";

export type SignInError = "contactInvalid" | "codeInvalid" | "tooMany" | "unavailable" | "generic";
export type SignInState =
  | { step: "contact"; error?: SignInError; contact?: string }
  | { step: "code"; kind: "phone" | "email"; to: string; error?: SignInError };

function field(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

/** Only same-site paths, so the redirect can't be used to send people elsewhere. */
function safeNext(lang: string, raw: string): string {
  return /^\/(en|am)\/[\w\-/]*$/.test(raw) && !raw.includes("//") ? raw : `/${lang}/build`;
}

export async function signInStep(prev: SignInState, form: FormData): Promise<SignInState> {
  const lang = isLocale(field(form, "lang")) ? field(form, "lang") : "en";
  const limiter = services().rateLimiter;
  const ip = await clientIp();

  if (field(form, "intent") === "restart") return { step: "contact" };

  if (prev.step === "contact" || field(form, "intent") === "send") {
    const raw = field(form, "contact").slice(0, 254);
    const contact = parseContact(raw);
    if (!contact) return { step: "contact", error: "contactInvalid", contact: raw };
    if (!otpSender.available) return { step: "contact", error: "unavailable", contact: raw };
    const [byIp, byContact] = await Promise.all([
      limiter.hit(`otp-send:ip:${ip}`, Number(process.env.OTP_SEND_PER_IP_PER_HOUR) || 10, 3_600_000),
      limiter.hit(`otp-send:to:${contact.value}`, 3, 600_000),
    ]);
    if (!byIp.allowed || !byContact.allowed) return { step: "contact", error: "tooMany", contact: raw };
    try {
      if (contact.kind === "email") await auth.api.sendVerificationOTP({ body: { email: contact.value, type: "sign-in" } });
      else await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: contact.value } });
    } catch (error) {
      console.error("otp send failed", error instanceof Error ? error.message : "unknown");
      return { step: "contact", error: "generic", contact: raw };
    }
    return { step: "code", kind: contact.kind, to: contact.value };
  }

  // Step 2: check the code. The contact comes from our own previous state, not the form.
  const code = field(form, "code").replace(/\D/g, "");
  if (!/^\d{6}$/.test(code)) return { ...prev, error: "codeInvalid" };
  const limit = await limiter.hit(`otp-verify:${prev.to}`, 10, 600_000);
  if (!limit.allowed) return { ...prev, error: "tooMany" };
  try {
    const h = await headers();
    if (prev.kind === "email") await auth.api.signInEmailOTP({ body: { email: prev.to, otp: code }, headers: h });
    else await auth.api.verifyPhoneNumber({ body: { phoneNumber: prev.to, code, disableSession: false }, headers: h });
  } catch {
    return { ...prev, error: "codeInvalid" };
  }
  redirect(safeNext(lang, field(form, "next")));
}

export async function signOut(form: FormData) {
  const lang = isLocale(field(form, "lang")) ? field(form, "lang") : "en";
  await auth.api.signOut({ headers: await headers() }).catch(() => undefined);
  redirect(`/${lang}`);
}
