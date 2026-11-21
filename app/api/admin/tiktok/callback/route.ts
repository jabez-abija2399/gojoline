import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { reportError } from "@/lib/observability/report";
import { tiktokExchange } from "@/lib/posts/tiktok-auth";
import { services } from "@/lib/server/services";

/** TikTok sends the admin back here: check the state, keep the refresh token, back to Posts. */
export async function GET(request: Request) {
  const me = await currentUser();
  const key = process.env.TIKTOK_CLIENT_KEY;
  const secret = process.env.TIKTOK_CLIENT_SECRET;
  if (!me || !isAdmin(me) || !key || !secret) return new Response(null, { status: 404 });
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!appUrl) return new Response(null, { status: 404 });
  const back = (done: string) => Response.redirect(`${appUrl}/en/admin?tab=posts&pd=${done}`, 302);
  const q = new URL(request.url).searchParams;
  const jar = await cookies();
  const want = Buffer.from(jar.get("gojo_tiktok_state")?.value ?? "");
  const given = Buffer.from(q.get("state") ?? "");
  jar.delete({ name: "gojo_tiktok_state", path: "/api/admin/tiktok" });
  const code = q.get("code");
  if (!code || want.length === 0 || want.length !== given.length || !timingSafeEqual(want, given)) return back("invalid");
  try {
    const refreshToken = await tiktokExchange({ clientKey: key, clientSecret: secret, code, appUrl });
    await services().posts.saveTikTokToken?.(refreshToken, me.id);
    return back("ok");
  } catch (e) {
    reportError("tiktok connect failed", e);
    return back("failed");
  }
}
