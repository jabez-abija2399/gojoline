import { eq } from "drizzle-orm";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { DevOtpSender } from "@/lib/providers/notify/otp";
import { testDb } from "@/test/db";
import { createAuth, phoneEmail } from "./config";

async function setup(secureCookies = false) {
  const db = await testDb();
  const sender = new DevOtpSender();
  const auth = createAuth({
    database: drizzleAdapter(db, { provider: "pg", schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification } }),
    secret: "test-secret-0123456789-0123456789-abcdef",
    baseURL: "http://localhost:3000",
    secureCookies,
    sender,
  });
  return { db, sender, auth };
}

describe("Better Auth on Postgres", () => {
  it("does not expose the OTP routes over HTTP", async () => {
    const { auth } = await setup();
    for (const path of ["/phone-number/send-otp", "/email-otp/send-verification-otp", "/sign-in/email-otp"]) {
      const res = await auth.handler(
        new Request(`http://localhost:3000/api/auth${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: "http://localhost:3000" },
          body: JSON.stringify({ phoneNumber: "+251911234567", email: "a@b.co", type: "sign-in", otp: "123456" }),
        }),
      );
      expect(res.status, path).toBe(404);
    }
  }, 30_000);

  it("signs up and in with an email code; codes are stored hashed", async () => {
    const { db, sender, auth } = await setup();
    const email = `abebe-${Date.now()}@example.com`;
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
    const code = sender.lastCode(email)!;
    expect(code).toMatch(/^\d{6}$/);
    const stored = await db.select().from(schema.verification);
    expect(JSON.stringify(stored)).not.toContain(code);

    await expect(auth.api.signInEmailOTP({ body: { email, otp: "000000" === code ? "111111" : "000000" } })).rejects.toThrow();
    const res = await auth.api.signInEmailOTP({ body: { email, otp: code } });
    expect(res.user.email).toBe(email);
    const [u] = await db.select().from(schema.user).where(eq(schema.user.email, email));
    expect(u?.emailVerified).toBe(true);
    expect((await db.select().from(schema.session).where(eq(schema.session.userId, u!.id))).length).toBe(1);
  }, 30_000);

  it("signs up with an Ethiopian phone number and rejects other formats", async () => {
    const { db, sender, auth } = await setup();
    const phone = "+251911234567";
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: phone } });
    const res = await auth.api.verifyPhoneNumber({ body: { phoneNumber: phone, code: sender.lastCode(phone)! } });
    expect(res.status).toBe(true);
    const [u] = await db.select().from(schema.user).where(eq(schema.user.phoneNumber, phone));
    expect(u?.phoneNumberVerified).toBe(true);
    expect(u?.email).toBe(phoneEmail(phone));
    await expect(auth.api.sendPhoneNumberOTP({ body: { phoneNumber: "0911234567" } })).rejects.toThrow();
  }, 30_000);

  it("on https the session cookie is __Host- (host-only, Secure, path /), so sibling subdomains can't plant one", async () => {
    const { sender, auth } = await setup(true);
    const email = `host-${Date.now()}@example.com`;
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
    const res = await auth.api.signInEmailOTP({ body: { email, otp: sender.lastCode(email)! }, asResponse: true });
    const cookies = res.headers.getSetCookie();
    const session = cookies.find((c) => c.startsWith("__Host-gojo.session_token="));
    expect(session, cookies.join("\n")).toBeTruthy();
    expect(session).toMatch(/;\s*Secure/i);
    expect(session).toMatch(/;\s*Path=\//i);
    expect(session).not.toMatch(/Domain=/i);
    expect(cookies.every((c) => c.startsWith("__Host-gojo."))).toBe(true);
  }, 30_000);
});
