import { useEffect, useRef, useState, type ReactNode } from "react";
import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";

/**
 * A row to swipe (phones) or step through with arrows (computers and keyboards). Without
 * JavaScript it is still a scrollable row.
 */
export function Rail({ label, children }: { label: string; children: ReactNode }) {
  const { lang } = useSite();
  const ref = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ overflow: true, start: true, end: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const x = Math.abs(el.scrollLeft);
      setState({ overflow: max > 8, start: x < 8, end: x > max - 8 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };
  const arrow = (dir: 1 | -1) => (
    // aria-disabled, not disabled: a focused arrow at the end keeps keyboard focus.
    <button type="button" onClick={() => go(dir)} aria-disabled={dir === -1 ? state.start : state.end} aria-label={uiText(dir === -1 ? "previous" : "next", lang)} className="rail-arrow">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === -1 ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
      </svg>
    </button>
  );
  return (
    <div className="flex flex-col gap-4">
      <ul ref={ref} tabIndex={0} aria-label={label} className="rail">
        {children}
      </ul>
      {/* The arrow row keeps its place; it hides when everything already fits. */}
      <div className={`flex justify-end gap-2 ${state.overflow ? "" : "invisible"}`} aria-hidden={!state.overflow || undefined}>
        {arrow(-1)}
        {arrow(1)}
      </div>
    </div>
  );
}
