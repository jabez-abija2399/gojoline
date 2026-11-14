import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./server";

export interface CurrentUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  verified: boolean;
}

/** The signed-in user for this request, or null. */
export const currentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) return null;
  const u = session.user as typeof session.user & { phoneNumber?: string | null; phoneNumberVerified?: boolean | null };
  const realEmail = u.email.endsWith("@phone.gojoline.invalid") ? null : u.email;
  return {
    id: u.id,
    name: u.name,
    email: realEmail,
    phone: u.phoneNumber ?? null,
    verified: Boolean(u.emailVerified && realEmail) || Boolean(u.phoneNumberVerified),
  };
});
