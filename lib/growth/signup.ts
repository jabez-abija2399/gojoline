import "server-only";
import { services } from "@/lib/server/services";
import { ATTRIBUTION_COOKIE, cookieValue, decodeAttribution } from "./attribution";

/** A new account: save where it first came from, and link it to its referrer (if any). */
export async function onSignup(user: { id: string; email: string; phoneNumber?: string | null }, headers: Headers | null): Promise<void> {
  const a = decodeAttribution(cookieValue(headers?.get("cookie"), ATTRIBUTION_COOKIE));
  await services().growth.sources.record(user.id, a);
}
