import { reportError } from "@/lib/observability/report";
import { z } from "zod";
import type { BuilderDeps } from "@/lib/builder/service";
import { sendOwnerMessage } from "@/lib/builder/service";
import { assetName, MAX_UPLOAD_BYTES, processImage } from "@/lib/cloud/images";
import type { RateLimiter } from "@/lib/rate-limit";
import { publishSite, type PublishDeps } from "@/lib/publish/service";
import { escapeHtml, type TelegramClient } from "./client";
import { botText, fill } from "./messages";
import type { PendingEdit, TelegramLink, TelegramStore } from "./store";

/** A bigger edit waits this long for the owner's "yes". */
const PENDING_TTL_MS = 15 * 60_000;
/** Only an explicit yes runs a bigger change (not "ok" or "go", which people send for other reasons). */
const YES = /^(yes|አዎ)$/i;

export interface BotDeps {
  store: TelegramStore;
  client: TelegramClient;
  builder: BuilderDeps | null;
  publish: PublishDeps | null;
  limiter: RateLimiter;
  /** Publishing needs a verified account; without this check the bot never republishes. */
  isVerified?: (userId: string) => Promise<boolean>;
  /** Editing by Telegram is a Business feature; without this check it's allowed. */
  canEditByTelegram?: (userId: string) => Promise<boolean>;
}

/** Only the parts of a Telegram update we use; everything else is ignored. */
const updateSchema = z.object({
  update_id: z.number().int(),
  message: z
    .object({
      chat: z.object({ id: z.number().int(), type: z.string() }),
      from: z.object({ username: z.string().max(64).optional() }).optional(),
      text: z.string().max(4096).optional(),
      caption: z.string().max(1024).optional(),
      photo: z.array(z.object({ file_id: z.string().max(300), file_size: z.number().optional(), width: z.number(), height: z.number() })).max(10).optional(),
    })
    .optional(),
});

export async function handleUpdate(deps: BotDeps, raw: unknown): Promise<void> {
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.message) return;
  if (!(await deps.store.firstSeen(parsed.data.update_id))) return;
  const msg = parsed.data.message;
  // Private chats only: a group must never receive an owner's answers or control a site.
  if (msg.chat.type !== "private") return;
  const chatId = String(msg.chat.id);
  const text = msg.text?.trim() ?? "";
  const link = await deps.store.byChat(chatId);
  const say = (html: string) => deps.client.sendMessage(chatId, html);

  if (text.startsWith("/start")) {
    const code = text.slice(6).trim();
    if (!code) return say(botText[link?.locale ?? "en"].welcome);
    if (!/^[\w-]{10,64}$/.test(code)) return say(botText.en.badCode);
    // Never silently move a chat from one account to another (someone could send you their link).
    if (link) return say(botText[link.locale].otherAccount);
    const claim = await deps.store.consumeLinkCode(code);
    if (!claim) return say(botText.en.badCode);
    await deps.store.link({ userId: claim.userId, chatId, username: msg.from?.username ?? null, locale: claim.locale });
    return say(botText[claim.locale].linked);
  }
  if (!link) return say(`${botText.en.notLinked}\n\n${botText.am.notLinked}`);
  const t = botText[link.locale];

  if (text === "/stop") {
    await deps.store.unlink(link.userId);
    return say(t.stopped);
  }
  if (text === "/help") return say(t.help);
  if (!deps.builder) return say(t.failed);

  const projects = await deps.builder.store.listProjects(link.userId);
  if (projects.length === 0) return say(t.noSites);

  if (text === "/sites") {
    const list = projects.slice(0, 20).map((p, i) => `${i + 1}. ${escapeHtml(p.name || "—")}`).join("\n");
    return say(`${t.pickSite}\n${list}`);
  }
  if (/^\d{1,2}$/.test(text) && Number(text) >= 1 && Number(text) <= Math.min(20, projects.length)) {
    const chosen = projects[Number(text) - 1]!;
    await deps.store.setActiveProject(link.userId, chosen.id);
    return say(fill(t.siteChosen, { name: escapeHtml(chosen.name || "—") }));
  }

  const project = projects.find((p) => p.id === link.activeProjectId) ?? projects[0]!;
  if (deps.canEditByTelegram && !(await deps.canEditByTelegram(link.userId))) return say(t.planEdits);

  // A photo (with or without a caption) is a new message: anything waiting for "yes" is dropped.
  if (msg.photo?.length && link.pendingEdit) await deps.store.setPendingEdit(link.userId, null);
  if (msg.photo?.length) {
    // Same per-owner limits as the web dashboard and builder.
    if (!(await deps.limiter.hit(`upload:o:${link.userId}`, 60, 3_600_000)).allowed) return say(t.tooMany);
    const photo = [...msg.photo].sort((a, b) => b.width * b.height - a.width * a.height)[0]!;
    const saved = await savePhoto(deps, link, project.id, photo.file_id);
    if (!saved) return say(t.photoBad);
    if (!msg.caption?.trim()) return say(fill(t.photoSaved, { name: escapeHtml(saved) }));
    return edit(deps, link, project.id, `${msg.caption.trim()}\n(Use the new photo /images/${saved}.)`, say);
  }
  if (!text || text.startsWith("/")) return say(t.help);
  // "Yes" to a bigger change asked about a moment ago runs that change (on the site it was for).
  const pending = link.pendingEdit ?? null;
  if (YES.test(text.trim()) && pending) {
    await deps.store.setPendingEdit(link.userId, null);
    if (Date.now() - Date.parse(pending.at) > PENDING_TTL_MS || !projects.some((p) => p.id === pending.projectId)) return say(t.confirmExpired);
    return edit(deps, link, pending.projectId, pending.text, say, { size: pending.size, cost: pending.cost });
  }
  if (pending) await deps.store.setPendingEdit(link.userId, null);
  return edit(deps, link, project.id, text, say);
}

