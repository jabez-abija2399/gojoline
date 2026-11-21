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
