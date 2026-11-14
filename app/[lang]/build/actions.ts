"use server";

import { redirect } from "next/navigation";
import { checkAccessCode, grantAccess, hasBuilderAccess, ownerId } from "@/lib/builder/access";
import { isLocale } from "@/lib/i18n/config";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";

export async function enterAccessCode(_prev: { error: boolean }, form: FormData): Promise<{ error: boolean }> {
  const lang = isLocale(form.get("lang")) ? (form.get("lang") as string) : "en";
  const limit = await services().rateLimiter.hit(`access:${await clientIp()}`, 10, 600_000);
  if (!limit.allowed) return { error: true };
  const code = String(form.get("code") ?? "").trim();
  const token = checkAccessCode(code);
  if (!token) return { error: true };
  await grantAccess(token);
  redirect(`/${lang}/build`);
}

export async function createProject(form: FormData) {
  const lang = isLocale(form.get("lang")) ? (form.get("lang") as "en" | "am") : "en";
  if (!(await hasBuilderAccess())) redirect(`/${lang}/build/access`);
  const builder = services().builder;
  if (!builder) redirect(`/${lang}/build`);
  const owner = (await ownerId(true))!;
  const perHour = Number(process.env.BUILDER_RATE_LIMIT_PER_HOUR) || 10;
  const limiter = services().rateLimiter;
  // Per owner and per IP: clearing the owner cookie must not reset the limit.
  const [byOwner, byIp] = await Promise.all([
    limiter.hit(`project-create:o:${owner}`, perHour, 3_600_000),
    limiter.hit(`project-create:ip:${await clientIp()}`, perHour * 2, 3_600_000),
  ]);
  if (!byOwner.allowed || !byIp.allowed) redirect(`/${lang}/build?error=too_many`);
  const project = await builder.store.createProject(owner, { name: "", locale: lang });
  redirect(`/${lang}/build/${project.id}`);
}
