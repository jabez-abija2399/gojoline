import { eq } from "drizzle-orm";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { DevOtpSender } from "@/lib/providers/notify/otp";
import { testDb } from "@/test/db";
import { createAuth, phoneEmail } from "./config";

async function setup() {
  const db = await testDb();
  const sender = new DevOtpSender();
  const auth = createAuth({
    database: drizzleAdapter(db, { provider: "pg", schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification } }),
    secret: "test-secret-0123456789-0123456789-abcdef",
    baseURL: "http://localhost:3000",
    secureCookies: false,
    sender,
  });
  return { db, sender, auth };
}

describe("Better Auth on Postgres", () => {
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
});
