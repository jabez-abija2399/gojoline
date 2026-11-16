"use client";

import { useEffect, useRef } from "react";
import { takePresetChoice } from "./start-prompt";

/**
 * Finishes "Start from this" from the landing page. On an account with no sites the picked
 * template opens straight away (no AI, no credit). Otherwise its tile is brought into view
 * and focused, so the owner decides.
 */
export function PresetStart({ autoStart }: { autoStart: boolean }) {
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const id = takePresetChoice();
    if (!id) return;
    const form = document.querySelector<HTMLFormElement>(`form[data-preset="${id}"]`);
    if (!form) return;
    if (autoStart) return form.requestSubmit();
    // The templates sit behind their tab: open it, then point at the picked one.
    location.hash = "#templates";
    const button = form.querySelector("button");
    setTimeout(() => {
      button?.scrollIntoView({ block: "center" });
      button?.focus();
    }, 50);
  }, [autoStart]);
  return null;
}
