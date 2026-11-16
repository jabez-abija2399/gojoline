"use client";

import { useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme } from "@/components/app/theme-switch";
import type { Theme } from "@/lib/app/theme-shared";

const QUERY = "(prefers-color-scheme: dark)";
const subscribe = (change: () => void) => {
  const m = matchMedia(QUERY);
  m.addEventListener("change", change);
  return () => m.removeEventListener("change", change);
};

/**
 * Dark mode on or off for the public pages. It starts from the saved choice ("Device" follows
 * the phone or computer) and saves the new one, the same setting as in the signed-in area.
 * `row` is the phone menu's full-width version; the icon swaps by CSS, so it is right before script.
 */
export function ThemeToggle({ initial, label, row = false }: { initial: Theme; label: string; row?: boolean }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const deviceDark = useSyncExternalStore(subscribe, () => matchMedia(QUERY).matches, () => false);
  const dark = theme === "dark" || (theme === "system" && deviceDark);
  const toggle = () => {
    const next: Theme = dark ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };
  const icons = (
    <>
      <Moon aria-hidden="true" className="logo-light size-5" />
      <Sun aria-hidden="true" className="logo-dark size-5" />
    </>
  );
  if (row)
    return (
      <button type="button" aria-pressed={dark} onClick={toggle} className="flex min-h-11 items-center justify-between gap-3 rounded-full px-4 font-medium text-ink hover:bg-sunken">
        {label}
        {icons}
      </button>
    );
  return (
    <button type="button" aria-pressed={dark} onClick={toggle} title={label} className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-sunken">
      {icons}
      <span className="sr-only">{label}</span>
    </button>
  );
}
