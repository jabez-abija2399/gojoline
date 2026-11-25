import { CalendarPlus, CheckCheck, CheckCircle2, ChevronDown, Clapperboard, Download, Send, SkipForward, Sparkles, Undo2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { services } from "@/lib/server/services";
import { approveAllDrafts, makePostVideo, makeWeekVideos, savePost, planWeek, postAction } from "@/app/[lang]/admin/posts-actions";
import { addDays, postText, youtubeTitle } from "@/lib/posts/plan";
import { addisToday, AUTO_CHANNELS, FILMABLE, readyChannels } from "@/lib/posts/service";
import { CHANNELS, type Channel, type SocialPost } from "@/lib/posts/types";
import { CopyButton } from "@/components/billing/copy-button";
import { PostsKit } from "./posts-kit";
import { TikTokPostPanel } from "./tiktok-post-panel";
import { TELEGRAM_KIT } from "@/lib/posts/telegram-kit";
import { shortUrl } from "@/lib/growth/short-links";
import { FocusOnMount } from "./focus-on-mount";
import { PostSubmit } from "./post-submit";
import { PostConnections } from "./post-connections";
import { VideoUpload } from "./video-upload";
import { reportError } from "@/lib/observability/report";
import { cache, Suspense } from "react";
import { summarize, type PostResult, type Results as Reach } from "@/lib/posts/results";

type T = Messages["admin"]["posts"];
const DONE = ["ok", "invalid", "failed", "not_found"] as const;

const chip: Record<SocialPost["status"], string> = {
  draft: "bg-sunken text-ink",
  approved: "border border-ink text-ink",
  posted: "border border-lagoon text-lagoon",
  failed: "bg-coral-soft text-destructive",
  skipped: "bg-sunken text-ink-muted",
};

const button = "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:border-faint pointer-fine:min-h-9";
const solid = "inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-sm font-semibold text-paper hover:bg-ink-hover pointer-fine:min-h-9";

const VIEWS = ["review", "scheduled", "videos", "sent", "kit", "connections"] as const;
type View = (typeof VIEWS)[number];

/** A day's dot in the week strip: what state its post is in. */
const DOT: Record<SocialPost["status"] | "none", string> = {
  draft: "bg-faint",
  approved: "bg-ink",
  posted: "bg-lagoon",
  failed: "bg-coral",
  skipped: "bg-line",
  none: "border border-dashed border-faint bg-transparent",
};

/**
 * Admin → Posts: a week strip (every day's post and its state at a glance), then one view at a
 * time: To review (drafts, with Approve all), Scheduled (approved), Sent, and Connections.
 */
export async function PostsTab({ lang, t, sp }: { lang: "en" | "am"; t: T; sp: Record<string, string | string[] | undefined> }) {
  const deps = services().posts;
  const today = addisToday();
  const loaded = await Promise.all([deps.store.between(today, addDays(today, 13)), deps.store.history(30), readyChannels(deps), deps.connections?.view(), (deps.kit?.posted() ?? Promise.resolve({} as Record<string, string>)).catch((e: unknown) => (reportError("kit state failed", e), {} as Record<string, string>))]).catch((e: unknown) => (reportError("posts load failed", e), null));
  if (!loaded) return <p role="alert" className="rounded-xl bg-coral-soft p-4 text-destructive">{t.loadFailed}</p>;
  const [upcoming, history, ready, views, kitPosted] = loaded;
  const done = DONE.find((d) => d === sp.pd) ?? null;
  const planned = typeof sp.planned === "string" ? Number(sp.planned) : null;
  const approvedN = typeof sp.approved === "string" ? Number(sp.approved) : null;
  const dayFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const shortDay = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { weekday: "short", timeZone: "UTC" });
  const dateNum = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { day: "numeric", timeZone: "UTC" });
  const drafts = upcoming.filter((p) => p.status === "draft");
  const scheduled = upcoming.filter((p) => p.status === "approved" || p.status === "failed" || p.status === "skipped");
  const sent = history.filter((p) => p.status === "posted");
  const network = typeof sp.cn === "string" ? sp.cn : null;
  // Where to land: the view asked for; Connections after connecting; drafts first when there are any.
  const view: View = VIEWS.find((v) => v === sp.view) ?? (network ? "connections" : drafts.length > 0 ? "review" : "scheduled");
  const kitId = typeof sp.kit === "string" && TELEGRAM_KIT.some((k) => k.id === sp.kit) ? sp.kit : null;
  const kitMessage = kitId && done ? { id: kitId, ok: done === "ok", why: typeof sp.why === "string" ? sp.why : null, sent: sp.sent === "1" } : null;
  const message = network && done ? { network, ok: done === "ok", why: typeof sp.why === "string" ? sp.why : done === "invalid" ? "invalid" : null } : null;
  const connected = views ? Object.values(views).filter((v) => v.connected).length : 0;
  // The week's posts that go out (drafts and scheduled), each needing a video for TikTok, Reels and Shorts.
  const weekPosts = upcoming.filter((p) => p.day <= addDays(today, 6) && p.status !== "skipped" && p.status !== "posted").sort((a, b) => a.day.localeCompare(b.day));
  const withVideo = weekPosts.filter((p) => p.media?.type === "video").length;
  // Videos → Post to TikTok: the post asked for (this week's, or any upcoming one with a video).
  const tiktokPost = typeof sp.tiktok === "string" ? (upcoming.find((p) => p.id === sp.tiktok && p.media?.type === "video") ?? null) : null;
  const counts: Record<View, string> = { review: String(drafts.length), scheduled: String(scheduled.length), videos: `${withVideo}/${weekPosts.length}`, sent: String(sent.length), kit: `${TELEGRAM_KIT.filter((k) => kitPosted[k.id]).length}/${TELEGRAM_KIT.length}`, connections: `${connected}/4` };
  const href = (v: View) => `/${lang}/admin?tab=posts&view=${v}`;
  const viewOf = (p: SocialPost): View => (p.status === "draft" ? "review" : p.status === "posted" ? "sent" : "scheduled");
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const card = (p: SocialPost) => <PostCard key={p.id} post={p} lang={lang} t={t} ready={ready} appUrl={deps.appUrl} canFilm={!!deps.video} title={dayFmt.format(new Date(`${p.day}T00:00:00Z`))} />;

  return (
    <div className="flex flex-col gap-5">
      {done && !network && !kitId && (
        <FocusOnMount>
          <p role={done === "ok" ? "status" : "alert"} className={`rounded-lg px-4 py-2 font-medium ${done === "ok" ? "border border-lagoon bg-white text-lagoon" : "bg-coral-soft text-destructive"}`}>
            {done === "ok" && planned !== null
              ? planned > 1
                ? format(t.planned, { n: planned })
                : planned === 1
                  ? t.plannedOne
                  : t.plannedNone
              : done === "ok" && approvedN !== null
                ? format(t.approvedAll, { n: approvedN })
                : done === "ok" && sp.ps === "saved"
                  ? t.saved
                  : t.done[done]}
          </p>
        </FocusOnMount>
      )}

      <section aria-labelledby="posts-head" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 id="posts-head" className="text-lg font-semibold">{t.headTitle}</h2>
            <p className="text-sm text-ink-muted">{t.headBody}</p>
          </div>
          <form action={planWeek}>
            <input type="hidden" name="lang" value={lang} />
            <PostSubmit working={t.working} className={`${solid} w-full justify-center px-4 sm:w-auto`}>
              <CalendarPlus aria-hidden="true" className="size-4" />
              {t.plan}
            </PostSubmit>
          </form>
        </div>
        {/* The week at a glance: each day's post and its state; tap a day to open it. */}
        <ol aria-label={t.weekLabel} className="grid grid-cols-7 gap-1.5">
          {week.map((day) => {
            const p = upcoming.find((x) => x.day === day && x.status !== "skipped") ?? upcoming.find((x) => x.day === day);
            const status = p?.status ?? "none";
            const inner = (
              <>
                <span className="text-[11px] font-medium text-ink-muted uppercase">{shortDay.format(new Date(`${day}T00:00:00Z`))}</span>
                <span className="font-display text-lg font-bold tabular-nums">{dateNum.format(new Date(`${day}T00:00:00Z`))}</span>
                <span aria-hidden="true" className={`size-2.5 rounded-full ${DOT[status]}`} />
                <span className="w-full truncate text-center text-[11px] text-ink-muted max-sm:sr-only">{p ? t.kinds[p.kind] : "—"}</span>
                <span className="sr-only">{p ? `, ${t.statuses[p.status]}` : `, ${t.nothingPlanned}`}</span>
              </>
            );
            const cls = `flex min-h-[4.75rem] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 ${day === today ? "bg-paper ring-1 ring-ink" : "bg-paper"}`;
            return (
              <li key={day}>
                {p ? (
                  <a href={`${href(viewOf(p))}#post-${p.id}`} className={`${cls} hover:ring-1 hover:ring-faint`}>
                    {inner}
                  </a>
                ) : (
                  <span className={cls}>
                    {inner}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted" aria-label={t.legendLabel}>
          {(["draft", "approved", "posted", "failed"] as const).map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`size-2 rounded-full ${DOT[k]}`} />
              {t.statuses[k]}
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label={t.viewsLabel} className="chips-scroll -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        {VIEWS.map((v) => (
          <a
            key={v}
            href={href(v)}
            aria-current={v === view ? "page" : undefined}
            className="relative flex min-h-12 shrink-0 items-center gap-2 px-3 text-sm font-medium whitespace-nowrap text-ink-muted hover:text-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-2 aria-[current=page]:after:bottom-0 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full aria-[current=page]:after:bg-ink"
          >
            {t.views[v]}
            <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${v === "review" && drafts.length > 0 ? "bg-coral-soft text-ink" : "bg-sunken"}`}>{counts[v]}</span>
          </a>
        ))}
      </nav>

      {view === "review" && (
        <section aria-label={t.views.review} className="flex flex-col gap-3">
          {drafts.length === 0 ? (
            <Empty text={t.emptyReview} />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-muted">{t.reviewHint}</p>
                <form action={approveAllDrafts}>
                  <input type="hidden" name="lang" value={lang} />
                  <PostSubmit working={t.working} confirm={format(t.approveAllConfirm, { n: drafts.length })} className={button}>
                    <CheckCheck aria-hidden="true" className="size-4" />
                    {format(t.approveAll, { n: drafts.length })}
                  </PostSubmit>
                </form>
              </div>
              <ul className="flex flex-col gap-3">{drafts.map(card)}</ul>
            </>
          )}
        </section>
      )}

      {view === "scheduled" && (
        <section aria-label={t.views.scheduled} className="flex flex-col gap-3">
          {scheduled.length === 0 ? <Empty text={t.emptyScheduled} /> : <ul className="flex flex-col gap-3">{scheduled.map(card)}</ul>}
        </section>
      )}

      {view === "videos" && (
        <section aria-labelledby="videos-head" className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col">
              <h2 id="videos-head" className="text-base font-semibold">{t.videos.title}</h2>
              <p className="max-w-prose text-base text-ink-muted">{deps.video ? t.videos.hint : t.videos.noRenderer}</p>
            </div>
            {deps.video && weekPosts.length > withVideo && (
              <form action={makeWeekVideos}>
                <input type="hidden" name="lang" value={lang} />
                <PostSubmit working={t.working} confirm={format(t.videos.makeAllConfirm, { n: weekPosts.length - withVideo })} className={`${solid} w-full justify-center whitespace-nowrap sm:w-auto`}>
                  <Clapperboard aria-hidden="true" className="size-4" />
                  {format(t.videos.makeAll, { n: weekPosts.length - withVideo })}
                </PostSubmit>
              </form>
            )}
          </div>
          {typeof sp.vq === "string" && (
            <FocusOnMount>
              <p role="status" className={`rounded-lg px-4 py-2 font-medium ${sp.vq === "busy" ? "bg-sunken text-ink" : "border border-lagoon bg-white text-lagoon"}`}>
                {sp.vq === "busy" ? t.videos.busy : Number(sp.vq) > 0 ? format(t.videos.queued, { n: Number(sp.vq) }) : t.videos.queuedNone}
              </p>
            </FocusOnMount>
          )}
          {tiktokPost && <TikTokPostPanel post={tiktokPost} lang={lang} t={t} title={dayFmt.format(new Date(`${tiktokPost.day}T00:00:00Z`))} result={typeof sp.tt === "string" ? sp.tt : null} />}
          {weekPosts.length === 0 ? (
            <Empty text={t.videos.empty} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {weekPosts.map((p) => (
                <VideoCard key={p.id} post={p} lang={lang} t={t} ready={ready} appUrl={deps.appUrl} canFilm={!!deps.video} canUpload={!!deps.video} title={dayFmt.format(new Date(`${p.day}T00:00:00Z`))} />
              ))}
            </ul>
          )}
        </section>
      )}

      {view === "sent" && (
        <section aria-label={t.views.sent} className="flex flex-col gap-3">
          <Suspense fallback={<ReachSkeleton t={t} />}>
            <ReachSummary today={today} lang={lang} t={t} />
          </Suspense>
          {sent.length === 0 ? (
            <Empty text={t.sentEmpty} />
          ) : (
            <ul className="flex flex-col rounded-2xl border border-line bg-white">
              {sent.map((p) => (
                <li key={p.id} id={`post-${p.id}`} className="flex scroll-mt-28 gap-3 border-t border-line p-4 first:border-0">
                  {p.media && p.media.type !== "video" && (
                    // eslint-disable-next-line @next/next/no-img-element -- an admin-only picture from our own route
                    <img src={`/api/admin/posts/${p.id}/media`} alt="" loading="lazy" className="aspect-[4/5] w-14 shrink-0 rounded-lg border border-line object-cover object-top" />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{dayFmt.format(new Date(`${p.day}T00:00:00Z`))}</span>
                      <span className="text-xs text-ink-muted">{t.kinds[p.kind]}</span>
                    </span>
                    <span lang="en" className="line-clamp-2 text-sm text-ink-muted">{p.captionEn}</span>
                    <Results post={p} t={t} />
                    <Suspense>
                      <ReachLine today={today} day={p.day} lang={lang} t={t} />
                    </Suspense>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {view === "kit" && <PostsKit lang={lang} t={t} posted={kitPosted} link={shortUrl(deps.appUrl, "tg")} channel={views?.telegram.connected ? views.telegram.label : null} message={kitMessage} />}

      {view === "connections" && views && <PostConnections lang={lang} t={t} views={views} appUrl={deps.appUrl} message={message} />}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-ink-muted">{text}</p>;
}

function Results({ post, t }: { post: SocialPost; t: T }) {
  const entries = Object.entries(post.results) as [Channel | "video", NonNullable<SocialPost["results"][Channel]>][];
  if (entries.length === 0) return null;
  return (
    <ul className="flex flex-col gap-0.5 text-sm">
      {entries.map(([c, r]) => (
        <li key={c} className={r.ok ? "text-lagoon" : "text-destructive [overflow-wrap:anywhere]"}>
          {r.ok ? format(t.result.ok, { channel: t.channels[c] }) : format(t.result.failed, { channel: t.channels[c], error: r.error ?? "" })}
        </li>
      ))}
    </ul>
  );
}

function PostCard({ post: p, lang, t, ready, appUrl, title, canFilm }: { post: SocialPost; lang: "en" | "am"; t: T; ready: Channel[]; appUrl: string; title: string; canFilm: boolean }) {
  const hidden = (
    <>
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="id" value={p.id} />
    </>
  );
  const action = (name: string, label: string, Icon: typeof Send, opts: { strong?: boolean; confirm?: string } = {}) => (
    <form action={postAction}>
      {hidden}
      <input type="hidden" name="action" value={name} />
      <PostSubmit label={`${label}: ${title}`} working={t.working} confirm={opts.confirm} className={opts.strong ? solid : button}>
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </PostSubmit>
    </form>
  );
  const manual = CHANNELS.filter((c) => !ready.includes(c));
  const mediaSrc = p.media ? `/api/admin/posts/${p.id}/media` : null;
  const filmable = canFilm && FILMABLE.includes(p.kind);
  return (
    <li id={`post-${p.id}`} className="flex scroll-mt-28 flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-ink-muted tabular-nums">· {p.time}</span>
        <span className="ms-auto flex flex-wrap gap-1.5">
          <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-semibold">{t.kinds[p.kind]}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chip[p.status]}`}>{t.statuses[p.status]}</span>
        </span>
      </div>

      <div className="flex gap-4">
        {mediaSrc && p.media?.type !== "video" ? (
          // eslint-disable-next-line @next/next/no-img-element -- an admin-only picture from our own route
          <img src={mediaSrc} alt={format(t.pictureFor, { day: title })} loading="lazy" className="aspect-[4/5] w-24 shrink-0 rounded-xl border border-line object-cover object-top sm:w-32" />
        ) : mediaSrc ? (
          <video src={mediaSrc} controls preload="none" aria-label={format(t.pictureFor, { day: title })} className="aspect-[9/16] w-28 shrink-0 rounded-xl border border-line bg-ink sm:w-36" />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p lang="en" className="whitespace-pre-line">{p.captionEn}</p>
          <p lang="en" className="text-sm text-ink-muted">{p.hashtags}</p>
          <Results post={p} t={t} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {p.status === "draft" && action("approve", t.approve, CheckCircle2, { strong: true })}
        {(p.status === "approved" || p.status === "skipped" || p.status === "failed") && action("unapprove", t.unapprove, Undo2)}
        {ready.length > 0 && p.channels.some((c) => AUTO_CHANNELS.includes(c)) && action("post", t.postNow, Send, { confirm: t.postConfirm })}
      </div>

      <details className="group border-t border-line pt-3">
        <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink pointer-fine:min-h-9 [&::-webkit-details-marker]:hidden">
          {t.more}
          <span className="sr-only">: {title}</span>
          <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 flex flex-col gap-5">
          <form action={savePost} className="flex flex-col gap-3">
            {hidden}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t.captionEn}</span>
              <textarea name="captionEn" lang="en" defaultValue={p.captionEn} rows={4} maxLength={1500} className="rounded-lg border border-input bg-white p-2 text-base" />
            </label>
            <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t.hashtags}</span>
                <input name="hashtags" defaultValue={p.hashtags} maxLength={300} className="min-h-11 rounded-lg border border-input bg-white px-2 text-base" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t.time}</span>
                <input type="time" name="time" defaultValue={p.time} required className="min-h-11 rounded-lg border border-input bg-white px-2 text-base" />
              </label>
            </div>
            <fieldset className="flex flex-col gap-1">
              <legend className="text-sm font-medium">{t.sendTo}</legend>
              <div className="flex flex-wrap gap-x-4">
                {AUTO_CHANNELS.map((c) => (
                  <label key={c} className="flex min-h-11 items-center gap-2 pointer-fine:min-h-9">
                    <input type="checkbox" name="channels" value={c} defaultChecked={p.channels.includes(c)} className="size-4" />
                    {t.channels[c]}
                    {!ready.includes(c) && <span className="text-xs text-ink-muted">({t.notConnected})</span>}
                  </label>
                ))}
              </div>
            </fieldset>
            <PostSubmit working={t.working} className={`${solid} w-fit`}>
              {t.save}
            </PostSubmit>
          </form>

          <div className="flex flex-wrap gap-2">
            {action("rewrite", t.rewrite, Sparkles)}
            {p.status !== "skipped" && action("skip", t.skip, SkipForward)}
          </div>

          {filmable && (
            <form action={makePostVideo} className="flex flex-wrap items-end gap-2">
              {hidden}
              {p.kind === "moment" ? (
                // A holiday's video is its greeting card: there is no style to choose.
                <input type="hidden" name="style" value="tour" />
              ) : (
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{t.videoStyle}</span>
                  <select name="style" defaultValue="tour" className="min-h-11 max-w-full rounded-lg border border-input bg-white px-2 text-base pointer-fine:min-h-9">
                    <option value="tour">{t.videoStyles.tour}</option>
                    <option value="spotlight">{t.videoStyles.spotlight}</option>
                  </select>
                </label>
              )}
              <PostSubmit label={`${p.media?.type === "video" ? t.remakeVideo : t.makeVideo}: ${title}`} working={t.makingVideo} className={button}>
                <Clapperboard aria-hidden="true" className="size-4" />
                {p.media?.type === "video" ? t.remakeVideo : t.makeVideo}
              </PostSubmit>
            </form>
          )}

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold">{t.kit}</h4>
            {mediaSrc && (
              <a href={`${mediaSrc}?download=1`} className={`${button} w-fit`}>
                <Download aria-hidden="true" className="size-4" />
                {t.download}
              </a>
            )}
            {manual.map((c) => {
              const text = postText(p, c, appUrl);
              const label = format(t.kitFor, { channel: t.channels[c] });
              return (
                <div key={c} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    <CopyButton value={text} what={label} copy={t.copy} copied={t.copied} />
                  </div>
                  <textarea readOnly aria-label={label} value={text} rows={4} className="rounded-lg border border-line bg-paper p-2 text-sm" />
                </div>
              );
            })}
          </div>
        </div>
      </details>
    </li>
  );
}

/** Visits (last 30 days, by visit day) and sign-ups (joined in the same days) from post links; once per request. */
const loadReach = cache(async (today: string): Promise<Reach | null> => {
  const svc = services();
  const from = addDays(today, -29);
  try {
    const [rows, signups] = await Promise.all([svc.analyticsEvents.rows(from, today, "post_visit"), svc.growth.sources.fromPosts(new Date(`${from}T00:00:00+03:00`))]);
    return summarize(rows, signups);
  } catch (e) {
    reportError("post results load failed", e);
    return null;
  }
});

const numbers = (lang: "en" | "am") => new Intl.NumberFormat(lang === "am" ? "am-ET" : "en-US");

async function ReachLine({ today, day, lang, t }: { today: string; day: string; lang: "en" | "am"; t: T }) {
  const reach = await loadReach(today);
  if (!reach) return null;
  const r: PostResult = reach.byDay.get(day) ?? { visits: 0, signups: 0, paid: 0 };
  const n = numbers(lang);
  return <span className="text-sm font-medium text-ink">{format(t.reach.line, { visits: n.format(r.visits), signups: n.format(r.signups), paid: n.format(r.paid) })}</span>;
}

function ReachBox({ t, children }: { t: T; children: React.ReactNode }) {
  return (
    <section aria-labelledby="reach-title" className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
      <h2 id="reach-title" className="text-lg font-semibold">{t.reach.title}</h2>
      {children}
    </section>
  );
}

function ReachSkeleton({ t }: { t: T }) {
  return (
    <ReachBox t={t}>
      <div aria-hidden="true" className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[60px] animate-pulse rounded-xl bg-sunken motion-reduce:animate-none" />
        ))}
      </div>
      <p className="sr-only" role="status">{t.reach.loading}</p>
    </ReachBox>
  );
}