/** Runs the edit and always tells the owner how it ended. */

async function savePhoto(deps: BotDeps, link: TelegramLink, projectId: string, fileId: string): Promise<string | null> {
  const assets = deps.builder?.assets;
  if (!assets) return null;
  const bytes = await deps.client.downloadFile(fileId, MAX_UPLOAD_BYTES);
  if (!bytes) return null;
  const img = await processImage(bytes);
  if (!img.ok) return null;
  const names = new Set((await assets.list(link.userId, projectId)).map((a) => a.name));
  const name = assetName(`telegram-photo-${Date.now()}`, (n) => names.has(n));
  await assets.add(link.userId, projectId, { name, mime: img.mime, width: img.width, height: img.height, data: img.data });
  return name;
}

/** Runs the owner's request through the builder agent, then republishes if the site is live. */
type Confirmed = { size: PendingEdit["size"]; cost: number };

async function edit(deps: BotDeps, link: TelegramLink, projectId: string, request: string, say: (html: string) => Promise<void>, confirmed?: Confirmed) {
  try {
    await runEdit(deps, link, projectId, request, say, confirmed);
  } catch (error) {
    reportError("telegram edit failed", error, { projectId });
    await say(botText[link.locale].failed).catch(() => undefined);
  }
}

async function runEdit(deps: BotDeps, link: TelegramLink, projectId: string, request: string, say: (html: string) => Promise<void>, confirmed?: Confirmed) {
  const t = botText[link.locale];
  // Bot edits share the web builder's per-owner AI limit (no separate allowance).
  if (!(await deps.limiter.hit(`ai-message:o:${link.userId}`, Number(process.env.BUILDER_RATE_LIMIT_PER_HOUR) || 40, 3_600_000)).allowed) return say(t.tooMany);
  await say(t.working);
  let outcome: { status?: string; reply?: string; error?: string; cost?: number; credits?: number; charged?: number; tooBig?: boolean; confirm?: { size: PendingEdit["size"]; cost: number; credits: number } } = {};
  await sendOwnerMessage(deps.builder!, {
    ownerId: link.userId,
    projectId,
    text: request,
    confirmSize: confirmed?.size,
    confirmCost: confirmed?.cost,
    onEvent: (e) => {
      if (e.type === "done") outcome = { status: e.message.status, reply: e.message.text, charged: e.charged, credits: e.credits, tooBig: e.tooBig };
      if (e.type === "error") outcome = { error: e.code, cost: e.cost, credits: e.credits };
      if (e.type === "needs_confirm" && e.size !== "small") outcome = { confirm: { size: e.size, cost: e.cost, credits: e.credits } };
    },
  });
  if (outcome.confirm) {
    // Nothing ran or was charged: the request waits for "yes" (the next other message replaces it).
    await deps.store.setPendingEdit(link.userId, { projectId, text: request, size: outcome.confirm.size, cost: outcome.confirm.cost, at: new Date().toISOString() });
    return say(fill(t.confirm, { cost: String(outcome.confirm.cost), left: String(outcome.confirm.credits) }));
  }
  if (outcome.error === "busy") return say(t.busy);
  if (outcome.error === "blocked") return say(t.blocked);
  if (outcome.error === "no_credits") return say(outcome.cost && (outcome.credits ?? 0) > 0 ? fill(t.notEnough, { cost: String(outcome.cost), left: String(outcome.credits ?? 0) }) : t.noCredits);
  if (outcome.status === "failed" && outcome.tooBig) return say(t.tooBig);
  if (outcome.error || outcome.status === "failed") return say(t.failed);
  // Bigger changes say what they used, so the cost is never a surprise.
  const used = (outcome.charged ?? 0) > 1 && typeof outcome.credits === "number" ? `\n${fill(t.used, { n: String(outcome.charged), left: String(outcome.credits) })}` : "";
  const reply = escapeHtml(outcome.reply ?? "") + used;
  if (outcome.status === "changed" && deps.publish) {
    const site = await deps.publish.sites.getByProject(link.userId, projectId);
    if (site?.status === "published" && (await deps.limiter.hit(`publish:o:${link.userId}`, Number(process.env.BUILDER_RATE_LIMIT_PER_HOUR) || 20, 3_600_000)).allowed) {
      const verified = deps.isVerified ? await deps.isVerified(link.userId) : false;
      const r = await publishSite(deps.publish, { id: link.userId, verified }, projectId, site.slug);
      if (r.ok) return say(fill(t.doneLive, { reply }));
    }
  }
  return say(outcome.status === "changed" ? fill(t.done, { reply }) : reply || t.help);
}
