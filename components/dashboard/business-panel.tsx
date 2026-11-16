"use client";

import { useEffect, useState } from "react";
import { MapPin, MessageCircle, Phone, Send } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/format";
import { WEEKDAYS, groupHours, mapLink, type Weekday } from "@/lib/site-info/hours";

type Lang = "en" | "am";
type Text = Partial<Record<Lang, string>>;
type Day = { open: string; close: string } | null;
interface Info {
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  address?: Text;
  hours?: Partial<Record<Weekday, Day>>;
  closedOn?: string | null;
  closedForNow?: boolean;
  announcement?: { on: boolean; text: Text };
}

const input = "min-h-11 w-full rounded-lg border border-input bg-white px-3 text-base";
const card = "flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:p-6";
/** Today in Addis Ababa (UTC+3), as the public API counts it. */
const addisToday = () => new Date(Date.now() + 3 * 3_600_000).toISOString().slice(0, 10);

/** Quick edits with no AI and no rebuild: contact, hours, closed notes and a banner, with a live preview. */
export function BusinessPanel({ t, locale, projectId, state }: { t: Messages["dashboard"]; locale: Locale; projectId: string; state: { live: boolean; outdated: boolean } }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [languages, setLanguages] = useState<Lang[]>(["en"]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [save, setSave] = useState<{ kind: "idle" | "saving" | "saved" | "error"; text?: string }>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/business`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d: { business: Info; languages: Lang[] }) => {
        if (cancelled) return;
        setInfo(d.business);
        setLanguages(d.languages.length ? d.languages : ["en"]);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [projectId, attempt]);

  if (error)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-white p-6">
        <p>{t.loadError}</p>
        <button type="button" onClick={() => { setError(false); setAttempt((a) => a + 1); }} className="min-h-11 rounded-lg border border-line px-4 text-sm font-medium">{t.retry}</button>
      </div>
    );
  if (!info)
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">{t.loading}</span>
        <div aria-hidden="true" className="h-64 animate-pulse rounded-2xl bg-line" />
      </div>
    );

  const set = (patch: Partial<Info>) => {
    setInfo((i) => ({ ...i, ...patch }));
    if (save.kind !== "saving") setSave({ kind: "idle" });
  };
  const inLang = (key: string, lang: Lang) => (languages.length > 1 ? format(key, { lang: t.languageNames[lang] }) : null);
  const setDay = (d: Weekday, v: Day | undefined) => {
    const hours = { ...info.hours };
    if (v === undefined) delete hours[d];
    else hours[d] = v;
    set({ hours });
  };
  const today = addisToday();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (save.kind === "saving") return;
    setSave({ kind: "saving" });
    const res = await fetch(`/api/projects/${projectId}/business`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(info) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) return setSave({ kind: "saved", text: state.live ? (state.outdated ? t.infoOutdated : t.savedInfo) : t.savedNotLive });
    const errors = t.infoErrors as Record<string, string>;
    setSave({ kind: "error", text: errors[d.field] ?? errors.failed });
  };

  const labels = { days: t.info.days, closed: t.info.closed, closedToday: t.info.closedTodayNotice, closedForNow: t.info.closedForNowNotice };
  const hours = groupHours(info.hours ?? {}, { en: labels, am: labels });
  const notice = info.closedForNow ? t.info.closedForNowNotice : info.closedOn === today ? t.info.closedTodayNotice : null;
  const banner = info.announcement?.on ? (info.announcement.text[locale] || info.announcement.text.en || info.announcement.text.am) : null;
  const address = info.address?.[locale] || info.address?.en || info.address?.am || "";
  const empty = !notice && !banner && !info.phone && !info.whatsapp && !info.telegram && !address && hours.length === 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <p className="text-ink-muted">{t.infoIntro}</p>

        <section aria-labelledby="dash-contact-title" className={card}>
          <h2 id="dash-contact-title" className="text-base font-semibold">{t.infoContact}</h2>
          <Field id="bi-phone" label={t.phone} hint={t.phoneHint}>
            <input id="bi-phone" type="tel" inputMode="tel" autoComplete="off" maxLength={30} value={info.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} aria-describedby="bi-phone-hint" className={input} />
          </Field>
          <Field id="bi-wa" label={t.whatsappLabel} hint={t.phoneHint}>
            <input id="bi-wa" type="tel" inputMode="tel" autoComplete="off" maxLength={30} value={info.whatsapp ?? ""} onChange={(e) => set({ whatsapp: e.target.value })} aria-describedby="bi-wa-hint" className={input} />
          </Field>
          <Field id="bi-tg" label={t.telegramLabel} hint={t.telegramHint}>
            <input id="bi-tg" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={60} value={info.telegram ?? ""} onChange={(e) => set({ telegram: e.target.value })} aria-describedby="bi-tg-hint" className={input} />
          </Field>
          {languages.map((lang) => (
            <Field key={lang} id={`bi-addr-${lang}`} label={inLang(t.addressIn, lang) ?? t.address}>
              <input id={`bi-addr-${lang}`} lang={lang} maxLength={160} value={info.address?.[lang] ?? ""} onChange={(e) => set({ address: { ...info.address, [lang]: e.target.value } })} className={input} />
            </Field>
          ))}
          {address && (
            <a href={mapLink(info.address?.en || address)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-link underline underline-offset-4">
              <MapPin aria-hidden="true" className="size-4" />
              {t.openMap}
              <span className="sr-only">{t.newTab}</span>
            </a>
          )}
        </section>

        <section aria-labelledby="dash-hours-title" className={card}>
          <div className="flex flex-col gap-1">
            <h2 id="dash-hours-title" className="text-base font-semibold">{t.hoursTitle}</h2>
            <p className="text-sm text-ink-muted">{t.hoursHint}</p>
          </div>
          <ul className="flex flex-col divide-y divide-line">
            {WEEKDAYS.map((d) => {
              const v = info.hours?.[d];
              const mode = v === undefined ? "unset" : v === null ? "closed" : "open";
              const name = t.info.dayNames[d];
              return (
                <li key={d} className="grid grid-cols-[minmax(5.5rem,auto)_1fr] items-center gap-2 py-3 sm:flex sm:flex-row">
                  <label htmlFor={`bi-day-${d}`} className="font-medium sm:w-28">{name}</label>
                  <select id={`bi-day-${d}`} value={mode} onChange={(e) => setDay(d, e.target.value === "unset" ? undefined : e.target.value === "closed" ? null : (info.hours?.mon ?? { open: "08:00", close: "18:00" }))} className={`${input} sm:w-36`}>
                    <option value="unset">{t.dayState.unset}</option>
                    <option value="open">{t.dayState.open}</option>
                    <option value="closed">{t.dayState.closed}</option>
                  </select>
                  {v && (
                    <div className="col-span-2 flex items-center gap-2">
                      <input type="time" value={v.open} onChange={(e) => setDay(d, { ...v, open: e.target.value })} aria-label={`${name}: ${t.opens}`} className={`${input} min-w-0 flex-1 sm:w-32 sm:flex-none`} />
                      <span aria-hidden="true">–</span>
                      <input type="time" value={v.close} onChange={(e) => setDay(d, { ...v, close: e.target.value })} aria-label={`${name}: ${t.closes}`} className={`${input} min-w-0 flex-1 sm:w-32 sm:flex-none`} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {info.hours?.mon && (
            <button type="button" onClick={() => set({ hours: { ...info.hours, tue: info.hours!.mon, wed: info.hours!.mon, thu: info.hours!.mon, fri: info.hours!.mon } })} className="inline-flex min-h-11 w-fit items-center rounded-lg border border-line px-3 text-sm font-medium hover:bg-sunken">
              {t.sameAsMonday}
            </button>
          )}
          <Check id="bi-today" checked={info.closedOn === today} onChange={(on) => set({ closedOn: on ? today : null })} label={t.closedToday} hint={t.closedTodayHint} />
          <Check id="bi-now" checked={Boolean(info.closedForNow)} onChange={(on) => set({ closedForNow: on })} label={t.closedForNow} hint={t.closedForNowHint} />
        </section>

        <section aria-labelledby="dash-banner-title" className={card}>
          <h2 id="dash-banner-title" className="text-base font-semibold">{t.banner}</h2>
          <Check id="bi-banner" checked={Boolean(info.announcement?.on)} onChange={(on) => set({ announcement: { text: info.announcement?.text ?? {}, on } })} label={t.bannerOn} hint={t.bannerHint} />
          {info.announcement?.on &&
            languages.map((lang) => (
              <Field key={lang} id={`bi-banner-${lang}`} label={inLang(t.bannerIn, lang) ?? t.bannerText}>
                <input id={`bi-banner-${lang}`} lang={lang} maxLength={120} value={info.announcement?.text[lang] ?? ""} onChange={(e) => set({ announcement: { on: true, text: { ...info.announcement?.text, [lang]: e.target.value } } })} className={input} />
              </Field>
            ))}
        </section>

        <div className="flex flex-col gap-2">
          <button type="submit" aria-disabled={save.kind === "saving" || undefined} className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-ink px-6 font-semibold text-white hover:bg-ink-hover aria-disabled:opacity-60 sm:w-fit">
            {save.kind === "saving" ? t.saving : t.saveInfo}
          </button>
          <p role={save.kind === "error" ? "alert" : "status"} className={save.kind === "error" ? "text-danger" : "text-ink"}>{save.kind === "saved" || save.kind === "error" ? save.text : ""}</p>
        </div>
      </form>

      {/* How the site will show it (the same grouping the live site gets). */}
      <aside aria-labelledby="dash-preview-title" className="flex flex-col gap-2 lg:sticky lg:top-4">
        <h2 id="dash-preview-title" className="text-sm font-semibold text-ink-muted">{t.preview} · {t.previewNote}</h2>
        <div className="overflow-hidden rounded-2xl border border-line bg-paper">
          {(notice || banner) && (
            <ul className="flex flex-col gap-0.5 bg-ink px-4 py-2 text-center text-sm font-medium text-white">
              {notice && <li>{notice}</li>}
              {banner && <li>{banner}</li>}
            </ul>
          )}
          <div className="flex flex-col gap-3 p-4">
            {empty ? (
              <p className="text-sm text-ink-muted">{t.previewEmpty}</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {info.phone && <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium shadow-sm"><Phone aria-hidden="true" className="size-4" />{info.phone}</span>}
                  {info.whatsapp && <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium shadow-sm"><MessageCircle aria-hidden="true" className="size-4" />{t.whatsapp}</span>}
                  {info.telegram && <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium shadow-sm"><Send aria-hidden="true" className="size-4" />@{info.telegram.replace(/^@/, "")}</span>}
                </div>
                {address && <p className="flex items-start gap-1.5 text-sm"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{address}</p>}
                {hours.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold">{t.hoursTitle}</p>
                    <dl className="flex flex-col text-sm">
                      {hours.map((h, i) => (
                        <div key={i} className="flex justify-between gap-4 border-b border-line py-1 last:border-0">
                          <dt className="text-ink-muted">{h.days[locale]}</dt>
                          <dd className="font-medium tabular-nums">{h.time[locale]}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

function Check({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: (on: boolean) => void; label: string; hint: string }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 font-medium">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-describedby={`${id}-hint`} className="size-6 shrink-0 accent-ink" />
        {label}
      </label>
      <p id={`${id}-hint`} className="ps-9 text-sm text-ink-muted">{hint}</p>
    </div>
  );
}
