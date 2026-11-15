"use client";

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
  children?: React.ReactNode;
}

/** Which languages the site will have: English, Amharic or both. */
export function LanguageChoice({ title, labels, value, onChange, name, className = "", children }: Props) {
  return (
    <fieldset className={`flex flex-col gap-2 ${className}`}>
      <legend className="sr-only">{title}</legend>
      <p aria-hidden="true" className="font-medium">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const key = opt.join("+");
          const checked = value.join("+") === key;
          return (
            <label
              key={key}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-mid ${
                checked ? "border-teal bg-teal text-white" : "border-teal-soft bg-white hover:border-teal-mid"
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
