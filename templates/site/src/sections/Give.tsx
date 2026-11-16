import { useState } from "react";
import { Picture } from "../components/Picture";
import { SectionHead } from "../components/SectionHead";
import { formatPrice, uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import type { GiveSection } from "../lib/types";

/**
 * A giving box: pick an amount (and once or monthly), see what it does, then go to the giving
 * form with the amount already filled in. Payment itself happens the way the owner says.
 */
export function Give({ section }: { section: GiveSection }) {
  const { text, href, lang } = useSite();
  const [pick, setPick] = useState(Math.min(1, section.amounts.length - 1));
  const [monthly, setMonthly] = useState(false);
  const chosen = section.amounts[pick]!;
  const amount = formatPrice(chosen.price, lang);
  const label = `${text(section.action.label)} ${amount}${monthly ? ` ${uiText("perMonth", lang)}` : ""}`;
  const goal = section.goal;
  const percent = goal ? Math.min(100, Math.round((goal.raised.amountMinor / Math.max(1, goal.target.amountMinor)) * 100)) : 0;
  // Fill the giving form's amount (and how often) if it has such fields.
  const fill = () => {
    const target = section.action.href.startsWith("#") ? document.getElementById(section.action.href.slice(1)) : null;
    const set = (name: string, value: string) => {
      const field = target?.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
      if (!field) return;
      if (field instanceof HTMLSelectElement) {
        const option = [...field.options].find((o) => o.value === value || o.text === value);
        if (option) field.value = option.value;
      } else field.value = field.type === "number" ? String(chosen.price.amountMinor / 100) : value;
    };
    set("amount", amount);
    if (section.monthly) set("frequency", uiText(monthly ? "monthly" : "once", lang));
  };
  const chip = "min-h-12 rounded-site border-2 px-4 font-heading text-lg font-bold transition";
  return (
    <section id={section.id ?? "giving"} className="section bg-surface">
      <div className="container-site grid gap-10 md:grid-cols-2 md:items-center md:gap-14">
        <div className="flex flex-col gap-6">
          <SectionHead eyebrow={section.eyebrow} heading={section.heading} intro={section.intro} />
          {goal && (
            <div className="flex flex-col gap-2">
              <div className="goal-bar" role="img" aria-label={`${formatPrice(goal.raised, lang)} ${uiText("raised", lang)} ${formatPrice(goal.target, lang)}`}>
                <span className="goal-fill" style={{ "--p": `${percent}%` } as React.CSSProperties} />
              </div>
              <p className="flex flex-wrap justify-between gap-x-4">
                <span>
                  <strong className="font-heading text-xl">{formatPrice(goal.raised, lang)}</strong> {uiText("raised", lang)} {formatPrice(goal.target, lang)}
                </span>
                {goal.label && <span className="text-muted">{text(goal.label)}</span>}
              </p>
            </div>
          )}
          {section.image && (
            <div className="zoom wipe rounded-site">
              <Picture image={section.image} sizes="(min-width: 768px) 50vw, 160px" className="aspect-[16/10] w-full rounded-site" />
            </div>
          )}
        </div>
        <div className="card flex flex-col gap-5 p-5 sm:p-7">
          {section.monthly && (
            <div role="group" className="grid grid-cols-2 gap-1 rounded-site bg-primary-soft p-1">
              {[false, true].map((m) => (
                <button key={String(m)} type="button" aria-pressed={monthly === m} onClick={() => setMonthly(m)} className={`min-h-11 rounded-site font-semibold transition ${monthly === m ? "bg-surface shadow-sm" : "text-muted"}`}>
                  {uiText(m ? "monthly" : "once", lang)}
                </button>
              ))}
            </div>
          )}
          <div role="group" aria-label={text(section.heading)} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {section.amounts.map((a, i) => (
              <button key={i} type="button" aria-pressed={pick === i} onClick={() => setPick(i)} className={`${chip} ${pick === i ? "border-primary bg-primary text-on-primary" : "border-line bg-surface hover:border-text"}`}>
                {formatPrice(a.price, lang)}
              </button>
            ))}
          </div>
          {chosen.impact && (
            <p aria-live="polite" className="min-h-[3.5rem] text-lg">
              {text(chosen.impact)}
            </p>
          )}
          <a href={href(section.action.href)} onClick={fill} className="btn btn-primary w-full text-lg">
            {label}
          </a>
        </div>
      </div>
    </section>
  );
}
