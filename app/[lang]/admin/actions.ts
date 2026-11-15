"use server";

import { reportError } from "@/lib/observability/report";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { dismissReports, restoreSite, takeDownSite } from "@/lib/safety/takedown";
import { services } from "@/lib/server/services";

const input = z.object({ id: z.uuid(), decision: z.enum(["approve", "reject"]), note: z.string().trim().max(300).optional(), lang: z.enum(["en", "am"]) });

export type ReviewState = { status: "idle" | "ok" | "not_found" | "already_reviewed" | "invalid" | "forbidden" | "failed" };

export async function reviewPayment(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return { status: "forbidden" };
  const parsed = input.safeParse({ id: form.get("id"), decision: form.get("decision"), note: form.get("note") || undefined, lang: form.get("lang") });
  if (!parsed.success) return { status: "invalid" };
  try {
    const status = await services().billing.review(user.id, parsed.data.id, parsed.data.decision, parsed.data.note ?? null);
    revalidatePath(`/${parsed.data.lang}/admin`);
    return { status };
  } catch (error) {
    reportError("payment review failed", error);
    return { status: "failed" };
  }
}

const modInput = z.object({
  siteId: z.uuid(),
  op: z.enum(["take_down", "dismiss", "restore"]),
  reason: z.string().trim().max(300).optional(),
  lang: z.enum(["en", "am"]),
  tab: z.enum(["reports", "sites"]),
});

export type ModerateState = { status: "idle" | "ok" | "not_found" | "deploy_failed" | "invalid" | "forbidden" | "failed" | "reason_required" };

export async function moderateSite(_prev: ModerateState, form: FormData): Promise<ModerateState> {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return { status: "forbidden" };
  const parsed = modInput.safeParse({ siteId: form.get("siteId"), op: form.get("op"), reason: form.get("reason") || undefined, lang: form.get("lang"), tab: form.get("tab") });
  if (!parsed.success) return { status: "invalid" };
  if (parsed.data.op === "take_down" && !parsed.data.reason) return { status: "reason_required" };
  const deps = services().moderation;
  if (!deps) return { status: "failed" };
  const { siteId, op, reason, lang, tab } = parsed.data;
  let status: ModerateState["status"];
  try {
    status =
      op === "take_down"
        ? await takeDownSite(deps, user.id, siteId, reason!)
        : op === "restore"
          ? await restoreSite(deps, user.id, siteId)
          : ((await dismissReports(deps, user.id, siteId)), "ok" as const);
  } catch (error) {
    reportError("moderation failed", error);
    status = "failed";
  }
  revalidatePath(`/${lang}/admin`);
  // The handled item may leave the list, so the outcome is shown at the top of the page.
  redirect(`/${lang}/admin?tab=${tab}&done=${status}`);
}
