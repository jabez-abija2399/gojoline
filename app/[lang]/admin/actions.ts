"use server";

import { reportError } from "@/lib/observability/report";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { billingSettingsSchema } from "@/lib/billing/settings";
import { dismissReports, restoreSite, takeDownSite } from "@/lib/safety/takedown";
import { after } from "next/server";
import { noticeDecision } from "@/lib/billing/notify";
import { adminStats, paymentNotices, services } from "@/lib/server/services";

const input = z.object({ id: z.uuid(), decision: z.enum(["approve", "reject"]), note: z.string().trim().max(300).optional(), lang: z.enum(["en", "am"]) });

export type ReviewState = { status: "idle" | "ok" | "not_found" | "already_reviewed" | "invalid" | "forbidden" | "failed" };

export async function reviewPayment(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return { status: "forbidden" };
  const parsed = input.safeParse({ id: form.get("id"), decision: form.get("decision"), note: form.get("note") || undefined, lang: form.get("lang") });
  if (!parsed.success) return { status: "invalid" };
  try {
    const billing = services().billing;
    const payment = await billing.store().payment(parsed.data.id);
    const status = await billing.review(user.id, parsed.data.id, parsed.data.decision, parsed.data.note ?? null);
    if (status === "ok" && payment) {
      const { decision, note } = parsed.data;
      after(() => noticeDecision(paymentNotices(), payment, decision, note ?? null).catch((e: unknown) => reportError("decision notice failed", e)));
    }
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

export type SettingsState = { status: "idle" | "ok" | "invalid" | "forbidden" | "failed"; field?: string };

/** "399" or "399.50" Birr → santim, without floating point. */
function birrToMinor(raw: string): number | null {
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(raw.trim().replace(/,/g, ""));
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || "0");
}

export async function saveBillingSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return { status: "forbidden" };
  const billing = services().billing;
  const current = await billing.settings();
  const prices: Record<string, number> = {};
  for (const key of Object.keys(current.prices)) {
    const minor = birrToMinor(String(form.get(`price_${key}`) ?? ""));
    if (minor === null || minor < 100) return { status: "invalid", field: `price_${key}` };
    prices[key] = minor;
  }
  const parsed = billingSettingsSchema.safeParse({
    prices,
    telebirrNumber: String(form.get("telebirrNumber") ?? ""),
    cbeAccount: String(form.get("cbeAccount") ?? ""),
    accountName: String(form.get("accountName") ?? ""),
  });
  if (!parsed.success) return { status: "invalid", field: String(parsed.error.issues[0]?.path[0] ?? "") };
  try {
    await billing.saveSettings(user.id, parsed.data);
  } catch (error) {
    reportError("settings save failed", error);
    return { status: "failed" };
  }
  const lang = form.get("lang") === "am" ? "am" : "en";
  revalidatePath(`/${lang}/admin`);
  revalidatePath(`/${lang}/billing`);
  return { status: "ok" };
}

export type UserActionState = { status: "idle" | "ok" | "invalid" | "reason_required" | "forbidden" | "not_found" | "failed" };

const userId = z.string().trim().min(1).max(200);
const reason = z.string().trim().max(200);
const grantInput = z.object({ userId, n: z.coerce.number().int().min(1).max(500), reason, key: z.uuid(), lang: z.enum(["en", "am"]) });
const planInput = z.object({ userId, plan: z.enum(["starter_month", "starter_year", "business_month", "business_year", "free"]), reason, lang: z.enum(["en", "am"]) });

/** Shared by the two owner actions: admin check, input, the owner exists, reason given. */
async function ownerAction<T extends { userId: string; reason: string; lang: "en" | "am" }>(
  schema: z.ZodType<T>,
  form: FormData,
  run: (adminId: string, input: T) => Promise<void>,
  what: string,
): Promise<UserActionState> {
  const me = await currentUser();
  if (!me || !isAdmin(me)) return { status: "forbidden" };
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "invalid" };
  if (parsed.data.reason.length < 3) return { status: "reason_required" };
  try {
    if (!(await adminStats().user(parsed.data.userId))) return { status: "not_found" };
    await run(me.id, parsed.data);
  } catch (error) {
    reportError(what, error);
    return { status: "failed" };
  }
  revalidatePath(`/${parsed.data.lang}/admin`);
  return { status: "ok" };
}

/** Extra AI changes for an owner (1–500), with a reason in the audit log. */
export async function grantCredits(_prev: UserActionState, form: FormData): Promise<UserActionState> {
  return ownerAction(grantInput, form, (adminId, d) => services().billing.adminGrantCredits(adminId, d.userId, d.n, d.reason, d.key), "admin credit grant failed");
}

/** Comps and corrections: start or extend Starter/Business by a month or a year, or end the plan now. */
export async function setOwnerPlan(_prev: UserActionState, form: FormData): Promise<UserActionState> {
  return ownerAction(
    planInput,
    form,
    (adminId, d) => {
      const [plan, period] = d.plan === "free" ? (["free", "month"] as const) : (d.plan.split("_") as ["starter" | "business", "month" | "year"]);
      return services().billing.adminSetPlan(adminId, d.userId, plan, period, d.reason);
    },
    "admin plan change failed",
  );
}

/** Light, dark or follow the device, remembered for a year (admin pages only). */
export async function setAdminTheme(form: FormData) {
  const me = await currentUser();
  if (!me || !isAdmin(me)) redirect("/");
  const theme = form.get("theme");
  const lang = form.get("lang") === "am" ? "am" : "en";
  const tab = String(form.get("tab") ?? "overview").replace(/[^a-z]/g, "").slice(0, 20);
  if (theme === "light" || theme === "dark" || theme === "system") {
    (await cookies()).set("gojo_admin_theme", theme, { path: `/`, maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  }
  redirect(`/${lang}/admin?tab=${tab}`);
}
