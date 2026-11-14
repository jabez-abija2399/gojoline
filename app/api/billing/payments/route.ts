import { z } from "zod";
import { json } from "@/lib/api/guard";
import { currentUser } from "@/lib/auth/session";
import { sameOrigin } from "@/lib/builder/access";
import { processImage, MAX_UPLOAD_BYTES } from "@/lib/cloud/images";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";

const fields = z.object({
  product: z.enum(["starter_month", "starter_year", "business_month", "business_year", "topup"]),
  method: z.enum(["telebirr", "cbe", "other"]),
  // Transaction numbers are letters and digits; normalised to upper case so duplicates are caught.
  reference: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{6,40}$/),
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
  if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 100_000) return json(413, { error: "receipt" });
  const form = await request.formData().catch(() => null);
  if (!form) return json(400, { error: "failed" });
  const parsed = fields.safeParse({ product: form.get("product"), method: form.get("method"), reference: form.get("reference") });
  if (!parsed.success) return json(400, { error: "reference" });
  let receipt: Buffer | null = null;
  const file = form.get("receipt");
  if (file instanceof File && file.size > 0) {
    const img = await processImage(Buffer.from(await file.arrayBuffer()));
    if (!img.ok) return json(415, { error: "receipt" });
    receipt = img.data;
  }
  const payment = await services().billing.submitPayment(user.id, { ...parsed.data, receipt });
  if (!payment) return json(409, { error: "duplicate" });
  return json(201, { payment });
}
