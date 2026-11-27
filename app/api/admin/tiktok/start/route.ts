import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { tiktokAuthorizeUrl } from "@/lib/posts/tiktok-auth";
import { newTikTokState } from "@/lib/posts/tiktok-state";
import { cookieAttrs, cookieName } from "@/lib/security/cookies";
import { services } from "@/lib/server/services";

/** Admin → Posts → "Connect TikTok": off to TikTok's sign-in, with a one-time state bound to this admin. */
export async function GET() {
  const me = await currentUser();
  if (!me || !isAdmin(me)) return new Response(null, { status: 404 });
  // The TikTok app saved in Admin → Posts → Connections (or on the server).
  const key = (await services().posts.connections?.load())?.tiktok?.clientKey;
  if (!key) return new Response(null, { status: 404 });
  const secret = process.env.BETTER_AUTH_SECRET;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!appUrl || !secret) return new Response(null, { status: 404 });
  const { nonce, state } = newTikTokState(secret, me.id);
  (await cookies()).set(cookieName("tiktokState"), nonce, { ...cookieAttrs(), httpOnly: true, sameSite: "lax", maxAge: 600 });
  return Response.redirect(tiktokAuthorizeUrl(key, appUrl, state), 302);
}
