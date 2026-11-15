"use client";

import { Globe } from "lucide-react";

export type SiteLanguages = ("en" | "am")[];

const OPTIONS: SiteLanguages[] = [["en"], ["am"], ["en", "am"]];

interface Props {
  /** Group name read by screen readers. */
  title: string;
  labels: { en: string; am: string; both: string };
  value: SiteLanguages;
  onChange: (value: SiteLanguages) => void;
  /** Radio group name: two choosers never share one. */
  name: string;
  className?: string;
  /** One tight row with no visible title, for use inside a prompt box. */
  compact?: boolean;
  children?: React.ReactNode;
}

/** Which languages the site will have: English, Amharic or both. */
export function LanguageChoice({ title, labels, value, onChange, name, className = "", compact = false, children }: Props) {
  return (
    <fieldset className={`flex flex-col gap-2 ${className}`}>
      <legend className="sr-only">{title}</legend>
      {!compact && (
        <p aria-hidden="true" className="font-medium">
          {title}
        </p>
      )}
      <div className={compact ? "flex items-center gap-1 rounded-full bg-sunken p-1" : "flex flex-wrap gap-2"}>
        {/* In the prompt box: say what the switch is for, so it isn't taken for the page's own language switch. */}
        {compact && (
          <span aria-hidden="true" className="flex items-center gap-1.5 ps-2.5 pe-1 text-ink-muted">
            <Globe className="size-4 shrink-0" />
            <span className="max-sm:hidden">{title}</span>
          </span>
        )}
        {OPTIONS.map((opt) => {
          const key = opt.join("+");
          const checked = value.join("+") === key;
          return (
            <label
              key={key}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-full font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-link ${
                compact ? `px-2.5 sm:px-3 ${checked ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"}` : `border px-4 ${checked ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-faint"}`
              }`}
            >
              <input type="radio" name={name} className="sr-only" checked={checked} onChange={() => onChange(opt)} />
              {key === "en" ? labels.en : key === "am" ? labels.am : labels.both}
            </label>
          );
        })}
      </div>
      {children}
    </fieldset>
  );
}
