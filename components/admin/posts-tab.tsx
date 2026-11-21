import { CalendarPlus, CheckCircle2, ChevronDown, Clapperboard, Download, Send, SkipForward, Sparkles, Undo2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { services } from "@/lib/server/services";
import { makePostVideo, savePost, planWeek, postAction } from "@/app/[lang]/admin/posts-actions";
import { addDays, postText } from "@/lib/posts/plan";
import { addisToday, AUTO_CHANNELS, readyChannels } from "@/lib/posts/service";
import { CHANNELS, type Channel, type SocialPost } from "@/lib/posts/types";
import { CopyButton } from "@/components/billing/copy-button";
import { FocusOnMount } from "./focus-on-mount";
import { PostSubmit } from "./post-submit";
import { PostConnections } from "./post-connections";
import { reportError } from "@/lib/observability/report";

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

/** Admin → Posts: plan a week, check and approve each post, connect the networks. */
export async function PostsTab({ lang, t, sp }: { lang: "en" | "am"; t: T; sp: Record<string, string | string[] | undefined> }) {
  const deps = services().posts;
  const today = addisToday();
  const loaded = await Promise.all([deps.store.between(today, addDays(today, 13)), deps.store.history(20), readyChannels(deps), deps.connections?.view()]).catch((e: unknown) => (reportError("posts load failed", e), null));
  if (!loaded) return <p role="alert" className="rounded-xl bg-coral-soft p-4 text-destructive">{t.loadFailed}</p>;
  const [upcoming, sent, ready, views] = loaded;
  const done = DONE.find((d) => d === sp.pd) ?? null;
  const planned = typeof sp.planned === "string" ? Number(sp.planned) : null;
  const dayFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const shown = upcoming.filter((p) => p.status !== "posted");
  const drafts = shown.filter((p) => p.status === "draft").length;
  const approved = shown.filter((p) => p.status === "approved").length;
  // A connection message goes on its card; any other message goes at the top.
  const network = typeof sp.cn === "string" ? sp.cn : null;
  const message = network && done ? { network, ok: done === "ok", why: typeof sp.why === "string" ? sp.why : done === "invalid" ? "invalid" : null } : null;

  return (
    <div className="flex flex-col gap-6">
      {done && !network && (
        <FocusOnMount>
          <p role={done === "ok" ? "status" : "alert"} className={`rounded-lg px-4 py-2 font-medium ${done === "ok" ? "border border-lagoon bg-white text-lagoon" : "bg-coral-soft text-destructive"}`}>
            {done === "ok" && planned !== null ? (planned > 1 ? format(t.planned, { n: planned }) : planned === 1 ? t.plannedOne : t.plannedNone) : done === "ok" && sp.ps === "saved" ? t.saved : t.done[done]}
          </p>
        </FocusOnMount>
      )}

      <section aria-labelledby="posts-head" className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 id="posts-head" className="text-lg font-semibold">{t.headTitle}</h2>
          <p className="text-ink-muted">{t.headBody}</p>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            <li className="rounded-full bg-sunken px-3 py-1">{format(t.stats.drafts, { n: drafts })}</li>
            <li className="rounded-full bg-sunken px-3 py-1">{format(t.stats.approved, { n: approved })}</li>
            <li className="rounded-full bg-sunken px-3 py-1">{format(t.stats.sent, { n: sent.filter((p) => p.status === "posted").length })}</li>
          </ul>
        </div>
        <form action={planWeek} className="shrink-0">
          <input type="hidden" name="lang" value={lang} />
          <PostSubmit working={t.working} className={`${solid} px-5`}>
            <CalendarPlus aria-hidden="true" className="size-4" />
            {t.plan}
          </PostSubmit>
        </form>
      </section>

      {views && <PostConnections lang={lang} t={t} views={views} appUrl={deps.appUrl} message={message} />}

      <section aria-labelledby="posts-upcoming" className="flex flex-col gap-3">
        <h2 id="posts-upcoming" className="text-base font-semibold">{t.upcoming}</h2>
        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-white p-6 text-center text-ink-muted">{t.upcomingEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((p) => (
              <PostCard key={p.id} post={p} lang={lang} t={t} ready={ready} appUrl={deps.appUrl} canFilm={!!deps.video} title={dayFmt.format(new Date(`${p.day}T00:00:00Z`))} />
            ))}
          </ul>
        )}
      </section>

      <details className="group rounded-xl border border-line bg-white">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold [&::-webkit-details-marker]:hidden">
          <span>
            {t.sent} <span className="font-normal text-ink-muted">({sent.length})</span>
          </span>
          <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        {sent.length === 0 ? (
          <p className="px-4 pb-4 text-ink-muted">{t.sentEmpty}</p>
        ) : (
          <ul className="flex flex-col border-t border-line">
            {sent.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 border-t border-line p-4 first:border-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{dayFmt.format(new Date(`${p.day}T00:00:00Z`))}</span>
                  <span className="text-xs text-ink-muted">{t.kinds[p.kind]}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chip[p.status]}`}>{t.statuses[p.status]}</span>
                </span>
                <Results post={p} t={t} />
                <span lang="en" className="line-clamp-2 text-ink-muted">{p.captionEn}</span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
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
  const filmable = canFilm && (p.kind === "template" || p.kind === "demo" || p.kind === "site");
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
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t.videoStyle}</span>
                <select name="style" defaultValue="tour" className="min-h-11 max-w-full rounded-lg border border-input bg-white px-2 text-base pointer-fine:min-h-9">
                  <option value="tour">{t.videoStyles.tour}</option>
                  <option value="spotlight">{t.videoStyles.spotlight}</option>
                </select>
              </label>
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
