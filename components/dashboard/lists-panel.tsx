"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";

type Lang = "en" | "am";
type Text = Partial<Record<Lang, string>>;
interface Item { ref: number | null; name: Text; description: Text; priceMinor: number | null }
interface List { key: string; kind: "menu" | "services"; title: Text; items: Item[] }

const langName: Record<Lang, string> = { en: "English", am: "አማርኛ" };

export function ListsPanel({ t, projectId }: { t: Messages["dashboard"]; projectId: string }) {
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
        <button type="button" onClick={() => { setError(false); setAttempt((a) => a + 1); }} className="min-h-11 rounded-lg border border-line px-4 font-medium">{t.retry}</button>
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
        <ListEditor key={l.key} t={t} projectId={projectId} languages={data.languages} list={l} />
      ))}
    </div>
  );
}

function ListEditor({ t, projectId, languages, list }: { t: Messages["dashboard"]; projectId: string; languages: Lang[]; list: List }) {
  const [items, setItems] = useState<Item[]>(list.items);
  const [state, setState] = useState<{ kind: "idle" | "saving" | "saved" | "error"; message?: string }>({ kind: "idle" });
  const title = list.title.en || list.title.am || "";

  const update = (i: number, patch: Partial<Item>) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const save = async () => {
    if (state.kind === "saving") return;
    setState({ kind: "saving" });
    const res = await fetch(`/api/projects/${projectId}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: list.key, items }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) setState({ kind: "saved", message: d.republished ? t.savedLive : t.saved });
    else setState({ kind: "error", message: (t.listErrors as Record<string, string>)[d.error] ?? t.listErrors.failed });
  };

  return (
    <section aria-label={title} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4 sm:p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <ol className="flex flex-col gap-4">
        {items.map((it, i) => (
          <li key={i} className="flex flex-col gap-3 rounded-lg border border-line p-3">
            {languages.map((lang) => (
              <div key={lang} className="grid gap-2 sm:grid-cols-2" lang={lang}>
                <label className="flex flex-col gap-1">
                  <span className="font-medium">{t.itemName}{languages.length > 1 ? ` · ${t.itemLang.replace("{lang}", langName[lang])}` : ""}</span>
                  <input value={it.name[lang] ?? ""} maxLength={300} onChange={(e) => update(i, { name: { ...it.name, [lang]: e.target.value } })} className="min-h-11 rounded-lg border border-input px-3 text-base" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium">{t.itemDescription}{languages.length > 1 ? ` · ${t.itemLang.replace("{lang}", langName[lang])}` : ""}</span>
                  <input value={it.description[lang] ?? ""} maxLength={300} onChange={(e) => update(i, { description: { ...it.description, [lang]: e.target.value } })} className="min-h-11 rounded-lg border border-input px-3 text-base" />
                </label>
              </div>
            ))}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-medium">{t.itemPrice}</span>
                <input
                  inputMode="decimal"
                  value={it.priceMinor === null ? "" : String(it.priceMinor / 100)}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d.]/g, "");
                    const n = Number(v);
                    update(i, { priceMinor: v === "" || !Number.isFinite(n) ? null : Math.round(n * 100) });
                  }}
                  className="min-h-11 w-40 rounded-lg border border-input px-3 text-base"
                />
              </label>
              <button type="button" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-medium text-destructive hover:bg-clay-soft">
                <Trash2 aria-hidden="true" className="size-4" /> {t.itemRemove}
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="button" onClick={() => setItems((xs) => [...xs, { ref: null, name: {}, description: {}, priceMinor: null }])} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-4 font-medium hover:border-teal-mid">
          <Plus aria-hidden="true" className="size-4" /> {t.itemAdd}
        </button>
        <button type="button" onClick={save} aria-disabled={state.kind === "saving"} className="min-h-11 rounded-lg bg-teal px-5 font-medium text-white hover:bg-teal-deep aria-disabled:opacity-50">
          {state.kind === "saving" ? t.saving : t.save}
        </button>
        {state.kind === "saved" && <p role="status" className="font-medium text-teal">{state.message}</p>}
        {state.kind === "error" && <p role="alert" className="text-destructive">{state.message}</p>}
      </div>
    </section>
  );
}
