import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { tiktokAuthorizeUrl } from "@/lib/posts/tiktok-auth";
import { services } from "@/lib/server/services";

/** Admin → Posts → "Connect TikTok": off to TikTok's sign-in, with a one-time state in a cookie. */
export async function GET() {
  const me = await currentUser();
  if (!me || !isAdmin(me)) return new Response(null, { status: 404 });
  // The TikTok app saved in Admin → Posts → Connections (or on the server).
  const key = (await services().posts.connections?.load())?.tiktok?.clientKey;
  if (!key) return new Response(null, { status: 404 });
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set("gojo_tiktok_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/api/admin/tiktok" });
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!appUrl) return new Response(null, { status: 404 });
  return Response.redirect(tiktokAuthorizeUrl(key, appUrl, state), 302);
}
