"use client";

import { useFormStatus } from "react-dom";

/** A submit button that can't be pressed twice while its form is being sent (slow phones). */
export function PendingButton({ children, className, "aria-label": label }: { children: React.ReactNode; className?: string; "aria-label"?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label={label}
      aria-disabled={pending}
      onClick={(e) => {
        if (pending) e.preventDefault();
      }}
      className={`${className ?? ""} aria-disabled:opacity-60`}
    >
      {children}
    </button>
  );
}