/** Visits, sign-ups and payments from post links in the last 30 days, in total and per network. */
async function ReachSummary({ today, lang, t }: { today: string; lang: "en" | "am"; t: T }) {
  const reach = await loadReach(today);
  const r = t.reach;
  if (!reach)
    return (
      <ReachBox t={t}>
        <p role="alert" className="text-sm text-ink-muted">{r.failed}</p>
      </ReachBox>
    );
  const n = numbers(lang);
  const networks = [...reach.byNetwork.entries()].sort((a, b) => b[1].visits + b[1].signups * 10 - (a[1].visits + a[1].signups * 10));
  const name = (k: string) => (k === "other" ? r.other : ((t.channels as Record<string, string>)[k] ?? r.other));
  const num = "py-1.5 ps-3 text-end tabular-nums";
  return (
    <ReachBox t={t}>
      <dl className="grid grid-cols-3 gap-2">
        {(["visits", "signups", "paid"] as const).map((k) => (
          <div key={k} className="flex flex-col rounded-xl bg-paper px-3 py-2">
            <dt className="text-xs text-ink-muted">{r[k]}</dt>
            <dd className="text-xl font-semibold tabular-nums">{n.format(reach.total[k])}</dd>
          </div>
        ))}
      </dl>
      {networks.length === 0 ? (
        <p className="text-sm text-ink-muted">{r.none}</p>
      ) : (
        <table aria-labelledby="reach-title" className="w-full text-sm sm:max-w-lg">
          <thead>
            <tr className="text-xs text-ink-muted">
              <th scope="col" className="py-1 text-start font-medium">{r.network}</th>
              <th scope="col" className="py-1 ps-3 text-end font-medium">{r.visits}</th>
              <th scope="col" className="py-1 ps-3 text-end font-medium">{r.signups}</th>
              <th scope="col" className="py-1 ps-3 text-end font-medium">{r.paid}</th>
            </tr>
          </thead>
          <tbody>
            {networks.map(([k, v]) => (
              <tr key={k} className="border-t border-line">
                <th scope="row" className="py-1.5 text-start font-medium">{name(k)}</th>
                <td className={num}>{n.format(v.visits)}</td>
                <td className={num}>{n.format(v.signups)}</td>
                <td className={num}>{n.format(v.paid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-ink-muted">{r.note}</p>
    </ReachBox>
  );
}

/** Admin → Posts → Videos: one day's video, ready for TikTok, Reels and Shorts, and where it goes. */
function VideoCard({ post: p, lang, t, ready, appUrl, title, canFilm, canUpload }: { post: SocialPost; lang: "en" | "am"; t: T; ready: Channel[]; appUrl: string; title: string; canFilm: boolean; canUpload: boolean }) {
  const v = t.videos;
  const hasVideo = p.media?.type === "video";
  const src = `/api/admin/posts/${p.id}/media`;
  const auto = p.channels.filter((c) => AUTO_CHANNELS.includes(c) && ready.includes(c));
  const byHand = CHANNELS.filter((c) => !auto.includes(c));
  const pageKind = p.kind === "template" || p.kind === "demo" || p.kind === "site";
  const failed = !hasVideo && p.results.video && !p.results.video.ok;
  const list = new Intl.ListFormat(lang === "am" ? "am" : "en", { type: "unit" });
  return (
    <li id={`video-${p.id}`} className="flex scroll-mt-28 flex-col gap-3 rounded-2xl border border-line bg-white p-3">
      <div className="flex flex-col">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-sm text-ink-muted tabular-nums">
          {p.time} · {t.kinds[p.kind]} · {t.statuses[p.status]}
        </span>
      </div>
      {hasVideo ? (
        <div className="mx-auto aspect-[9/16] w-full max-w-[15rem] overflow-hidden rounded-xl border border-line bg-paper">
          <video src={src} controls playsInline preload="none" aria-label={format(v.videoOf, { day: title })} className="size-full object-cover" />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-faint bg-paper px-3 py-4 text-sm text-ink-muted">
          <Clapperboard aria-hidden="true" className="size-5 shrink-0" />
          {v.noVideo}
        </div>
      )}
      {failed && <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-destructive">{v.failed}</p>}
      <div className="flex flex-wrap items-start gap-2">
        {canFilm && FILMABLE.includes(p.kind) && (
          <form action={makePostVideo} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="lang" value={lang} />
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="back" value="videos" />
            {pageKind ? (
              <select name="style" defaultValue="tour" aria-label={`${t.videoStyle}: ${title}`} className="min-h-11 max-w-[9rem] rounded-lg border border-input bg-white px-2 text-sm pointer-fine:min-h-9">
                <option value="tour">{v.styleTour}</option>
                <option value="spotlight">{v.styleSpotlight}</option>
              </select>
            ) : (
              <input type="hidden" name="style" value="tour" />
            )}
            <PostSubmit working={t.makingVideo} className={button}>
              <Clapperboard aria-hidden="true" className="size-4" />
              {hasVideo ? t.remakeVideo : t.makeVideo}
              <span className="sr-only">: {title}</span>
            </PostSubmit>
          </form>
        )}
        {canUpload && <VideoUpload postId={p.id} label={title} t={{ upload: v.upload, uploading: v.uploading, uploaded: v.uploaded, errors: v.errors }} />}
        {hasVideo && (
          <a href={`${src}?download=1`} className={button}>
            <Download aria-hidden="true" className="size-4" />
            {v.download}
            <span className="sr-only">: {title}</span>
          </a>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-line pt-3 text-sm">
        <p>
          <span className="font-medium">{v.goesTo}</span> {auto.length ? list.format(auto.map((c) => (c === "tiktok" ? v.tiktokInbox : t.channels[c]))) : v.nowhere}
        </p>
        <p className="text-ink-muted">
          <span className="font-medium text-ink">{v.byHand}</span> {list.format(byHand.map((c) => t.channels[c]))}
        </p>
        <div className="flex flex-wrap gap-2">
          {hasVideo && (
            <a href={`/${lang}/admin?tab=posts&view=videos&tiktok=${p.id}#tiktok-post`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-ink px-3 text-sm font-semibold text-paper hover:bg-ink-hover pointer-fine:min-h-9">
              {t.tiktokPost.open}
              <span className="sr-only">: {title}</span>
            </a>
          )}
          <CopyButton value={postText(p, "tiktok", appUrl)} what={`${v.tiktokCaption}: ${title}`} copy={v.tiktokCaption} copied={t.copied} />
          <CopyButton value={postText(p, "instagram", appUrl)} what={`${v.instagramCaption}: ${title}`} copy={v.instagramCaption} copied={t.copied} />
          <CopyButton value={postText(p, "facebook", appUrl)} what={`${v.facebookCaption}: ${title}`} copy={v.facebookCaption} copied={t.copied} />
          <CopyButton value={youtubeTitle(p)} what={`${v.youtubeTitle}: ${title}`} copy={v.youtubeTitle} copied={t.copied} />
        </div>
      </div>
    </li>
  );
}
