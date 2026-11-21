"use client";

import { useFormStatus } from "react-dom";

/**
 * A Posts tab button: can't be pressed twice while its form runs (writing a caption or posting
 * takes seconds), says it is working, and can ask first (posting to a public channel).
 */
export function PostSubmit({ children, working, confirm, className, label }: { children: React.ReactNode; working: string; confirm?: string; className: string; label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label={label}
      aria-disabled={pending}
      onClick={(e) => {
        if (pending || (confirm && !window.confirm(confirm))) e.preventDefault();
      }}
      className={`${className} aria-disabled:opacity-60`}
    >
      {pending ? working : children}
    </button>
  );
}
