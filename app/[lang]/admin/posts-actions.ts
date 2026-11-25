"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { reportError } from "@/lib/observability/report";
import { services } from "@/lib/server/services";
import { addisNow, FILMABLE, makeVideo, planAhead, publishPost, rewriteCaption } from "@/lib/posts/service";
import { cleanHashtags } from "@/lib/posts/captions";
import { CHANNELS } from "@/lib/posts/types";
import { KIT_IDS, TELEGRAM_KIT, kitMediaUrl, kitText } from "@/lib/posts/telegram-kit";
import { shortUrl } from "@/lib/growth/short-links";
import { escapeHtml } from "@/lib/telegram/client";
import { PRIVACY_LEVELS, privacyAllowed } from "@/lib/posts/tiktok-direct";
import { IG_ID_NEEDED, IG_TOKEN_EXPIRES } from "@/lib/posts/verify";

type Done = "ok" | "invalid" | "failed" | "not_found";
const lang = (form: FormData) => (form.get("lang") === "am" ? "am" : "en");
const back = (l: string, done: Done, extra = "") => redirect(`/${l}/admin?tab=posts&pd=${done}${extra}`);

async function admin() {
  const me = await currentUser();
  if (!me || !isAdmin(me)) redirect("/");
  return me;
}

/** Plans (and captions) the next 7 days that have no post yet. */
export async function planWeek(form: FormData) {
  const me = await admin();
  const l = lang(form);
  let n = -1;
  try {
    n = await planAhead(services().posts, me.id, addisNow(Date.now()).day);
  } catch (e) {
    reportError("posts plan failed", e);
  }
  revalidatePath(`/${l}/admin`);
  back(l, n < 0 ? "failed" : "ok", n >= 0 ? `&planned=${n}` : "");
}

