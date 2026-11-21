import { CalendarPlus, CheckCircle2, Download, Send, SkipForward, Sparkles, Undo2, XCircle } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { services } from "@/lib/server/services";
import { makePostVideo, savePost, planWeek, postAction } from "@/app/[lang]/admin/posts-actions";
import { addDays, postText } from "@/lib/posts/plan";
import { addisToday, AUTO_CHANNELS, CONNECT_HINT, readyChannels } from "@/lib/posts/service";
import { CHANNELS, type Channel, type SocialPost } from "@/lib/posts/types";
import { CopyButton } from "@/components/billing/copy-button";
import { FocusOnMount } from "./focus-on-mount";
import { PostSubmit } from "./post-submit";
import { reportError } from "@/lib/observability/report";
import { ChevronDown, Clapperboard } from "lucide-react";

type T = Messages["admin"]["posts"];
const DONE = ["ok", "invalid", "failed", "not_found"] as const;

const chip: Record<SocialPost["status"], string> = {
  draft: "border border-line bg-paper text-ink",
  approved: "border border-ink bg-white text-ink",
  posted: "border border-lagoon bg-white text-lagoon",
  failed: "bg-coral-soft text-destructive",
  skipped: "bg-sunken text-ink-muted",
};

const button = "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium hover:border-faint pointer-fine:min-h-9";

