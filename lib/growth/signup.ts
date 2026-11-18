import "server-only";
import { services } from "@/lib/server/services";
import { ATTRIBUTION_COOKIE, cookieValue, decodeAttribution } from "./attribution";

/** A new account: save where it first came from, and link it to its referrer (if any). */
export async function onSignup(user: { id: string; email: string; phoneNumber?: string | null }, headers: Headers | null): Promise<void> {
  const a = decodeAttribution(cookieValue(headers?.get("cookie"), ATTRIBUTION_COOKIE));
  const { growth } = services();
  await growth.sources.record(user.id, a);
  const email = user.email.endsWith("@phone.gojoline.invalid") ? null : user.email;
  await growth.referrals.onSignup({ id: user.id, email, phone: user.phoneNumber ?? null }, a);
}
