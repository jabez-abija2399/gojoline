"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { services } from "@/lib/server/services";

const input = z.object({ id: z.uuid(), decision: z.enum(["approve", "reject"]), note: z.string().trim().max(300).optional(), lang: z.enum(["en", "am"]) });

export async function reviewPayment(form: FormData) {
  const user = await currentUser();
  if (!user || !isAdmin(user)) throw new Error("forbidden");
  const parsed = input.safeParse({ id: form.get("id"), decision: form.get("decision"), note: form.get("note") || undefined, lang: form.get("lang") });
  if (!parsed.success) throw new Error("invalid");
  await services().billing.review(user.id, parsed.data.id, parsed.data.decision, parsed.data.note ?? null);
  revalidatePath(`/${parsed.data.lang}/admin`);
}
