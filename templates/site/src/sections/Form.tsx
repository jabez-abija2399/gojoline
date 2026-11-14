import { useState, type FormEvent } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import { publishMeta } from "../lib/meta";
import type { FormSection } from "../lib/types";

type Status = "idle" | "sending" | "sent" | "error";

/** Sends answers to Gojoline Cloud; the owner sees them in the dashboard and on Telegram. */
export function Form({ section }: { section: FormSection }) {
  const { text, lang } = useSite();
  const [status, setStatus] = useState<Status>("idle");
  const [startedAt] = useState(() => Date.now());
  const live = Boolean(publishMeta.dataApiUrl && publishMeta.siteId && publishMeta.siteKey);
  const idPrefix = `f-${section.id}`;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    if (!live) {
      setStatus("sent");
      return;
    }
    const data = new FormData(form);
    const answers: Record<string, string> = {};
    for (const f of section.fields) answers[f.name] = String(data.get(f.name) ?? "").slice(0, 2000);
    setStatus("sending");
    try {
      const res = await fetch(`${publishMeta.dataApiUrl}/api/public/sites/${publishMeta.siteId}/forms/${section.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Site-Key": publishMeta.siteKey! },
        // _hp is a trap field people never see; _ms is how long the form was open (bots are instant).
        body: JSON.stringify({ answers, lang, _hp: String(data.get("_hp") ?? ""), _ms: Date.now() - startedAt }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id={section.id} className="section">
      <div className="container-site grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <SectionTitle>{text(section.heading)}</SectionTitle>
          {section.intro && <p className="max-w-[60ch] text-muted">{text(section.intro)}</p>}
          {!live && <p className="text-muted">{uiText("formPreview", lang)}</p>}
        </div>
        {status === "sent" ? (
          <p role="status" tabIndex={-1} className="rounded-site border border-line bg-primary-soft p-6 text-lg font-semibold">
            {text(section.successMessage)}
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4 rounded-site border border-line bg-surface p-6" noValidate={false}>
            {section.fields.map((f) => {
              const id = `${idPrefix}-${f.name}`;
              const common = { id, name: f.name, required: f.required, className: "min-h-11 w-full rounded-site border border-line bg-white px-3 py-2 text-base" };
              return (
                <div key={f.name} className="flex flex-col gap-1">
                  <label htmlFor={id} className="font-medium">
                    {text(f.label)}
                    {f.required && <span className="text-muted"> ({uiText("required", lang)})</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea {...common} rows={4} maxLength={2000} />
                  ) : f.type === "select" ? (
                    <select {...common} defaultValue="">
                      <option value="" disabled />
                      {(f.options ?? []).map((o, i) => (
                        <option key={i} value={text(o)}>{text(o)}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...common}
                      type={f.type}
                      maxLength={f.type === "number" ? undefined : 300}
                      autoComplete={f.type === "email" ? "email" : f.type === "tel" ? "tel" : f.name === "name" ? "name" : undefined}
                      inputMode={f.type === "tel" ? "tel" : undefined}
                    />
                  )}
                </div>
              );
            })}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
              <label>
                Leave empty
                <input name="_hp" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            {status === "error" && <p role="alert" className="font-medium">{uiText("formError", lang)}</p>}
            <button type="submit" className="btn btn-primary" aria-disabled={status === "sending"}>
              {status === "sending" ? uiText("sending", lang) : text(section.submitLabel)}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
