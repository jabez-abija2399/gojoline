"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/** Pause and play for the marquee (WCAG 2.2.2: moving content can be stopped on any device). */
export function MarqueeToggle({ label, children }: { label: string; children: React.ReactNode }) {
  const [paused, setPaused] = useState(false);
  // It only moves while on screen: no animation work while the page loads or it's scrolled away.
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} data-paused={paused || undefined} data-running={visible || undefined} className="marquee-wrap flex flex-col items-center gap-4">
      {children}
      <button type="button" title={label} aria-pressed={paused} onClick={() => setPaused((p) => !p)} className="marquee-toggle inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-faint">
        {paused ? <Play aria-hidden="true" className="size-4" /> : <Pause aria-hidden="true" className="size-4" />}
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}
