"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
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
    console.error("payment review failed", error instanceof Error ? error.message : "unknown");
    return { status: "failed" };
  }
}
