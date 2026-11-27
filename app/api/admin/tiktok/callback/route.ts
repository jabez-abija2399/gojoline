import { cookies } from "next/headers";
import { checkTikTokState } from "@/lib/posts/tiktok-state";
import { cookieAttrs, cookieName } from "@/lib/security/cookies";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { reportError } from "@/lib/observability/report";
import { tiktokExchange } from "@/lib/posts/tiktok-auth";
import { services } from "@/lib/server/services";

/** TikTok sends the admin back here: check the state, keep the refresh token, back to Posts. */
export async function GET(request: Request) {
  const me = await currentUser();
  if (!me || !isAdmin(me)) return new Response(null, { status: 404 });
  const connections = services().posts.connections;
  const app = (await connections?.load())?.tiktok;
  if (!connections || !app) return new Response(null, { status: 404 });
  const key = app.clientKey;
  const secret = app.clientSecret;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!appUrl) return new Response(null, { status: 404 });
  const back = (done: string) => Response.redirect(`${appUrl}/en/admin?tab=posts&pd=${done}`, 302);
  const q = new URL(request.url).searchParams;
  const jar = await cookies();
  const nonce = jar.get(cookieName("tiktokState"))?.value;
  jar.set(cookieName("tiktokState"), "", { ...cookieAttrs(), httpOnly: true, sameSite: "lax", maxAge: 0 });
  const code = q.get("code");
  if (!code || !checkTikTokState(process.env.BETTER_AUTH_SECRET ?? "", me.id, nonce, q.get("state"))) return back("invalid");
  try {
    const refreshToken = await tiktokExchange({ clientKey: key, clientSecret: secret, code, appUrl });
    await connections.saveTikTokToken(refreshToken, me.id);
    return back("ok");
  } catch (e) {
    reportError("tiktok connect failed", e);
    return back("failed");
  }
}
