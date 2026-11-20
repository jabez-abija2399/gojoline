"use client";

import { useEffect, useRef } from "react";

/**
 * The marketing pages' menu on phones. A native <details>, so it opens without script; with
 * script it also closes the way people expect: Escape, a tap outside, focus leaving it, or
 * choosing a link (the bar is sticky, so an open menu would otherwise follow the page).
 */
export function PhoneMenu({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const close = () => {
      el.open = false;
    };
    const outside = (e: PointerEvent) => {
      if (el.open && !el.contains(e.target as Node)) close();
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !el.open) return;
      close();
      el.querySelector("summary")?.focus();
    };
    const left = (e: FocusEvent) => {
      if (el.open && !el.contains(e.relatedTarget as Node | null)) close();
    };
    const chosen = (e: MouseEvent) => {
      if ((e.target as Element).closest("a")) close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    el.addEventListener("focusout", left);
    el.addEventListener("click", chosen);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      el.removeEventListener("focusout", left);
      el.removeEventListener("click", chosen);
    };
  }, []);
  return (
    <details ref={ref} className="group relative md:hidden">
      <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-line bg-white font-medium text-ink hover:bg-sunken [&::-webkit-details-marker]:hidden">{label}</summary>
      {children}
    </details>
  );
}
