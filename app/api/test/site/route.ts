import { NextResponse } from "next/server";
import { testRoutesOpen } from "@/lib/server/test-routes";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { services } from "@/lib/server/services";

/**
 * e2e only: the signed-in owner's own published site's key and origin, so tests can call the
 * public Data API the way the site does. 404 everywhere else (same rule as /api/test/answers).
 */
export async function GET(request: Request) {
  if (!testRoutesOpen()) return new NextResponse(null, { status: 404 });
  const user = await currentUser();
  const id = z.uuid().safeParse(new URL(request.url).searchParams.get("projectId"));
  const svc = services();
  if (!user || !id.success || !svc.publish) return new NextResponse(null, { status: 404 });
  const site = await svc.publish.sites.getByProject(user.id, id.data);
  if (!site?.url || !site.siteKey) return new NextResponse(null, { status: 404 });
  return NextResponse.json({ siteKey: site.siteKey, origin: new URL(site.url).origin });
}
