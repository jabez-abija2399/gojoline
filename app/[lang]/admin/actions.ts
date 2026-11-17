"use server";

import { reportError } from "@/lib/observability/report";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { billingSettingsSchema } from "@/lib/billing/settings";
import { birrToMinor } from "@/lib/billing/plans";
import { creditSettingsSchema, usdToCents } from "@/lib/billing/credits";
import { discountInputSchema, launchOfferTermsSchema, PRODUCT_IDS } from "@/lib/billing/discounts";
import { dismissReports, restoreSite, takeDownSite } from "@/lib/safety/takedown";
import { refreshTemplateUsage } from "@/lib/landing/template-usage";
import { after } from "next/server";
import { noticeDecision } from "@/lib/billing/notify";
import { adminStats, paymentNotices, services } from "@/lib/server/services";
import { adminFeedbackInput } from "@/lib/feedback/schema";
import { updateFeedback } from "@/lib/feedback/admin";
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from "@/lib/feedback/types";

const input = z.object({ id: z.uuid(), decision: z.enum(["approve", "reject"]), note: z.string().trim().max(300).optional(), lang: z.enum(["en", "am"]) });

export type ReviewState = { status: "idle" | "ok" | "not_found" | "already_reviewed" | "discount_unavailable" | "invalid" | "forbidden" | "failed" };

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
    if (op !== "dismiss") refreshTemplateUsage();
  } catch (error) {
    reportError("moderation failed", error);
    status = "failed";
  }
  revalidatePath(`/${lang}/admin`);
  // The handled item may leave the list, so the outcome is shown at the top of the page.
  redirect(`/${lang}/admin?tab=${tab}&done=${status}`);
}

export type SettingsState = { status: "idle" | "ok" | "invalid" | "forbidden" | "failed"; field?: string };

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

export type CreditsState = { status: "idle" | "ok" | "invalid" | "forbidden" | "failed"; field?: string };

/** A whole number typed in a form field, or NaN (so validation names the field). */
const whole = (v: FormDataEntryValue | null) => (typeof v === "string" && /^\s*\d{1,6}\s*$/.test(v) ? Number(v) : NaN);

/** Monthly changes, rollover, pack size, changes per request size and the cost cap. Audited. */
export async function saveCreditSettings(_prev: CreditsState, form: FormData): Promise<CreditsState> {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return { status: "forbidden" };
  const cap = usdToCents(String(form.get("capUsd") ?? ""));
  if (cap === null) return { status: "invalid", field: "capUsd" };
  const plans = ["free", "starter", "business"] as const;
  const sizes = ["small", "medium", "large"] as const;
  const parsed = creditSettingsSchema.safeParse({
    monthly: Object.fromEntries(plans.map((p) => [p, whole(form.get(`monthly_${p}`))])),
    rollover: Object.fromEntries(plans.map((p) => [p, whole(form.get(`rollover_${p}`))])),
    topupCredits: whole(form.get("topupCredits")),
    sizeCredits: Object.fromEntries(sizes.map((x) => [x, whole(form.get(`size_${x}`))])),
    capCentsPerCredit: cap,
  });
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path ?? [];
    const field = path[0] === "monthly" ? `monthly_${String(path[1])}` : path[0] === "rollover" ? `rollover_${String(path[1])}` : path[0] === "sizeCredits" ? `size_${String(path[1])}` : path[0] === "capCentsPerCredit" ? "capUsd" : String(path[0] ?? "");
    return { status: "invalid", field };
  }
  try {
    await services().billing.saveCreditSettings(user.id, parsed.data);
  } catch (error) {
    reportError("credit settings save failed", error);
    return { status: "failed" };
  }
  const lang = form.get("lang") === "am" ? "am" : "en";
  for (const path of [`/${lang}/admin`, `/${lang}/billing`, `/${lang}/pricing`, `/${lang}`]) revalidatePath(path);
  return { status: "ok" };
}

export type DiscountState = { status: "idle" | "ok" | "invalid" | "exists" | "forbidden" | "failed"; field?: string };

const products = (form: FormData) => form.getAll("products").map(String).filter((p) => (PRODUCT_IDS as string[]).includes(p));

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/**
 * The launch offer's terms: percent off chosen products, an optional last day and an optional
 * name (both languages or neither), saved atomically without touching on/off (only the switch changes that). Audited.
 */
export async function saveLaunchOffer(_prev: DiscountState, form: FormData): Promise<DiscountState> {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return { status: "forbidden" };
  const until = text(form.get("until"));
  const en = text(form.get("name_en"));
  const am = text(form.get("name_am"));
  const parsed = launchOfferTermsSchema.safeParse({
    percent: whole(form.get("percent")),
    products: products(form),
    ...(until ? { until } : {}),
    ...(en || am ? { name: { en, am } } : {}),
  });
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path ?? [];
    return { status: "invalid", field: path[0] === "name" ? `name_${String(path[1] ?? "en")}` : String(path[0] ?? "") };
  }
  try {
    await services().billing.saveLaunchOfferTerms(user.id, parsed.data);
  } catch (error) {
    reportError("launch offer save failed", error);
    return { status: "failed" };
  }
  const lang = form.get("lang") === "am" ? "am" : "en";
  for (const path of [`/${lang}/admin`, `/${lang}/billing`, `/${lang}/pricing`, `/${lang}`]) revalidatePath(path);
  return { status: "ok" };
}

