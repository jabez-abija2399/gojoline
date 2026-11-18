import { NextResponse } from "next/server";
import { z } from "zod";
import { testRoutesOpen } from "@/lib/server/test-routes";
import { currentUser } from "@/lib/auth/session";
import { services } from "@/lib/server/services";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";

/**
 * e2e only: the home page the signed-in owner's site was last published with (the in-memory
 * host keeps the files), so tests can check what visitors get. 404 everywhere else.
 */
export async function GET(request: Request) {
  if (!testRoutesOpen()) return new NextResponse(null, { status: 404 });
  const user = await currentUser();
  const id = z.uuid().safeParse(new URL(request.url).searchParams.get("projectId"));
  const svc = services();
  if (!user || !id.success || !(svc.publish?.publisher instanceof MemoryPublishProvider)) return new NextResponse(null, { status: 404 });
  const site = await svc.publish.sites.getByProject(user.id, id.data);
  const page = site && svc.publish.publisher.published.get(site.slug)?.find((f) => f.path === "index.html");
  if (!page) return new NextResponse(null, { status: 404 });
  return new NextResponse(page.data.toString("utf8"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
