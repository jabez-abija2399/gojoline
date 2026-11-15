"use server";

import { redirect } from "next/navigation";
import { ownerId } from "@/lib/builder/access";
import { isLocale } from "@/lib/i18n/config";
import { clientIp } from "@/lib/server/request";
import { services } from "@/lib/server/services";
import { getMessages } from "@/lib/i18n";
import { isPresetId, presetVersionFiles } from "@/lib/template/presets";

export async function createProject(form: FormData) {
  const lang = isLocale(form.get("lang")) ? (form.get("lang") as "en" | "am") : "en";
  const owner = await ownerId();
  if (!owner) redirect(`/${lang}/sign-in?next=/${lang}/build`);
  const builder = services().builder;
  if (!builder) redirect(`/${lang}/build`);
  const perHour = Number(process.env.BUILDER_RATE_LIMIT_PER_HOUR) || 10;
  const limiter = services().rateLimiter;
  // Per owner and per IP: clearing the owner cookie must not reset the limit.
  const [byOwner, byIp] = await Promise.all([
    limiter.hit(`project-create:o:${owner}`, perHour, 3_600_000),
    limiter.hit(`project-create:ip:${await clientIp()}`, perHour * 2, 3_600_000),
  ]);
  if (!byOwner.allowed || !byIp.allowed) redirect(`/${lang}/build?error=too_many`);
  // Starting from an industry template gives a ready site as version 1 (no AI cost).
  const preset = form.get("preset");
  // Named after the kind of business until the owner gives the real name (not the example's).
  const project = await builder.store.createProject(owner, { name: isPresetId(preset) ? getMessages(lang).builder.templates[preset] : "", locale: lang });
  if (isPresetId(preset)) await builder.store.addVersion(owner, { projectId: project.id, summary: `template:${preset}`, files: presetVersionFiles(preset) });
  redirect(`/${lang}/build/${project.id}`);
}