/** The one-click launch offer switch at the top of the Discounts tab: on or off at once. Audited. */
export async function switchLaunchOffer(form: FormData) {
  const me = await currentUser();
  if (!me || !isAdmin(me)) redirect("/");
  const lang = form.get("lang") === "am" ? "am" : "en";
  const active = z.enum(["true", "false"]).safeParse(form.get("active"));
  let done: "ok" | "failed" | "not_found" = "failed";
  if (active.success) {
    try {
      done = (await services().billing.setLaunchOfferActive(me.id, active.data === "true")) === "ok" ? "ok" : "not_found";
    } catch (error) {
      reportError("launch offer switch failed", error);
    }
  }
  for (const path of [`/${lang}/admin`, `/${lang}/billing`, `/${lang}/pricing`, `/${lang}`]) revalidatePath(path);
  redirect(`/${lang}/admin?tab=discounts&done=${done}`);
}

/** A new discount code (percent or whole Birr off, products, uses, last day, first payment only). Audited. */
export async function createDiscountCode(_prev: DiscountState, form: FormData): Promise<DiscountState> {
  const user = await currentUser();
  if (!user || !isAdmin(user)) return { status: "forbidden" };
  const kind = form.get("kind") === "amount" ? "amount" : "percent";
  const amount = birrToMinor(String(form.get("amount") ?? ""));
  const rawMax = String(form.get("maxUses") ?? "").trim();
  const rawDate = String(form.get("expires") ?? "").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? new Date(`${rawDate}T23:59:59.999+03:00`) : rawDate ? new Date(NaN) : null;
  const parsed = discountInputSchema.safeParse({
    code: String(form.get("code") ?? ""),
    kind,
    percentOff: kind === "percent" ? whole(form.get("percent")) : null,
    amountOffMinor: kind === "amount" ? (amount ?? NaN) : null,
    products: products(form),
    maxUses: rawMax ? whole(rawMax) : null,
    expiresAt: date && !Number.isNaN(date.getTime()) ? date : date ? "bad" : null,
    firstPaymentOnly: form.get("firstPaymentOnly") === "on",
    perCustomerOnce: form.get("perCustomerOnce") === "on",
  });
  if (!parsed.success) {
    const f = String(parsed.error.issues[0]?.path[0] ?? "");
    return { status: "invalid", field: f === "percentOff" ? "percent" : f === "amountOffMinor" ? "amount" : f === "expiresAt" ? "expires" : f === "kind" ? (kind === "percent" ? "percent" : "amount") : f };
  }
  try {
    const created = await services().billing.createDiscount(user.id, parsed.data);
    if (!created) return { status: "exists", field: "code" };
  } catch (error) {
    reportError("discount create failed", error);
    return { status: "failed" };
  }
  revalidatePath(`/${form.get("lang") === "am" ? "am" : "en"}/admin`);
  return { status: "ok" };
}

/** Switches a code off or on again (never deleted). Audited. */
export async function toggleDiscountCode(form: FormData) {
  const me = await currentUser();
  if (!me || !isAdmin(me)) redirect("/");
  const lang = form.get("lang") === "am" ? "am" : "en";
  const id = z.uuid().safeParse(form.get("id"));
  let done: "ok" | "failed" | "not_found" = "failed";
  if (id.success) {
    try {
      done = (await services().billing.setDiscountActive(me.id, id.data, form.get("active") === "true")) ? "ok" : "not_found";
    } catch (error) {
      reportError("discount toggle failed", error);
    }
  }
  revalidatePath(`/${lang}/admin`);
  redirect(`/${lang}/admin?tab=discounts&done=${done}`);
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

export type FeedbackState = { status: "idle" | "invalid" | "forbidden" | "not_found" | "failed" };

const fbFilters = z.object({ fStatus: z.enum(FEEDBACK_STATUSES).optional().catch(undefined), fType: z.enum(FEEDBACK_TYPES).optional().catch(undefined) });

/** The admin's save on one feedback card: status and/or reply, each audited. Back to the same filters with the outcome on top. */
export async function saveFeedback(_prev: FeedbackState, form: FormData): Promise<FeedbackState> {
  const me = await currentUser();
  if (!me || !isAdmin(me)) return { status: "forbidden" };
  const parsed = adminFeedbackInput.safeParse({ id: form.get("id"), status: form.get("status"), reply: form.get("reply") ?? "", lang: form.get("lang") });
  if (!parsed.success) return { status: "invalid" };
  const { id, status, reply, lang } = parsed.data;
  let result: Awaited<ReturnType<typeof updateFeedback>>;
  try {
    result = await updateFeedback({ store: services().feedback, audit: (e) => services().billing.store().audit(e) }, me.id, id, { status, reply });
  } catch (error) {
    reportError("feedback update failed", error);
    return { status: "failed" };
  }
  if (result === "not_found") return { status: "not_found" };
  revalidatePath(`/${lang}/admin`);
  const back = fbFilters.parse({ fStatus: form.get("fStatus") || undefined, fType: form.get("fType") || undefined });
  const params = new URLSearchParams({ tab: "feedback" });
  if (back.fStatus) params.set("status", back.fStatus);
  if (back.fType) params.set("type", back.fType);
  params.set("done", "ok");
  // The item may leave a filtered list, so the outcome is shown at the top of the page.
  redirect(`/${lang}/admin?${params.toString()}`);
}
