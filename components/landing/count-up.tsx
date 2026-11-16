"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts the number in a measured value ("~40 s", "30 of 30") up from zero the first time it
 * comes into view. The real value is in the HTML (and stays for reduced motion); the width is
 * kept with tabular figures and an invisible copy, so nothing moves.
 */
export function CountUp({ value }: { value: string }) {
  const match = /\d+/.exec(value);
  const target = match ? Number(match[0]) : 0;
  const [n, setN] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !match || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 1100);
        const eased = 1 - (1 - p) ** 3;
        setN(p >= 1 ? null : Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      setN(0);
      raf = requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // The value never changes on this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const shown = n === null || !match ? value : value.slice(0, match.index) + n + value.slice(match.index + match[0].length);
  return (
    <span ref={ref} className="relative inline-block tabular-nums">
      <span className="invisible">{value}</span>
      <span className="absolute inset-0">{shown}</span>
    </span>
  );
}
