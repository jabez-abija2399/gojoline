import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { user } from "@/lib/db/schema";

/** Same rule as the session: a real verified email or a verified phone. */
export async function isUserVerified(userId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return process.env.E2E === "1"; // memory auth in e2e only creates OTP-verified users
  const [u] = await db.select({ email: user.email, ev: user.emailVerified, pv: user.phoneNumberVerified }).from(user).where(eq(user.id, userId)).limit(1);
  if (!u) return false;
  return (u.ev && !u.email.endsWith("@phone.gojoline.invalid")) || !!u.pv;
}
