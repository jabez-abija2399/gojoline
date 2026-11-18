import "server-only";
import { cookies } from "next/headers";
import { after } from "next/server";
import { ipFromHeaders } from "@/lib/server/request";
import { reportError } from "@/lib/observability/report";
import { services } from "@/lib/server/services";
import { ATTRIBUTION_COOKIE, cookieValue, decodeAttribution } from "./attribution";
import { signupHashes } from "./fingerprint";

/**
 * A new account: save where it first came from, and link it to its inviter (if any). The cookie
 * is cleared (it has done its job and can't be reused for another account); the writes run
 * after the response, so sign-up never waits for them.
 */
export async function onSignup(user: { id: string; email: string; phoneNumber?: string | null }, headers: Headers | null): Promise<void> {
  const a = decodeAttribution(cookieValue(headers?.get("cookie"), ATTRIBUTION_COOKIE));
  const hashes = headers ? signupHashes({ ip: ipFromHeaders(headers), userAgent: headers.get("user-agent") }, process.env.BETTER_AUTH_SECRET || "dev-only-signup-hash-key") : null;
  if (a) {
    try {
      (await cookies()).delete(ATTRIBUTION_COOKIE);
    } catch {
      // Outside a request that can set cookies: nothing to clear.
    }
  }
  const work = async () => {
    try {
      const { growth } = services();
      await growth.sources.record(user.id, a, hashes ?? undefined);
      const email = user.email.endsWith("@phone.gojoline.invalid") ? null : user.email;
      await growth.referrals.onSignup({ id: user.id, email, phone: user.phoneNumber ?? null }, a, hashes);
    } catch (e) {
      reportError("sign-up source failed", e);
    }
  };
  try {
    after(work);
  } catch {
    await work();
  }
}
