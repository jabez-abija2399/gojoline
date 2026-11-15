"use client";

import { useEffect, useRef } from "react";

/** Moves keyboard and screen-reader focus to a message that appears after an action. */
export function FocusOnMount({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div ref={ref} tabIndex={-1} className="outline-none">
      {children}
    </div>
  );
}
