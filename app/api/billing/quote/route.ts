import { z } from "zod";
import { json } from "@/lib/api/guard";
import { currentUser } from "@/lib/auth/session";
import { sameOrigin } from "@/lib/builder/access";
import { codeAttemptAllowed, discountCodeField } from "@/lib/billing/code-attempts";
import { PRODUCT_IDS } from "@/lib/billing/discounts";
import type { Product } from "@/lib/billing/plans";
import { services } from "@/lib/server/services";

const body = z.object({ product: z.enum(PRODUCT_IDS as [Product, ...Product[]]), code: discountCodeField }).strict();

/** The price to pay with a discount code, shown before the customer sends the payment. */
export async function POST(request: Request) {
  if (!(await sameOrigin())) return json(403, { error: "forbidden" });
  const user = await currentUser();
  if (!user) return json(401, { error: "access" });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "code_not_found" });
  if (parsed.data.code && !(await codeAttemptAllowed(user.id))) return json(429, { error: "too_many" });
  const result = await services().billing.quote(user.id, parsed.data.product, parsed.data.code || null);
  if (!result.ok) return json(400, { error: `code_${result.error}` });
  const { originalMinor, finalMinor, discountMinor, source } = result.quote;
  return json(200, { quote: { originalMinor, finalMinor, discountMinor, source } });
}
