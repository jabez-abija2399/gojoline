"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies the site's address; says so for a moment (and to screen readers). */
export function CopyLink({ url, label, done }: { url: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <>
      <button
        type="button"
        onClick={async () => {
          const ok = await navigator.clipboard?.writeText(url).then(() => true, () => false);
          if (!ok) return;
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 2000);
        }}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink transition-colors hover:border-faint hover:bg-sunken lg:min-h-9"
      >
        {copied ? <Check aria-hidden="true" className="size-4 text-lagoon" /> : <Copy aria-hidden="true" className="size-4" />}
        {copied ? done : label}
      </button>
      <span role="status" className="sr-only">
        {copied ? done : ""}
      </span>
    </>
  );
}
