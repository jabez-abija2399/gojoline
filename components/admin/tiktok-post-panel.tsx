import { postToTikTok } from "@/app/[lang]/admin/posts-actions";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { postText } from "@/lib/posts/plan";
import type { SocialPost } from "@/lib/posts/types";
import { reportError } from "@/lib/observability/report";
import { services } from "@/lib/server/services";
import { FocusOnMount } from "./focus-on-mount";
import { TikTokPostForm } from "./tiktok-post-form";

type T = Messages["admin"]["posts"];

/** Videos → Post to TikTok: one post's video with TikTok's required posting screen. */
export async function TikTokPostPanel({ post, lang, t, title, result }: { post: SocialPost; lang: "en" | "am"; t: T; title: string; result: string | null }) {
  const k = t.tiktokPost;
  const deps = services().posts;
  const cancel = `/${lang}/admin?tab=posts&view=videos#video-${post.id}`;
  // Posted (just now, or earlier): the form isn't shown again and TikTok isn't called.
  const ok = result === "sent";
  const done = ok || !!post.results.tiktok?.ok;
  const tiktok = done ? null : await deps.tiktokDirect?.().catch(() => null);
  let creator = null;
  let loadFailed = false;
  if (tiktok) {
    creator = await tiktok.creator().catch((e: unknown) => {
      reportError("tiktok creator info failed", e);
      loadFailed = true;
      return null;
    });
  }
  return (
    <section id="tiktok-post" aria-labelledby="tiktok-post-title" className="flex scroll-mt-28 flex-col gap-3 rounded-2xl border-2 border-ink bg-white p-4">
      <h3 id="tiktok-post-title" className="text-base font-semibold">{format(k.heading, { day: title })}</h3>
      {result && (
        <FocusOnMount>
          <p role={ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${ok ? "border border-lagoon text-lagoon" : "bg-coral-soft text-destructive"}`}>
            {ok ? k.sent : Object.hasOwn(k.errors, result) ? (k.errors as Record<string, string>)[result] : k.errors.failed}
          </p>
        </FocusOnMount>
      )}
      {post.media?.type === "video" && (
        <video src={`/api/admin/posts/${post.id}/media`} controls preload="metadata" playsInline aria-label={format(k.videoLabel, { day: title })} className="aspect-[9/16] w-full max-w-48 rounded-lg bg-ink" />
      )}
      {done && !result && <p className="rounded-lg border border-lagoon px-3 py-2 text-sm text-lagoon">{k.alreadyPosted}</p>}
      {!done &&
        (!tiktok ? (
          <p className="text-ink-muted">
            {k.errors.not_connected}{" "}
            <a href={`/${lang}/admin?tab=posts&view=connections`} className="font-medium text-ink underline underline-offset-4">{k.toConnections}</a>
          </p>
        ) : loadFailed || !creator ? (
          <p role="alert" className="text-destructive">{k.errors.load}</p>
        ) : (
          <TikTokPostForm action={postToTikTok} lang={lang} postId={post.id} caption={postText(post, "tiktok", deps.appUrl)} creator={creator} t={k} cancelHref={cancel} />
        ))}
    </section>
  );
}
