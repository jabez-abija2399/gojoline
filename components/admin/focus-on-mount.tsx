"use client";

import { useEffect, useRef } from "react";

/** Moves keyboard and screen-reader focus to a message that appears after an action. */
export function FocusOnMount({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  return (
    <div ref={ref} tabIndex={-1} className={`outline-none ${className}`}>
      {children}
    </div>
  );
}
