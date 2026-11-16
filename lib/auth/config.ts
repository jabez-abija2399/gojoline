import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { emailOTP, phoneNumber } from "better-auth/plugins";
import { normalizeEthiopianPhone } from "@/lib/contact";
import type { OtpSender } from "@/lib/providers/notify/otp";

/** Placeholder email for phone-only accounts (never sent to; .invalid is a reserved TLD). */
/** Session cookies are named gojo.session_token (__Secure-gojo.… on https). */
export const AUTH_COOKIE_PREFIX = "gojo";

export const phoneEmail = (phone: string) => `${phone.replace(/\D/g, "")}@phone.gojoline.invalid`;

export const OTP_HTTP_PATHS = [
  "/sign-up/email",
  "/sign-in/email",
  "/email-otp/send-verification-otp",
  "/email-otp/check-verification-otp",
  "/email-otp/verify-email",
  "/sign-in/email-otp",
  "/email-otp/request-password-reset",
  "/forget-password/email-otp",
  "/email-otp/reset-password",
  "/email-otp/request-email-change",
  "/email-otp/change-email",
  "/sign-in/phone-number",
  "/phone-number/send-otp",
  "/phone-number/verify",
  "/phone-number/request-password-reset",
  "/phone-number/reset-password",
];

export interface AuthConfig {
  database: Parameters<typeof betterAuth>[0]["database"];
  secret: string;
  baseURL: string;
  secureCookies: boolean;
  sender: OtpSender;
  /** Google OAuth client (redirect URI: <baseURL>/api/auth/callback/google). */
  google?: { clientId: string; clientSecret: string } | null;
  extraPlugins?: BetterAuthPlugin[];
}

/** Passwordless sign-in with a 6-digit code by email or Ethiopian mobile number. */
export function createAuth(c: AuthConfig) {
  return betterAuth({
    appName: "Gojoline",
    baseURL: c.baseURL,
    secret: c.secret,
    database: c.database,
    advanced: { cookiePrefix: AUTH_COOKIE_PREFIX, useSecureCookies: c.secureCookies },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    // Google confirms the email, so a Google sign-in joins the account that already uses it.
    socialProviders: c.google ? { google: { clientId: c.google.clientId, clientSecret: c.google.clientSecret, prompt: "select_account" } } : undefined,
    account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
    rateLimit: { enabled: true, window: 60, max: 30 },
    // Codes are only sent and checked through our server actions (shared Upstash rate limits);
    // the matching public HTTP routes are switched off. Server-side auth.api calls still work.
    disabledPaths: OTP_HTTP_PATHS,
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
