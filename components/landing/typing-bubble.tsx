"use client";

import { memo, useEffect, useMemo, useState } from "react";

/**
 * The owner's message in the hero demo, typing itself out each time `run` changes. It owns its
 * own state, so only this bubble redraws (once per frame) while it types, and the full text keeps
 * its size underneath, so nothing around it moves.
 */
export const TypingBubble = memo(function TypingBubble({ text, run }: { text: string; run: number }) {
  const chars = useMemo(() => [...text], [text]);
  const [typed, setTyped] = useState<number | null>(null);
  useEffect(() => {
    if (run === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      // About 80 characters a second, whatever the frame rate.
      const n = Math.min(chars.length, Math.floor((now - start) / 12.5));
      setTyped(n >= chars.length ? null : n);
      if (n < chars.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, chars]);
  return (
    <p className="relative ms-auto max-w-[92%] rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-white">
      <span className={typed === null ? "" : "invisible"}>{text}</span>
      {typed !== null && <span className="typing-caret absolute inset-0 px-4 py-3">{chars.slice(0, typed).join("")}</span>}
    </p>
  );
});
