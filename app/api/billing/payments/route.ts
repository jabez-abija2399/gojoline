import { z } from "zod";
import { json } from "@/lib/api/guard";
import { currentUser } from "@/lib/auth/session";
import { sameOrigin } from "@/lib/builder/access";
import { processImage } from "@/lib/cloud/images";
import { clientIp } from "@/lib/server/request";
import { after } from "next/server";
import { noticeNewPayment } from "@/lib/billing/notify";
import { reportError } from "@/lib/observability/report";
import { paymentNotices, services } from "@/lib/server/services";
import { codeAttemptAllowed, discountCodeField } from "@/lib/billing/code-attempts";

/** Below the hosting platform's ~4.5 MB request limit, so a big photo gets a clear message. */
const MAX_RECEIPT_BYTES = 4_000_000;

const fields = z.object({
  product: z.enum(["starter_month", "starter_year", "business_month", "business_year", "topup"]),
  method: z.enum(["telebirr", "cbe", "other"]),
  // Transaction numbers are letters and digits; normalised to upper case so duplicates are caught.
  reference: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9 -]{4,48}[A-Z0-9]$/).refine((r) => r.replace(/[^A-Z0-9]/g, "").length >= 6),
  // Optional; checked (and its attempts limited) by the billing service.
  code: discountCodeField,
});

export async function GET() {
  const user = await currentUser();
  if (!user) return json(401, { error: "access" });
  return json(200, { payments: await services().billing.store().paymentsFor(user.id) });
}

/** Records a manual payment for an admin to check. Nothing changes until it's approved. */
export async function POST(request: Request) {
  if (!(await sameOrigin())) return json(403, { error: "forbidden" });
  const user = await currentUser();
  if (!user) return json(401, { error: "access" });
  const limiter = services().rateLimiter;
  const [byUser, byIp] = await Promise.all([limiter.hit(`pay:o:${user.id}`, 10, 86_400_000), limiter.hit(`pay:ip:${await clientIp()}`, 20, 86_400_000)]);
  if (!byUser.allowed || !byIp.allowed) return json(429, { error: "too_many" });
  // A length is required, so a chunked body can't be buffered before the size is known.
  const length = Number(request.headers.get("content-length") ?? NaN);
  if (!Number.isFinite(length)) return json(411, { error: "failed" });
  if (length > MAX_RECEIPT_BYTES + 100_000) return json(413, { error: "receipt" });
  const form = await request.formData().catch(() => null);
  if (!form) return json(400, { error: "failed" });
  const parsed = fields.safeParse({ product: form.get("product"), method: form.get("method"), reference: form.get("reference"), code: form.get("code") ?? "" });
  if (!parsed.success) return json(400, { error: parsed.error.issues[0]?.path[0] === "code" ? "code_not_found" : "reference" });
  if (parsed.data.code && !(await codeAttemptAllowed(user.id))) return json(429, { error: "too_many" });
  // A receipt photo is required: it shows who paid, so nobody can claim someone else's transaction.
  const file = form.get("receipt");
  if (!(file instanceof File) || file.size === 0) return json(400, { error: "receipt_missing" });
  if (file.size > MAX_RECEIPT_BYTES) return json(413, { error: "receipt" });
  const img = await processImage(Buffer.from(await file.arrayBuffer()));
  if (!img.ok) return json(415, { error: "receipt" });
  const receipt = img.data;
  const result = await services().billing.submitPayment(user.id, { ...parsed.data, receipt });
  if (!result.ok) return result.error === "duplicate" ? json(409, { error: "duplicate" }) : json(400, { error: `code_${result.error}` });
  const payment = result.payment;
  after(() => noticeNewPayment(paymentNotices(), payment).catch((e: unknown) => reportError("payment notice failed", e)));
  return json(201, { payment });
}
