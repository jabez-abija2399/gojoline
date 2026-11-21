"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/billing/service";
import { reportError } from "@/lib/observability/report";
import { services } from "@/lib/server/services";
import { addisNow, makeVideo, planAhead, publishPost, rewriteCaption } from "@/lib/posts/service";
import { cleanHashtags } from "@/lib/posts/captions";
import { CHANNELS } from "@/lib/posts/types";

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
  back(l, done, `#post-${parsed.data.id}`);
}

const connectInput = z.discriminatedUnion("network", [
  // A public channel name (@name) or a private channel's numeric id (-100…).
  z.object({ network: z.literal("telegram"), channelId: z.string().trim().regex(/^(@[A-Za-z0-9_]{5,32}|-100\d{5,15})$/) }),
  z.object({ network: z.literal("facebook"), pageId: z.string().trim().regex(/^\d{5,25}$/), token: z.string().trim().min(20).max(1000) }),
  z.object({ network: z.literal("instagram"), userId: z.string().trim().regex(/^\d{5,25}$/) }),
  z.object({ network: z.literal("tiktok"), clientKey: z.string().trim().min(5).max(100), clientSecret: z.string().trim().min(10).max(200) }),
]);

/** Admin → Posts → Connections: checks the details with the network, then saves them (tokens sealed). */
export async function saveConnection(form: FormData) {
  const me = await admin();
  const l = lang(form);
  const parsed = connectInput.safeParse(Object.fromEntries(form));
  const network = String(form.get("network") ?? "");
  const anchor = `#connect-${network.replace(/[^a-z]/g, "")}`;
  if (!parsed.success) return back(l, "invalid", `&cn=${network}${anchor}`);
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
      const fb = (await connections.load()).facebook;
      if (!fb) problem = "facebook_first";
      else {
        const username = await deps.verify!.instagram(v.userId, fb.token).catch((e: Error) => void (problem = e.message));
        if (!problem) await connections.saveInstagram({ userId: v.userId, username: username ?? undefined }, me.id);
      }
    } else {
      await connections.saveTikTokApp({ clientKey: v.clientKey, clientSecret: v.clientSecret }, me.id);
    }
  } catch (e) {
    reportError(`connect ${v.network} failed`, e);
    return back(l, "failed", `&cn=${v.network}${anchor}`);
  }
  revalidatePath(`/${l}/admin`);
  // Only a fixed reason code goes back in the address (the page words it): never the network's text.
  if (problem) return back(l, "failed", `&cn=${v.network}&why=${connectProblem(v.network, String(problem))}${anchor}`);
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
export type ConnectProblem = "facebook_first" | "bot" | "chat_not_found" | "bot_not_admin" | "token" | "permission" | "not_found" | "other";

function connectProblem(network: string, message: string): ConnectProblem {
  if (message === "facebook_first" || message === "bot") return message;
  if (network === "telegram") {
    if (/chat not found/i.test(message)) return "chat_not_found";
    if (/not enough rights|administrator|not a member|forbidden|kicked/i.test(message)) return "bot_not_admin";
    return "other";
  }
  if (/oauth|access token|session|expired|invalid token/i.test(message)) return "token";
  if (/permission|does not have|requires|not authorized/i.test(message)) return "permission";
  if (/does not exist|unsupported get request|cannot be loaded|not found/i.test(message)) return "not_found";
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
