"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme } from "@/lib/app/theme-client";
import type { Theme } from "@/lib/app/theme-shared";

const QUERY = "(prefers-color-scheme: dark)";

/** Whether the page is dark right now: the saved choice on <body>, or the device's when "Device". */
function pageIsDark() {
  const theme = document.body.dataset.gojoTheme;
  return theme === "dark" || (theme !== "light" && matchMedia(QUERY).matches);
}

/** Changes of the device's setting, or of the page's theme (another switch on the page). */
function subscribe(change: () => void) {
  const media = matchMedia(QUERY);
  media.addEventListener("change", change);
  const observer = new MutationObserver(change);
  observer.observe(document.body, { attributes: true, attributeFilter: ["data-gojo-theme"] });
  return () => {
    media.removeEventListener("change", change);
    observer.disconnect();
  };
}

/**
 * Dark mode on or off for the public pages. It reads the page itself, so every switch on the
 * page agrees, and saves the choice (the same setting as in the signed-in area). `row` is the
 * phone menu's full-width version; the icon swaps by CSS, so it is right before script.
 */
export function ThemeToggle({ initial, label, row = false }: { initial: Theme; label: string; row?: boolean }) {
  const dark = useSyncExternalStore(subscribe, pageIsDark, () => initial === "dark");
  const toggle = () => applyTheme(pageIsDark() ? "light" : "dark");
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
