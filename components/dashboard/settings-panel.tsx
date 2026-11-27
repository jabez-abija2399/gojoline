"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Moon, RotateCcw, Sun as Wake, UploadCloud } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/format";
import { DomainSection } from "@/components/builder/domain-section";
import { Address } from "./address";
import { CopyLink } from "./copy-link";
import { Confirm } from "./dialog";
import { TelegramPanel, type TelegramPlan } from "./telegram-panel";
import { ShowcaseSection } from "./showcase-section";

type T = Messages["dashboard"];
type Lang = "en" | "am";
type Text = Partial<Record<Lang, string>>;
export interface SettingsState {
  status: "live" | "resting" | "draft" | "taken_down";
  address: { href: string; text: string } | null;
  versions: { number: number; summary: string; createdAt: string }[];
  current: number | null;
  languages: Lang[];
  siteName: string;
  /** The plan includes "Download your website" (Business). */
  canDownload: boolean;
}

const card = "flex scroll-mt-4 flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-6";
const outline = "inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:border-faint hover:bg-sunken aria-disabled:opacity-60";
const input = "min-h-11 w-full rounded-lg border border-input bg-white px-3 text-base";

/** Settings: Telegram alerts, address and own domain, the offline switch, the share preview, earlier versions. */
export function SettingsPanel({ t, tb, locale, projectId, bot, telegram, s, showcase }: { t: T; tb: Messages["builder"]; locale: Locale; projectId: string; bot: string; telegram: TelegramPlan; s: SettingsState; showcase?: { t: Messages["growth"]["showcase"]; on: boolean | null } }) {
  return (
    <div className="flex flex-col gap-4">
      <div id="telegram" className="scroll-mt-4">
        <TelegramPanel t={t} locale={locale} bot={bot} plan={telegram} />
      </div>
      <section id="address" aria-labelledby="dash-address-title" className={card}>
        <h2 id="dash-address-title" className="text-base font-semibold">{t.addressTitle}</h2>
        {s.address ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 basis-full rounded-xl bg-sunken px-3 py-2.5 font-medium sm:basis-auto"><Address text={s.address.text} /></p>
            <CopyLink url={s.address.href} label={t.copyLink} done={t.copied} />
          </div>
        ) : (
          <p className="text-ink-muted">{t.addressNone}</p>
        )}
        {s.address && <DomainSection t={tb} projectId={projectId} />}
      </section>
      <OfflineSection t={t} projectId={projectId} status={s.status} bot={bot} />
      <SeoSection t={t} projectId={projectId} s={s} />
      {showcase && <ShowcaseSection t={showcase.t} locale={locale} projectId={projectId} on={s.status === "live" || s.status === "resting" ? showcase.on : null} />}
      <VersionsSection t={t} locale={locale} projectId={projectId} s={s} />
      <DownloadSection t={t} locale={locale} projectId={projectId} status={s.status} canDownload={s.canDownload} />
    </div>
  );
}

