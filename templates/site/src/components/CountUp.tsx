import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up when it scrolls into view ("3,400+", "86%", "$620", "15 min").
 * Values with other digits ("9 of 10", "12:45 pm") or years stay as they are. The page is
 * written with the final number, so it is right without JavaScript and for search engines;
 * numbers already on screen when the page opens don't move.
 */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    setShown(value);
    const m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(\D*)$/.exec(value);
    const el = ref.current;
    if (!m || !el || /^(19|20)\d\d$/.test(m[2]!) || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const [, before, num, after] = m as unknown as [string, string, string, string];
    const target = Number(num.replace(/,/g, ""));
    const decimals = num.split(".")[1]?.length ?? 0;
    const format = (v: number) => before + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: num.includes(",") }) + after;
    let first = true;
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (first) {
          first = false;
          if (entry?.isIntersecting) return io.disconnect();
          setShown(format(0));
          return;
        }
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 1400);
          setShown(format(target * (1 - (1 - p) ** 3)));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);
  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  );
}
