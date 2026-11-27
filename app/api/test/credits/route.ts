import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { testRoutesOpen } from "@/lib/server/test-routes";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { services } from "@/lib/server/services";

const body = z.object({ left: z.number().int().min(0).max(500), plan: z.enum(["free", "starter", "business"]).optional() }).strict();

/**
 * e2e only: puts the signed-in owner on a paid plan (or back on Free: the subscription lapses)
 * and/or sets their changes left, so tests can
 * reach "no changes left" without spending them one by one. 404 everywhere else (same rule as
 * /api/test/answers: never with a real database).
 */
export async function POST(request: Request) {
  if (!testRoutesOpen()) return new NextResponse(null, { status: 404 });
  const user = await currentUser();
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!user || !parsed.success) return new NextResponse(null, { status: 404 });
  const billing = services().billing;
  const plan = parsed.data.plan;
  if (plan === "free") {
    const sub = await billing.store().subscription(user.id);
    if (sub) await billing.store().setSubscription({ ...sub, currentPeriodEnd: new Date(Date.now() - 1000) });
  } else if (plan) await billing.store().extendSubscription(user.id, plan, "month", new Date());
  // The monthly grant first, so it doesn't top the balance up again afterwards.
  const now = await billing.creditsLeft(user.id);
  await billing.store().addCredits(user.id, parsed.data.left - now, "admin", `e2e:${randomUUID()}`);
  return NextResponse.json({ credits: await billing.creditsLeft(user.id) });
}