const edit = z.object({
  id: z.uuid(),
  captionEn: z.string().trim().max(1500),
  hashtags: z.string().trim().max(300),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export async function savePost(form: FormData) {
  await admin();
  const l = lang(form);
  const parsed = edit.safeParse(Object.fromEntries(form));
  if (!parsed.success) return back(l, "invalid");
  const channels = form.getAll("channels").filter((c): c is (typeof CHANNELS)[number] => CHANNELS.includes(c as (typeof CHANNELS)[number]));
  const store = services().posts.store;
  const post = await store.get(parsed.data.id);
  if (!post) return back(l, "not_found");
  if (post.status === "posted") return back(l, "invalid");
  const { id, hashtags, ...rest } = parsed.data;
  await store.update(id, { ...rest, hashtags: hashtags ? cleanHashtags(hashtags) : "", channels });
  revalidatePath(`/${l}/admin`);
  back(l, "ok", `&ps=saved#post-${id}`);
}

const act = z.object({ id: z.uuid(), action: z.enum(["approve", "unapprove", "skip", "post", "rewrite"]) });

/** Approve, back to draft, skip, post now (approves first) or rewrite the caption. */
export async function postAction(form: FormData) {
  const me = await admin();
  const l = lang(form);
  const parsed = act.safeParse(Object.fromEntries(form));
  if (!parsed.success) return back(l, "invalid");
  const { id, action } = parsed.data;
  const deps = services().posts;
  let done: Done = "ok";
  try {
    const post = await deps.store.get(id);
    if (!post) done = "not_found";
    else if (post.status === "posted" && action !== "post") done = "invalid";
    else if (action === "approve") await deps.store.update(id, { status: "approved" });
    else if (action === "unapprove") await deps.store.update(id, { status: "draft" });
    else if (action === "skip") await deps.store.update(id, { status: "skipped" });
    else if (action === "rewrite") done = (await rewriteCaption(deps, me.id, id)) ? "ok" : "failed";
    else {
      if (post.status === "draft" || post.status === "skipped") await deps.store.update(id, { status: "approved" });
      const after = await publishPost(deps, id);
      done = after?.status === "posted" ? "ok" : "failed";
    }
  } catch (e) {
    reportError(`post ${action} failed`, e);
    done = "failed";
  }
  revalidatePath(`/${l}/admin`);
  back(l, done, `#post-${id}`);
}

const videoInput = z.object({ id: z.uuid(), style: z.enum(["tour", "spotlight"]) });

/** Films the post's template or site into its video (about a minute). */
export async function makePostVideo(form: FormData) {
  await admin();
  const l = lang(form);
  const parsed = videoInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return back(l, "invalid");
  let done: Done = "ok";
  try {
    done = (await makeVideo(services().posts, parsed.data.id, parsed.data.style, "en")) ? "ok" : "not_found";
  } catch (e) {
    reportError("post video failed", e);
    done = "failed";
  }
  revalidatePath(`/${l}/admin`);
  back(l, done, form.get("back") === "videos" ? `&view=videos#video-${parsed.data.id}` : `#post-${parsed.data.id}`);
}

const connectInput = z.discriminatedUnion("network", [
  // A public channel name (@name) or a private channel's numeric id (-100…).
  z.object({ network: z.literal("telegram"), channelId: z.string().trim().regex(/^(@[A-Za-z0-9_]{5,32}|-100\d{5,15})$/) }),
  z.object({ network: z.literal("facebook"), pageId: z.string().trim().regex(/^\d{5,25}$/), token: z.string().trim().min(20).max(1000) }),
  // Instagram: a token (Instagram login or Unified login); the account is found from it, or given.
  z.object({ network: z.literal("instagram"), token: z.string().trim().min(20).max(1000), userId: z.union([z.literal(""), z.string().trim().regex(/^\d{5,25}$/)]).optional() }),
  z.object({ network: z.literal("tiktok"), clientKey: z.string().trim().min(5).max(100), clientSecret: z.string().trim().min(10).max(200) }),
]);

/** Admin → Posts → Connections: checks the details with the network, then saves them (tokens sealed). */
export async function saveConnection(form: FormData) {
  const me = await admin();
  const l = lang(form);
  const parsed = connectInput.safeParse(Object.fromEntries(form));
  const network = String(form.get("network") ?? "");
  const anchor = `#connect-${network.replace(/[^a-z]/g, "")}`;
  if (!parsed.success) {
    // A mistyped Instagram account ID gets its own message (and only that field is marked).
    const onlyId = network === "instagram" && parsed.error.issues.every((i) => i.path[0] === "userId");
    return onlyId ? back(l, "failed", `&cn=instagram&why=ig_id_format${anchor}`) : back(l, "invalid", `&cn=${network}${anchor}`);
  }
  const deps = services().posts;
  const connections = deps.connections;
  if (!connections) return back(l, "failed", anchor);
  const v = parsed.data;
  let problem: string | null = null;
  try {
    if (v.network === "telegram") {
      // A short message in the channel proves the bot can post there.
      const tg = services().telegram;
      if (!tg) problem = "bot";
      else await tg.client.post(v.channelId, { html: "✅ Gojoline is connected to this channel. Daily posts will appear here." }).then(() => connections.saveTelegram(v.channelId, me.id), (e: Error) => void (problem = e.message));
    } else if (v.network === "facebook") {
      const name = await deps.verify!.facebook(v.pageId, v.token).catch((e: Error) => void (problem = e.message));
      if (!problem) await connections.saveFacebook({ pageId: v.pageId, token: v.token, name: name ?? undefined }, me.id);
    } else if (v.network === "instagram") {
      const who = await deps.verify!.instagramToken(v.token, v.userId || undefined).catch((e: Error) => void (problem = e.message));
      if (!problem && who) await connections.saveInstagram({ userId: who.userId, username: who.username, token: v.token, host: who.host }, me.id);
    } else {
      await connections.saveTikTokApp({ clientKey: v.clientKey, clientSecret: v.clientSecret }, me.id);
    }
  } catch (e) {
    reportError(`connect ${v.network} failed`, e);
    return back(l, "failed", `&cn=${v.network}${anchor}`);
  }
  revalidatePath(`/${l}/admin`);
  // Only a fixed reason code goes back in the address (the page words it): never the network's text.
  // The network's own reason, server-side only (it never contains the token), for diagnosing.
  if (problem) console.warn(`connect ${v.network} refused: ${scrub(String(problem), v)}`);
  if (problem) return back(l, "failed", `&cn=${v.network}&why=${connectProblem(v.network, String(problem), v.network === "instagram" && !!v.userId)}${anchor}`);
  back(l, "ok", `&cn=${v.network}&connected=1${anchor}`);
}

const disconnectInput = z.object({ network: z.enum(["telegram", "facebook", "instagram", "tiktok"]) });

/** Removes a connection saved in Admin (server settings, if any, still apply). */
export async function disconnectNetwork(form: FormData) {
  const me = await admin();
  const l = lang(form);
  const parsed = disconnectInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return back(l, "invalid");
  await services().posts.connections?.remove(parsed.data.network, me.id);
  revalidatePath(`/${l}/admin`);
  back(l, "ok", `&cn=${parsed.data.network}#connect-${parsed.data.network}`);
}

/** The reasons a connection can fail, as codes the page words in its own language. */
export type ConnectProblem = "not_business" | "ig_permission" | "ig_id_needed" | "ig_id_format" | "ig_expires" | "bot" | "chat_not_found" | "bot_not_admin" | "token" | "permission" | "not_found" | "other";

function connectProblem(network: string, message: string, gaveId = false): ConnectProblem {
  if (message === "bot") return message;
  if (message === IG_ID_NEEDED) return "ig_id_needed";
  if (message === IG_TOKEN_EXPIRES) return "ig_expires";
  if (/professional account/i.test(message)) return "not_business";
  if (network === "telegram") {
    if (/chat not found/i.test(message)) return "chat_not_found";
    if (/not enough rights|administrator|not a member|forbidden|kicked/i.test(message)) return "bot_not_admin";
    return "other";
  }
  if (/oauth|access token|session|expired|invalid token/i.test(message)) return "token";
  if (/permission|does not have|requires|not authorized/i.test(message)) return network === "instagram" ? "ig_permission" : "permission";
  // An unknown account: the ID typed, else (no ID on the Instagram form) the token.
  if (/does not exist|unsupported get request|cannot be loaded|not found/i.test(message)) return network === "instagram" && !gaveId ? "token" : "not_found";
  return "other";
}

/** "Approve all": every draft in the next two weeks, after the admin has read them in the To review tab. */
export async function approveAllDrafts(form: FormData) {
  await admin();
  const l = lang(form);
  const store = services().posts.store;
  const today = addisNow(Date.now()).day;
  const end = new Date(Date.parse(`${today}T00:00:00Z`) + 13 * 86_400_000).toISOString().slice(0, 10);
  const drafts = (await store.between(today, end)).filter((p) => p.status === "draft");
  for (const p of drafts) await store.update(p.id, { status: "approved" });
  revalidatePath(`/${l}/admin`);
  redirect(`/${l}/admin?tab=posts&view=scheduled&pd=ok&approved=${drafts.length}`);
}

/**
 * Admin → Posts → Videos: makes the video of every draft in the next 7 days that has none, one
 * after another in the background (each takes 10 s to a minute), so the page answers at once.
 * Approved posts keep what was approved. One batch at a time; a post that got a video meanwhile
 * (an upload) is skipped; a busy video server is waited for; a post's own failure is noted on it.
 */
export async function makeWeekVideos(form: FormData) {
  await admin();
  const l = lang(form);
  const deps = services().posts;
  const video = deps.video;
  if (!video) return back(l, "failed", "&view=videos");
  const today = addisNow(Date.now()).day;
  const end = new Date(Date.parse(`${today}T00:00:00Z`) + 6 * 86_400_000).toISOString().slice(0, 10);
  const todo = (await deps.store.between(today, end)).filter((p) => p.status === "draft" && FILMABLE.includes(p.kind) && p.media?.type !== "video");
  // Long enough for every video at its slowest (the client waits up to 280 s each).
  const token = todo.length ? await deps.lock.acquire("posts:videos", (todo.length * 300 + 60) * 1000) : null;
  if (todo.length && !token) return redirect(`/${l}/admin?tab=posts&view=videos&vq=busy`);
  if (token) {
    after(async () => {
      try {
        for (const p of todo) {
          const now = await deps.store.get(p.id).catch(() => null);
          if (!now || now.status !== "draft" || now.media?.type === "video") continue;
          for (let attempt = 0; ; attempt++) {
            try {
              await makeVideo(deps, p.id, "tour", "en");
              break;
            } catch (e) {
              // The video server is busy with another video: wait and try again (3 times).
              if (attempt < 3 && e instanceof Error && /renderer 503/.test(e.message)) {
                await new Promise((r) => setTimeout(r, 20_000));
                continue;
              }
              reportError("week video failed", e);
              await deps.store.saveResult(p.id, "video", { ok: false, at: new Date().toISOString(), error: e instanceof Error ? e.message.slice(0, 200) : "failed" }).catch(() => undefined);
              break;
            }
          }
        }
      } finally {
        await deps.lock.release("posts:videos", token);
      }
    });
  }
  revalidatePath(`/${l}/admin`);
  redirect(`/${l}/admin?tab=posts&view=videos&vq=${todo.length}`);
}

/** A network's reason, safe to log: the secrets given removed, anything token-shaped hidden, one line. */
function scrub(text: string, v: Record<string, unknown>): string {
  let out = text;
  for (const k of ["token", "clientSecret"]) if (typeof v[k] === "string" && (v[k] as string).length >= 8) out = out.split(v[k] as string).join("[secret]");
  return out.replace(/\b(EAA|IG)[A-Za-z0-9_-]{16,}/g, "[secret]").replace(/[\r\n]+/g, " ").slice(0, 200);
}

const kitInput = z.object({ id: z.enum(KIT_IDS as [string, ...string[]]), done: z.enum(["1", "0"]).optional(), again: z.literal("1").optional() });

/** Telegram start: marks a starter post as posted (by hand) or not. */
export async function markKitPost(form: FormData) {
  const me = await admin();
  const l = lang(form);
  const parsed = kitInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return back(l, "invalid", "&view=kit");
  await services().posts.kit?.mark(parsed.data.id, parsed.data.done !== "0", me.id);
  revalidatePath(`/${l}/admin`);
  back(l, "ok", `&view=kit&kit=${parsed.data.id}#kit-${parsed.data.id}`);
}

/** Telegram start: sends a starter post to the connected channel now (video, photo, album or quiz), then marks it posted. */
export async function sendKitPost(form: FormData) {
  const me = await admin();
  const l = lang(form);
  const parsed = kitInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return back(l, "invalid", "&view=kit");
  const id = parsed.data.id;
  const deps = services().posts;
  const tg = services().telegram;
  const channel = (await deps.connections?.load())?.telegram?.channelId;
  const post = TELEGRAM_KIT.find((k) => k.id === id)!;
  // Query first, then the card's anchor: anything after "#" never reaches the page.
  const here = `&view=kit&kit=${id}`;
  const anchor = `#kit-${id}`;
  if (!tg || !channel) return back(l, "failed", `${here}&why=no_channel${anchor}`);
  // One send at a time per post: a double click never posts twice.
  const token = await deps.lock.acquire(`kit:${id}`, 180_000);
  if (!token) return back(l, "failed", `${here}&why=busy${anchor}`);
  // Already posted: only "Send again" (again=1) posts it a second time, never a repeated form.
  if (!parsed.data.again && (await deps.kit?.posted())?.[id]) {
    await deps.lock.release(`kit:${id}`, token);
    return back(l, "failed", `${here}&why=already${anchor}`);
  }
  let failed = false;
  try {
    const html = escapeHtml(kitText(post, shortUrl(deps.appUrl, "tg")));
    // Telegram fetches the media from our public address: nothing large passes through this server.
    const url = (file: string) => `${deps.appUrl}${kitMediaUrl(file)}`;
    const m = post.media[0];
    if (post.quiz) await tg.client.quiz(channel, post.quiz);
    else if (post.media.length > 1) await tg.client.album(channel, { html, urls: post.media.map((x) => url(x.file)) });
    else if (m) await tg.client.postUrl(channel, { html, kind: m.kind, url: url(m.file) });
    else await tg.client.post(channel, { html });
    await deps.kit?.mark(id, true, me.id);
  } catch (e) {
    console.warn(`kit ${id} send failed: ${String((e as Error).message).replace(/[\r\n]+/g, " ").slice(0, 200)}`);
    failed = true;
  } finally {
    await deps.lock.release(`kit:${id}`, token);
  }
  revalidatePath(`/${l}/admin`);
  return failed ? back(l, "failed", `${here}&why=send${anchor}`) : back(l, "ok", `${here}&sent=1${anchor}`);
}

const tiktokInput = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(2200),
  privacy: z.enum(PRIVACY_LEVELS),
  comment: z.literal("on").optional(),
  duet: z.literal("on").optional(),
  stitch: z.literal("on").optional(),
  disclose: z.literal("on").optional(),
  yourBrand: z.literal("on").optional(),
  branded: z.literal("on").optional(),
});

