"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseContact } from "@/lib/contact";
import { isLocale } from "@/lib/i18n/config";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";
import { safeNext } from "./next";
import { getAuth, googleAuth, otpSender } from "./server";

export type SignInError = "contactInvalid" | "codeInvalid" | "tooMany" | "unavailable" | "smsUnavailable" | "google" | "generic";
export type SignInState =
  | { step: "contact"; error?: SignInError; contact?: string }
  | { step: "code"; kind: "phone" | "email"; to: string; error?: SignInError };

function field(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

// useActionState sends the previous state back from the browser, so it is untrusted input.
const codeStep = z.object({ step: z.literal("code"), kind: z.enum(["phone", "email"]), to: z.string().max(254) });

export async function signInStep(rawPrev: SignInState, form: FormData): Promise<SignInState> {
  const parsedCode = codeStep.safeParse(rawPrev);
  const contactOk = parsedCode.success && parseContact(parsedCode.data.to)?.value === parsedCode.data.to;
  const prev: SignInState = parsedCode.success && contactOk ? parsedCode.data : { step: "contact" };
  const lang = isLocale(field(form, "lang")) ? field(form, "lang") : "en";
  const limiter = services().rateLimiter;
  const ip = await clientIp();

  if (field(form, "intent") === "restart") return { step: "contact" };

  if (prev.step === "contact" || field(form, "intent") === "send") {
    const raw = field(form, "contact").slice(0, 254);
    const contact = parseContact(raw);
    if (!contact) return { step: "contact", error: "contactInvalid", contact: raw };
    if (!otpSender.available || !getAuth()) return { step: "contact", error: "unavailable", contact: raw };
    // Phone codes need an SMS gateway; until then, email (or Google) works.
    if (!otpSender.supports(contact.kind === "email" ? "email" : "sms")) return { step: "contact", error: "smsUnavailable", contact: raw };
    const [byIp, byContactIp, byContact] = await Promise.all([
      limiter.hit(`otp-send:ip:${ip}`, Number(process.env.OTP_SEND_PER_IP_PER_HOUR) || 10, 3_600_000),
      limiter.hit(`otp-send:to-ip:${contact.value}:${ip}`, 3, 600_000),
      // Ceiling per recipient so nobody can flood one phone with texts.
      limiter.hit(`otp-send:to:${contact.value}`, 6, 600_000),
    ]);
    if (!byIp.allowed || !byContactIp.allowed || !byContact.allowed) return { step: "contact", error: "tooMany", contact: raw };
    const auth = getAuth()!;
    try {
      if (contact.kind === "email") await auth.api.sendVerificationOTP({ body: { email: contact.value, type: "sign-in" } });
      else await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: contact.value } });
    } catch (error) {
      console.error("otp send failed", error instanceof Error ? error.message : "unknown");
      return { step: "contact", error: "generic", contact: raw };
    }
    return { step: "code", kind: contact.kind, to: contact.value };
  }

  // Step 2: check the code for the (validated) contact from the previous step.
  const code = field(form, "code").replace(/\D/g, "");
  if (!/^\d{6}$/.test(code)) return { ...prev, error: "codeInvalid" };
  const [byContactIp, byContact] = await Promise.all([
    limiter.hit(`otp-verify:${prev.to}:${ip}`, 10, 600_000),
    limiter.hit(`otp-verify:${prev.to}`, 30, 600_000),
  ]);
  if (!byContactIp.allowed || !byContact.allowed) return { ...prev, error: "tooMany" };
  const auth = getAuth();
  if (!auth) return { step: "contact", error: "unavailable" };
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
  await getAuth()?.api.signOut({ headers: await headers() }).catch(() => undefined);
  redirect(`/${lang}`);
}

/** Starts "Continue with Google": Google sends the person back to /api/auth/callback/google. */
export async function signInWithGoogle(form: FormData) {
  const lang = isLocale(field(form, "lang")) ? field(form, "lang") : "en";
  const auth = getAuth();
  if (!auth || !googleAuth) redirect(`/${lang}/sign-in?error=google`);
  const limiter = services().rateLimiter;
  if (!(await limiter.hit(`google:ip:${await clientIp()}`, 30, 3_600_000)).allowed) redirect(`/${lang}/sign-in?error=tooMany`);
  let url: string | undefined;
  try {
    const res = await auth.api.signInSocial({
      body: { provider: "google", callbackURL: safeNext(lang, field(form, "next")), errorCallbackURL: `/${lang}/sign-in?error=google`, newUserCallbackURL: `/${lang}/build` },
      headers: await headers(),
    });
    url = res.url;
  } catch (error) {
    console.error("google sign-in failed", error instanceof Error ? error.message : "unknown");
  }
  // Only Google's own sign-in page.
  if (!url || !url.startsWith("https://accounts.google.com/")) redirect(`/${lang}/sign-in?error=google`);
  redirect(url);
}
