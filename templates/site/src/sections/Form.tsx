import { useEffect, useRef, useState, type FormEvent } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { uiText, type UiKey } from "../lib/i18n";
import { useSite } from "../lib/context";
import { publishMeta } from "../lib/meta";
import type { FormField, FormSection } from "../lib/types";

type Status = "idle" | "sending" | "sent" | "error";

const checks: Partial<Record<FormField["type"], { re: RegExp; message: UiKey }>> = {
  email: { re: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: "fieldEmail" },
  tel: { re: /^[+\d][\d\s\-()]{5,20}$/, message: "fieldPhone" },
  number: { re: /^-?\d{1,9}(\.\d{1,2})?$/, message: "fieldNumber" },
};

/** Sends answers to Gojoline Cloud; the owner sees them in the dashboard and on Telegram. */
export function Form({ section }: { section: FormSection }) {
  const { text, lang } = useSite();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, UiKey>>({});
  const [startedAt] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);
  const live = Boolean(publishMeta.dataApiUrl && publishMeta.siteId && publishMeta.siteKey);
  const idPrefix = `f-${section.id}`;

  useEffect(() => {
    if (status === "sent") doneRef.current?.focus();
  }, [status]);

  function validate(data: FormData): Record<string, UiKey> {
    const found: Record<string, UiKey> = {};
    for (const f of section.fields) {
      const v = String(data.get(f.name) ?? "").trim();
      if (!v) {
        if (f.required) found[f.name] = "fieldRequired";
        continue;
      }
      const c = checks[f.type];
      if (c && !c.re.test(v)) found[f.name] = c.message;
    }
    return found;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const data = new FormData(e.currentTarget);
    const found = validate(data);
    setErrors(found);
    const first = section.fields.find((f) => found[f.name]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${idPrefix}-${first.name}`)?.focus();
      return;
    }
    if (!live) {
      setStatus("sent");
      return;
    }
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
          {section.eyebrow && <p className="eyebrow">{text(section.eyebrow)}</p>}
          <SectionTitle>{text(section.heading)}</SectionTitle>
          {section.intro && <p className="max-w-[60ch] text-muted">{text(section.intro)}</p>}
          {!live && <p className="text-muted">{uiText("formPreview", lang)}</p>}
        </div>
        {status === "sent" ? (
          <p ref={doneRef} role="status" tabIndex={-1} className="rounded-site border border-line bg-primary-soft p-6 text-lg font-semibold">
            {text(section.successMessage)}
          </p>
        ) : (
          <form ref={formRef} onSubmit={submit} noValidate className="relative flex flex-col gap-4 rounded-site border border-line bg-surface p-6">
            {section.fields.map((f) => {
              const id = `${idPrefix}-${f.name}`;
              const err = errors[f.name];
              const common = {
                id,
                name: f.name,
                "aria-required": f.required || undefined,
                "aria-invalid": err ? true : undefined,
                "aria-describedby": err ? `${id}-error` : undefined,
                className: "min-h-11 w-full rounded-site border border-line bg-white px-3 py-2 text-base aria-[invalid=true]:border-2 aria-[invalid=true]:border-current",
              } as const;
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
                      inputMode={f.type === "tel" ? "tel" : f.type === "number" ? "decimal" : undefined}
                    />
                  )}
                  {err && (
                    <p id={`${id}-error`} className="font-medium">
                      {uiText(err, lang)}
                    </p>
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