/** Publishes the latest version again from the dashboard (no AI, no credits). */
export function PublishNow({ t, projectId }: { t: T; projectId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed" | "paused">("idle");
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-disabled={state === "busy" || undefined}
        onClick={async () => {
          if (state === "busy") return;
          setState("busy");
          const res = await fetch(`/api/projects/${projectId}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: "" }) }).catch(() => null);
          const code = res && !res.ok ? ((await res.json().catch(() => null)) as { error?: string } | null)?.error : null;
          setState(res?.ok ? "done" : code === "paused" ? "paused" : "failed");
          if (res?.ok) router.refresh();
        }}
        className={outline}
      >
        <UploadCloud aria-hidden="true" className="size-4" />
        {state === "busy" ? t.publishing : t.publishNow}
      </button>
      <p role={state === "failed" ? "alert" : "status"} className={state === "failed" ? "text-danger" : "text-ink"}>{state === "done" ? t.publishedNow : state === "failed" ? t.publishFailed : state === "paused" ? t.publishPaused : ""}</p>
    </div>
  );
}

function OfflineSection({ t, projectId, status, bot }: { t: T; projectId: string; status: SettingsState["status"]; bot: string }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; alert?: boolean } | null>(null);
  const resting = status === "resting";
  const run = async () => {
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}/offline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offline: !resting }) }).catch(() => null);
    setBusy(false);
    setAsk(false);
    if (!res?.ok) return setNote({ text: t.offlineFailed, alert: true });
    setNote({ text: resting ? t.onlineDone : t.offlineDone });
    router.refresh();
  };
  return (
    <section id="offline" aria-labelledby="dash-offline-title" className={card}>
      <h2 id="dash-offline-title" className="flex items-center gap-2 text-base font-semibold">
        {resting && <Moon aria-hidden="true" className="size-5 text-warning" />}
        {resting ? t.onlineTitle : t.offlineTitle}
      </h2>
      {status === "taken_down" ? (
        <p className="text-ink-muted">
          {t.offlineTakenDown}{" "}
          <a href={`https://t.me/${bot}`} target="_blank" rel="noopener noreferrer" className="font-medium text-link underline underline-offset-4">@{bot}<span className="sr-only"> {t.newTab}</span></a>
        </p>
      ) : status === "draft" ? (
        <p className="text-ink-muted">{t.offlineDraft}</p>
      ) : (
        <>
          <p className="max-w-[60ch] text-ink-muted">{resting ? t.onlineBody : t.offlineBody}</p>
          <button type="button" onClick={() => setAsk(true)} className={resting ? "inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-hover" : `${outline} text-danger`}>
            {resting ? <Wake aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
            {resting ? t.onlineCta : t.offlineCta}
          </button>
        </>
      )}
      <p role={note?.alert ? "alert" : "status"} className={note?.alert ? "text-danger" : "text-ink"}>{note?.text}</p>
      <Confirm open={ask} onClose={() => setAsk(false)} onConfirm={() => void run()} busy={busy} danger={!resting} title={resting ? t.onlineConfirmTitle : t.offlineConfirmTitle} body={resting ? t.onlineConfirmBody : t.offlineConfirmBody} confirmLabel={resting ? t.onlineConfirm : t.offlineConfirm} cancelLabel={t.cancel} closeLabel={t.close} labelId="dash-offline-confirm-title" />
    </section>
  );
}

interface Seo {
  title?: Text;
  description?: Text;
  image?: string | null;
  icon?: string | null;
}

function SeoSection({ t, projectId, s }: { t: T; projectId: string; s: SettingsState }) {
  const [seo, setSeo] = useState<Seo | null>(null);
  const [photos, setPhotos] = useState<{ name: string }[]>([]);
  const [failed, setFailed] = useState(false);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error" | "blocked">("idle");
  const lang: Lang = s.languages[0] ?? "en";

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch(`/api/projects/${projectId}/seo`).then((r) => (r.ok ? r.json() : Promise.reject(new Error("seo")))), fetch(`/api/projects/${projectId}/assets`).then((r) => (r.ok ? r.json() : { assets: [] }))])
      .then(([a, b]: [{ seo: Seo }, { assets: { name: string }[] }]) => {
        if (cancelled) return;
        setSeo(a.seo);
        setPhotos(b.assets);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const set = (patch: Partial<Seo>) => {
    setSeo((x) => ({ ...x, ...patch }));
    setSave("idle");
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (save === "saving") return;
    setSave("saving");
    const res = await fetch(`/api/projects/${projectId}/seo`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(seo) }).catch(() => null);
    setSave(res?.ok ? "saved" : res?.status === 422 ? "blocked" : "error");
  };
  const inLang = (key: string, l: Lang) => format(key, { lang: t.languageNames[l] });
  const title = seo?.title?.[lang] || s.siteName;
  const description = seo?.description?.[lang] || "";
  const image = seo?.image ? `/api/projects/${projectId}/assets/${seo.image}` : null;

  return (
    <section aria-labelledby="dash-seo-title" className={card}>
      <div className="flex flex-col gap-1">
        <h2 id="dash-seo-title" className="text-base font-semibold">{t.seoTitle}</h2>
        <p className="text-ink-muted">{t.seoIntro}</p>
      </div>
      {failed ? (
        <p role="alert">{t.loadError}</p>
      ) : !seo ? (
        <div role="status" aria-label={t.loading} className="h-40 animate-pulse rounded-xl bg-line" />
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            {s.languages.map((l) => (
              <div key={l} className="flex flex-col gap-3">
                <Counted id={`seo-title-${l}`} lang={l} label={inLang(t.seoTitleIn, l)} placeholder={s.siteName} max={70} value={seo.title?.[l] ?? ""} onChange={(v) => set({ title: { ...seo.title, [l]: v } })} t={t} />
                <Counted id={`seo-desc-${l}`} lang={l} label={inLang(t.seoDescIn, l)} placeholder={t.seoDescPlaceholder} max={160} value={seo.description?.[l] ?? ""} onChange={(v) => set({ description: { ...seo.description, [l]: v } })} t={t} long />
              </div>
            ))}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 font-medium">{t.seoImage}</legend>
              {photos.length === 0 ? (
                <p className="text-sm text-ink-muted">{t.seoImageEmpty}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-line p-1 text-center text-sm has-[:checked]:border-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2">
                    <input type="radio" name="seo-image" className="sr-only" checked={!seo.image} onChange={() => set({ image: null, icon: null })} />
                    {t.seoImageNone}
                  </label>
                  {photos.map((p, i) => (
                    <label key={p.name} className="cursor-pointer overflow-hidden rounded-lg border-2 border-line has-[:checked]:border-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2">
                      <input type="radio" name="seo-image" className="sr-only" checked={seo.image === p.name} onChange={() => set({ image: p.name, icon: seo.icon ? p.name : null })} />
                      {/* eslint-disable-next-line @next/next/no-img-element -- the owner's private photos from our API */}
                      <img src={`/api/projects/${projectId}/assets/${p.name}`} alt={format(t.seoImagePick, { n: i + 1 })} loading="lazy" className="aspect-square w-full object-cover" />
                    </label>
                  ))}
                </div>
              )}
              {seo.image && (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
                  <input type="checkbox" checked={seo.icon === seo.image} onChange={(e) => set({ icon: e.target.checked ? seo.image : null })} className="size-6 accent-ink" />
                  {t.seoIcon}
                </label>
              )}
            </fieldset>
          </div>
          {/* Live previews: a Google result and a Telegram link card. */}
          <div className="flex flex-col gap-4">
            <figure className="flex flex-col gap-2">
              <figcaption className="text-sm font-semibold text-ink-muted">{t.googlePreview}</figcaption>
              <div className="flex flex-col gap-0.5 rounded-xl border border-line bg-paper p-4">
                <span className="truncate text-sm text-ink-muted">{s.address?.text ?? s.siteName}</span>
                <span className="text-lg leading-snug text-link [overflow-wrap:anywhere]">{title}</span>
                <span className="line-clamp-2 text-sm text-ink-muted">{description}</span>
              </div>
            </figure>
            <figure className="flex flex-col gap-2">
              <figcaption className="text-sm font-semibold text-ink-muted">{t.telegramPreview}</figcaption>
              <div className="flex flex-col gap-1 rounded-xl border-s-4 border-ink bg-sunken p-3">
                <span className="text-sm font-semibold">{s.siteName}</span>
                <span className="font-semibold leading-snug [overflow-wrap:anywhere]">{title}</span>
                {description && <span className="line-clamp-3 text-sm">{description}</span>}
                {/* eslint-disable-next-line @next/next/no-img-element -- the owner's private photo from our API */}
                {image && <img src={image} alt="" className="mt-1 aspect-[1.91/1] w-full rounded-lg object-cover" />}
              </div>
            </figure>
          </div>
            <div className="flex flex-col gap-2 lg:col-span-2">
              <button type="submit" aria-disabled={save === "saving" || undefined} className="inline-flex min-h-11 w-fit items-center rounded-lg bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-hover aria-disabled:opacity-60">
                {save === "saving" ? t.saving : t.save}
              </button>
              <p role={save === "error" || save === "blocked" ? "alert" : "status"} className={save === "error" || save === "blocked" ? "text-danger" : "text-ink"}>{save === "saved" ? t.seoSaved : save === "blocked" ? t.infoErrors.blocked : save === "error" ? t.infoErrors.failed : ""}</p>
              {save === "saved" && (s.status === "live" || s.status === "resting") && <PublishNow t={t} projectId={projectId} />}
            </div>
        </form>
      )}
    </section>
  );
}

function Counted({ id, lang, label, placeholder, max, value, onChange, t, long }: { id: string; lang: Lang; label: string; placeholder: string; max: number; value: string; onChange: (v: string) => void; t: T; long?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">{label}</label>
      {long ? (
        <textarea id={id} lang={lang} rows={3} placeholder={placeholder} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={`${id}-left`} className={`${input} py-2`} />
      ) : (
        <input id={id} lang={lang} placeholder={placeholder} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={`${id}-left`} className={input} />
      )}
      <p id={`${id}-left`} className="text-sm text-ink-muted">{format(t.charsLeft, { n: max - [...value].length })}</p>
    </div>
  );
}

function VersionsSection({ t, locale, projectId, s }: { t: T; locale: Locale; projectId: string; s: SettingsState }) {
  const router = useRouter();
  const [ask, setAsk] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; alert?: boolean; restored?: boolean } | null>(null);
  const [all, setAll] = useState(false);
  const fmt = new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const list = all ? s.versions : s.versions.slice(0, 5);
  const dateOf = (n: number) => {
    const v = s.versions.find((x) => x.number === n);
    return v ? fmt.format(new Date(v.createdAt)) : "";
  };
  const describe = (summary: string) => {
    if (/^restore:\d+$/.test(summary)) return t.restoredFrom;
    if (/^template:/.test(summary)) return t.fromTemplate;
    return summary;
  };
  const restore = async () => {
    if (ask === null || busy) return;
    setBusy(true);
    const n = ask;
    const res = await fetch(`/api/projects/${projectId}/versions/${n}/restore`, { method: "POST" }).catch(() => null);
    setBusy(false);
    setAsk(null);
    if (!res?.ok) return setNote({ text: t.restoreFailed, alert: true });
    setNote({ text: format(t.restored, { date: dateOf(n) }), restored: true });
    router.refresh();
  };
  return (
    <section id="versions" aria-labelledby="dash-versions-title" className={card}>
      <div className="flex flex-col gap-1">
        <h2 id="dash-versions-title" className="text-base font-semibold">{t.versionsTitle}</h2>
        <p className="text-ink-muted">{t.versionsIntro}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p role={note?.alert ? "alert" : "status"} className={note?.alert ? "text-danger" : "font-medium text-ink"}>{note?.text}</p>
        {note?.restored && (s.status === "live" || s.status === "resting") && <PublishNow t={t} projectId={projectId} />}
      </div>
      {s.versions.length === 0 ? (
        <p className="text-ink-muted">{t.versionsEmpty}</p>
      ) : (
        <ol className="flex flex-col divide-y divide-line">
          {list.map((v) => (
            <li key={v.number} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1 basis-48">
                <p className="font-semibold">
                  <time dateTime={v.createdAt}>{fmt.format(new Date(v.createdAt))}</time>
                  {v.number === s.current && <span className="ms-2 rounded-full bg-sunken px-2 py-0.5 text-xs font-semibold text-ink">{t.current}</span>}
                </p>
                <p className="text-ink-muted [overflow-wrap:anywhere]">{describe(v.summary)}</p>
              </div>
              {v.number !== s.current && (
                <button type="button" onClick={() => setAsk(v.number)} aria-label={format(t.restoreNamed, { date: fmt.format(new Date(v.createdAt)) })} className={outline}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  {t.restore}
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
      {!all && s.versions.length > 5 && (
        <button type="button" onClick={() => setAll(true)} className={outline}>{format(t.showMore, { n: s.versions.length - 5 })}</button>
      )}
      <Confirm open={ask !== null} onClose={() => setAsk(null)} onConfirm={() => void restore()} busy={busy} title={format(t.restoreTitle, { date: ask === null ? "" : dateOf(ask) })} body={t.restoreBody} confirmLabel={busy ? t.restoring : t.restoreConfirm} cancelLabel={t.cancel} closeLabel={t.close} labelId="dash-restore-title" />
    </section>
  );
}

/**
 * "Download your website" (Business): the live site as a ZIP to host anywhere. Other plans see
 * what it is and where to get it; a draft is told to publish first.
 */
function DownloadSection({ t, locale, projectId, status, canDownload }: { t: T; locale: Locale; projectId: string; status: SettingsState["status"]; canDownload: boolean }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; alert?: boolean } | null>(null);
  const live = status === "live" || status === "resting";
  const run = async () => {
    setBusy(true);
    setNote({ text: t.downloadPreparing });
    const res = await fetch(`/api/projects/${projectId}/download`, { method: "POST" }).catch(() => null);
    if (!res?.ok) {
      const code = ((await res?.json().catch(() => null)) as { error?: string } | null)?.error;
      setBusy(false);
      return setNote({ text: code === "busy" ? t.downloadBusy : code === "too_many" ? t.downloadTooMany : code === "too_large" ? t.downloadTooLarge : code === "blocked" ? t.downloadBlocked : t.downloadFailed, alert: true });
    }
    const blob = await res.blob();
    const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "website.zip";
    const href = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
    setBusy(false);
    setNote({ text: t.downloadDone });
  };
  return (
    <section id="download" aria-labelledby="dash-download-title" className={card}>
      <h2 id="dash-download-title" className="flex items-center gap-2 text-base font-semibold">
        <Download aria-hidden="true" className="size-5" />
        {t.downloadTitle}
      </h2>
      <p className="max-w-[60ch] text-ink-muted">{t.downloadBody}</p>
      {!canDownload ? (
        <>
          <p className="max-w-[60ch] text-ink">{t.downloadPlan}</p>
          <a href={`/${locale}/billing`} className={outline}>{t.downloadUpgrade}</a>
        </>
      ) : status === "taken_down" ? (
        <p className="text-ink-muted">{t.downloadTakenDown}</p>
      ) : !live ? (
        <p className="text-ink-muted">{t.downloadDraft}</p>
      ) : (
        <button type="button" onClick={() => void run()} disabled={busy} aria-disabled={busy} className={outline}>
          <Download aria-hidden="true" className="size-4" />
          {busy ? t.downloadPreparingShort : t.downloadCta}
        </button>
      )}
      <p role={note?.alert ? "alert" : "status"} className={note?.alert ? "text-danger" : "text-ink-muted"}>{note?.text}</p>
    </section>
  );
}
