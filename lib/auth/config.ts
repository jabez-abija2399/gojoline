import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { emailOTP, phoneNumber } from "better-auth/plugins";
import { normalizeEthiopianPhone } from "@/lib/contact";
import type { OtpSender } from "@/lib/providers/notify/otp";

/** Placeholder email for phone-only accounts (never sent to; .invalid is a reserved TLD). */
export const phoneEmail = (phone: string) => `${phone.replace(/\D/g, "")}@phone.gojoline.invalid`;

export interface AuthConfig {
  database: Parameters<typeof betterAuth>[0]["database"];
  secret: string;
  baseURL: string;
  secureCookies: boolean;
  sender: OtpSender;
  extraPlugins?: BetterAuthPlugin[];
}

/** Passwordless sign-in with a 6-digit code by email or Ethiopian mobile number. */
export function createAuth(c: AuthConfig) {
  return betterAuth({
    appName: "Gojoline",
    baseURL: c.baseURL,
    secret: c.secret,
    database: c.database,
    advanced: { cookiePrefix: "gojo", useSecureCookies: c.secureCookies },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    // Server actions add per-contact and per-IP limits on top of Better Auth's own.
    rateLimit: { enabled: true, window: 60, max: 30 },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        allowedAttempts: 5,
        storeOTP: "hashed",
        async sendVerificationOTP({ email, otp }) {
          await c.sender.send({ channel: "email", to: email, code: otp, locale: "en" });
        },
      }),
      phoneNumber({
        otpLength: 6,
        expiresIn: 600,
        allowedAttempts: 5,
        phoneNumberValidator: (p) => normalizeEthiopianPhone(p) === p,
        async sendOTP({ phoneNumber: to, code }) {
          await c.sender.send({ channel: "sms", to, code, locale: "en" });
        },
        signUpOnVerification: { getTempEmail: phoneEmail, getTempName: () => "" },
      }),
      ...(c.extraPlugins ?? []),
    ],
  });
}
