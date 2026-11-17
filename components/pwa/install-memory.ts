"use client";

import { EMPTY_MEMORY, INSTALL_SNOOZE_MS, parseMemory, type InstallMemory } from "@/lib/pwa/install-rules";

const KEY = "gojo.install";
const VISIT_KEY = "gojo.install.visit";
/** Fired when the owner's first site is made or published, so an open page can offer the app. */
export const GOOD_MOMENT_EVENT = "gojo:install-moment";

// Storage can be blocked (private windows, settings) or full: the pop-up then simply never shows.
export function readInstallMemory(): InstallMemory {
  try {
    return parseMemory(localStorage.getItem(KEY));
  } catch {
    return { ...EMPTY_MEMORY, never: true };
  }
}

function update(patch: Partial<InstallMemory>): InstallMemory {
  const next = { ...readInstallMemory(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Not remembered: nothing else to do.
  }
  return next;
}

/** Installed, or the browser's own prompt was answered: never ask again on this device. */
export const markInstallAnswered = () => update({ never: true });

/** "Not now": hidden for 14 days. */
export const snoozeInstall = (now = Date.now()) => update({ snoozedUntil: now + INSTALL_SNOOZE_MS });

/** The first site was made or published: a good moment to offer the app. */
export function markInstallMoment() {
  if (readInstallMemory().goodMoment) return;
  update({ goodMoment: true });
  window.dispatchEvent(new Event(GOOD_MOMENT_EVENT));
}

/** Counts a visit once per browser session (a new tab or a reopened browser is a new visit). */
export function countInstallVisit(): InstallMemory {
  try {
    if (sessionStorage.getItem(VISIT_KEY)) return readInstallMemory();
    sessionStorage.setItem(VISIT_KEY, "1");
  } catch {
    return readInstallMemory();
  }
  return update({ visits: readInstallMemory().visits + 1 });
}
