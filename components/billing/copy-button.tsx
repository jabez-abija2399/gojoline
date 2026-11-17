"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies a number or amount, says "Copied" for a moment (read out too), then goes back. */
export function CopyButton({ value, label, copy, copied }: { value: string; label: string; copy: string; copied: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(id);
  }, [done]);
  const click = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
    } catch {
      // Clipboard blocked: the number is on screen to type or select.
    }
  };
  return (
    <button
      type="button"
      onClick={click}
      aria-label={label}
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink hover:border-faint hover:bg-sunken lg:min-h-9"
    >
      {done ? <Check aria-hidden="true" className="size-4 text-lagoon" /> : <Copy aria-hidden="true" className="size-4" />}
      <span aria-hidden="true">{done ? copied : copy}</span>
      <span role="status" className="sr-only">{done ? copied : ""}</span>
    </button>
  );
}
