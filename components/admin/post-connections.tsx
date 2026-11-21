import { Camera, CheckCircle2, ChevronDown, Music2, Send, ThumbsUp } from "lucide-react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { disconnectNetwork, saveConnection } from "@/app/[lang]/admin/posts-actions";
import type { ConnectionView } from "@/lib/posts/connections";
import { PostSubmit } from "./post-submit";

type T = Messages["admin"]["posts"];
type Network = "telegram" | "facebook" | "instagram" | "tiktok";
const NETWORKS: Network[] = ["telegram", "facebook", "instagram", "tiktok"];

/** Each network's badge: its colour and a simple icon (no brand logos in our icon set). */
const BADGE: Record<Network, { Icon: typeof Send; cls: string }> = {
  telegram: { Icon: Send, cls: "bg-[#229ED9] text-white" },
  facebook: { Icon: ThumbsUp, cls: "bg-[#1877F2] text-white" },
  instagram: { Icon: Camera, cls: "bg-[linear-gradient(135deg,#F58529,#DD2A7B_55%,#8134AF)] text-white" },
  tiktok: { Icon: Music2, cls: "bg-[#111] text-white" },
};

const input = "min-h-11 w-full rounded-lg border border-input bg-white px-3 text-base";
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink-hover pointer-fine:min-h-9";
const quiet = "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-muted hover:bg-sunken hover:text-ink pointer-fine:min-h-9";

/** Admin → Posts → Connections: Gojoline's own accounts, connected here in a few steps each. */
export function PostConnections({ lang, t, views, appUrl, message }: { lang: "en" | "am"; t: T; views: Record<Network, ConnectionView>; appUrl: string; message: { network: string; ok: boolean; why: string | null } | null }) {
  const count = NETWORKS.filter((n) => views[n].connected).length;
  return (
    <section aria-labelledby="connections-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="connections-title" className="text-base font-semibold">{t.connections.title}</h2>
        <span className="text-sm text-ink-muted">{format(t.connections.count, { n: count, total: NETWORKS.length })}</span>
      </div>
      <ul className="grid items-start gap-3 sm:grid-cols-2">
        {NETWORKS.map((n) => (
          <NetworkCard key={n} network={n} lang={lang} t={t} view={views[n]} appUrl={appUrl} facebookReady={views.facebook.connected} message={message?.network === n ? message : null} />
        ))}
      </ul>
    </section>
  );
}

function NetworkCard({ network: n, lang, t, view, appUrl, facebookReady, message }: { network: Network; lang: "en" | "am"; t: T; view: ConnectionView; appUrl: string; facebookReady: boolean; message: { ok: boolean; why: string | null } | null }) {
  const c = t.connections;
  const { Icon, cls } = BADGE[n];
  const name = t.channels[n];
  const waiting = n === "tiktok" && view.needsSignIn;
  return (
    <li id={`connect-${n}`} className="flex min-w-0 scroll-mt-28 flex-col gap-3 rounded-xl border border-line bg-white p-4">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${cls}`}>
          <Icon className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{name}</span>
          <span className="truncate text-sm text-ink-muted">{view.connected ? view.label : waiting ? c.waitingSignIn : c.purpose[n]}</span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${view.connected ? "border border-lagoon text-lagoon" : "bg-sunken text-ink-muted"}`}>
          {view.connected ? c.on : c.off}
        </span>
      </div>

      {message && (
        <p role={message.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-paper text-ink" : "bg-coral-soft text-destructive [overflow-wrap:anywhere]"}`}>
          {message.ok ? c.saved : message.why === "invalid" ? t.done.invalid : message.why === "facebook_first" ? c.facebookFirst : message.why === "bot" ? c.noBot : message.why ? format(c.failedWhy, { why: message.why }) : c.failed}
        </p>
      )}

      {waiting && (
        <Link href="/api/admin/tiktok/start" prefetch={false} className={`${primary} w-fit`}>
          {c.signInTikTok}
        </Link>
      )}

      {n === "instagram" && !facebookReady && !view.connected ? (
        <p className="text-sm text-ink-muted">{c.facebookFirst}</p>
      ) : (
        <details className="group">
          <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:border-faint pointer-fine:min-h-9 [&::-webkit-details-marker]:hidden">
            {view.connected || waiting ? c.change : c.connect}
            <span className="sr-only">: {name}</span>
            <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <ol className="flex list-decimal flex-col gap-1 ps-5 text-sm text-ink-muted [overflow-wrap:anywhere]">
              {c.steps[n].map((s) => (
                <li key={s}>{s.replace("{callback}", `${appUrl}/api/admin/tiktok/callback`)}</li>
              ))}
            </ol>
            <form action={saveConnection} className="flex flex-col gap-3">
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="network" value={n} />
              {n === "telegram" && <Field label={c.fields.channelId} name="channelId" placeholder="@gojoline" />}
              {n === "facebook" && (
                <>
                  <Field label={c.fields.pageId} name="pageId" placeholder="123456789012345" inputMode="numeric" />
                  <Field label={c.fields.pageToken} name="token" type="password" />
                </>
              )}
              {n === "instagram" && <Field label={c.fields.igUserId} name="userId" placeholder="17841400000000000" inputMode="numeric" />}
              {n === "tiktok" && (
                <>
                  <Field label={c.fields.clientKey} name="clientKey" />
                  <Field label={c.fields.clientSecret} name="clientSecret" type="password" />
                </>
              )}
              <p className="text-xs text-ink-muted">{c.private}</p>
              <PostSubmit working={c.checking} className={`${primary} w-fit`}>
                {n === "tiktok" ? c.saveTikTok : c.save}
              </PostSubmit>
            </form>
          </div>
        </details>
      )}

      {view.source === "admin" && (
        <form action={disconnectNetwork}>
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="network" value={n} />
          <PostSubmit working={t.working} confirm={format(c.disconnectConfirm, { channel: name })} className={quiet} label={`${c.disconnect}: ${name}`}>
            {c.disconnect}
          </PostSubmit>
        </form>
      )}
      {view.source === "server" && (
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          <CheckCircle2 aria-hidden="true" className="size-3.5" />
          {c.fromServer}
        </p>
      )}
    </li>
  );
}

function Field({ label, name, type = "text", placeholder, inputMode }: { label: string; name: string; type?: string; placeholder?: string; inputMode?: "numeric" }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <input name={name} type={type} placeholder={placeholder} inputMode={inputMode} required autoComplete="off" spellCheck={false} className={input} />
    </label>
  );
}
