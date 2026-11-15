"use server";

import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";
import { parseWaitlistInput, type WaitlistErrorCode } from "@/lib/waitlist/schema";

export type WaitlistState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      formError?: WaitlistErrorCode;
      fieldErrors?: Partial<Record<"name" | "contact" | "business", WaitlistErrorCode>>;
      values: { name: string; contact: string; business: string };
    };

function field(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export async function joinWaitlist(_prev: WaitlistState, form: FormData): Promise<WaitlistState> {
  const values = {
    name: field(form, "name").slice(0, 200),
    contact: field(form, "contact").slice(0, 300),
    business: field(form, "business").slice(0, 200),
  };
  const { waitlist, rateLimiter } = services();

  const perMinute = Number(process.env.WAITLIST_RATE_LIMIT_PER_MIN) || 5;
  const limit = await rateLimiter.hit(`waitlist:${await clientIp()}`, perMinute, 60_000);
  if (!limit.allowed) return { status: "error", formError: "tooMany", values };

  const parsed = parseWaitlistInput({ ...values, locale: field(form, "locale") || "en" });
  if (!parsed.ok) return { status: "error", fieldErrors: parsed.errors, values };

  try {
    await waitlist.add(parsed.entry);
    return { status: "success" };
  } catch (error) {
    console.error("waitlist.add failed", error instanceof Error ? error.message : "unknown");
    return { status: "error", formError: "generic", values };
  }
}