/**
 * Videos → Post to TikTok: posts one video straight to our TikTok account with the settings the
 * admin chose on TikTok's required screen (privacy from TikTok's own options, interactions the
 * account allows, commercial content disclosure). Checked again here against the account.
 */
export async function postToTikTok(form: FormData) {
  await admin();
  const l = lang(form);
  const parsed = tiktokInput.safeParse(Object.fromEntries(form));
  const id = typeof form.get("id") === "string" ? String(form.get("id")) : "";
  const here = (why: string) => `&view=videos&tiktok=${encodeURIComponent(/^[0-9a-f-]{36}$/.test(id) ? id : "")}&tt=${why}#tiktok-post`;
  if (!parsed.success) return back(l, "invalid", here("invalid"));
  const v = parsed.data;
  // Disclosure on means saying what kind; a paid partnership can't be private (TikTok's rules).
  if (v.disclose && !v.yourBrand && !v.branded) return back(l, "failed", here("disclose"));
  if (!privacyAllowed(v.privacy, !!(v.disclose && v.branded))) return back(l, "failed", here("branded_private"));
  const deps = services().posts;
  const tiktok = await deps.tiktokDirect?.();
  if (!tiktok) return back(l, "failed", here("not_connected"));
  const post = await deps.store.get(v.id);
  if (!post) return back(l, "not_found", "&view=videos");
  const media = post.media?.type === "video" ? await deps.media(post.media) : null;
  if (!media || media.kind !== "video") return back(l, "failed", here("no_video"));
  const token = await deps.lock.acquire(`tiktok:${v.id}`, 180_000);
  if (!token) return back(l, "failed", here("busy"));
  let why = "sent";
  try {
    const creator = await tiktok.creator();
    if (!creator.privacyOptions.includes(v.privacy)) why = "privacy";
    else {
      const ref = await tiktok.post({
        video: media.data,
        title: v.title,
        privacy: v.privacy,
        allowComment: !!v.comment && !creator.commentDisabled,
        allowDuet: !!v.duet && !creator.duetDisabled,
        allowStitch: !!v.stitch && !creator.stitchDisabled,
        yourBrand: !!(v.disclose && v.yourBrand),
        brandedContent: !!(v.disclose && v.branded),
      });
      await deps.store.saveResult(v.id, "tiktok", { ok: true, at: new Date().toISOString(), ref });
    }
  } catch (e) {
    console.warn(`tiktok direct post failed: ${String((e as Error).message).replace(/[\r\n]+/g, " ").slice(0, 200)}`);
    await deps.store.saveResult(v.id, "tiktok", { ok: false, at: new Date().toISOString(), error: String((e as Error).message).slice(0, 200) }).catch(() => null);
    why = "failed";
  } finally {
    await deps.lock.release(`tiktok:${v.id}`, token);
  }
  revalidatePath(`/${l}/admin`);
  back(l, why === "sent" ? "ok" : "failed", here(why));
}
