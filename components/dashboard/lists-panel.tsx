"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

type Lang = "en" | "am";
type Text = Partial<Record<Lang, string>>;
interface Item { ref: number | null; name: Text; description: Text; priceMinor: number | null }
interface List { key: string; kind: "menu" | "services"; title: Text; items: Item[] }
/** Price is kept as the text the owner typed; it becomes minor units only when saving. */
interface Row extends Omit<Item, "priceMinor"> { id: number; price: string }

const PRICE = /^\d{0,9}(\.\d{0,2})?$/;

let rowSeq = 0;
const next = () => ++rowSeq;

function toRows(items: Item[]): Row[] {
  return items.map((i) => ({ id: next(), ref: i.ref, name: i.name, description: i.description, price: i.priceMinor === null ? "" : String(i.priceMinor / 100) }));
}

export function ListsPanel({ t, locale, projectId }: { t: Messages["dashboard"]; locale: Locale; projectId: string }) {
  const [data, setData] = useState<{ languages: Lang[]; lists: List[] } | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}/lists`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load"))))
      .then((d: { languages: Lang[]; lists: List[] }) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [projectId, attempt]);

  if (error)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-line bg-white p-6">
        <p>{t.loadError}</p>
        <button type="button" onClick={() => { setError(false); setAttempt((a) => a + 1); }} className="min-h-11 rounded-lg border border-line px-4 font-medium text-sm lg:min-h-9">{t.retry}</button>
      </div>
    );
  if (!data)
    return (
      <div role="status">
        <span className="sr-only">{t.loading}</span>
        <div aria-hidden="true" className="h-64 animate-pulse rounded-xl bg-line" />
      </div>
    );
  if (data.lists.length === 0) return <p className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-ink-muted">{t.listsEmpty}</p>;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-ink-muted">{t.listsHint}</p>
      {data.lists.map((l) => (
        <ListEditor key={l.key} t={t} locale={locale} projectId={projectId} languages={data.languages} list={l} />
      ))}
    </div>
  );
}

function ListEditor({ t, locale, projectId, languages, list }: { t: Messages["dashboard"]; locale: Locale; projectId: string; languages: Lang[]; list: List }) {
  const [rows, setRows] = useState<Row[]>(() => toRows(list.items));
  const [state, setState] = useState<{ kind: "idle" | "saving" | "saved" | "error"; message?: string }>({ kind: "idle" });
  const focusId = useRef<string | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const title = list.title[locale] || list.title.en || list.title.am || "";
  const pick = (x: Text) => x[locale] || x.en || x.am || "";

  useEffect(() => {
    if (!focusId.current) return;
    document.getElementById(focusId.current)?.focus();
    focusId.current = null;
  }, [rows]);

  const update = (id: number, patch: Partial<Row>) => setRows((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const remove = (index: number) => {
    const after = rows[index + 1] ?? rows[index - 1];
    focusId.current = after ? `${list.key}-${after.id}-name-${languages[0]}` : null;
    setRows((xs) => xs.filter((_, j) => j !== index));
    if (!after) requestAnimationFrame(() => addRef.current?.focus());
  };
  const add = () => {
    const id = next();
    focusId.current = `${list.key}-${id}-name-${languages[0]}`;
    setRows((xs) => [...xs, { id, ref: null, name: {}, description: {}, price: "" }]);
  };

  const save = async () => {
    if (state.kind === "saving") return;
    if (rows.some((r) => !PRICE.test(r.price))) return setState({ kind: "error", message: t.listErrors.invalid });
    setState({ kind: "saving" });
    const items = rows.map((r) => ({ ref: r.ref, name: r.name, description: r.description, priceMinor: r.price === "" ? null : Math.round(Number(r.price) * 100) }));
    const res = await fetch(`/api/projects/${projectId}/lists`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: list.key, items }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) setState({ kind: "saved", message: d.republished ? t.savedLive : t.saved });
    else setState({ kind: "error", message: (t.listErrors as Record<string, string>)[d.error] ?? t.listErrors.failed });
  };

  const inLang = (lang: Lang) => (languages.length > 1 ? ` · ${t.itemLang.replace("{lang}", t.languageNames[lang])}` : "");

  return (
    <section aria-label={title} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4 sm:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <ol className="flex flex-col gap-4">
        {rows.map((it, i) => {
          const base = `${list.key}-${it.id}`;
          const priceOk = PRICE.test(it.price);
          return (
            <li key={it.id} className="flex flex-col gap-3 rounded-lg border border-line p-3">
              {languages.map((lang) => (
                <div key={lang} className="grid gap-2 sm:grid-cols-2">
                  <label htmlFor={`${base}-name-${lang}`} className="flex flex-col gap-1">
                    <span className="font-medium">{t.itemName}{inLang(lang)}</span>
                    <input id={`${base}-name-${lang}`} lang={lang} value={it.name[lang] ?? ""} maxLength={300} onChange={(e) => update(it.id, { name: { ...it.name, [lang]: e.target.value } })} className="min-h-11 rounded-lg border border-input px-3 text-base" />
                  </label>
                  <label htmlFor={`${base}-desc-${lang}`} className="flex flex-col gap-1">
                    <span className="font-medium">{t.itemDescription}{inLang(lang)}</span>
                    <input id={`${base}-desc-${lang}`} lang={lang} value={it.description[lang] ?? ""} maxLength={300} onChange={(e) => update(it.id, { description: { ...it.description, [lang]: e.target.value } })} className="min-h-11 rounded-lg border border-input px-3 text-base" />
                  </label>
                </div>
              ))}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor={`${base}-price`} className="font-medium">{t.itemPrice}</label>
                  <input
                    id={`${base}-price`}
                    inputMode="decimal"
                    value={it.price}
                    onChange={(e) => update(it.id, { price: e.target.value.replace(/[^\d.]/g, "") })}
                    aria-invalid={!priceOk || undefined}
                    aria-describedby={!priceOk ? `${base}-price-error` : undefined}
                    className="min-h-11 w-40 rounded-lg border border-input px-3 text-base"
                  />
                  {!priceOk && <p id={`${base}-price-error`} className="text-destructive">{t.priceInvalid}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={t.itemRemoveNamed.replace("{name}", pick(it.name) || String(i + 1))}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-medium text-destructive hover:bg-coral-soft text-sm lg:min-h-9"
                >
                  <Trash2 aria-hidden="true" className="size-4" /> {t.itemRemove}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button ref={addRef} type="button" onClick={add} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-4 font-medium hover:border-faint text-sm lg:min-h-9">
          <Plus aria-hidden="true" className="size-4" /> {t.itemAdd}
        </button>
        <button type="button" onClick={save} aria-disabled={state.kind === "saving"} className="min-h-11 rounded-lg bg-ink px-5 font-medium text-white hover:bg-ink-hover aria-disabled:opacity-50 text-sm lg:min-h-9">
          {state.kind === "saving" ? t.saving : t.save}
        </button>
        {state.kind === "saved" && <p role="status" className="font-medium text-ink">{state.message}</p>}
        {state.kind === "error" && <p role="alert" className="text-destructive">{state.message}</p>}
      </div>
    </section>
  );
}
