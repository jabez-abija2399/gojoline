import "server-only";
import { MemoryEmailSender, ResendEmailSender, type EmailSender } from "./email";
import { DevOtpSender, EmailOtpSender, UnavailableOtpSender, type OtpSender } from "./otp";

const env = process.env;
const production = env.NODE_ENV === "production" && env.E2E !== "1";
const g = globalThis as unknown as { gojoEmail?: EmailSender | null };

/** Resend when RESEND_API_KEY is set; in development and e2e a memory sender; otherwise none. */
export function emailSender(): EmailSender | null {
  if (g.gojoEmail !== undefined) return g.gojoEmail;
  const from = env.EMAIL_FROM || "Gojoline <login@afridea.et>";
  g.gojoEmail = env.RESEND_API_KEY && env.E2E !== "1" ? new ResendEmailSender(env.RESEND_API_KEY, from) : production ? null : new MemoryEmailSender();
  return g.gojoEmail;
}

export function pickOtpSender(): OtpSender {
  if (!production) return new DevOtpSender();
  const email = emailSender();
  return email ? new EmailOtpSender(email) : new UnavailableOtpSender();
}