/** Admin → Posts: plan a week of posts, check and approve each, send them, and the posting kit. */
export async function PostsTab({ lang, t, sp }: { lang: "en" | "am"; t: T; sp: Record<string, string | string[] | undefined> }) {
  const deps = services().posts;
  const today = addisToday();
  const loaded = await Promise.all([deps.store.between(today, addDays(today, 13)), deps.store.history(20)]).catch((e: unknown) => (reportError("posts load failed", e), null));
  if (!loaded) return <p role="alert" className="rounded-xl bg-coral-soft p-4 text-destructive">{t.loadFailed}</p>;
  const [upcoming, sent] = loaded;
  const ready = readyChannels(deps);
  const done = DONE.find((d) => d === sp.pd) ?? null;
  const planned = typeof sp.planned === "string" ? Number(sp.planned) : null;
  const dayFmt = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const shown = upcoming.filter((p) => p.status !== "posted");

  return (
    <div className="flex flex-col gap-4">
      {done && (
        <FocusOnMount>
          <p role={done === "ok" ? "status" : "alert"} className={`rounded-lg px-4 py-2 font-medium ${done === "ok" ? "border border-lagoon bg-white text-lagoon" : "bg-coral-soft text-destructive"}`}>
            {done === "ok" && planned !== null ? (planned > 1 ? format(t.planned, { n: planned }) : planned === 1 ? t.plannedOne : t.plannedNone) : done === "ok" && sp.ps === "saved" ? t.saved : t.done[done]}
          </p>
        </FocusOnMount>
      )}
      <section aria-labelledby="posts-setup" className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
        <h2 id="posts-setup" className="sr-only">{t.setup}</h2>
        <p className="text-ink-muted">{t.intro}</p>
        <ul aria-label={t.networks} className="flex flex-col gap-1">
          {AUTO_CHANNELS.map((c) => {
            const p = deps.publishers[c];
            return (
              <li key={c} className={`flex items-start gap-2 ${p ? "text-ink" : "text-ink-muted"}`}>
                {p ? <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-lagoon" /> : <XCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
                <span>{p ? format(t.connected, { channel: t.channels[c], label: p.label }) : format(t.disconnected, { channel: t.channels[c], hint: CONNECT_HINT[c] })}</span>
              </li>
            );
          })}
        </ul>
        {deps.saveTikTokToken && (
          <Link href="/api/admin/tiktok/start" prefetch={false} className="inline-flex min-h-11 w-fit items-center font-medium text-ink underline underline-offset-4 pointer-fine:min-h-9">{t.connectTikTok}</Link>
        )}
        <p className="text-xs text-ink-muted">{t.kitNote}</p>
        <form action={planWeek}>
          <input type="hidden" name="lang" value={lang} />
          <PostSubmit working={t.working} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink-hover pointer-fine:min-h-9">
            <CalendarPlus aria-hidden="true" className="size-4" />
            {t.plan}
          </PostSubmit>
        </form>
      </section>

      <section aria-labelledby="posts-upcoming" className="flex flex-col gap-3">
        <h2 id="posts-upcoming" className="text-base font-semibold">{t.upcoming}</h2>
        {shown.length === 0 ? (
          <p className="rounded-xl border border-line bg-white p-4 text-ink-muted">{t.upcomingEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((p) => (
              <PostCard key={p.id} post={p} lang={lang} t={t} ready={ready} appUrl={deps.appUrl} canFilm={!!deps.video} title={dayFmt.format(new Date(`${p.day}T00:00:00Z`))} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="posts-sent" className="flex flex-col gap-3">
        <h2 id="posts-sent" className="text-base font-semibold">{t.sent}</h2>
        {sent.length === 0 ? (
          <p className="rounded-xl border border-line bg-white p-4 text-ink-muted">{t.sentEmpty}</p>
        ) : (
          <ul className="flex flex-col rounded-xl border border-line bg-white">
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
      </section>
    </div>
  );
}

function Results({ post, t }: { post: SocialPost; t: T }) {
  const entries = Object.entries(post.results) as [Channel | "video", NonNullable<SocialPost["results"][Channel]>][];
  if (entries.length === 0) return null;
  return (
    <ul className="flex flex-col gap-0.5 text-xs">
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
      <PostSubmit label={`${label}: ${title}`} working={t.working} confirm={opts.confirm} className={opts.strong ? `${button} border-ink font-semibold` : button}>
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </PostSubmit>
    </form>
  );
  const manual = CHANNELS.filter((c) => !ready.includes(c));
  const mediaSrc = p.media ? `/api/admin/posts/${p.id}/media` : null;
  return (
    <li id={`post-${p.id}`} className="flex scroll-mt-28 flex-col gap-3 rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-ink-muted tabular-nums">{p.time}</span>
        <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-semibold">{t.kinds[p.kind]}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chip[p.status]}`}>{t.statuses[p.status]}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        {mediaSrc && p.media?.type !== "video" ? (
          // eslint-disable-next-line @next/next/no-img-element -- an admin-only picture from our own route
          <img src={mediaSrc} alt={format(t.pictureFor, { day: title })} loading="lazy" className="aspect-[4/5] w-32 rounded-lg border border-line object-cover object-top" />
        ) : mediaSrc ? (
          <video src={mediaSrc} controls preload="none" aria-label={format(t.pictureFor, { day: title })} className="aspect-[9/16] w-full max-w-xs rounded-lg border border-line bg-ink sm:w-32" />
        ) : (
          <span className="flex aspect-[4/5] w-32 items-center justify-center rounded-lg border border-dashed border-line text-center text-xs text-ink-muted">{t.noMedia}</span>
        )}
        <div className="flex min-w-0 flex-col gap-2">
          <p lang="am" className="whitespace-pre-line">{p.captionAm}</p>
          <p lang="en" className="whitespace-pre-line text-ink-muted">{p.captionEn}</p>
          <p lang="en" className="text-sm text-ink-muted">{p.hashtags}</p>
          <Results post={p} t={t} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {p.status === "draft" && action("approve", t.approve, CheckCircle2, { strong: true })}
        {(p.status === "approved" || p.status === "skipped" || p.status === "failed") && action("unapprove", t.unapprove, Undo2)}
        {ready.length > 0 && p.channels.some((c) => AUTO_CHANNELS.includes(c)) && action("post", t.postNow, Send, { confirm: t.postConfirm })}
        {action("rewrite", t.rewrite, Sparkles)}
        {p.status !== "skipped" && action("skip", t.skip, SkipForward)}
      </div>
      {canFilm && (p.kind === "template" || p.kind === "site") && (
        <form action={makePostVideo} className="flex flex-wrap items-end gap-2 rounded-lg border border-line p-3">
          {hidden}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t.videoStyle}</span>
            <select name="style" defaultValue="tour" className="min-h-11 max-w-full rounded-lg border border-input bg-white px-2 text-base pointer-fine:min-h-9">
              <option value="tour">{t.videoStyles.tour}</option>
              <option value="spotlight">{t.videoStyles.spotlight}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t.videoLang}</span>
            <select name="videoLang" defaultValue="am" className="min-h-11 rounded-lg border border-input bg-white px-2 text-base pointer-fine:min-h-9">
              <option value="am" lang="am">አማርኛ</option>
              <option value="en" lang="en">English</option>
            </select>
          </label>
          <PostSubmit label={`${p.media?.type === "video" ? t.remakeVideo : t.makeVideo}: ${title}`} working={t.makingVideo} className={button}>
            <Clapperboard aria-hidden="true" className="size-4" />
            {p.media?.type === "video" ? t.remakeVideo : t.makeVideo}
          </PostSubmit>
        </form>
      )}
      <details className="group rounded-lg border border-line">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 font-medium pointer-fine:min-h-9 [&::-webkit-details-marker]:hidden">
          <span>
            {t.edit}
            <span className="sr-only">: {title}</span>
          </span>
          <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <form action={savePost} className="flex flex-col gap-3 p-3">
          {hidden}
          <label className="flex flex-col gap-1">
            <span className="font-medium">{t.captionAm}</span>
            <textarea name="captionAm" lang="am" defaultValue={p.captionAm} rows={4} maxLength={1500} className="rounded-lg border border-input bg-white p-2 text-base" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">{t.captionEn}</span>
            <textarea name="captionEn" lang="en" defaultValue={p.captionEn} rows={4} maxLength={1500} className="rounded-lg border border-input bg-white p-2 text-base" />
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
            <label className="flex flex-col gap-1">
              <span className="font-medium">{t.hashtags}</span>
              <input name="hashtags" defaultValue={p.hashtags} maxLength={300} className="min-h-11 rounded-lg border border-input bg-white px-2 text-base" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-medium">{t.time}</span>
              <input type="time" name="time" defaultValue={p.time} required className="min-h-11 rounded-lg border border-input bg-white px-2 text-base" />
            </label>
          </div>
          {AUTO_CHANNELS.length > 0 && (
            <fieldset className="flex flex-col gap-1">
              <legend className="font-medium">{t.sendTo}</legend>
              {AUTO_CHANNELS.map((c) => (
                <label key={c} className="flex min-h-11 items-center gap-2 pointer-fine:min-h-9">
                  <input type="checkbox" name="channels" value={c} defaultChecked={p.channels.includes(c)} className="size-4" />
                  {t.channels[c]}
                  {!ready.includes(c) && <span className="text-xs text-warning">({t.notConnected})</span>}
                </label>
              ))}
            </fieldset>
          )}
          <PostSubmit working={t.working} className="min-h-11 w-fit rounded-lg bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink-hover pointer-fine:min-h-9">
            {t.save}
          </PostSubmit>
        </form>
      </details>
      <details className="group rounded-lg border border-line">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 font-medium pointer-fine:min-h-9 [&::-webkit-details-marker]:hidden">
          <span>
            {t.kit}
            <span className="sr-only">: {title}</span>
          </span>
          <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-3 p-3">
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
                  <span className="font-medium">{label}</span>
                  <CopyButton value={text} what={label} copy={t.copy} copied={t.copied} />
                </div>
                <textarea readOnly aria-label={label} value={text} rows={5} className="rounded-lg border border-line bg-paper p-2 text-sm" />
              </div>
            );
          })}
        </div>
      </details>
    </li>
  );
}
